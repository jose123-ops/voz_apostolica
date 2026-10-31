
import { Injectable } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

@Injectable({
  providedIn: 'root'
})
export class TemaService {

  private readonly CLAVE = 'voz_apostolica_tema';

  constructor() {
    this.inicializarTema();
  }

  inicializarTema(): void {
    const guardado = localStorage.getItem(this.CLAVE);

    const tema: Tema =
      guardado === 'claro' ? 'claro' : 'oscuro';

    this.establecerTema(tema);
  }

  obtenerTema(): Tema {
    return document.documentElement.classList.contains('tema-claro')
      ? 'claro'
      : 'oscuro';
  }

  establecerTema(tema: Tema): void {
    const raiz = document.documentElement;

    raiz.classList.toggle('tema-claro', tema === 'claro');
    raiz.classList.toggle('tema-oscuro', tema === 'oscuro');

    raiz.classList.toggle(
      'ion-palette-dark',
      tema === 'oscuro'
    );

    raiz.style.colorScheme =
      tema === 'oscuro' ? 'dark' : 'light';

    localStorage.setItem(this.CLAVE, tema);
  }

  cambiarTema(): void {
    const nuevoTema: Tema =
      this.obtenerTema() === 'oscuro'
        ? 'claro'
        : 'oscuro';

    this.establecerTema(nuevoTema);
  }
}
