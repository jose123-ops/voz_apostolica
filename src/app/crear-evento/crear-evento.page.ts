
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  Router,
  ActivatedRoute
} from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonInput,
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

type SeccionEvento =
  | 'ministracion'
  | 'lectura'
  | 'ofrenda'
  | 'despedida'
  | 'especiales';

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
    IonSelect,
    IonSelectOption
  ]
})
export class CrearEventoPage implements OnInit {

  // INFORMACIÓN DEL EVENTO

  nombre = '';
  fecha = '';

  // MODO EDICIÓN

  modoEdicion = false;
  eventoId: string | null = null;

  cargandoEvento = false;

  // Se conserva la versión de los eventos existentes.
  versionPrograma = 2;

  // CANCIONES DISPONIBLES

  canciones: Cancion[] = [];

  // REPERTORIO

  ministracion: CancionEvento[] = [];
  lectura: CancionEvento[] = [];
  ofrenda: CancionEvento[] = [];
  despedida: CancionEvento[] = [];
  especiales: CancionEvento[] = [];

  // ESTADOS

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

  private route =
    inject(ActivatedRoute);

  private changeDetector =
    inject(ChangeDetectorRef);


  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  async ngOnInit() {

    const id =
      this.route.snapshot.queryParamMap.get('editar');

    if (id) {
      this.modoEdicion = true;
      this.eventoId = id;
    }

    await this.cargarCanciones();

    if (this.modoEdicion && this.eventoId) {
      await this.cargarEvento(this.eventoId);
    }

  }


  // ==========================================
  // CARGAR CANCIONES DE FIRESTORE
  // ==========================================

  async cargarCanciones() {

    this.cargandoCanciones = true;

    try {

      this.canciones =
        await this.cancionesService.obtenerCanciones();

    } catch (error) {

      console.error(
        'Error cargando canciones:',
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
  // CARGAR EVENTO EXISTENTE
  // ==========================================

  async cargarEvento(id: string) {

    this.cargandoEvento = true;
    this.error = '';

    try {

      const evento =
        await this.eventosService.obtenerEvento(id);

      if (!evento) {

        this.error =
          'El evento que intentás editar no existe.';

        return;
      }

      // DATOS GENERALES

      this.nombre = evento.nombre || '';
      this.fecha = evento.fecha || '';

      // CONSERVAR VERSIÓN ORIGINAL

      this.versionPrograma =
        evento.versionPrograma ?? 1;

      // CARGAR REPERTORIO
      // Se crean copias para no modificar
      // accidentalmente los datos originales.

      this.ministracion = (
        evento.ministracion || []
      ).map(item => ({ ...item }));

      this.lectura = (
        evento.lectura || []
      ).map(item => ({ ...item }));

      this.ofrenda = (
        evento.ofrenda || []
      ).map(item => ({ ...item }));

      this.despedida = (
        evento.despedida || []
      ).map(item => ({ ...item }));

      this.especiales = (
        evento.especiales || []
      ).map(item => ({ ...item }));

      console.log(
        'Evento cargado para edición:',
        id
      );

    } catch (error) {

      console.error(
        'Error cargando evento:',
        error
      );

      this.error =
        'No se pudo cargar el evento para editarlo.';

    } finally {

      this.cargandoEvento = false;

      this.changeDetector.detectChanges();
    }

  }


  // ==========================================
  // OBTENER NOMBRE DE CANCIÓN
  // ==========================================

  obtenerNombreCancion(id: string): string {

    const cancion =
      this.canciones.find(
        item => item.id === id
      );

    return cancion?.titulo ||
      'Canción no encontrada';

  }


  // ==========================================
  // OBTENER LISTA DE UNA SECCIÓN
  // ==========================================

  obtenerLista(
    seccion: SeccionEvento
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
  // AGREGAR CANCIÓN
  // ==========================================

  agregarCancion(seccion: SeccionEvento) {

    const lista = this.obtenerLista(seccion);

    lista.push({
      cancionId: '',
      dirige: ''
    });

    this.changeDetector.detectChanges();

  }


  // ==========================================
  // ELIMINAR CANCIÓN
  // ==========================================

  eliminarCancion(
    seccion: SeccionEvento,
    indice: number
  ) {

    const lista = this.obtenerLista(seccion);

    if (indice < 0 || indice >= lista.length) {
      return;
    }

    lista.splice(indice, 1);

    this.changeDetector.detectChanges();

  }


  // ==========================================
  // MOVER CANCIÓN HACIA ARRIBA O ABAJO
  // ==========================================

  moverCancion(
    seccion: SeccionEvento,
    indice: number,
    direccion: 'arriba' | 'abajo'
  ) {

    const lista = this.obtenerLista(seccion);

    const nuevoIndice =
      direccion === 'arriba'
        ? indice - 1
        : indice + 1;

    if (
      nuevoIndice < 0 ||
      nuevoIndice >= lista.length
    ) {
      return;
    }

    const [cancion] = lista.splice(indice, 1);

    lista.splice(nuevoIndice, 0, cancion);

    this.changeDetector.detectChanges();

  }


  // ==========================================
  // GUARDAR O ACTUALIZAR EVENTO
  // ==========================================

  async guardarEvento() {

    this.mensaje = '';
    this.error = '';

    if (this.guardando || this.cargandoEvento) {
      return;
    }

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
      ...this.lectura,
      ...this.especiales,
      ...this.ofrenda,
      ...this.despedida,
      ...this.ministracion
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

    this.guardando = true;

    try {

      const evento: Evento = {

        nombre: this.nombre.trim(),

        fecha: this.fecha,

        versionPrograma: this.versionPrograma,

        ministracion: this.ministracion.map(
          item => ({ ...item })
        ),

        lectura: this.lectura.map(
          item => ({ ...item })
        ),

        ofrenda: this.ofrenda.map(
          item => ({ ...item })
        ),

        despedida: this.despedida.map(
          item => ({ ...item })
        ),

        especiales: this.especiales.map(
          item => ({ ...item })
        )

      };

      // ======================================
      // EDITAR EVENTO EXISTENTE
      // ======================================

      if (this.modoEdicion) {

        if (!this.eventoId) {

          this.error =
            'No se encontró el evento que se desea editar.';

          return;
        }

        await this.eventosService.actualizarEvento(
          this.eventoId,
          evento
        );

        this.mensaje =
          'El repertorio del evento se actualizó correctamente.';

        await this.router.navigate(
          ['/detalle-evento'],
          {
            queryParams: {
              id: this.eventoId
            }
          }
        );

      } else {

        // ====================================
        // CREAR EVENTO NUEVO
        // ====================================

        await this.eventosService.agregarEvento(
          evento
        );

        this.mensaje =
          'El evento se creó correctamente.';

        await this.router.navigate(['/eventos']);

      }

    } catch (error) {

      console.error(
        'Error guardando evento:',
        error
      );

      this.error = this.modoEdicion
        ? 'No se pudieron guardar los cambios del evento.'
        : 'No se pudo crear el evento.';

    } finally {

      this.guardando = false;

      this.changeDetector.detectChanges();

    }

  }


  // ==========================================
  // VOLVER
  // ==========================================

  volver() {

    if (this.modoEdicion && this.eventoId) {

      this.router.navigate(
        ['/detalle-evento'],
        {
          queryParams: {
            id: this.eventoId
          }
        }
      );

    } else {

      this.router.navigate(['/eventos']);

    }

  }

}
