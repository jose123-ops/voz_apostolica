
/*
  =======================================
  VOZ APOSTÓLICA
  FIREBASE CLOUD MESSAGING
  =======================================
*/

// Firebase SDK compatible con Service Workers
importScripts(
  'https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js'
);

// =======================================
// CONFIGURACIÓN FIREBASE
// =======================================

firebase.initializeApp({
  apiKey: "AIzaSyCCln6vcCmeS1kMXpTBNlfxXurhUWyk57M",
  authDomain: "voz-apostolica.firebaseapp.com",
  projectId: "voz-apostolica",
  storageBucket: "voz-apostolica.firebasestorage.app",
  messagingSenderId: "947785586287",
  appId: "1:947785586287:web:4ae3effcea76c02f56df9a"
});

// =======================================
// INICIALIZAR FIREBASE MESSAGING
// =======================================

const messaging = firebase.messaging();

// Los mensajes enviados con un campo
// "notification" desde Firebase Console
// se muestran automáticamente cuando
// la aplicación está en segundo plano.

// No llamamos a showNotification()
// para evitar notificaciones duplicadas.

messaging.onBackgroundMessage((payload) => {

  console.log(
    '[Voz Apostólica] Mensaje recibido:',
    payload
  );

});
