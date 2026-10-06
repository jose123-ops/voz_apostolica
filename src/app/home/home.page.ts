
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonFooter,
  IonIcon
} from '@ionic/angular';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

import {
  UsuarioService
} from '../services/usuario.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonFooter,
    IonIcon
  ]
})
export class HomePage implements OnInit {
  esAdmin = false;

  canciones: Cancion[] = [];

  cargando = true;

  error = '';

  private cancionesService = inject(CancionesService);

  private router = inject(Router);

  private usuarioService =
  inject(UsuarioService);

  private changeDetector =
    inject(ChangeDetectorRef);


  async ngOnInit() {


  this.esAdmin =
    await this.usuarioService
      .esAdmin();

  await this.cargarCanciones();



    await this.cargarCanciones();

  }


  async cargarCanciones() {

   

    this.cargando = true;

    this.error = '';

    this.changeDetector.detectChanges();


    try {

      const resultado =
        await this.cancionesService
          .obtenerCanciones();


      console.log(
        '📦 RESULTADO FIRESTORE:',
        resultado
      );


      console.log(
        '📊 CANTIDAD:',
        resultado.length
      );


      this.canciones = resultado;


      console.log(
        '🎵 CANCIONES EN COMPONENTE:',
        this.canciones
      );


    } catch (error) {

      console.error(
        '❌ ERROR CARGANDO CANCIONES:',
        error
      );


      this.error =
        'No se pudieron cargar las canciones.';


      this.canciones = [];


    } finally {

      this.cargando = false;


      console.log(
        '🔴 CARGANDO FINAL:',
        this.cargando
      );


      console.log(
        '🟢 CANCIONES FINAL:',
        this.canciones.length
      );


      /*
       * IMPORTANTE:
       * Forzamos a Angular a actualizar
       * la pantalla después de Firestore.
       */

      this.changeDetector.detectChanges();

    }

  }


  abrirCancion(cancion: Cancion) {

    console.log(
      '🎵 ABRIENDO CANCIÓN:',
      cancion
    );


    if (!cancion.id) {

      console.error(
        '❌ La canción no tiene ID'
      );

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


abrirAgregarCancion() {

  this.router.navigate([
    '/agregar-cancion'
  ]);

}

abrirFavoritos() {
  this.router.navigate(['/favoritos']);
}


abrirCanciones() {
  this.router.navigate(['/canciones']);
}

abrirEventos() {
  this.router.navigate(['/eventos']);
}
}

