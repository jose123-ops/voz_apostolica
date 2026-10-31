import { NotificacionesService } from '../services/notificaciones.service';
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonFooter,
  IonIcon,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  AlertController
} from '@ionic/angular';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

import { AuthService } from '../services/auth.service';
import { UsuarioService } from '../services/usuario.service';
import { TemaService, Tema } from '../services/tema.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonFooter,
    IonIcon,
    IonPopover,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class HomePage implements OnInit {

  esAdmin = false;

  canciones: Cancion[] = [];
  ultimasCanciones: Cancion[] = [];

  busqueda = '';
  cargando = true;
  error = '';

  private authService = inject(AuthService);
  private alertController = inject(AlertController);
  private cancionesService = inject(CancionesService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private temaService = inject(TemaService);

  temaActual: Tema = this.temaService.obtenerTema();

  // ======================================
  // MODO CLARO / OSCURO
  // ======================================

  cambiarTema(): void {

    const nuevoTema: Tema =
      this.temaActual === 'oscuro'
        ? 'claro'
        : 'oscuro';

    this.temaService.establecerTema(nuevoTema);

    this.temaActual = nuevoTema;
  }

  // ======================================
  // INICIALIZAR HOME
  // ======================================

  async ngOnInit(): Promise<void> {

    this.temaActual = this.temaService.obtenerTema();

    try {

      this.esAdmin = await this.usuarioService.esAdmin();

    } catch (error) {

      console.error(
        'Error verificando administrador:',
        error
      );

      this.esAdmin = false;
    }

    await this.cargarCanciones();
  }

  // ======================================
  // CARGAR CANCIONES
  // ======================================

  async cargarCanciones(): Promise<void> {

    this.cargando = true;
    this.error = '';

    this.changeDetector.detectChanges();

    try {

      this.canciones =
        await this.cancionesService.obtenerCanciones();

      this.ultimasCanciones = [...this.canciones]
        .sort((a, b) =>
          this.convertirFecha(b.fechaCreacion) -
          this.convertirFecha(a.fechaCreacion)
        )
        .slice(0, 3);

    } catch (error) {

      console.error(
        'Error cargando canciones:',
        error
      );

      this.error =
        'No se pudieron cargar las canciones.';

      this.canciones = [];
      this.ultimasCanciones = [];

    } finally {

      this.cargando = false;
      this.changeDetector.detectChanges();
    }
  }

  // ======================================
  // CONVERTIR FECHAS
  // ======================================

  private convertirFecha(valor: unknown): number {

    if (!valor) return 0;

    if (
      typeof valor === 'object' &&
      valor !== null &&
      'toMillis' in valor &&
      typeof valor.toMillis === 'function'
    ) {
      return valor.toMillis();
    }

    if (
      typeof valor === 'object' &&
      valor !== null &&
      'seconds' in valor &&
      typeof valor.seconds === 'number'
    ) {
      return valor.seconds * 1000;
    }

    if (valor instanceof Date) {
      return valor.getTime();
    }

    if (
      typeof valor === 'string' ||
      typeof valor === 'number'
    ) {

      const fecha = new Date(valor).getTime();

      return Number.isNaN(fecha) ? 0 : fecha;
    }

    return 0;
  }

  // ======================================
  // NORMALIZAR TEXTO
  // ======================================

  private normalizarTexto(texto: string): string {

    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // ======================================
  // FILTRAR CANCIONES
  // ======================================

  get cancionesFiltradas(): Cancion[] {

    const termino =
      this.normalizarTexto(this.busqueda);

    if (!termino) {
      return this.ultimasCanciones;
    }

    return this.canciones.filter(cancion => {

      const contenido = this.normalizarTexto(
        `${cancion.titulo} ${cancion.artista} ${cancion.categoria || ''}`
      );

      return contenido.includes(termino);
    });
  }

  // ======================================
  // LIMPIAR BÚSQUEDA
  // ======================================

  limpiarBusqueda(): void {
    this.busqueda = '';
  }

  // ======================================
  // ABRIR DETALLE DE CANCIÓN
  // ======================================

  abrirCancion(cancion: Cancion): void {

    if (!cancion.id) {

      console.error('La canción no tiene ID');
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

  // ======================================
  // AGREGAR CANCIÓN (ADMIN)
  // ======================================

  abrirAgregarCancion(): void {

    if (!this.esAdmin) return;

    this.router.navigate(['/agregar-cancion']);
  }

  // ======================================
  // NAVEGACIÓN
  // ======================================

  abrirFavoritos(): void {
    this.router.navigate(['/favoritos']);
  }

  abrirCanciones(): void {
    this.router.navigate(['/canciones']);
  }

  abrirEventos(): void {
    this.router.navigate(['/eventos']);
  }

  abrirEnsayos(): void {
    this.router.navigate(['/ensayos']);
  }

  // ======================================
  // CONFIRMAR CIERRE DE SESIÓN
  // ======================================

  async confirmarCerrarSesion(): Promise<void> {

    const alerta = await this.alertController.create({

      header: 'Cerrar sesión',

      message:
        '¿Estás seguro de que deseas salir de Voz Apostólica?',

      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, cerrar sesión',
          role: 'destructive',
          handler: () => {
            void this.cerrarSesion();
          }
        }
      ]
    });

    await alerta.present();
  }

  // ======================================
  // CERRAR SESIÓN FIREBASE
  // ======================================

  async cerrarSesion(): Promise<void> {

    try {

      await this.authService.cerrarSesion();

      this.esAdmin = false;

      this.canciones = [];
      this.ultimasCanciones = [];

      await this.router.navigateByUrl(
        '/login',
        {
          replaceUrl: true
        }
      );

    } catch (error) {

      console.error(
        'Error al cerrar sesión:',
        error
      );

      const alerta = await this.alertController.create({

        header: 'Error',

        message:
          'No se pudo cerrar la sesión. Intentá nuevamente.',

        buttons: ['Aceptar']

      });

      await alerta.present();
    }
  }

  
private notificacionesService =
  inject(NotificacionesService);

async activarNotificaciones(): Promise<void> {

  try {

    const token =
      await this.notificacionesService
        .activarNotificaciones();

    if (token) {

      console.log(
        'Token FCM para prueba:',
        token
      );

      const alerta =
        await this.alertController.create({
          header: 'Notificaciones activadas',
          message:
            'Tu dispositivo está preparado para recibir avisos de Voz Apostólica.',
          buttons: ['Aceptar']
        });

      await alerta.present();
    }

  } catch (error: any) {

    console.error(
      'Error activando notificaciones:',
      error
    );

    const alerta =
      await this.alertController.create({
        header: 'Notificaciones',
        message:
          error?.message ||
          'No se pudieron activar las notificaciones.',
        buttons: ['Aceptar']
      });

    await alerta.present();
  }
}


}
