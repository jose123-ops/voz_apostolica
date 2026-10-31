
import { Component,OnInit,OnDestroy,inject,ChangeDetectorRef} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon
} from '@ionic/angular';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

import {
  EventosService,
  Evento,
  CancionEvento
} from '../services/eventos';

import {
  UsuarioService
} from '../services/usuario.service';

import { auth } from '../firebase';
import { EnsayosService, Ensayo } from '../services/ensayos';

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { Subscription } from 'rxjs';

interface CancionPrograma {
  cancionId: string;
  dirige: string;
  seccion: string;
  indiceSeccion: number;
  totalSeccion: number;
}



@Component({
  selector: 'app-cancion-detalle',
  templateUrl: './cancion-detalle.page.html',
  styleUrls: ['./cancion-detalle.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon
  ]
})
export class CancionDetallePage implements OnInit, OnDestroy {

  cancion: Cancion | null = null;

  cargando = true;
  error = '';

  esFavorito = false;
  actualizandoFavorito = false;

  rolUsuario = '';
  puedeVerLetra = false;
  puedeVerAcordes = false;
  tonoSeleccionado = 'C';

  readonly tonosDisponibles = [
    { valor: 'C', etiqueta: 'C - Do' },
    { valor: 'C#', etiqueta: 'C# - Do sostenido' },
    { valor: 'D', etiqueta: 'D - Re' },
    { valor: 'Eb', etiqueta: 'Eb - Mi bemol' },
    { valor: 'E', etiqueta: 'E - Mi' },
    { valor: 'F', etiqueta: 'F - Fa' },
    { valor: 'F#', etiqueta: 'F# - Fa sostenido' },
    { valor: 'G', etiqueta: 'G - Sol' },
    { valor: 'Ab', etiqueta: 'Ab - La bemol' },
    { valor: 'A', etiqueta: 'A - La' },
    { valor: 'Bb', etiqueta: 'Bb - Si bemol' },
    { valor: 'B', etiqueta: 'B - Si' }
  ];

  cambiarTono(evento: Event) {
    const selector = evento.target as HTMLSelectElement;
    this.tonoSeleccionado = selector.value;
  }

  // CONTEXTO DEL ENSAYO
  ensayoId: string | null = null;
  ensayo: Ensayo | null = null;
  repertorioEnsayo: string[] = [];
  indiceEnsayo = -1;

  get enEnsayo(): boolean {
    return !!this.ensayoId && this.indiceEnsayo >= 0 && this.repertorioEnsayo.length > 0;
  }

  get numeroEnsayo(): number { return this.indiceEnsayo + 1; }
  get totalEnsayo(): number { return this.repertorioEnsayo.length; }
  get tieneAnteriorEnsayo(): boolean { return this.enEnsayo && this.indiceEnsayo > 0; }
  get tieneSiguienteEnsayo(): boolean { return this.enEnsayo && this.indiceEnsayo < this.repertorioEnsayo.length - 1; }

  // CONTEXTO DEL EVENTO
  eventoId: string | null = null;
  evento: Evento | null = null;

  programa: CancionPrograma[] = [];
  indicePrograma = -1;

  cargandoPrograma = false;
  errorPrograma = '';



  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cancionesService = inject(CancionesService);
  private eventosService = inject(EventosService);
  private ensayosService = inject(EnsayosService);
  private usuarioService = inject(UsuarioService);
  private changeDetector = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  private suscripcionRuta?: Subscription;
  private versionCarga = 0;

  private youtubeCacheUrl = '';
  private youtubeCacheSeguro: SafeResourceUrl | null = null;

  get enPrograma(): boolean {
    return !!this.eventoId &&
      this.programa.length > 0 &&
      this.indicePrograma >= 0;
  }

  get cancionActualPrograma(): CancionPrograma | null {
    return this.programa[this.indicePrograma] || null;
  }

  get tieneAnterior(): boolean {
    return this.enPrograma && this.indicePrograma > 0;
  }

  get tieneSiguiente(): boolean {
    return this.enPrograma &&
      this.indicePrograma < this.programa.length - 1;
  }

  get numeroActual(): number {
    return this.indicePrograma + 1;
  }

