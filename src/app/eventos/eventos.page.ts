import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton
} from '@ionic/angular';

import { Router } from '@angular/router';

import {
  EventosService,
  Evento
} from '../services/eventos';

import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.page.html',
  styleUrls: ['./eventos.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton
  ]
})
export class EventosPage implements OnInit {

  eventos: Evento[] = [];

  cargando = true;
  error = '';

  esAdmin = false;

  private eventosService: EventosService =
    inject(EventosService);

  private usuarioService: UsuarioService =
    inject(UsuarioService);

  private router: Router =
    inject(Router);

  private changeDetector: ChangeDetectorRef =
    inject(ChangeDetectorRef);


  async ngOnInit() {

    await this.verificarAdmin();

    await this.cargarEventos();

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


  async cargarEventos() {

    this.cargando = true;
    this.error = '';

    try {

      this.eventos =
        await this.eventosService.obtenerEventos();

      console.log(
        '📅 Eventos encontrados:',
        this.eventos
      );

    } catch (error) {

      console.error(
        '❌ Error cargando eventos:',
        error
      );

      this.error =
        'No se pudieron cargar los eventos.';

    } finally {

      this.cargando = false;

      this.changeDetector.detectChanges();

    }

  }


  crearEvento() {

    this.router.navigate([
      '/crear-evento'
    ]);

  }


  verEvento(id: string | undefined) {

    if (!id) {
      return;
    }

    this.router.navigate(
      ['/detalle-evento'],
      {
        queryParams: {
          id
        }
      }
    );

  }


  volver() {

    this.router.navigate([
      '/home'
    ]);

  }


  formatearFecha(fecha: string): string {

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

}