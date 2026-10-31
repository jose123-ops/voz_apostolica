
import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  IonApp,
  IonRouterOutlet,
  IonIcon
} from '@ionic/angular';

import {
  Router,
  NavigationEnd,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { filter } from 'rxjs/operators';

import { TemaService } from './services/tema.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    IonApp,
    IonRouterOutlet,
    IonIcon,
    RouterLink,
    RouterLinkActive
  ]
})
export class AppComponent implements OnInit {

  mostrarMenu = false;

  private router = inject(Router);

  // Conservamos la inicialización del tema.
  private temaService = inject(TemaService);

  ngOnInit() {

    this.actualizarMenu();

    this.router.events
      .pipe(
        filter(
          (evento): evento is NavigationEnd =>
            evento instanceof NavigationEnd
        )
      )
      .subscribe(() => {
        this.actualizarMenu();
      });

  }

  private actualizarMenu() {

    const ruta = this.router.url.split('?')[0];

    this.mostrarMenu =
      ruta !== '/' &&
      ruta !== '/login';

  }

}