  get totalPrograma(): number {
    return this.programa.length;
  }

  async ngOnInit() {
    await this.cargarRolUsuario();

    this.suscripcionRuta = this.route.queryParamMap.subscribe(
      parametros => {
        const id = parametros.get('id');
        const eventoId = parametros.get('eventoId');
        const ensayoId = parametros.get('ensayoId');
        const indiceEnsayo = Number(parametros.get('indiceEnsayo') ?? '-1');

        const indiceRecibido = Number(
          parametros.get('indicePrograma') ?? '-1'
        );

        void this.inicializarCancion(
          id,
          eventoId,
          Number.isInteger(indiceRecibido)
            ? indiceRecibido
            : -1,
          ensayoId,
          Number.isInteger(indiceEnsayo) ? indiceEnsayo : -1
        );
      }
    );
  }

  ngOnDestroy() {
    this.versionCarga++;
    this.suscripcionRuta?.unsubscribe();
  }

  private async inicializarCancion(
    id: string | null,
    eventoId: string | null,
    indiceRecibido: number,
    ensayoId: string | null = null,
    indiceEnsayoRecibido = -1
  ) {
    const version = ++this.versionCarga;

    this.cargando = true;
    this.error = '';
    this.cancion = null;
    this.esFavorito = false;

    this.ensayoId = eventoId ? null : ensayoId;
    this.ensayo = null;
    this.repertorioEnsayo = [];
    this.indiceEnsayo = -1;

    this.eventoId = eventoId;
    this.evento = null;
    this.programa = [];
    this.indicePrograma = -1;
    this.errorPrograma = '';

    this.youtubeCacheUrl = '';
    this.youtubeCacheSeguro = null;

    this.changeDetector.detectChanges();

    if (!id) {
      this.error = 'No se recibió el ID de la canción.';
      this.cargando = false;
      this.changeDetector.detectChanges();
      return;
    }

    try {
      const tareas: Promise<unknown>[] = [
        this.cancionesService.obtenerCancion(id)
      ];

      if (this.ensayoId) {
        tareas.push(this.ensayosService.obtenerEnsayo(this.ensayoId));
      }

      if (eventoId) {
        this.cargandoPrograma = true;
        tareas.push(
          this.eventosService.obtenerEvento(eventoId)
        );
      }

      const resultados = await Promise.all(tareas);

      if (version !== this.versionCarga) return;

      const cancion = resultados[0] as Cancion | null;
      const ensayo = this.ensayoId
        ? resultados[1] as Ensayo | null
        : null;
      const evento = eventoId
        ? resultados[this.ensayoId ? 2 : 1] as Evento | null
        : null;

      if (!cancion) {
        this.error = 'La canción no existe.';
        return;
      }

      this.cancion = cancion;
      this.tonoSeleccionado = cancion.tono || 'C';

      if (this.ensayoId && ensayo) {
        this.ensayo = ensayo;
        this.repertorioEnsayo = (ensayo.canciones || []).map(item => item.cancionId);
        if (
          indiceEnsayoRecibido >= 0 &&
          indiceEnsayoRecibido < this.repertorioEnsayo.length &&
          this.repertorioEnsayo[indiceEnsayoRecibido] === id
        ) {
          this.indiceEnsayo = indiceEnsayoRecibido;
        } else {
          this.indiceEnsayo = this.repertorioEnsayo.indexOf(id);
        }
      } else if (this.ensayoId) {
        this.errorPrograma = 'No se pudo recuperar el repertorio del ensayo.';
      }

      if (eventoId && evento) {
        this.evento = evento;
        this.construirPrograma(evento);

        // Usamos el índice recibido solo si coincide
        // con la canción realmente abierta.
        if (
          indiceRecibido >= 0 &&
          indiceRecibido < this.programa.length &&
          this.programa[indiceRecibido].cancionId === id
        ) {
          this.indicePrograma = indiceRecibido;
        } else {
          this.indicePrograma = this.programa.findIndex(
            item => item.cancionId === id
          );
        }
      } else if (eventoId) {
        this.errorPrograma =
          'No se pudo recuperar el programa del evento.';
      }

      await this.comprobarFavorito();

      if (version !== this.versionCarga) return;

    } catch (error) {
      if (version !== this.versionCarga) return;

      console.error('Error cargando canción:', error);
      this.error = 'No se pudo cargar la canción.';

    } finally {
      if (version === this.versionCarga) {
        this.cargando = false;
        this.cargandoPrograma = false;
        this.changeDetector.detectChanges();
      }
    }
  }

