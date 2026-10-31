
import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';

import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules,
  
} from '@angular/router';

import {
  IonicRouteStrategy,
  provideIonicAngular
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  home,
  personOutline,
  musicalNotesOutline,
  heartOutline,
  folderOpenOutline,
  logoYoutube,
  searchOutline,
  play,
  arrowBackOutline,
  musicalNoteOutline,
  documentTextOutline,
  alertCircleOutline,
  arrowForwardOutline,
  addCircleOutline,
  heart,
  calendarOutline,
  bookOutline,
  starOutline,
  createOutline,
  trashOutline,
  chevronForwardOutline,
  checkmarkCircleOutline,
  listOutline,
  playOutline,
  shareSocialOutline,
  copyOutline,
  peopleOutline,
  sunnyOutline,
  moonOutline,
  notificationsOutline
} from 'ionicons/icons';

import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// ========================================
// REGISTRAR ICONOS
// ========================================

addIcons({

  'home': home,

  'person-outline': personOutline,

  'musical-notes-outline': musicalNotesOutline,

  'heart-outline': heartOutline,

  'folder-open-outline': folderOpenOutline,

  'logo-youtube': logoYoutube,

  'search-outline': searchOutline,

  'play': play,

  'arrow-back-outline': arrowBackOutline,

  'musical-note-outline': musicalNoteOutline,

  'document-text-outline': documentTextOutline,

  'alert-circle-outline': alertCircleOutline,

  'arrow-forward-outline': arrowForwardOutline,

  'add-circle-outline': addCircleOutline,

  'heart': heart,

  'calendar-outline': calendarOutline,

  'book-outline': bookOutline,

  'star-outline': starOutline,

  'create-outline': createOutline,

  'trash-outline': trashOutline,

  'chevron-forward-outline': chevronForwardOutline,

  'checkmark-circle-outline': checkmarkCircleOutline,

  'list-outline': listOutline,

  'play-outline': playOutline,

  'share-social-outline': shareSocialOutline,

  'people-outline': peopleOutline,

  'copy-outline': copyOutline,

  'sunny-outline': sunnyOutline,

  'moon-outline': moonOutline,
  
  'notifications-outline': notificationsOutline

});

// ========================================
// INICIAR APLICACIÓN
// ========================================

bootstrapApplication(
  AppComponent,
  {
    providers: [

      // ====================================
      // HABILITAR HTTP CLIENT
      // Para buscar letras de canciones
      // ====================================

      provideHttpClient(),

      // ====================================
      // ESTRATEGIA DE NAVEGACIÓN IONIC
      // ====================================

      {
        provide: RouteReuseStrategy,
        useClass: IonicRouteStrategy
      },

      // ====================================
      // CONFIGURACIÓN IONIC
      // ====================================

      provideIonicAngular(),

      // ====================================
      // RUTAS DE LA APLICACIÓN
      // ====================================

      provideRouter(
        routes,

        withPreloading(
          PreloadAllModules
        ),

        withComponentInputBinding()
      ),

      // ====================================
      // SERVICE WORKER PWA
      // ====================================

      provideServiceWorker(
        'ngsw-worker.js',
        {
          enabled: !isDevMode(),

          registrationStrategy:
            'registerWhenStable:30000'
        }
      )

    ]
  }
);
