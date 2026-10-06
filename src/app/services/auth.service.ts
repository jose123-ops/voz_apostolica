
import { Injectable } from '@angular/core';

import {
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import { auth } from '../firebase';


@Injectable({
  providedIn: 'root'
})
export class AuthService {


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


  async logout() {

    await signOut(auth);

  }

}

