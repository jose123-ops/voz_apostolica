
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
    FormsModule,
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

  ultimasCanciones: Cancion[] = [];

  busqueda = '';

  cargando = true;

  error = '';

  private cancionesService = inject(CancionesService);

  private usuarioService = inject(UsuarioService);

  private router = inject(Router);

  private changeDetector = inject(ChangeDetectorRef);


  async ngOnInit() {

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


  // ==========================================
  // CARGAR CANCIONES
  // ==========================================

  async cargarCanciones() {

    this.cargando = true;

    this.error = '';

    this.changeDetector.detectChanges();

    try {

      this.canciones =
        await this.cancionesService.obtenerCanciones();

      // ORDENAR POR FECHA DE CREACIÓN
      // Y MOSTRAR LAS ÚLTIMAS 3

      this.ultimasCanciones = [...this.canciones]
        .sort((a, b) => {

          return (
            this.convertirFecha(b.fechaCreacion) -
            this.convertirFecha(a.fechaCreacion)
          );

        })
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


  // ==========================================
  // CONVERTIR FECHA DE FIREBASE
  // ==========================================

  private convertirFecha(valor: unknown): number {

    if (!valor) {
      return 0;
    }

    // FIRESTORE TIMESTAMP

    if (
      typeof valor === 'object' &&
      valor !== null &&
      'toMillis' in valor &&
      typeof valor.toMillis === 'function'
    ) {
      return valor.toMillis();
    }

    // FIRESTORE TIMESTAMP SERIALIZADO

    if (
      typeof valor === 'object' &&
      valor !== null &&
      'seconds' in valor &&
      typeof valor.seconds === 'number'
    ) {
      return valor.seconds * 1000;
    }

    // DATE

    if (valor instanceof Date) {
      return valor.getTime();
    }

    // STRING O NÚMERO

    if (
      typeof valor === 'string' ||
      typeof valor === 'number'
    ) {

      const fecha = new Date(valor).getTime();

      return Number.isNaN(fecha) ? 0 : fecha;

    }

    return 0;

  }


  // ==========================================
  // BUSCADOR
  // ==========================================

  private normalizarTexto(texto: string): string {

    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  }


  get cancionesFiltradas(): Cancion[] {

    const termino =
      this.normalizarTexto(this.busqueda);

    // SIN BÚSQUEDA:
    // MOSTRAR SOLO LAS ÚLTIMAS 3

    if (!termino) {
      return this.ultimasCanciones;
    }

    // CON BÚSQUEDA:
    // BUSCAR EN TODA LA BIBLIOTECA

    return this.canciones.filter(cancion => {

      const contenido = this.normalizarTexto(
        `${cancion.titulo} ${cancion.artista} ${cancion.categoria}`
      );

      return contenido.includes(termino);

    });

  }


  limpiarBusqueda() {
    this.busqueda = '';
  }


  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  abrirCancion(cancion: Cancion) {

    if (!cancion.id) {

      console.error(
        'La canción no tiene ID'
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

    if (!this.esAdmin) {
      return;
    }

    this.router.navigate([
      '/agregar-cancion'
    ]);

  }


  abrirFavoritos() {

    this.router.navigate([
      '/favoritos'
    ]);

  }


  abrirCanciones() {

    this.router.navigate([
      '/canciones'
    ]);

  }


  abrirEventos() {

    this.router.navigate([
      '/eventos'
    ]);

  }


  // NUEVO MÓDULO DE ENSAYOS

  abrirEnsayos() {

    this.router.navigate([
      '/ensayos'
    ]);

  }

}
