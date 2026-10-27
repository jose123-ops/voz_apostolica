
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';

import {
  EnsayosService,
  Ensayo
} from '../services/ensayos';

import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-ensayos',
  templateUrl: './ensayos.page.html',
  styleUrls: ['./ensayos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent
  ]
})
export class EnsayosPage implements OnInit {

  ensayos: Ensayo[] = [];
  esAdmin = false;
  cargando = true;
  error = '';

  private ensayosService = inject(EnsayosService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  async ngOnInit() {
    await this.verificarAdmin();
    await this.cargarEnsayos();
  }

  async ionViewWillEnter() {
    await this.cargarEnsayos();
  }

  async verificarAdmin() {
    try {
      this.esAdmin = await this.usuarioService.esAdmin();
    } catch (error) {
      console.error(error);
      this.esAdmin = false;
    }

    this.cd.detectChanges();
  }

  async cargarEnsayos() {
    this.cargando = true;
    this.error = '';
    this.cd.detectChanges();

    try {
      this.ensayos =
        await this.ensayosService.obtenerEnsayos();
    } catch (error) {
      console.error('Error cargando ensayos:', error);
      this.error = 'No se pudieron cargar los ensayos.';
      this.ensayos = [];
    } finally {
      this.cargando = false;
      this.cd.detectChanges();
    }
  }

  async refrescar(event: CustomEvent) {
    await this.cargarEnsayos();

    const refresher = event.target as HTMLIonRefresherElement;
    await refresher.complete();
  }

  get proximosEnsayos(): Ensayo[] {
    const hoy = new Date();
    const fechaHoy =
      `${hoy.getFullYear()}-` +
      `${String(hoy.getMonth() + 1).padStart(2, '0')}-` +
      `${String(hoy.getDate()).padStart(2, '0')}`;

    return this.ensayos.filter(
      ensayo => ensayo.fecha >= fechaHoy
    );
  }

  get ensayosAnteriores(): Ensayo[] {
    const hoy = new Date();
    const fechaHoy =
      `${hoy.getFullYear()}-` +
      `${String(hoy.getMonth() + 1).padStart(2, '0')}-` +
      `${String(hoy.getDate()).padStart(2, '0')}`;

    return this.ensayos
      .filter(ensayo => ensayo.fecha < fechaHoy)
      .reverse();
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';

    const partes = fecha.split('-');

    if (partes.length !== 3) return fecha;

    const [anio, mes, dia] = partes.map(Number);

    return new Date(anio, mes - 1, dia)
      .toLocaleDateString('es-NI', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
  }

  formatearHora(hora: string): string {
    if (!hora) return 'Sin hora';

    const [horas, minutos] = hora.split(':').map(Number);

    if (
      Number.isNaN(horas) ||
      Number.isNaN(minutos)
    ) {
      return hora;
    }

    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);

    return fecha.toLocaleTimeString('es-NI', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  volver() {
    this.router.navigate(['/home']);
  }

  crearEnsayo() {
    if (!this.esAdmin) return;

    this.router.navigate(['/crear-ensayo']);
  }

  abrirEnsayo(ensayo: Ensayo) {
    if (!ensayo.id) return;

    this.router.navigate(['/detalle-ensayo'], {
      queryParams: {
        id: ensayo.id
      }
    });
  }
}
