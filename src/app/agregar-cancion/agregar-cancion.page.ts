
import {
  Component,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonInput,
  IonTextarea,
  IonButton,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import {
  CancionesService,
  Cancion
} from '../services/canciones';


@Component({
  selector: 'app-agregar-cancion',
  templateUrl: './agregar-cancion.page.html',
  styleUrls: ['./agregar-cancion.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonInput,
    IonTextarea,
    IonButton,
    IonSelect,
    IonSelectOption
  ]
})
export class AgregarCancionPage {


  /*
   * ==============================
   * DATOS DE LA CANCIÓN
   * ==============================
   */

  titulo = '';

  artista = '';

  categoria = '';

  acordes = '';

  letra = '';

  youtube = '';


  /*
   * ==============================
   * ESTADO
   * ==============================
   */

  guardando = false;

  mensaje = '';

  error = '';


  /*
   * ==============================
   * SERVICIOS
   * ==============================
   */

  private cancionesService =
    inject(CancionesService);

  private router =
    inject(Router);

  private changeDetector =
    inject(ChangeDetectorRef);


  /*
   * ==============================
   * GUARDAR CANCIÓN
   * ==============================
   */

  async guardarCancion() {

    this.mensaje = '';

    this.error = '';


    /*
     * Validamos los campos
     */

    if (!this.titulo.trim()) {

      this.error =
        'Ingrese el título de la canción.';

      return;

    }


    if (!this.artista.trim()) {

      this.error =
        'Ingrese el artista o autor.';

      return;

    }


    if (!this.categoria.trim()) {

      this.error =
        'Seleccione una categoría.';

      return;

    }


    if (!this.letra.trim()) {

      this.error =
        'Ingrese la letra de la canción.';

      return;

    }


    /*
     * Evitamos doble clic
     */

    if (this.guardando) {

      return;

    }


    this.guardando = true;

    this.changeDetector.detectChanges();


    try {

      console.log(
        '🎵 Guardando canción...'
      );


      const nuevaCancion: Cancion = {

        titulo:
          this.titulo.trim(),

        artista:
          this.artista.trim(),

        categoria:
          this.categoria.trim(),

        letra:
          this.letra,

        acordes:
          this.acordes,

        youtube:
          this.youtube.trim()

      };


      console.log(
        '📦 Datos:',
        nuevaCancion
      );


      await this.cancionesService
        .agregarCancion(nuevaCancion);


      console.log(
        '✅ Canción guardada'
      );


      this.mensaje =
        'La canción se guardó correctamente.';


      /*
       * Limpiamos el formulario
       */

      this.titulo = '';

      this.artista = '';

      this.categoria = '';

      this.acordes = '';

      this.letra = '';

      this.youtube = '';


    } catch (error) {

      console.error(
        '❌ Error guardando canción:',
        error
      );


      this.error =
        'No se pudo guardar la canción.';


    } finally {

      this.guardando = false;

      this.changeDetector.detectChanges();

    }

  }


  /*
   * ==============================
   * VOLVER
   * ==============================
   */

  volver() {

    this.router.navigate([
      '/home'
    ]);

  }

}

