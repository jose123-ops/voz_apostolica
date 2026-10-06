
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  FormsModule
} from '@angular/forms';

import {
  UsuarioService
} from '../services/usuario.service';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

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
export class CancionesPage
  implements OnInit {


  canciones: Cancion[] = [];

  cancionesFiltradas: Cancion[] = [];

  cargando = true;

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


  private cancionesService =
    inject(CancionesService);

  private router =
    inject(Router);

  private changeDetector =
    inject(ChangeDetectorRef);

    private usuarioService =
  inject(UsuarioService);


  async ngOnInit() {

  this.esAdmin =
    await this.usuarioService
      .esAdmin();

  await this.cargarCanciones();

}

  async cargarCanciones() {

    this.cargando = true;

    this.error = '';

    this.changeDetector.detectChanges();


    try {

      console.log(
        '🎵 Cargando canciones...'
      );


      this.canciones =
        await this.cancionesService
          .obtenerCanciones();


      console.log(
        '🎵 Canciones encontradas:',
        this.canciones.length
      );


      this.aplicarFiltros();


    } catch (error) {

      console.error(
        '❌ Error cargando canciones:',
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


  aplicarFiltros() {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();


    this.cancionesFiltradas =
      this.canciones.filter(
        cancion => {

          const coincideTexto =
            !texto ||
            cancion.titulo
              ?.toLowerCase()
              .includes(texto) ||
            cancion.artista
              ?.toLowerCase()
              .includes(texto) ||
            cancion.categoria
              ?.toLowerCase()
              .includes(texto);


          const coincideCategoria =
            this.categoriaSeleccionada ===
              'todas' ||
            cancion.categoria
              ?.toLowerCase() ===
              this.categoriaSeleccionada
                .toLowerCase();


          return (
            coincideTexto &&
            coincideCategoria
          );

        }
      );

  }


  buscar() {

    this.aplicarFiltros();

  }


  cambiarCategoria() {

    this.aplicarFiltros();

  }


  abrirCancion(
    cancion: Cancion
  ) {

    if (!cancion.id) {

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


  volver() {

    this.router.navigate([
      '/home'
    ]);

  }


  abrirAgregarCancion() {

    this.router.navigate([
      '/agregar-cancion'
    ]);

  }

}

