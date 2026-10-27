
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import {
  EnsayosService,
  Ensayo,
  CancionEnsayo
} from '../services/ensayos';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-crear-ensayo',
  templateUrl: './crear-ensayo.page.html',
  styleUrls: ['./crear-ensayo.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption
  ]
})
export class CrearEnsayoPage implements OnInit {

  // Datos del formulario
  nombre = '';
  fecha = '';
  hora = '';
  lugar = '';
  observaciones = '';

  canciones: Cancion[] = [];
  cancionesSeleccionadas: CancionEnsayo[] = [];

  // Control de edición
  modoEdicion = false;
  ensayoId: string | null = null;

  cargando = true;
  guardando = false;
  error = '';

  private ensayosService = inject(EnsayosService);
  private cancionesService = inject(CancionesService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cd = inject(ChangeDetectorRef);

  async ngOnInit() {
    await this.inicializarFormulario();
  }

  private async inicializarFormulario() {
    this.cargando = true;
    this.error = '';

    try {
      const esAdmin = await this.usuarioService.esAdmin();

      if (!esAdmin) {
        await this.router.navigate(['/ensayos']);
        return;
      }

      // Cargar catálogo de canciones
      this.canciones =
        await this.cancionesService.obtenerCanciones();

      this.canciones.sort((a, b) =>
        a.titulo.localeCompare(b.titulo, 'es')
      );

      // Detectar si estamos editando
      this.ensayoId =
        this.route.snapshot.queryParamMap.get('id');

      this.modoEdicion = !!this.ensayoId;

      if (this.modoEdicion && this.ensayoId) {
        await this.cargarEnsayo(this.ensayoId);
      } else {
        this.limpiarFormulario();
      }

    } catch (error) {
      console.error('Error inicializando formulario:', error);
      this.error = 'No se pudo cargar el formulario.';
    } finally {
      this.cargando = false;
      this.cd.detectChanges();
    }
  }

  private async cargarEnsayo(id: string) {
    const ensayo = await this.ensayosService.obtenerEnsayo(id);

    if (!ensayo) {
      this.error = 'El ensayo que intentas editar no existe.';
      return;
    }

    this.nombre = ensayo.nombre || '';
    this.fecha = ensayo.fecha || '';
    this.hora = ensayo.hora || '';
    this.lugar = ensayo.lugar || '';
    this.observaciones = ensayo.observaciones || '';

    // Crear copias para no modificar los datos originales
    this.cancionesSeleccionadas =
      (ensayo.canciones || []).map(c => ({
        cancionId: c.cancionId
      }));

    if (this.cancionesSeleccionadas.length === 0) {
      this.agregarCancion();
    }
  }

  private limpiarFormulario() {
    this.nombre = '';
    this.fecha = '';
    this.hora = '';
    this.lugar = '';
    this.observaciones = '';

    this.cancionesSeleccionadas = [];
    this.agregarCancion();
  }

  agregarCancion() {
    this.cancionesSeleccionadas.push({
      cancionId: ''
    });
  }

  eliminarCancion(indice: number) {
    this.cancionesSeleccionadas.splice(indice, 1);
  }

  async guardarEnsayo() {
    if (this.guardando || this.cargando) {
      return;
    }

    this.error = '';

    if (!this.nombre.trim()) {
      this.error = 'Ingresa el nombre del ensayo.';
      return;
    }

    if (!this.fecha) {
      this.error = 'Selecciona la fecha del ensayo.';
      return;
    }

    if (!this.hora) {
      this.error = 'Selecciona la hora del ensayo.';
      return;
    }

    if (!this.lugar.trim()) {
      this.error = 'Ingresa el lugar del ensayo.';
      return;
    }

    const cancionesValidas =
      this.cancionesSeleccionadas.filter(
        c => c.cancionId?.trim()
      );

    if (cancionesValidas.length === 0) {
      this.error = 'Selecciona al menos una canción.';
      return;
    }

    const ids = cancionesValidas.map(c => c.cancionId);

    if (new Set(ids).size !== ids.length) {
      this.error = 'No puedes agregar la misma canción dos veces.';
      return;
    }

    // Comprobar que las canciones todavía existen
    const cancionesExistentes = new Set(
      this.canciones.map(c => c.id)
    );

    if (ids.some(id => !cancionesExistentes.has(id))) {
      this.error =
        'Una de las canciones seleccionadas ya no existe.';
      return;
    }

    this.guardando = true;
    this.cd.detectChanges();

    try {
      const esAdmin = await this.usuarioService.esAdmin();

      if (!esAdmin) {
        this.error = 'No tienes permisos para guardar ensayos.';
        return;
      }

      const datos: Ensayo = {
        nombre: this.nombre.trim(),
        fecha: this.fecha,
        hora: this.hora,
        lugar: this.lugar.trim(),
        observaciones: this.observaciones.trim(),
        canciones: cancionesValidas,
        participantes: []
      };

      if (this.modoEdicion && this.ensayoId) {

        // Conservar los participantes registrados
        // y actualizar únicamente los campos del formulario
        const { participantes, ...actualizacion } = datos;

        await this.ensayosService.actualizarEnsayo(
          this.ensayoId,
          actualizacion
        );

        await this.router.navigate(['/detalle-ensayo'], {
          queryParams: { id: this.ensayoId }
        });

      } else {

        const nuevoId =
          await this.ensayosService.agregarEnsayo(datos);

        await this.router.navigate(['/detalle-ensayo'], {
          queryParams: { id: nuevoId }
        });
      }

    } catch (error) {
      console.error('Error guardando ensayo:', error);
      this.error =
        'No se pudo guardar el ensayo. Revisa tu conexión y los permisos de Firebase.';
    } finally {
      this.guardando = false;
      this.cd.detectChanges();
    }
  }

  volver() {
    if (this.modoEdicion && this.ensayoId) {
      this.router.navigate(['/detalle-ensayo'], {
        queryParams: { id: this.ensayoId }
      });
    } else {
      this.router.navigate(['/ensayos']);
    }
  }
}
