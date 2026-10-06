import {
  Component,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonLabel,
  IonText,
  IonSpinner
} from '@ionic/angular';

import {
  AuthService
} from '../services/auth.service';

import {
  UsuarioService
} from '../services/usuario.service';


@Component({
  selector: 'app-login',

  templateUrl:
    './login.page.html',

  styleUrls:
    ['./login.page.scss'],

  imports: [

    CommonModule,

    FormsModule,

    IonContent,

    IonItem,

    IonInput,

    IonButton,

    IonLabel,

    IonText,

    IonSpinner

  ]

})
export class LoginPage {

  usuario = '';

  password = '';

  error = '';

  cargando = false;


  private authService =
    inject(AuthService);


  private usuarioService =
    inject(UsuarioService);


  private router =
    inject(Router);


  async iniciarSesion() {

    this.error = '';


    if (
      !this.usuario.trim() ||
      !this.password
    ) {

      this.error =
        'Ingrese usuario y contraseña.';

      return;

    }


    this.cargando = true;


    try {

      console.log(
        'Intentando iniciar sesión:',
        this.usuario
      );


      const resultado =
        await this.authService.login(

          this.usuario.trim(),

          this.password

        );


      console.log(
        'Login correcto'
      );


      const uid =
        resultado.user.uid;


      console.log(
        'UID de Firebase:',
        uid
      );


      const usuarioFirestore =
        await this.usuarioService
          .obtenerUsuarioPorUid(uid);


      if (!usuarioFirestore) {

        console.error(
          '❌ El usuario inició sesión, pero no existe en Firestore.'
        );

        this.error =
          'El usuario no está registrado en el sistema.';

        return;

      }


      console.log(
        '✅ Usuario encontrado en Firestore:',
        usuarioFirestore
      );


      console.log(
        '👤 Nombre:',
        usuarioFirestore.nombre
      );


      console.log(
        '🔐 Rol:',
        usuarioFirestore.rol
      );


      console.log(
        '❤️ Favoritos:',
        usuarioFirestore.favoritos
      );


      await this.router.navigate(
        ['/home']
      );


    }

    catch (error) {

      console.error(
        'Error de Firebase:',
        error
      );


      this.error =
        'Usuario o contraseña incorrectos.';


    }

    finally {

      this.cargando = false;

    }

  }

}

