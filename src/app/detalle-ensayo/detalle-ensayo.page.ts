
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  AlertController
} from '@ionic/angular';

import { EnsayosService, Ensayo } from '../services/ensayos';
import { CancionesService, Cancion } from '../services/canciones';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-detalle-ensayo',
  templateUrl: './detalle-ensayo.page.html',
  styleUrls: ['./detalle-ensayo.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon
  ]
})
export class DetalleEnsayoPage implements OnInit {

  ensayo: Ensayo | null = null;
  canciones: Cancion[] = [];

  esAdmin = false;
  cargando = true;
  eliminando = false;
  error = '';

  private ensayosService = inject(EnsayosService);
  private cancionesService = inject(CancionesService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private cd = inject(ChangeDetectorRef);

  async ngOnInit() {
    try {
      this.esAdmin = await this.usuarioService.esAdmin();
    } catch {
      this.esAdmin = false;
    }

    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        void this.cargarDetalle(id);
      } else {
        this.ensayo = null;
        this.error = 'No se indicó el ensayo.';
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  async cargarDetalle(id: string) {
    this.cargando = true;
    this.error = '';
    this.cd.detectChanges();

    try {
      const [ensayo, canciones] = await Promise.all([
        this.ensayosService.obtenerEnsayo(id),
        this.cancionesService.obtenerCanciones()
      ]);

      if (!ensayo) {
        this.ensayo = null;
        this.error = 'El ensayo no existe.';
        return;
      }

      this.ensayo = ensayo;
      this.canciones = canciones;

    } catch (error) {
      console.error('Error cargando ensayo:', error);
      this.error = 'No se pudo cargar el ensayo.';
    } finally {
      this.cargando = false;
      this.cd.detectChanges();
    }
  }

  obtenerCancion(id: string): Cancion | undefined {
    return this.canciones.find(c => c.id === id);
  }

  abrirCancion(id: string, indice: number) {
    if (!this.ensayo?.id) return;

    this.router.navigate(['/cancion-detalle'], {
      queryParams: {
        id,
        ensayoId: this.ensayo.id,
        indiceEnsayo: indice
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const valor = new Date(anio, mes - 1, dia);

    return valor.toLocaleDateString('es-NI', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearHora(hora: string): string {
    if (!hora) return 'Sin hora';

    const [horas, minutos] = hora.split(':').map(Number);
    const valor = new Date();

    valor.setHours(horas, minutos, 0, 0);

    return valor.toLocaleTimeString('es-NI', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  compartirWhatsApp() {
    if (!this.ensayo) return;

    const mensaje = [
      '🎶 *VOZ APOSTÓLICA* 🎶',
      '',
      '¡Dios les bendiga, hermanos!',
      '',
      'Les invitamos a nuestro próximo ensayo musical.',
      '',
      `🎼 *Ensayo:* ${this.ensayo.nombre}`,
      `📅 *Fecha:* ${this.formatearFecha(this.ensayo.fecha)}`,
      `🕕 *Hora:* ${this.formatearHora(this.ensayo.hora)}`,
      `📍 *Lugar:* ${this.ensayo.lugar || 'Por confirmar'}`,
      '',
      '🎵 *REPERTORIO MUSICAL*',
      '',
      'Las canciones están disponibles en nuestra aplicación *Voz Apostólica*.',
      '',
      '📱 Ingresen a la aplicación para revisar y practicar las canciones antes del ensayo.',
      '',
      '¡Les esperamos! 🙌'
    ].join('\n');

    window.open(
      'https://wa.me/?text=' + encodeURIComponent(mensaje),
      '_blank',
      'noopener,noreferrer'
    );
  }

  volver() {
    this.router.navigate(['/ensayos']);
  }

  editarEnsayo() {
    if (!this.esAdmin || !this.ensayo?.id) return;

    this.router.navigate(['/crear-ensayo'], {
      queryParams: { id: this.ensayo.id }
    });
  }

  async eliminarEnsayo() {
    if (!this.esAdmin || !this.ensayo?.id || this.eliminando) {
      return;
    }

    const alerta = await this.alertController.create({
      header: 'Eliminar ensayo',
      message: '¿Estás seguro de que deseas eliminar este ensayo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.confirmarEliminacion();
          }
        }
      ]
    });

    await alerta.present();
  }

  private async confirmarEliminacion() {
    if (!this.esAdmin || !this.ensayo?.id || this.eliminando) {
      return;
    }

    this.eliminando = true;
    this.cd.detectChanges();

    try {
      await this.ensayosService.eliminarEnsayo(this.ensayo.id);
      await this.router.navigate(['/ensayos']);
    } catch (error) {
      console.error('Error eliminando ensayo:', error);
      this.error = 'No se pudo eliminar el ensayo.';
    } finally {
      this.eliminando = false;
      this.cd.detectChanges();
    }
  }
}