  private construirPrograma(evento: Evento) {
    const nuevo = evento.versionPrograma === 2;
    const secciones: { nombre: string; canciones: CancionEvento[] }[] = nuevo
      ? [
          { nombre: '3. Acción de Gracias', canciones: evento.lectura || [] },
          { nombre: '4. Himnos Especiales', canciones: evento.especiales || [] },
          { nombre: '5. Ofrenda', canciones: evento.ofrenda || [] },
          { nombre: '6. Entregar', canciones: evento.despedida || [] },
          { nombre: '7. Ministración', canciones: evento.ministracion || [] }
        ]
      : [
          { nombre: 'Ministración', canciones: evento.ministracion || [] },
          { nombre: 'Lectura', canciones: evento.lectura || [] },
          { nombre: 'Ofrenda', canciones: evento.ofrenda || [] },
          { nombre: 'Especiales', canciones: evento.especiales || [] },
          { nombre: 'Despedida', canciones: evento.despedida || [] }
        ];

    this.programa = [];
    for (const seccion of secciones) {
      seccion.canciones.forEach((item, indice) => {
        this.programa.push({
          cancionId: item.cancionId,
          dirige: item.dirige || '',
          seccion: seccion.nombre,
          indiceSeccion: indice + 1,
          totalSeccion: seccion.canciones.length
        });
      });
    }
  }

  anteriorCancionEnsayo() {
    if (!this.tieneAnteriorEnsayo) return;
    this.irACancionEnsayo(this.indiceEnsayo - 1);
  }

  siguienteCancionEnsayo() {
    if (!this.tieneSiguienteEnsayo) return;
    this.irACancionEnsayo(this.indiceEnsayo + 1);
  }

  private irACancionEnsayo(indice: number) {
    if (!this.ensayoId || indice < 0 || indice >= this.repertorioEnsayo.length) return;
    void this.router.navigate(['/cancion-detalle'], {
      queryParams: {
        id: this.repertorioEnsayo[indice],
        ensayoId: this.ensayoId,
        indiceEnsayo: indice
      },
      replaceUrl: true
    });
  }

  volverAlEnsayo() {
    if (!this.ensayoId) return;
    void this.router.navigate(['/detalle-ensayo'], {
      queryParams: { id: this.ensayoId }
    });
  }

  anteriorCancion() {
    if (!this.tieneAnterior) return;
    this.irACancionPrograma(this.indicePrograma - 1);
  }

  siguienteCancion() {
    if (!this.tieneSiguiente) return;
    this.irACancionPrograma(this.indicePrograma + 1);
  }

  private irACancionPrograma(indice: number) {
    const siguiente = this.programa[indice];

    if (!siguiente || !this.eventoId) return;

    this.router.navigate(
      ['/cancion-detalle'],
      {
        queryParams: {
          id: siguiente.cancionId,
          eventoId: this.eventoId,
          indicePrograma: indice
        },
        replaceUrl: true
      }
    );
  }

  volverAlPrograma() {
    if (!this.eventoId) {
      this.router.navigate(['/eventos']);
      return;
    }

    this.router.navigate(
      ['/detalle-evento'],
      {
        queryParams: {
          id: this.eventoId
        }
      }
    );
  }

  volver() {
    if (this.ensayoId) {
      this.volverAlEnsayo();
    } else if (this.eventoId) {
      this.volverAlPrograma();
    } else {
      this.router.navigate(['/home']);
    }
  }

  async cargarCancion() {
    const parametros = this.route.snapshot.queryParamMap;

    await this.inicializarCancion(
      parametros.get('id'),
      parametros.get('eventoId'),
      Number(parametros.get('indicePrograma') ?? '-1'),
      parametros.get('ensayoId'),
      Number(parametros.get('indiceEnsayo') ?? '-1')
    );
  }

