
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

type FiltroEvento = 'todos' | 'proximos' | 'anteriores';

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
export class EventosPage  {

  eventos: Evento[] = [];

  cargando = true;
  error = '';
  esAdmin = false;

  busqueda = '';
  filtro: FiltroEvento = 'proximos';

  private eventosService = inject(EventosService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  

  // Se ejecuta cada vez que entramos a la página
  async ionViewWillEnter() {
    await this.inicializar();
  }

  private async inicializar() {
    await this.verificarAdmin();
    await this.cargarEventos();
  }

  async verificarAdmin() {
    try {
      this.esAdmin = await this.usuarioService.esAdmin();
    } catch (error) {
      console.error('Error verificando administrador:', error);
      this.esAdmin = false;
    }

    this.changeDetector.detectChanges();
  }

  async cargarEventos() {
    this.cargando = true;
    this.error = '';

    this.changeDetector.detectChanges();

    try {
      this.eventos = await this.eventosService.obtenerEventos();
    } catch (error) {
      console.error('Error cargando eventos:', error);

      this.error = 'No se pudieron cargar los eventos.';
      this.eventos = [];
    } finally {
      this.cargando = false;
      this.changeDetector.detectChanges();
    }
  }

  private obtenerFechaLocal(fecha: string): Date | null {
    if (!fecha) return null;

    const partes = fecha.split('-');

    if (partes.length !== 3) return null;

    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);

    const resultado = new Date(anio, mes - 1, dia);

    if (
      resultado.getFullYear() !== anio ||
      resultado.getMonth() !== mes - 1 ||
      resultado.getDate() !== dia
    ) {
      return null;
    }

    resultado.setHours(0, 0, 0, 0);

    return resultado;
  }

  private obtenerHoy(): Date {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy;
  }

  esProximo(evento: Evento): boolean {
    const fecha = this.obtenerFechaLocal(evento.fecha);
    return !!fecha && fecha >= this.obtenerHoy();
  }

  esAnterior(evento: Evento): boolean {
    const fecha = this.obtenerFechaLocal(evento.fecha);
    return !!fecha && fecha < this.obtenerHoy();
  }

  get totalEventos(): number {
    return this.eventos.length;
  }

  get totalProximos(): number {
    return this.eventos.filter(e => this.esProximo(e)).length;
  }

  get totalAnteriores(): number {
    return this.eventos.filter(e => this.esAnterior(e)).length;
  }

  get eventosFiltrados(): Evento[] {
    const termino = this.normalizar(this.busqueda);

    return this.eventos
      .filter(evento => {
        if (this.filtro === 'proximos') {
          return this.esProximo(evento);
        }

        if (this.filtro === 'anteriores') {
          return this.esAnterior(evento);
        }

        return true;
      })
      .filter(evento => {
        if (!termino) return true;

        const contenido = this.normalizar(
          `${evento.nombre} ${evento.fecha} ${this.formatearFecha(evento.fecha)}`
        );

        return contenido.includes(termino);
      })
      .sort((a, b) => {
        const fechaA = this.obtenerFechaLocal(a.fecha)?.getTime() ?? 0;
        const fechaB = this.obtenerFechaLocal(b.fecha)?.getTime() ?? 0;

        return this.filtro === 'anteriores'
          ? fechaB - fechaA
          : fechaA - fechaB;
      });
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  actualizarBusqueda(event: Event) {
    this.busqueda = (event.target as HTMLInputElement).value;
  }

  limpiarBusqueda() {
    this.busqueda = '';
  }

  cambiarFiltro(filtro: FiltroEvento) {
    this.filtro = filtro;
  }

  cantidadCanciones(evento: Evento): number {
    return (
      (evento.ministracion?.length || 0) +
      (evento.lectura?.length || 0) +
      (evento.ofrenda?.length || 0) +
      (evento.despedida?.length || 0) +
      (evento.especiales?.length || 0)
    );
  }

  obtenerDia(fecha: string): string {
    const fechaLocal = this.obtenerFechaLocal(fecha);
    return fechaLocal
      ? String(fechaLocal.getDate()).padStart(2, '0')
      : '--';
  }

  obtenerMes(fecha: string): string {
    const fechaLocal = this.obtenerFechaLocal(fecha);

    return fechaLocal
      ? fechaLocal.toLocaleDateString('es-NI', {
          month: 'short'
        }).replace('.', '').toUpperCase()
      : '---';
  }

  formatearFecha(fecha: string): string {
    const fechaLocal = this.obtenerFechaLocal(fecha);

    if (!fechaLocal) return fecha || '';

    return fechaLocal.toLocaleDateString('es-NI', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  crearEvento() {
    if (!this.esAdmin) return;

    this.router.navigate(['/crear-evento']);
  }

  verEvento(id: string | undefined) {
    if (!id) return;

    this.router.navigate(
      ['/detalle-evento'],
      {
        queryParams: { id }
      }
    );
  }

  volver() {
    this.router.navigate(['/home']);
  }
}
