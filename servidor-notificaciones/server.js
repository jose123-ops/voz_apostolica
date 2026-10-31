
require('dotenv').config();

const express = require('express');
const cors = require('cors');


const {
    initializeApp,
    cert
} = require('firebase-admin/app');

const {
    getAuth
} = require('firebase-admin/auth');

const {
    getFirestore,
    FieldValue
} = require('firebase-admin/firestore');

const {
    getMessaging
} = require('firebase-admin/messaging');


const app = express();

const PORT = process.env.PORT || 3000;

const ADMIN_UID = process.env.ADMIN_UID;

const ORIGEN =
    'https://voz-apostolica.web.app';

// ========================================
// FIREBASE ADMIN
// ========================================

const credenciales =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!credenciales) {
    throw new Error(
        'Falta FIREBASE_SERVICE_ACCOUNT_JSON'
    );
}

if (!ADMIN_UID) {
    throw new Error(
        'Falta configurar ADMIN_UID'
    );
}


initializeApp({
    credential: cert(
        JSON.parse(credenciales)
    )
});

const db = getFirestore();
const auth = getAuth();
const messaging = getMessaging();

console.log('Firebase Admin inicializado correctamente');


// ========================================
// MIDDLEWARES
// ========================================

app.use(express.json({ limit: '20kb' }));

app.use(cors({
    origin: ORIGEN,
    methods: ['GET', 'POST'],
    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ]
}));

// ========================================
// VERIFICAR ADMINISTRADOR
// ========================================

async function verificarAdmin(req, res, next) {

    try {

        const autorizacion =
            req.headers.authorization || '';

        if (!autorizacion.startsWith('Bearer ')) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Falta autenticación.'
            });
        }

        const token =
            autorizacion.substring(7);

        const usuario =
            await auth.verifyIdToken(
                token,
                true
            );

        if (usuario.uid !== ADMIN_UID) {
            return res.status(403).json({
                ok: false,
                mensaje: 'Acceso solo para administrador.'
            });
        }

        req.usuario = usuario;

        next();

    } catch (error) {

        console.error(
            'Error verificando autenticación:',
            error
        );

        return res.status(401).json({
            ok: false,
            mensaje: 'Sesión inválida o vencida.'
        });
    }
}

// ========================================
// VERIFICAR DOCUMENTO
// ========================================

const configuraciones = {

    cancion: {
        coleccion: 'canciones',
        titulo: 'Nueva canción',
        ruta: '/canciones'
    },

    ensayo: {
        coleccion: 'ensayos',
        titulo: 'Nuevo ensayo',
        ruta: '/ensayos'
    },

    evento: {
        coleccion: 'eventos',
        titulo: 'Nuevo evento',
        ruta: '/eventos'
    }

};

// ========================================
// MENSAJE SEGÚN TIPO
// ========================================

function crearMensaje(tipo, datos) {

    switch (tipo) {

        case 'cancion':
            return (
                'Se agregó una nueva canción: ' +
                String(datos.titulo || 'Sin título')
            ).slice(0, 180);

        case 'ensayo':
            return (
                'Se programó un nuevo ensayo. ' +
                'Revisá los detalles en Voz Apostólica.'
            );

        case 'evento':
            return (
                'Se registró un nuevo evento. ' +
                'Consultá la fecha y el lugar.'
            );

        default:
            return 'Tenés una nueva notificación.';
    }
}

// ========================================
// ENVIAR NOTIFICACIÓN
// ========================================

