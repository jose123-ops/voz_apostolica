
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  AlertController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import {
  UsuarioService
} from '../services/usuario.service';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

@Component({
  selector: 'app-canciones',
  templateUrl: './canciones.page.html',
  styleUrls: ['./canciones.page.scss'],
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
export class CancionesPage implements OnInit {

  canciones: Cancion[] = [];
  cancionesFiltradas: Cancion[] = [];

  cargando = true;
  eliminandoId: string | null = null;

  error = '';
  busqueda = '';
  categoriaSeleccionada = 'todas';
  esAdmin = false;

  categorias = [
    'alabanza',
    'adoracion',
    'coros',
    'especial',
    'himnos',
    'otros'
  ];

  private cancionesService = inject(CancionesService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  // ======================================
  // INICIALIZAR
  // ======================================

  async ngOnInit(): Promise<void> {

    try {
      this.esAdmin =
        await this.usuarioService.esAdmin();
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

      this.aplicarFiltros();

    } catch (error) {

      console.error(
        'Error cargando canciones:',
        error
      );

      this.error =
        'No se pudieron cargar las canciones.';

      this.canciones = [];
      this.cancionesFiltradas = [];

    } finally {

      this.cargando = false;
      this.changeDetector.detectChanges();
    }
  }

  // ======================================
  // FILTRAR CANCIONES
  // ======================================

  aplicarFiltros(): void {

    const texto = this.busqueda
      .trim()
      .toLowerCase();

    this.cancionesFiltradas =
      this.canciones.filter(cancion => {

        const coincideTexto =
          !texto ||
          (cancion.titulo || '')
            .toLowerCase()
            .includes(texto) ||
          (cancion.artista || '')
            .toLowerCase()
            .includes(texto) ||
          (cancion.categoria || '')
            .toLowerCase()
            .includes(texto);

        const coincideCategoria =
          this.categoriaSeleccionada === 'todas' ||
          (cancion.categoria || '')
            .toLowerCase() ===
          this.categoriaSeleccionada.toLowerCase();

        return coincideTexto && coincideCategoria;
      });
  }

  buscar(): void {
    this.aplicarFiltros();
  }

  cambiarCategoria(): void {
    this.aplicarFiltros();
  }

  // ======================================
  // ABRIR CANCIÓN
  // ======================================

  abrirCancion(cancion: Cancion): void {

    if (!cancion.id) return;

    void this.router.navigate(
      ['/cancion-detalle'],
      {
        queryParams: {
          id: cancion.id
        }
      }
    );
  }

  // ======================================
  // CONFIRMAR ELIMINACIÓN
  // ======================================

  async confirmarEliminar(
    cancion: Cancion
  ): Promise<void> {

    if (!this.esAdmin || !cancion.id) {
      return;
    }

    if (this.eliminandoId) {
      return;
    }

    const alerta =
      await this.alertController.create({

        header: 'Eliminar canción',

        subHeader: cancion.titulo,

        message:
          '¿Estás seguro de eliminar esta canción? ' +
          'Se borrará permanentemente de Firebase.',

        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Sí, eliminar',
            role: 'destructive',
            handler: () => {
              void this.eliminarCancion(cancion);
            }
          }
        ]

      });

    await alerta.present();
  }

  // ======================================
  // ELIMINAR DE FIREBASE
  // ======================================

  async eliminarCancion(
    cancion: Cancion
  ): Promise<void> {

    if (!this.esAdmin || !cancion.id) {
      return;
    }

    if (this.eliminandoId) {
      return;
    }

    const id = cancion.id;

    this.eliminandoId = id;
    this.changeDetector.detectChanges();

    try {

      // Volver a comprobar el rol.
      // La autorización definitiva
      // debe estar en Firestore Rules.

      const autorizado =
        await this.usuarioService.esAdmin();

      if (!autorizado) {
        throw new Error(
          'No tenés permisos para eliminar canciones.'
        );
      }

      await this.cancionesService
        .eliminarCancion(id);

      // Quitar de la lista sin recargar.
      this.canciones =
        this.canciones.filter(
          item => item.id !== id
        );

      this.aplicarFiltros();

      const toast =
        await this.toastController.create({
          message: 'Canción eliminada correctamente.',
          duration: 2500,
          color: 'success',
          position: 'bottom'
        });

      await toast.present();

    } catch (error) {

      console.error(
        'Error eliminando canción:',
        error
      );

      const toast =
        await this.toastController.create({
          message:
            'No se pudo eliminar la canción. Revisá los permisos.',
          duration: 3500,
          color: 'danger',
          position: 'bottom'
        });

      await toast.present();

    } finally {

      this.eliminandoId = null;
      this.changeDetector.detectChanges();
    }
  }

  // ======================================
  // NAVEGACIÓN
  // ======================================

  volver(): void {
    void this.router.navigate(['/home']);
  }

  abrirAgregarCancion(): void {

    if (!this.esAdmin) return;

    void this.router.navigate(['/agregar-cancion']);
  }
}
