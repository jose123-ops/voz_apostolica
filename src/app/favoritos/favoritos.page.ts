
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon
} from '@ionic/angular';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

import {
  UsuarioService
} from '../services/usuario.service';

import {
  auth
} from '../firebase';

@Component({
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon
  ]
})
export class FavoritosPage implements OnInit {

  canciones: Cancion[] = [];

  cargando = true;

  error = '';

  private cancionesService =
    inject(CancionesService);

  private usuarioService =
    inject(UsuarioService);

  private router =
    inject(Router);

  private changeDetector =
    inject(ChangeDetectorRef);


  async ngOnInit() {

    await this.cargarFavoritos();

  }


  async cargarFavoritos() {

    this.cargando = true;

    this.error = '';

    this.canciones = [];

    this.changeDetector.detectChanges();


    const usuarioFirebase =
      auth.currentUser;


    if (!usuarioFirebase) {

      this.error =
        'Debe iniciar sesión para ver sus favoritos.';

      this.cargando = false;

      this.changeDetector.detectChanges();

      return;

    }


    try {

      console.log(
        '❤️ Cargando favoritos del usuario:',
        usuarioFirebase.uid
      );


      const usuario =
        await this.usuarioService
          .obtenerUsuarioPorUid(
            usuarioFirebase.uid
          );


      if (!usuario) {

        throw new Error(
          'Usuario no encontrado.'
        );

      }


      console.log(
        '👤 Usuario:',
        usuario
      );


      const favoritos =
        Array.isArray(usuario.favoritos)
          ? usuario.favoritos
          : [];


      console.log(
        '❤️ IDs favoritos:',
        favoritos
      );


      if (favoritos.length === 0) {

        this.canciones = [];

        return;

      }


      const cancionesEncontradas:
        Cancion[] = [];


      for (
        const cancionId of favoritos
      ) {

        try {

          const cancion =
            await this.cancionesService
              .obtenerCancion(
                cancionId
              );


          if (cancion) {

            cancionesEncontradas.push(
              cancion
            );

          }

        } catch (error) {

          console.error(
            'Error cargando canción:',
            cancionId,
            error
          );

        }

      }


      this.canciones =
        cancionesEncontradas;


      console.log(
        '🎵 Canciones favoritas:',
        this.canciones
      );


    } catch (error) {

      console.error(
        '❌ Error cargando favoritos:',
        error
      );


      this.error =
        'No se pudieron cargar los favoritos.';


    } finally {

      this.cargando = false;

      this.changeDetector.detectChanges();

    }

  }


  abrirCancion(
    cancion: Cancion
  ) {

    if (!cancion.id) {

      return;

    }


    this.router.navigate(
      ['/cancion-detalle'],
      {
        queryParams: {
          id: cancion.id
        }
      }
    );

  }


  volver() {

    this.router.navigate([
      '/home'
    ]);

  }

}