app.post(
    '/api/notificar',
    verificarAdmin,
    async (req, res) => {

        try {

            const { tipo, documentoId } = req.body;

            const configuracion =
                configuraciones[tipo];

            if (
                !configuracion ||
                typeof documentoId !== 'string' ||
                !/^[A-Za-z0-9]{1,128}$/.test(documentoId)
            ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Solicitud inválida.'
                });
            }

            // Buscar el registro guardado
            const documento =
                await db.collection(
                    configuracion.coleccion
                ).doc(documentoId).get();

            if (!documento.exists) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'El registro no existe.'
                });
            }

            const datos = documento.data() || {};

            // Evitar enviar dos veces la misma
            // notificación de creación.
            const controlRef = db
                .collection('notificaciones_enviadas')
                .doc(`${tipo}_${documentoId}`);

            try {
                await controlRef.create({
                    tipo,
                    documentoId,
                    creadoPor: req.usuario.uid,
                    fecha: FieldValue.serverTimestamp(),
                    estado: 'procesando'
                });
            } catch (error) {

                if (error.code === 6 ||
                    error.code === 'already-exists') {

                    return res.status(409).json({
                        ok: false,
                        mensaje: 'Esta notificación ya fue solicitada.'
                    });
                }

                throw error;
            }

            // Buscar dispositivos registrados
            const dispositivos =
                await db.collection(
                    'dispositivos_push'
                ).get();

            const tokens = new Set();

            dispositivos.forEach(documento => {

                const lista =
                    documento.data().tokens;

                if (Array.isArray(lista)) {

                    lista.forEach(token => {

                        if (
                            typeof token === 'string' &&
                            token.trim()
                        ) {
                            tokens.add(token);
                        }

                    });
                }
            });

            const listaTokens = [...tokens];

            if (listaTokens.length === 0) {


                if (tokensInvalidos.size > 0) {

                    try {

                        for (const dispositivo of dispositivos.docs) {

                            const actuales =
                                dispositivo.data().tokens || [];

                            const eliminar = actuales.filter(
                                token => tokensInvalidos.has(token)
                            );

                            if (eliminar.length > 0) {

                                await dispositivo.ref.update({
                                    tokens: FieldValue.arrayRemove(
                                        ...eliminar
                                    )
                                });

                            }
                        }

                        console.log(
                            'Tokens FCM inválidos eliminados:',
                            tokensInvalidos.size
                        );

                    } catch (error) {

                        console.error(
                            'No se pudieron limpiar algunos tokens:',
                            error
                        );

                    }
                }


                await controlRef.update({
                    estado: 'sin_destinatarios'
                });

                return res.json({
                    ok: true,
                    mensaje: 'Registro guardado, sin dispositivos registrados.',
                    enviados: 0
                });
            }

            const titulo = configuracion.titulo;
            const cuerpo = crearMensaje(tipo, datos);

            let enviados = 0;
            let fallidos = 0;

            const tokensInvalidos = new Set();

            // FCM permite lotes de hasta 500 tokens
            for (
                let i = 0;
                i < listaTokens.length;
                i += 500
            ) {

                const lote =
                    listaTokens.slice(i, i + 500);

                const respuesta =
                    await messaging.sendEachForMulticast({

                        tokens: lote,

                        notification: {
                            title: `Voz Apostólica - ${titulo}`,
                            body: cuerpo
                        },


                        webpush: {
                            headers: {
                                Urgency: 'high',
                                TTL: '86400'
                            },

                            notification: {
                                icon: `${ORIGEN}/icons/icon-192x192.png`
                            },

                            fcmOptions: {
                                link: ORIGEN + configuracion.ruta
                            }
                        },


                        data: {
                            tipo,
                            documentoId,
                            ruta: configuracion.ruta
                        }

                    });

                enviados += respuesta.successCount;
                fallidos += respuesta.failureCount;


                respuesta.responses.forEach((resultado, indice) => {

                    if (resultado.success) {
                        return;
                    }

                    const codigo =
                        resultado.error?.code || 'desconocido';

                    console.warn(
                        '[FCM] Error en destinatario:',
                        i + indice,
                        'Código:',
                        codigo
                    );

                    if (
                        codigo ===
                        'messaging/registration-token-not-registered'
                    ) {
                        tokensInvalidos.add(lote[indice]);
                    }

                });

            }

            await controlRef.update({
                estado: 'procesado',
                enviados,
                fallidos
            });

            console.log(
                'Notificaciones:',
                tipo,
                'Enviados:',
                enviados,
                'Fallidos:',
                fallidos
            );

            return res.json({
                ok: true,
                mensaje: 'Envío procesado.',
                enviados,
                fallidos
            });

        } catch (error) {

            console.error(
                'Error enviando notificaciones:',
                error
            );

            return res.status(500).json({
                ok: false,
                mensaje: 'No se pudo procesar el envío.'
            });
        }

    }
);

// ========================================
// COMPROBAR SERVIDOR
// ========================================

app.get('/api/salud', (req, res) => {

    res.json({
        ok: true,
        servicio: 'Notificaciones Voz Apostólica'
    });

});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, '0.0.0.0', () => {

    console.log(
        `Servidor de notificaciones en puerto ${PORT}`
    );

});
