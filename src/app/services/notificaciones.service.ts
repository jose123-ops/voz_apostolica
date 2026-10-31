import {
  doc,
  setDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';

import { db, auth } from '../firebase';
import { Injectable, inject } from '@angular/core';

import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from 'firebase/messaging';

import { getApp } from 'firebase/app';
import { ToastController } from '@ionic/angular';

// Inicializa Firebase usando la configuración existente
import '../firebase';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private toastController = inject(ToastController);

  // Reemplazar con la clave pública de Firebase
  private vapidKey = 'BElM02aDKhuVBLpB4JSHHpWt0jDj9tqw9cGYeYf9Evz-It7PIScK8N3iwPxcJv9-3ClT76xvBmuBhG8z7WuLMsI';

  private escuchando = false;

  // =====================================
  // ACTIVAR NOTIFICACIONES
  // =====================================

  async activarNotificaciones(): Promise<string | null> {

    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator)
    ) {
      throw new Error(
        'Este navegador no admite notificaciones push.'
      );
    }

    if (!(await isSupported())) {
      throw new Error(
        'Firebase Messaging no es compatible con este navegador.'
      );
    }

    if (
      this.vapidKey ===
      'PEGA_AQUI_TU_CLAVE_PUBLICA_VAPID'
    ) {
      throw new Error(
        'Falta configurar la clave VAPID.'
      );
    }

    const permiso =
      await Notification.requestPermission();

    if (permiso !== 'granted') {
      throw new Error(
        'No se concedió permiso para notificaciones.'
      );
    }

    // Service Worker exclusivo de Firebase Messaging
    const registro =
      await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        {
          scope: '/firebase-cloud-messaging-push-scope'
        }
      );

    await navigator.serviceWorker.ready;

    const messaging = getMessaging(getApp());

    const token = await getToken(messaging, {
      vapidKey: this.vapidKey,
      serviceWorkerRegistration: registro
    });

    if (!token) {
      throw new Error(
        'Firebase no devolvió un token.'
      );
    }
    await this.guardarTokenDispositivo(token);

    this.escucharMensajes();

    return token;
  }

  // =====================================
  // NOTIFICACIONES EN PRIMER PLANO
  // =====================================

  private async escucharMensajes(): Promise<void> {

    if (this.escuchando) return;

    const messaging = getMessaging(getApp());

    onMessage(messaging, async payload => {

      const titulo =
        payload.notification?.title ||
        'Voz Apostólica';

      const mensaje =
        payload.notification?.body ||
        'Tenés una nueva notificación.';

      const toast =
        await this.toastController.create({
          header: titulo,
          message: mensaje,
          duration: 6000,
          position: 'top',
          color: 'primary',
          buttons: [
            {
              text: 'Cerrar',
              role: 'cancel'
            }
          ]
        });

      await toast.present();
    });

    this.escuchando = true;
  }

  
async guardarTokenDispositivo(
  token: string
): Promise<void> {

  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error(
      'Debés iniciar sesión para registrar el dispositivo.'
    );
  }

  const referencia = doc(
    db,
    'dispositivos_push',
    usuario.uid
  );

  await setDoc(
    referencia,
    {
      uid: usuario.uid,

      tokens: arrayUnion(token),

      actualizado: serverTimestamp()
    },
    {
      merge: true
    }
  );

  console.log(
    'Dispositivo registrado para notificaciones.'
  );
}


}
