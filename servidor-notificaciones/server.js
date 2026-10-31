
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

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_UID = process.env.ADMIN_UID;

const ORIGEN = 'https://voz-apostolica.web.app';

// ==========================================
// INICIALIZAR FIREBASE ADMIN
// ==========================================

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
  credential: cert(JSON.parse(credenciales))
});

const db = getFirestore();
const auth = getAuth();
const messaging = getMessaging();

console.log(
  'Firebase Admin inicializado correctamente'
);

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(express.json({ limit: '20kb' }));

app.use(cors({
  origin: ORIGEN,
  methods: ['GET', 'POST'],
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
}));

// ==========================================
// VERIFICAR ADMINISTRADOR
// ==========================================

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

    const token = autorizacion.substring(7);

    const usuario = await auth.verifyIdToken(
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

// ==========================================
// TIPOS DE NOTIFICACIONES
// ==========================================

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

// ==========================================
// GENERAR CONTENIDO DEL MENSAJE
// ==========================================

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

// ==========================================
// OBTENER TOKENS DE FIRESTORE
// ==========================================

async function obtenerDispositivos() {

  const snapshot = await db
    .collection('dispositivos_push')
    .get();

  const tokens = new Set();

  snapshot.forEach(documento => {

    const lista = documento.data().tokens;

    if (!Array.isArray(lista)) {
      return;
    }

    lista.forEach(token => {

      if (
        typeof token === 'string' &&
        token.trim().length > 0
      ) {
        tokens.add(token.trim());
      }

    });

  });

  return {
    snapshot,
    tokens: [...tokens]
  };

}

// ==========================================
// ELIMINAR TOKENS CONFIRMADOS INVÁLIDOS
// ==========================================

async function limpiarTokensInvalidos(
  snapshot,
  tokensInvalidos
) {

  if (tokensInvalidos.size === 0) {
    return 0;
  }

  let eliminados = 0;

  for (const dispositivo of snapshot.docs) {

    const actuales =
      dispositivo.data().tokens || [];

    if (!Array.isArray(actuales)) {
      continue;
    }

    const eliminar = actuales.filter(
      token => tokensInvalidos.has(token)
    );

    if (eliminar.length === 0) {
      continue;
    }

    await dispositivo.ref.update({
      tokens: FieldValue.arrayRemove(
        ...eliminar
      ),
      actualizado: FieldValue.serverTimestamp()
    });

    eliminados += eliminar.length;

  }

  return eliminados;
}

// ==========================================
// ENVIAR NOTIFICACIONES
// ==========================================

app.post(
  '/api/notificar',
  verificarAdmin,
  async (req, res) => {

    try {

      const { tipo, documentoId } = req.body;

      const configuracion =
        configuraciones[tipo];

      // ----------------------------------
      // VALIDAR SOLICITUD
      // ----------------------------------

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

      // ----------------------------------
      // VERIFICAR REGISTRO EN FIRESTORE
      // ----------------------------------

      const documento = await db
        .collection(configuracion.coleccion)
        .doc(documentoId)
        .get();

      if (!documento.exists) {

        return res.status(404).json({
          ok: false,
          mensaje: 'El registro no existe.'
        });

      }

      const datos = documento.data() || {};

      // ----------------------------------
      // EVITAR NOTIFICACIONES REPETIDAS
      // ----------------------------------

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

        if (
          error.code === 6 ||
          error.code === 'already-exists'
        ) {

          return res.status(409).json({
            ok: false,
            mensaje:
              'La notificación de este registro ya fue solicitada.'
          });

        }

        throw error;

      }

      // ----------------------------------
      // OBTENER DISPOSITIVOS REGISTRADOS
      // ----------------------------------

      const {
        snapshot,
        tokens
      } = await obtenerDispositivos();

      console.log(
        '[FCM] Tokens únicos encontrados:',
        tokens.length
      );

      if (tokens.length === 0) {

        await controlRef.update({
          estado: 'sin_destinatarios',
          enviados: 0,
          fallidos: 0
        });

        return res.json({
          ok: true,
          mensaje:
            'No hay dispositivos registrados.',
          enviados: 0,
          fallidos: 0
        });

      }

      // ----------------------------------
      // PREPARAR MENSAJE
      // ----------------------------------

      const titulo = configuracion.titulo;

      const cuerpo = crearMensaje(
        tipo,
        datos
      );

      let enviados = 0;
      let fallidos = 0;

      const tokensInvalidos = new Set();

      // ----------------------------------
      // ENVIAR POR LOTES DE HASTA 500
      // ----------------------------------

      for (
        let i = 0;
        i < tokens.length;
        i += 500
      ) {

        const lote = tokens.slice(
          i,
          i + 500
        );

        // MENSAJE DE DATOS:
        // Lo recibe firebase-messaging-sw.js
        // y lo muestra en segundo plano.

        const respuesta =
          await messaging.sendEachForMulticast({

            tokens: lote,

            data: {

              titulo:
                `Voz Apostólica - ${titulo}`,

              mensaje: cuerpo,

              tipo: tipo,

              documentoId: documentoId,

              ruta: configuracion.ruta

            },

            webpush: {

              headers: {
                Urgency: 'high',
                TTL: '86400'
              }

            }

          });

        // --------------------------------
        // CONTABILIZAR RESULTADOS
        // --------------------------------

        enviados += respuesta.successCount;

        fallidos += respuesta.failureCount;

        // --------------------------------
        // IDENTIFICAR ERRORES POR DESTINO
        // --------------------------------

        respuesta.responses.forEach(
          (resultado, indice) => {

            if (resultado.success) {

              console.log(
                '[FCM] Envío aceptado. Destinatario:',
                i + indice
              );

              return;
            }

            const codigo =
              resultado.error?.code ||
              'desconocido';

            console.error(
              '[FCM] Error. Destinatario:',
              i + indice,
              'Código:',
              codigo
            );

            if (
              codigo ===
              'messaging/registration-token-not-registered'
            ) {

              tokensInvalidos.add(
                lote[indice]
              );

            }

          }
        );

      }

      // ----------------------------------
      // LIMPIAR TOKENS CADUCADOS
      // ----------------------------------

      let eliminados = 0;

      try {

        eliminados =
          await limpiarTokensInvalidos(
            snapshot,
            tokensInvalidos
          );

      } catch (error) {

        console.error(
          '[FCM] Error limpiando tokens:',
          error
        );

      }

      // ----------------------------------
      // GUARDAR RESULTADO
      // ----------------------------------

      await controlRef.update({

        estado: 'procesado',

        enviados,
        fallidos,

        tokensInvalidosEliminados:
          eliminados,

        fechaFinalizacion:
          FieldValue.serverTimestamp()

      });

      console.log(
        '[FCM] Tipo:',
        tipo,
        '| Enviados:',
        enviados,
        '| Fallidos:',
        fallidos,
        '| Tokens eliminados:',
        eliminados
      );

      return res.status(200).json({

        ok: true,

        mensaje: 'Envío procesado.',

        enviados,

        fallidos

      });

    } catch (error) {

      console.error(
        '[FCM] Error general:',
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          'No se pudo procesar el envío.'
      });

    }

  }
);

// ==========================================
// COMPROBAR SERVIDOR
// ==========================================

app.get('/api/salud', (req, res) => {

  res.json({

    ok: true,

    servicio: 'Notificaciones Voz Apostólica'

  });

});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `Servidor de notificaciones en puerto ${PORT}`
    );

  }
);
