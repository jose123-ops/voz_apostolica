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
      import('./login/login.page').then(
        m => m.LoginPage
      )
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then(
        m => m.HomePage
      )
  },

  {
    path: 'cancion-detalle',
    loadComponent: () =>
      import('./cancion-detalle/cancion-detalle.page').then(
        m => m.CancionDetallePage
      )
  },
  {
    path: 'agregar-cancion',
    loadComponent: () => import('./agregar-cancion/agregar-cancion.page').then( m => m.AgregarCancionPage)
  },

  {
  path: 'agregar-cancion',
  loadComponent: () =>
    import('./agregar-cancion/agregar-cancion.page')
      .then(
        m => m.AgregarCancionPage
      )
},
  {
    path: 'favoritos',
    loadComponent: () => import('./favoritos/favoritos.page').then( m => m.FavoritosPage)
  },

  {
  path: 'favoritos',
  loadComponent: () =>
    import('./favoritos/favoritos.page').then(
      m => m.FavoritosPage
    )
},
  {
    path: 'canciones',
    loadComponent: () => import('./canciones/canciones.page').then( m => m.CancionesPage)
  },


{
  path: 'canciones',
  loadComponent: () =>
    import('./canciones/canciones.page').then(
      m => m.CancionesPage
    )
},
  {
    path: 'eventos',
    loadComponent: () => import('./eventos/eventos.page').then( m => m.EventosPage)
  },
  {
    path: 'crear-evento',
    loadComponent: () => import('./crear-evento/crear-evento.page').then( m => m.CrearEventoPage)
  },
  {
    path: 'detalle-evento',
    loadComponent: () => import('./detalle-evento/detalle-evento.page').then( m => m.DetalleEventoPage)
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



];