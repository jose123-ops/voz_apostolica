import { Injectable } from '@angular/core';

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

import {
  onAuthStateChanged
} from 'firebase/auth';

import {
  db,
  auth
} from '../firebase';

export interface Usuario {
  id?: string;
  usuario: string;
  nombre: string;
  rol: string;
  uid: string;
  favoritos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private usuariosRef =
    collection(db, 'usuarios');


  // =====================================================
  // ESPERAR A QUE FIREBASE DETERMINE EL USUARIO ACTUAL
  // =====================================================

  private esperarUsuarioFirebase(): Promise<any | null> {

    return new Promise((resolve) => {

      if (auth.currentUser) {

        resolve(auth.currentUser);

        return;
      }

      const cancelar =
        onAuthStateChanged(
          auth,
          (usuario) => {

            cancelar();

            resolve(usuario);
          }
        );
    });
  }


  // =====================================================
  // BUSCAR USUARIO EN FIRESTORE POR UID
  // =====================================================

  async obtenerUsuarioPorUid(
    uid: string
  ): Promise<Usuario | null> {

    if (!uid) {

      console.error(
        '❌ UID vacío.'
      );

      return null;
    }

    console.log(
      '🔎 Buscando usuario con UID:',
      uid
    );

    const consulta =
      query(
        this.usuariosRef,
        where('uid', '==', uid)
      );

    const resultado =
      await getDocs(consulta);

    if (resultado.empty) {

      console.error(
        '❌ No existe usuario en Firestore con UID:',
        uid
      );

      return null;
    }

    const documento =
      resultado.docs[0];

    const datos =
      documento.data();

    let favoritos: string[] = [];

    if (
      Array.isArray(
        datos['favoritos']
      )
    ) {

      favoritos =
        datos['favoritos'];

    } else if (
      Array.isArray(
        datos['favorito']
      )
    ) {

      favoritos =
        datos['favorito'];
    }

    const usuario: Usuario = {

      id: documento.id,

      usuario:
        datos['usuario'] || '',

      nombre:
        datos['nombre'] || '',

      rol:
        datos['rol'] || '',

      uid:
        datos['uid'] || '',

      favoritos
    };

    console.log(
      '✅ Usuario encontrado:',
      usuario
    );

    return usuario;
  }


  // =====================================================
  // OBTENER USUARIO ACTUAL
  // =====================================================

  async obtenerUsuarioActual():
    Promise<Usuario | null> {

    const usuarioFirebase =
      await this.esperarUsuarioFirebase();

    if (!usuarioFirebase) {

      console.error(
        '❌ No hay usuario autenticado en Firebase.'
      );

      return null;
    }

    console.log(
      '🔥 UID Firebase Authentication:',
      usuarioFirebase.uid
    );

    return await this.obtenerUsuarioPorUid(
      usuarioFirebase.uid
    );
  }


  // =====================================================
  // OBTENER ROL DEL USUARIO
  // =====================================================

  async obtenerRolActual(): Promise<string> {

    const usuario =
      await this.obtenerUsuarioActual();

    if (!usuario) {
      return '';
    }

    return (
      usuario.rol || ''
    ).toLowerCase().trim();
  }


  // =====================================================
  // COMPROBAR SI ES ADMIN
  // =====================================================

  async esAdmin(): Promise<boolean> {

    const rol =
      await this.obtenerRolActual();

    return rol === 'admin';
  }


  // =====================================================
  // COMPROBAR SI ES MÚSICO
  // =====================================================

  async esMusico(): Promise<boolean> {

    const rol =
      await this.obtenerRolActual();

    return rol === 'musico';
  }


  // =====================================================
  // COMPROBAR SI ES CANTANTE
  // =====================================================

  async esCantante(): Promise<boolean> {

    const rol =
      await this.obtenerRolActual();

    return rol === 'cantante';
  }


  // =====================================================
  // FAVORITOS
  // =====================================================

  async agregarFavorito(
    uid: string,
    cancionId: string
  ) {

    const usuario =
      await this.obtenerUsuarioPorUid(uid);

    if (!usuario?.id) {

      throw new Error(
        'Usuario no encontrado.'
      );
    }

    const referencia =
      doc(
        db,
        'usuarios',
        usuario.id
      );

    await updateDoc(
      referencia,
      {
        favoritos:
          arrayUnion(cancionId)
      }
    );
  }


  async quitarFavorito(
    uid: string,
    cancionId: string
  ) {

    const usuario =
      await this.obtenerUsuarioPorUid(uid);

    if (!usuario?.id) {

      throw new Error(
        'Usuario no encontrado.'
      );
    }

    const referencia =
      doc(
        db,
        'usuarios',
        usuario.id
      );

    await updateDoc(
      referencia,
      {
        favoritos:
          arrayRemove(cancionId)
      }
    );
  }


  async esFavorito(
    uid: string,
    cancionId: string
  ): Promise<boolean> {

    const usuario =
      await this.obtenerUsuarioPorUid(uid);

    if (!usuario) {
      return false;
    }

    return usuario.favoritos
      .includes(cancionId);
  }

}