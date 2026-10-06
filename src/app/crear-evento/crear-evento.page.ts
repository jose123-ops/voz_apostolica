import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

import {
  EventosService,
  Evento,
  CancionEvento
} from '../services/eventos';

@Component({
  selector: 'app-crear-evento',
  templateUrl: './crear-evento.page.html',
  styleUrls: ['./crear-evento.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption
  ]
})
export class CrearEventoPage implements OnInit {

  nombre = '';

  fecha = '';

  canciones: Cancion[] = [];

  ministracion: CancionEvento[] = [];

  lectura: CancionEvento[] = [];

  ofrenda: CancionEvento[] = [];

  despedida: CancionEvento[] = [];

  especiales: CancionEvento[] = [];


  cargandoCanciones = true;

  guardando = false;

  mensaje = '';

  error = '';


  private cancionesService =
    inject(CancionesService);

  private eventosService =
    inject(EventosService);

  private router =
    inject(Router);

  private changeDetector =
    inject(ChangeDetectorRef);


  async ngOnInit() {

    await this.cargarCanciones();

  }


  // ==========================================
  // CARGAR CANCIONES DE FIRESTORE
  // ==========================================

  async cargarCanciones() {

    this.cargandoCanciones = true;

    try {

      this.canciones =
        await this.cancionesService
          .obtenerCanciones();

    } catch (error) {

      console.error(
        '❌ Error cargando canciones:',
        error
      );

      this.error =
        'No se pudieron cargar las canciones.';

    } finally {

      this.cargandoCanciones = false;

      this.changeDetector.detectChanges();
    }
  }


  // ==========================================
  // OBTENER NOMBRE DE CANCIÓN
  // ==========================================

  obtenerNombreCancion(
    id: string
  ): string {

    const cancion =
      this.canciones.find(
        item => item.id === id
      );

    return cancion?.titulo || 'Canción no encontrada';
  }


  // ==========================================
  // AGREGAR CANCIÓN A UNA SECCIÓN
  // ==========================================

  agregarCancion(
    seccion:
      | 'ministracion'
      | 'lectura'
      | 'ofrenda'
      | 'despedida'
      | 'especiales'
  ) {

    const lista =
      this.obtenerLista(seccion);

    lista.push({

      cancionId: '',

      dirige: ''

    });
  }


  // ==========================================
  // OBTENER LISTA
  // ==========================================

  obtenerLista(
    seccion:
      | 'ministracion'
      | 'lectura'
      | 'ofrenda'
      | 'despedida'
      | 'especiales'
  ): CancionEvento[] {

    switch (seccion) {

      case 'ministracion':
        return this.ministracion;

      case 'lectura':
        return this.lectura;

      case 'ofrenda':
        return this.ofrenda;

      case 'despedida':
        return this.despedida;

      case 'especiales':
        return this.especiales;
    }
  }


  // ==========================================
  // ELIMINAR CANCIÓN
  // ==========================================

  eliminarCancion(
    seccion:
      | 'ministracion'
      | 'lectura'
      | 'ofrenda'
      | 'despedida'
      | 'especiales',

    indice: number
  ) {

    const lista =
      this.obtenerLista(seccion);

    lista.splice(indice, 1);
  }

  


  // ==========================================
  // GUARDAR EVENTO
  // ==========================================

  async guardarEvento() {

    this.mensaje = '';

    this.error = '';


    if (!this.nombre.trim()) {

      this.error =
        'Ingrese el nombre del evento.';

      return;
    }


    if (!this.fecha) {

      this.error =
        'Seleccione la fecha del evento.';

      return;
    }


    const todasLasSecciones = [

      ...this.ministracion,

      ...this.lectura,

      ...this.ofrenda,

      ...this.despedida,

      ...this.especiales

    ];


    const cancionesInvalidas =
      todasLasSecciones.some(
        item => !item.cancionId
      );


    if (cancionesInvalidas) {

      this.error =
        'Seleccione una canción en todas las filas agregadas.';

      return;
    }


    if (this.guardando) {
      return;
    }


    this.guardando = true;


    try {

      const evento: Evento = {

        nombre:
          this.nombre.trim(),

        fecha:
          this.fecha,

        ministracion:
          this.ministracion,

        lectura:
          this.lectura,

        ofrenda:
          this.ofrenda,

        despedida:
          this.despedida,

        especiales:
          this.especiales

      };


      await this.eventosService
        .agregarEvento(evento);


      this.mensaje =
        'El evento se creó correctamente.';


      setTimeout(() => {

        this.router.navigate([
          '/eventos'
        ]);

      }, 1000);


    } catch (error) {

      console.error(
        '❌ Error creando evento:',
        error
      );

      this.error =
        'No se pudo crear el evento.';

    } finally {

      this.guardando = false;

      this.changeDetector.detectChanges();
    }
  }


  // ==========================================
  // VOLVER
  // ==========================================

  volver() {

    this.router.navigate([
      '/eventos'
    ]);

  }

}