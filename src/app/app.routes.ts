
import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.page')
        .then(m => m.LoginPage)
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page')
        .then(m => m.HomePage)
  },

  {
    path: 'canciones',
    loadComponent: () =>
      import('./canciones/canciones.page')
        .then(m => m.CancionesPage)
  },

  {
    path: 'cancion-detalle',
    loadComponent: () =>
      import('./cancion-detalle/cancion-detalle.page')
        .then(m => m.CancionDetallePage)
  },

  {
    path: 'agregar-cancion',
    loadComponent: () =>
      import('./agregar-cancion/agregar-cancion.page')
        .then(m => m.AgregarCancionPage)
  },

  {
    path: 'favoritos',
    loadComponent: () =>
      import('./favoritos/favoritos.page')
        .then(m => m.FavoritosPage)
  },

  {
    path: 'eventos',
    loadComponent: () =>
      import('./eventos/eventos.page')
        .then(m => m.EventosPage)
  },

  {
    path: 'crear-evento',
    loadComponent: () =>
      import('./crear-evento/crear-evento.page')
        .then(m => m.CrearEventoPage)
  },

  {
    path: 'detalle-evento',
    loadComponent: () =>
      import('./detalle-evento/detalle-evento.page')
        .then(m => m.DetalleEventoPage)
  },

  {
    path: 'ensayos',
    loadComponent: () =>
      import('./ensayos/ensayos.page')
        .then(m => m.EnsayosPage)
  },

  {
    path: 'crear-ensayo',
    loadComponent: () =>
      import('./crear-ensayo/crear-ensayo.page')
        .then(m => m.CrearEnsayoPage)
  },

  {
    path: 'detalle-ensayo',
    loadComponent: () =>
      import('./detalle-ensayo/detalle-ensayo.page')
        .then(m => m.DetalleEnsayoPage)
  }

];
