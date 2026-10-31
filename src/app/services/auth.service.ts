
import { Injectable } from '@angular/core';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

import { auth } from '../firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // INICIAR SESIÓN
  async login(
    usuario: string,
    password: string
  ) {

    const email =
      `${usuario}@vozapostolica.com`;

    return await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  }

  // CERRAR SESIÓN
  async cerrarSesion(): Promise<void> {
    await signOut(auth);
  }

  // CONSERVAR COMPATIBILIDAD
  async logout(): Promise<void> {
    await this.cerrarSesion();
  }

  // USUARIO ACTUAL
  obtenerUsuarioActual(): User | null {
    return auth.currentUser;
  }

  // OBSERVAR ESTADO DE AUTENTICACIÓN
  observarSesion(
    callback: (usuario: User | null) => void
  ) {
    return onAuthStateChanged(auth, callback);
  }

}
