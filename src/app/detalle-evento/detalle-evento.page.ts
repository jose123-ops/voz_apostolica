import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { IonHeader, IonToolbar, IonContent, IonIcon } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { EventosService, Evento, CancionEvento } from '../services/eventos';
import { CancionesService, Cancion } from '../services/canciones';
import { UsuarioService } from '../services/usuario.service';

type ClaveSeccion = 'ministracion' | 'lectura' | 'ofrenda' | 'especiales' | 'despedida';
interface SeccionPrograma {
  clave: ClaveSeccion;
  titulo: string;
  subtitulo: string;
  icono: string;
  canciones: CancionEvento[];
}

@Component({
  selector: 'app-detalle-evento',
  templateUrl: './detalle-evento.page.html',
  styleUrls: ['./detalle-evento.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent, IonIcon]
})
export class DetalleEventoPage {
  evento: Evento | null = null;
  canciones: Cancion[] = [];
  secciones: SeccionPrograma[] = [];
  cargando = true;
  eliminando = false;
  error = '';
  esAdmin = false;
  mostrarConfirmacion = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventosService = inject(EventosService);
  private cancionesService = inject(CancionesService);
  private usuarioService = inject(UsuarioService);
  private changeDetector = inject(ChangeDetectorRef);

  async ionViewWillEnter() {
    await this.verificarAdmin();
    await this.cargarDatos();
  }

  async verificarAdmin() {
    try { this.esAdmin = await this.usuarioService.esAdmin(); }
    catch (error) { console.error('Error verificando administrador:', error); this.esAdmin = false; }
  }

  async cargarDatos() {
    this.cargando = true;
    this.error = '';
    this.evento = null;
    this.secciones = [];
    this.changeDetector.detectChanges();
    try {
      const id = this.route.snapshot.queryParamMap.get('id');
      if (!id) { this.error = 'No se encontró el identificador del evento.'; return; }
      const [evento, canciones] = await Promise.all([
        this.eventosService.obtenerEvento(id),
        this.cancionesService.obtenerCanciones()
      ]);
      if (!evento) { this.error = 'El evento no existe.'; return; }
      this.evento = { ...evento, id: evento.id || id };
      this.canciones = canciones;
      this.construirSecciones();
    } catch (error) {
      console.error('Error cargando evento:', error);
      this.error = 'No se pudo cargar la programación.';
    } finally {
      this.cargando = false;
      this.changeDetector.detectChanges();
    }
  }

  private construirSecciones() {
    if (!this.evento) { this.secciones = []; return; }
    const e = this.evento;
    const nuevas: SeccionPrograma[] = [
      { clave: 'lectura', titulo: 'Canto para Acción de Gracias', subtitulo: '3. ACCIÓN DE GRACIAS', icono: 'heart-outline', canciones: e.lectura || [] },
      { clave: 'especiales', titulo: 'Canto para los Himnos Especiales', subtitulo: '4. HIMNOS ESPECIALES', icono: 'star-outline', canciones: e.especiales || [] },
      { clave: 'ofrenda', titulo: 'Canto para la Ofrenda', subtitulo: '5. OFRENDA', icono: 'heart-outline', canciones: e.ofrenda || [] },
      { clave: 'despedida', titulo: 'Canto para Entregar', subtitulo: '6. ENTREGAR', icono: 'musical-note-outline', canciones: e.despedida || [] },
      { clave: 'ministracion', titulo: 'Canto de Ministración', subtitulo: '7. MINISTRACIÓN', icono: 'musical-notes-outline', canciones: e.ministracion || [] }
    ];
    const anteriores: SeccionPrograma[] = [
      { clave: 'ministracion', titulo: 'Ministración', subtitulo: 'ADORACIÓN', icono: 'musical-notes-outline', canciones: e.ministracion || [] },
      { clave: 'lectura', titulo: 'Cantos para la lectura', subtitulo: 'PALABRA', icono: 'book-outline', canciones: e.lectura || [] },
      { clave: 'ofrenda', titulo: 'Cantos para la ofrenda', subtitulo: 'OFRENDA', icono: 'heart-outline', canciones: e.ofrenda || [] },
      { clave: 'especiales', titulo: 'Cantos especiales', subtitulo: 'PARTICIPACIÓN', icono: 'star-outline', canciones: e.especiales || [] },
      { clave: 'despedida', titulo: 'Cantos para despedir', subtitulo: 'CIERRE', icono: 'musical-note-outline', canciones: e.despedida || [] }
    ];
    this.secciones = (e.versionPrograma === 2 ? nuevas : anteriores)
      .filter(seccion => seccion.canciones.length > 0);
  }

  obtenerCancion(id: string): Cancion | null {
    return this.canciones.find(cancion => cancion.id === id) || null;
  }
  obtenerNombreCancion(id: string): string {
    return this.obtenerCancion(id)?.titulo || 'Canción no encontrada';
  }
  obtenerArtista(id: string): string { return this.obtenerCancion(id)?.artista || ''; }
  obtenerCantidadCanciones(): number {
    return this.secciones.reduce((total, seccion) => total + seccion.canciones.length, 0);
  }
  obtenerCantidadSecciones(): number { return this.secciones.length; }

  obtenerIndiceGlobal(clave: ClaveSeccion, indiceLocal: number): number {
    let indice = 0;
    for (const seccion of this.secciones) {
      if (seccion.clave === clave) return indice + indiceLocal;
      indice += seccion.canciones.length;
    }
    return indiceLocal;
  }

  abrirCancion(item: CancionEvento, clave: ClaveSeccion, indiceLocal: number) {
    if (!item.cancionId || !this.evento?.id) return;
    void this.router.navigate(['/cancion-detalle'], {
      queryParams: {
        id: item.cancionId,
        eventoId: this.evento.id,
        indicePrograma: this.obtenerIndiceGlobal(clave, indiceLocal)
      }
    });
  }

  abrirPrimeraCancion() {
    const primera = this.secciones[0];
    if (!primera?.canciones.length) return;
    this.abrirCancion(primera.canciones[0], primera.clave, 0);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const partes = fecha.split('-');
    if (partes.length !== 3) return fecha;
    const [anio, mes, dia] = partes.map(Number);
    const fechaLocal = new Date(anio, mes - 1, dia);
    if (Number.isNaN(fechaLocal.getTime())) return fecha;
    return fechaLocal.toLocaleDateString('es-NI', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  generarTextoPrograma(): string {
    if (!this.evento) return '';
    const lineas: string[] = [
      '🎵 VOZ APOSTÓLICA', '📋 PROGRAMA DEL CULTO', '',
      `📌 ${this.evento.nombre}`, `📅 ${this.formatearFecha(this.evento.fecha)}`, ''
    ];
    for (const seccion of this.secciones) {
      lineas.push(`🎶 ${seccion.titulo.toUpperCase()}`);
      seccion.canciones.forEach((item, indice) => {
        lineas.push(`${indice + 1}. ${this.obtenerNombreCancion(item.cancionId)}`);
        if (item.dirige?.trim()) lineas.push(`   Dirige: ${item.dirige.trim()}`);
      });
      lineas.push('');
    }
    lineas.push('Dios bendiga nuestro servicio.');
    return lineas.join('\n');
  }

  compartirWhatsApp() {
    if (!this.evento) return;
    const url = 'https://wa.me/?text=' + encodeURIComponent(this.generarTextoPrograma());
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async copiarPrograma() {
    const texto = this.generarTextoPrograma();
    if (!texto) return;
    try { await navigator.clipboard.writeText(texto); }
    catch (error) { console.error('No se pudo copiar el programa:', error); }
  }

  volver() { void this.router.navigate(['/eventos']); }

  editarEvento() {
    if (!this.esAdmin || !this.evento?.id) return;
    void this.router.navigate(['/crear-evento'], {
      queryParams: { editar: this.evento.id }
    });
  }

  solicitarEliminar() {
    if (!this.esAdmin || !this.evento?.id) return;
    this.mostrarConfirmacion = true;
  }
  cancelarEliminar() {
    if (this.eliminando) return;
    this.mostrarConfirmacion = false;
  }

  async confirmarEliminar() {
    if (!this.esAdmin || !this.evento?.id || this.eliminando) return;
    this.eliminando = true;
    this.error = '';
    try {
      await this.eventosService.eliminarEvento(this.evento.id);
      this.mostrarConfirmacion = false;
      await this.router.navigate(['/eventos']);
    } catch (error) {
      console.error('Error eliminando evento:', error);
      this.error = 'No se pudo eliminar el evento.';
      this.mostrarConfirmacion = false;
    } finally {
      this.eliminando = false;
      this.changeDetector.detectChanges();
    }
  }
}
