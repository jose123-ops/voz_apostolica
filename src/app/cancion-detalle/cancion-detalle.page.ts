
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  ActivatedRoute,
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

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';


@Component({
  selector: 'app-cancion-detalle',

  templateUrl:
    './cancion-detalle.page.html',

  styleUrls:
    ['./cancion-detalle.page.scss'],

  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon
  ]

})
export class CancionDetallePage
  implements OnInit {


  cancion: Cancion | null = null;

  cargando = true;

  error = '';

  // Indica si la canción está en favoritos
  esFavorito = false;

  // Evita pulsaciones múltiples
  actualizandoFavorito = false;

  rolUsuario = '';

puedeVerLetra = false;
puedeVerAcordes = false;


  private sanitizer =
    inject(DomSanitizer);


  private route =
    inject(ActivatedRoute);


  private router =
    inject(Router);


  private cancionesService =
    inject(CancionesService);


  private usuarioService =
    inject(UsuarioService);


  private changeDetector =
    inject(ChangeDetectorRef);



  async ngOnInit() {

  
  await this.cargarRolUsuario();

  await this.cargarCancion();


    await this.cargarCancion();

  }



  /*
   * ==============================
   * CARGAR CANCIÓN
   * ==============================
   */

  async cargarCancion() {
   

    this.cargando = true;

    this.error = '';

    this.cancion = null;

    this.esFavorito = false;


    this.changeDetector.detectChanges();


    const id =
      this.route.snapshot
        .queryParamMap
        .get('id');


    console.log(
      'ID recibido:',
      id
    );


    if (!id) {

      console.error(
        'No se recibió ID'
      );

      this.error =
        'No se recibió el ID de la canción.';

      this.cargando = false;

      this.changeDetector.detectChanges();

      return;

    }


    try {

      console.log(
        'Consultando Firestore...'
      );


      const resultado =
        await this.cancionesService
          .obtenerCancion(id);


      console.log(
        'Resultado:',
        resultado
      );


      if (!resultado) {

        console.error(
          'Canción no encontrada'
        );

        this.error =
          'La canción no existe.';

        this.cargando = false;

        this.changeDetector.detectChanges();

        return;

      }


      this.cancion = resultado;


      console.log(
        'Canción asignada:',
        this.cancion
      );


      /*
       * ==============================
       * COMPROBAR FAVORITO
       * ==============================
       */

      await this.comprobarFavorito();


    } catch (error) {

      console.error(
        'Error:',
        error
      );

      this.error =
        'No se pudo cargar la canción.';


    } finally {

      this.cargando = false;


      console.log(
        'Cargando:',
        this.cargando
      );


      console.log(
        'Canción:',
        this.cancion
      );


      this.changeDetector.detectChanges();

    }

  }



  /*
   * ==============================
   * COMPROBAR FAVORITO
   * ==============================
   */

  async comprobarFavorito() {

    if (!this.cancion?.id) {

      return;

    }


    const usuarioFirebase =
      auth.currentUser;


    if (!usuarioFirebase) {

      console.warn(
        'No hay usuario autenticado.'
      );

      this.esFavorito = false;

      return;

    }


    try {

      this.esFavorito =
        await this.usuarioService
          .esFavorito(
            usuarioFirebase.uid,
            this.cancion.id
          );


      console.log(
        '❤️ ¿Es favorito?:',
        this.esFavorito
      );


    } catch (error) {

      console.error(
        'Error comprobando favorito:',
        error
      );

      this.esFavorito = false;

    }

  }



  /*
   * ==============================
   * AGREGAR / QUITAR FAVORITO
   * ==============================
   */

  async cambiarFavorito() {

    if (
      !this.cancion?.id ||
      this.actualizandoFavorito
    ) {

      return;

    }


    const usuarioFirebase =
      auth.currentUser;


    if (!usuarioFirebase) {

      this.error =
        'Debe iniciar sesión para guardar favoritos.';

      this.changeDetector.detectChanges();

      return;

    }


    this.actualizandoFavorito = true;

    this.error = '';

    this.changeDetector.detectChanges();


    try {

      if (this.esFavorito) {

        /*
         * QUITAR DE FAVORITOS
         */

        await this.usuarioService
          .quitarFavorito(

            usuarioFirebase.uid,

            this.cancion.id

          );


        this.esFavorito = false;


        console.log(
          '💔 Canción eliminada de favoritos.'
        );


      } else {

        /*
         * AGREGAR A FAVORITOS
         */

        await this.usuarioService
          .agregarFavorito(

            usuarioFirebase.uid,

            this.cancion.id

          );


        this.esFavorito = true;


        console.log(
          '❤️ Canción agregada a favoritos.'
        );

      }


    } catch (error) {

      console.error(
        'Error actualizando favorito:',
        error
      );


      this.error =
        'No se pudo actualizar el favorito.';


    } finally {

      this.actualizandoFavorito = false;

      this.changeDetector.detectChanges();

    }

  }



  /*
   * ==============================
   * VOLVER AL INICIO
   * ==============================
   */

  volver() {

    this.router.navigate([
      '/home'
    ]);

  }



  /*
   * ==============================
   * SEPARAR ESTROFAS
   * ==============================
   */

  separarEstrofas(
    letra: string
  ): string[] {

    if (!letra) {

      return [];

    }


    return letra

      .replace(
        /\r\n/g,
        '\n'
      )

      .replace(
        /\r/g,
        '\n'
      )

      .split(
        /\n\s*\n/
      )

      .map(
        estrofa =>
          estrofa.trim()
      )

      .filter(
        estrofa =>
          estrofa.length > 0
      );

  }


  async cargarRolUsuario() {

  try {

    const usuario =
      await this.usuarioService
        .obtenerUsuarioActual();

    console.log(
      '👤 Usuario actual:',
      usuario
    );

    if (!usuario) {

      console.error(
        '❌ No se pudo obtener el usuario actual.'
      );

      this.rolUsuario = '';

      this.puedeVerLetra = false;

      this.puedeVerAcordes = false;

      return;
    }

    this.rolUsuario =
      (usuario.rol || '')
        .toLowerCase()
        .trim();

    console.log(
      '🎵 Rol del usuario:',
      this.rolUsuario
    );


    // ADMIN
    if (
      this.rolUsuario === 'admin'
    ) {

      this.puedeVerLetra = true;

      this.puedeVerAcordes = true;
    }


    // MÚSICO
    else if (
      this.rolUsuario === 'musico'
    ) {

      this.puedeVerLetra = false;

      this.puedeVerAcordes = true;
    }


    // CANTANTE
    else if (
      this.rolUsuario === 'cantante'
    ) {

      this.puedeVerLetra = true;

      this.puedeVerAcordes = false;
    }


    console.log(
      '📖 Puede ver letra:',
      this.puedeVerLetra
    );

    console.log(
      '🎸 Puede ver acordes:',
      this.puedeVerAcordes
    );

  } catch (error) {

    console.error(
      '❌ Error obteniendo rol:',
      error
    );

    this.rolUsuario = '';

    this.puedeVerLetra = false;

    this.puedeVerAcordes = false;
  }
}



  /*
   * ==============================
   * OBTENER ID DE YOUTUBE
   * ==============================
   */

  obtenerYoutubeId(
    url: string | undefined
  ): string {

    if (!url) {

      return '';

    }


    try {

      const urlObj =
        new URL(url);


      /*
       * URL normal:
       * youtube.com/watch?v=ABC123
       */

      const videoId =
        urlObj.searchParams.get('v');


      if (videoId) {

        return videoId;

      }


      /*
       * URL corta:
       * youtu.be/ABC123
       */

      if (
        urlObj.hostname ===
        'youtu.be'
      ) {

        return urlObj.pathname
          .replace('/', '');

      }


      /*
       * URL embed:
       * youtube.com/embed/ABC123
       */

      if (
        urlObj.pathname
          .startsWith('/embed/')
      ) {

        return urlObj.pathname
          .replace('/embed/', '');

      }


    } catch (error) {

      console.error(
        'URL de YouTube inválida:',
        error
      );

    }


    return '';

  }



  /*
   * ==============================
   * URL SEGURA DE YOUTUBE
   * ==============================
   */

  obtenerYoutubeUrlSegura(
    url: string | undefined
  ): SafeResourceUrl | null {

    const videoId =
      this.obtenerYoutubeId(url);


    if (!videoId) {

      return null;

    }


    const youtubeUrl =
      `https://www.youtube.com/embed/${videoId}`;


    return this.sanitizer
      .bypassSecurityTrustResourceUrl(
        youtubeUrl
      );

  }

}

