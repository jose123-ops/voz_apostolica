import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonButton
} from '@ionic/angular';

import { ActivatedRoute, Router } from '@angular/router';

import {
  EventosService,
  Evento,
  CancionEvento
} from '../services/eventos';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-detalle-evento',
  templateUrl: './detalle-evento.page.html',
  styleUrls: ['./detalle-evento.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonButton
  ]
})
export class DetalleEventoPage implements OnInit {

  evento: Evento | null = null;

  canciones: Cancion[] = [];

  cargando = true;

  error = '';

  esAdmin = false;

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private eventosService =
    inject(EventosService);

  private cancionesService =
    inject(CancionesService);

  private usuarioService =
    inject(UsuarioService);

  private changeDetector =
    inject(ChangeDetectorRef);


  async ngOnInit() {

    await this.verificarAdmin();

    await this.cargarDatos();

  }


  async verificarAdmin() {

    try {

      this.esAdmin =
        await this.usuarioService.esAdmin();

    } catch (error) {

      console.error(
        '❌ Error verificando administrador:',
        error
      );

      this.esAdmin = false;

    }

  }


  async cargarDatos() {

    this.cargando = true;

    this.error = '';

    try {

      const id =
        this.route.snapshot.queryParamMap.get('id');

      if (!id) {

        this.error =
          'No se encontró el evento.';

        return;

      }


      const [evento, canciones] =
        await Promise.all([

          this.eventosService.obtenerEvento(id),

          this.cancionesService.obtenerCanciones()

        ]);


      if (!evento) {

        this.error =
          'El evento no existe.';

        return;

      }


      this.evento = evento;

      this.canciones = canciones;


      console.log(
        '📅 Evento:',
        this.evento
      );

      console.log(
        '🎵 Canciones:',
        this.canciones
      );


    } catch (error) {

      console.error(
        '❌ Error cargando detalle del evento:',
        error
      );

      this.error =
        'No se pudo cargar el evento.';

    } finally {

      this.cargando = false;

      this.changeDetector.detectChanges();

    }

  }


  obtenerCancion(
    id: string
  ): Cancion | null {

    return (
      this.canciones.find(
        cancion => cancion.id === id
      ) || null
    );

  }


  obtenerNombreCancion(
    id: string
  ): string {

    const cancion =
      this.obtenerCancion(id);

    return (
      cancion?.titulo ||
      'Canción no encontrada'
    );

  }


  abrirCancion(
    id: string
  ) {

    if (!id) {
      return;
    }

    this.router.navigate(
      ['/cancion-detalle'],
      {
        queryParams: {
          id
        }
      }
    );

  }


  formatearFecha(
    fecha: string
  ): string {

    if (!fecha) {
      return '';
    }


    const partes =
      fecha.split('-');


    if (partes.length !== 3) {
      return fecha;
    }


    const anio =
      Number(partes[0]);

    const mes =
      Number(partes[1]);

    const dia =
      Number(partes[2]);


    const fechaLocal =
      new Date(
        anio,
        mes - 1,
        dia
      );


    return fechaLocal.toLocaleDateString(
      'es-NI',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    );

  }


  obtenerCantidadCanciones(): number {

    if (!this.evento) {
      return 0;
    }


    return (

      this.evento.ministracion.length +

      this.evento.lectura.length +

      this.evento.ofrenda.length +

      this.evento.especiales.length +

      this.evento.despedida.length

    );

  }


  volver() {

    this.router.navigate([
      '/eventos'
    ]);

  }


  editarEvento() {

    if (!this.evento?.id) {
      return;
    }

    console.log(
      '✏️ Editar evento:',
      this.evento.id
    );

    // Lo implementaremos en el siguiente paso.

  }


  async eliminarEvento() {

    if (!this.evento?.id) {
      return;
    }


    const confirmar =
      window.confirm(
        '¿Está seguro de eliminar este evento?'
      );


    if (!confirmar) {
      return;
    }


    try {

      await this.eventosService.eliminarEvento(
        this.evento.id
      );


      this.router.navigate([
        '/eventos'
      ]);

    } catch (error) {

      console.error(
        '❌ Error eliminando evento:',
        error
      );

      this.error =
        'No se pudo eliminar el evento.';

      this.changeDetector.detectChanges();

    }

  }

}