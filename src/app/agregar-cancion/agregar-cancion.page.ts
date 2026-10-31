
import {
  Component,
  inject,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonInput,
  IonTextarea,
  IonButton,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import {
  CancionesService,
  Cancion
} from '../services/canciones';

import {
  LetrasService,
  LetraResultado
} from '../services/letras';

import { EnvioNotificacionesService } from '../services/envio-notificaciones.service';

@Component({
  selector: 'app-agregar-cancion',
  standalone: true,
  templateUrl: './agregar-cancion.page.html',
  styleUrls: ['./agregar-cancion.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonInput,
    IonTextarea,
    IonButton,
    IonSelect,
    IonSelectOption
  ]
})
export class AgregarCancionPage {

  @ViewChild(IonContent)
  contenido?: IonContent;

  // =====================================
  // DATOS DE LA CANCIÓN
  // =====================================

  titulo = '';
  artista = '';
  categoria = '';
  letra = '';
  youtube = '';
  tono = 'C';

  // =====================================
  // ESTADO DEL FORMULARIO
  // =====================================

  guardando = false;
  mensaje = '';
  error = '';

  // =====================================
  // BUSCADOR DE LETRAS
  // =====================================

  consultaTitulo = '';
  consultaArtista = '';

  buscandoLetra = false;
  busquedaRealizada = false;
  mostrarBuscador = true;

  errorBusqueda = '';

  resultadosLetras: LetraResultado[] = [];

  resultadoSeleccionado: LetraResultado | null = null;

  // =====================================
  // SERVICIOS
  // =====================================

  private cancionesService =
    inject(CancionesService);

  private letrasService =
    inject(LetrasService);

  private envioNotificaciones =
    inject(EnvioNotificacionesService);

  private router =
    inject(Router);

  private changeDetector =
    inject(ChangeDetectorRef);

  // =====================================
  // ABRIR / CERRAR BUSCADOR
  // =====================================

  alternarBuscador(): void {

    this.mostrarBuscador = !this.mostrarBuscador;

    this.changeDetector.detectChanges();
  }

  // =====================================
  // BUSCAR LETRAS EN INTERNET
  // =====================================

  async buscarLetra(): Promise<void> {

    if (this.buscandoLetra) {
      return;
    }

    const tituloBusqueda =
      this.consultaTitulo.trim();

    const artistaBusqueda =
      this.consultaArtista.trim();

    this.errorBusqueda = '';
    this.mensaje = '';

    if (!tituloBusqueda) {

      this.errorBusqueda =
        'Primero escribí el título de la canción.';

      return;
    }

    this.buscandoLetra = true;
    this.busquedaRealizada = false;

    this.resultadosLetras = [];
    this.resultadoSeleccionado = null;

    this.changeDetector.detectChanges();

    try {

      const resultados =
        await this.letrasService.buscar(
          tituloBusqueda,
          artistaBusqueda
        );

      this.resultadosLetras = resultados;

      this.busquedaRealizada = true;

    } catch (error) {

      console.error(
        'Error buscando letras:',
        error
      );

      this.errorBusqueda =
        'No se pudo realizar la búsqueda. Revisá tu conexión.';

    } finally {

      this.buscandoLetra = false;

      this.changeDetector.detectChanges();
    }
  }

  // =====================================
  // SELECCIONAR UNA CANCIÓN
  // MOSTRAR PRIMERO SU LETRA
  // =====================================

  seleccionarResultado(
    resultado: LetraResultado
  ): void {

    // Guardar el resultado seleccionado
    // para mostrar la vista previa.

    this.resultadoSeleccionado = resultado;

    // NO copiar todavía al formulario.
    // NO borrar el listado original:
    // así podemos regresar sin buscar otra vez.

    this.errorBusqueda = '';

    this.changeDetector.detectChanges();

    // Subir al inicio del buscador
    // para ver la letra seleccionada.

    void this.irASeccion('buscador-letras');
  }

  // =====================================
  // CERRAR VISTA PREVIA
  // REGRESAR A LOS RESULTADOS
  // =====================================

  cerrarVistaPrevia(): void {

    this.resultadoSeleccionado = null;

    this.errorBusqueda = '';

    this.changeDetector.detectChanges();

    // Los resultados anteriores siguen guardados.
    // No es necesario consultar internet otra vez.
  }

  // =====================================
  // UTILIZAR LA LETRA SELECCIONADA
  // =====================================

  usarLetraEncontrada(): void {

    if (!this.resultadoSeleccionado) {
      return;
    }

    const resultado =
      this.resultadoSeleccionado;

    const letraEncontrada =
      resultado.plainLyrics;

    if (!letraEncontrada?.trim()) {

      this.errorBusqueda =
        'Esta canción no tiene letra disponible.';

      return;
    }

    // Copiar datos al formulario
    this.titulo =
      resultado.trackName || '';

    this.artista =
      resultado.artistName || '';

    this.letra =
      letraEncontrada.trim();

    // Mantener los datos en el buscador
    this.consultaTitulo = this.titulo;
    this.consultaArtista = this.artista;

    // Ocultar buscador y resultados
    this.mostrarBuscador = false;

    this.resultadosLetras = [];
    this.busquedaRealizada = false;

    this.errorBusqueda = '';
    this.error = '';

    this.mensaje =
      'Letra agregada correctamente al formulario.';

    this.changeDetector.detectChanges();

    // Desplazar automáticamente
    // hasta el campo de la letra.

    void this.irASeccion('seccion-letra');
  }

  // =====================================
  // BUSCAR OTRA CANCIÓN
  // =====================================

  buscarOtraLetra(): void {

    this.mostrarBuscador = true;

    this.consultaTitulo =
      this.titulo || this.consultaTitulo;

    this.consultaArtista =
      this.artista || this.consultaArtista;

    this.resultadoSeleccionado = null;

    this.resultadosLetras = [];
    this.busquedaRealizada = false;

    this.errorBusqueda = '';
    this.mensaje = '';

    // Conservamos la letra actual hasta
    // que el usuario elija una nueva.

    this.changeDetector.detectChanges();

    void this.irASeccion('buscador-letras');
  }

  // =====================================
  // DESPLAZAR A UNA SECCIÓN
  // =====================================

  private async irASeccion(
    id: string
  ): Promise<void> {

    if (!this.contenido) {
      return;
    }

    try {

      const scrollElement =
        await this.contenido.getScrollElement();

      const elemento =
        document.getElementById(id);

      if (!elemento) {
        return;
      }

      // Posición relativa al contenedor
      // interno de scroll de Ionic.

      const contenedorRect =
        scrollElement.getBoundingClientRect();

      const elementoRect =
        elemento.getBoundingClientRect();

      const posicion =
        scrollElement.scrollTop +
        elementoRect.top -
        contenedorRect.top -
        12;

      await this.contenido.scrollToPoint(
        0,
        Math.max(0, posicion),
        350
      );

    } catch (error) {

      console.error(
        'No se pudo desplazar a la sección:',
        error
      );
    }
  }

  // =====================================
  // GUARDAR CANCIÓN EN FIREBASE
  // =====================================

 
async guardarCancion(): Promise<void> {

  console.log('BOTÓN GUARDAR PRESIONADO');

  if (this.guardando) {
    return;
  }

  this.mensaje = '';
  this.error = '';

  // =============================
  // VALIDACIONES
  // =============================

  if (!this.titulo.trim()) {
    this.error = 'Ingresá el título de la canción.';
  } else if (!this.artista.trim()) {
    this.error = 'Ingresá el artista o autor.';
  } else if (!this.categoria.trim()) {
    this.error = 'Seleccioná una categoría.';
  } else if (!this.tono.trim()) {
    this.error = 'Seleccioná el tono musical.';
  } else if (!this.letra.trim()) {
    this.error = 'Ingresá la letra de la canción.';
  }

  if (this.error) {
    this.changeDetector.detectChanges();
    await this.contenido?.scrollToTop(300);
    return;
  }

  this.guardando = true;
  this.mensaje = 'Guardando canción en Firebase...';
  this.changeDetector.detectChanges();

  try {

    // =============================
    // PREPARAR CANCIÓN
    // =============================

    const nuevaCancion: Cancion = {
      titulo: this.titulo.trim(),
      artista: this.artista.trim(),
      categoria: this.categoria.trim(),
      tono: this.tono,
      letra: this.letra.trim(),
      acordes: '',
      youtube: this.youtube.trim()
    };

    console.log('Guardando en Firestore...');

    // =============================
    // GUARDAR EN FIREBASE
    // =============================

    const referencia =
      await this.cancionesService.agregarCancion(
        nuevaCancion
      );

    // Compatible con DocumentReference o string
    const documentoId =
      typeof referencia === 'string'
        ? referencia
        : referencia.id;

    console.log('Canción guardada. ID:', documentoId);

    // =============================
    // MOSTRAR CONFIRMACIÓN
    // =============================

    this.mensaje =
      '¡Canción guardada correctamente!';

    // =============================
    // LIMPIAR FORMULARIO
    // =============================

    this.titulo = '';
    this.artista = '';
    this.categoria = '';
    this.tono = 'C';
    this.letra = '';
    this.youtube = '';

    this.consultaTitulo = '';
    this.consultaArtista = '';

    this.mostrarBuscador = true;
    this.buscandoLetra = false;
    this.busquedaRealizada = false;

    this.resultadosLetras = [];
    this.resultadoSeleccionado = null;
    this.errorBusqueda = '';

    this.changeDetector.detectChanges();

    await this.contenido?.scrollToTop(300);

    // =============================
    // ENVIAR NOTIFICACIÓN
    // SIN BLOQUEAR EL FORMULARIO
    // =============================

    console.log('Solicitando notificación...');

    void this.envioNotificaciones
      .notificar('cancion', documentoId)
      .then(respuesta => {

        console.log(
          'Resultado notificaciones:',
          respuesta
        );

        if (respuesta.enviados) {
          this.mensaje =
            `Canción guardada. Avisos enviados: ${respuesta.enviados}.`;
        } else {
          this.mensaje =
            'Canción guardada. No se enviaron avisos a dispositivos.';
        }

        this.changeDetector.detectChanges();
      })
      .catch(errorNotificacion => {

        console.error(
          'Error enviando notificación:',
          errorNotificacion
        );

        this.mensaje =
          'Canción guardada, pero falló el envío de la notificación.';

        this.changeDetector.detectChanges();
      });

  } catch (error) {

    console.error(
      'ERROR AL GUARDAR CANCIÓN:',
      error
    );

    this.error =
      'No se pudo guardar la canción. Revisá la consola.';

    await this.contenido?.scrollToTop(300);

  } finally {

    this.guardando = false;
    this.changeDetector.detectChanges();
  }
}


  // =====================================
  // VOLVER AL INICIO
  // =====================================

  volver(): void {

    void this.router.navigate(['/home']);

  }

}
