
import { bootstrapApplication } from '@angular/platform-browser';

import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules
} from '@angular/router';

import {
  IonicRouteStrategy,
  provideIonicAngular
} from '@ionic/angular';

import {
  addIcons
} from 'ionicons';

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
} from 'ionicons/icons';

import { routes } from './app/app.routes';

import {
  AppComponent
} from './app/app.component';


// ========================================
// REGISTRAR ICONOS
// ========================================

addIcons({

  'home':
    home,

  'person-outline':
    personOutline,

  'musical-notes-outline':
    musicalNotesOutline,

  'heart-outline':
    heartOutline,

  'folder-open-outline':
    folderOpenOutline,

  'logo-youtube':
    logoYoutube,

  'search-outline':
    searchOutline,

  'play':
    play,

  'arrow-back-outline':
    arrowBackOutline,

  'musical-note-outline':
    musicalNoteOutline,

  'document-text-outline':
    documentTextOutline,

  'alert-circle-outline':
    alertCircleOutline,

  'arrow-forward-outline':
    arrowForwardOutline,

  'add-circle-outline':
    addCircleOutline,

  'heart':
    heart,

  'calendar-outline': calendarOutline,

  'book-outline': bookOutline,

  'star-outline': starOutline,

});


// ========================================
// INICIAR APLICACIÓN
// ========================================

bootstrapApplication(
  AppComponent,
  {

    providers: [

      {
        provide:
          RouteReuseStrategy,

        useClass:
          IonicRouteStrategy

      },


      provideIonicAngular(),


      provideRouter(

        routes,

        withPreloading(
          PreloadAllModules
        ),

        withComponentInputBinding()

      )

    ]

  }
);