  async comprobarFavorito() {
    if (!this.cancion?.id) return;

    const usuarioFirebase = auth.currentUser;

    if (!usuarioFirebase) {
      this.esFavorito = false;
      return;
    }

    const idConsultado = this.cancion.id;

    try {
      const favorito = await this.usuarioService.esFavorito(
        usuarioFirebase.uid,
        idConsultado
      );

      if (this.cancion?.id === idConsultado) {
        this.esFavorito = favorito;
      }

    } catch (error) {
      console.error('Error comprobando favorito:', error);
      this.esFavorito = false;
    }
  }

  async cambiarFavorito() {
    if (!this.cancion?.id || this.actualizandoFavorito) {
      return;
    }

    const usuarioFirebase = auth.currentUser;

    if (!usuarioFirebase) {
      this.errorPrograma = 'Debes iniciar sesión para guardar favoritos.';
      this.changeDetector.detectChanges();
      return;
    }

    const idCancion = this.cancion.id;
    const eraFavorito = this.esFavorito;

    this.actualizandoFavorito = true;

    try {
      if (eraFavorito) {
        await this.usuarioService.quitarFavorito(
          usuarioFirebase.uid,
          idCancion
        );
      } else {
        await this.usuarioService.agregarFavorito(
          usuarioFirebase.uid,
          idCancion
        );
      }

      if (this.cancion?.id === idCancion) {
        this.esFavorito = !eraFavorito;
      }

    } catch (error) {
      console.error('Error actualizando favorito:', error);
      this.errorPrograma = 'No se pudo actualizar el favorito.';
    } finally {
      this.actualizandoFavorito = false;
      this.changeDetector.detectChanges();
    }
  }

  

  async cargarRolUsuario() {
    this.puedeVerLetra = false;
    this.puedeVerAcordes = false;

    try {
      const usuario =
        await this.usuarioService.obtenerUsuarioActual();

      this.rolUsuario = (usuario?.rol || '')
        .toLowerCase()
        .trim();

      if (this.rolUsuario === 'admin') {
        this.puedeVerLetra = true;
        this.puedeVerAcordes = true;

      } else if (this.rolUsuario === 'musico') {
        this.puedeVerLetra = true;
        this.puedeVerAcordes = true;

      } else if (this.rolUsuario === 'cantante') {
        this.puedeVerLetra = true;
        this.puedeVerAcordes = false;
      }

    } catch (error) {
      console.error('Error obteniendo rol:', error);
      this.rolUsuario = '';
    }

    this.changeDetector.detectChanges();
  }

  

  separarEstrofas(letra: string): string[] {
    if (!letra) return [];

    return letra
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split(/\n\s*\n/)
      .map(estrofa => estrofa.trim())
      .filter(estrofa => estrofa.length > 0);
  }

  obtenerYoutubeId(url: string | undefined): string {
    if (!url) return '';

    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname.toLowerCase();

      if (
        host !== 'youtube.com' &&
        host !== 'www.youtube.com' &&
        host !== 'm.youtube.com' &&
        host !== 'youtu.be' &&
        host !== 'www.youtu.be' &&
        host !== 'youtube-nocookie.com' &&
        host !== 'www.youtube-nocookie.com'
      ) {
        return '';
      }

      let videoId = '';

      if (host.endsWith('youtu.be')) {
        videoId = urlObj.pathname.split('/')[1] || '';
      } else if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v') || '';
      } else if (
        urlObj.pathname.startsWith('/embed/') ||
        urlObj.pathname.startsWith('/shorts/') ||
        urlObj.pathname.startsWith('/live/')
      ) {
        videoId = urlObj.pathname.split('/')[2] || '';
      }

      return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
        ? videoId
        : '';

    } catch {
      return '';
    }
  }

  obtenerYoutubeUrlSegura(
    url: string | undefined
  ): SafeResourceUrl | null {

    const videoId = this.obtenerYoutubeId(url);

    if (!videoId) return null;

    if (
      this.youtubeCacheUrl === videoId &&
      this.youtubeCacheSeguro
    ) {
      return this.youtubeCacheSeguro;
    }

    this.youtubeCacheUrl = videoId;

    this.youtubeCacheSeguro =
      this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );

    return this.youtubeCacheSeguro;
  }

  
}
