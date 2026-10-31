
import { Injectable } from '@angular/core';

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

import { db } from '../firebase';


export interface Cancion {

  id?: string;

  titulo: string;

  artista: string;

  categoria: string;

  letra: string;

  // Nuevo campo para el tono musical
  tono?: string;

  // Compatibilidad con canciones anteriores
  acordes?: string;

  youtube?: string;

  // Fecha de creación
  fechaCreacion?: any;

}

@Injectable({
  providedIn: 'root'
})
export class CancionesService {


  private cancionesRef =
    collection(
      db,
      'canciones'
    );


  // ========================================
  // OBTENER CANCIONES
  // ========================================

  async obtenerCanciones(): Promise<Cancion[]> {

    console.log(
      '🔥 Consultando Firestore...'
    );


    const snapshot =
      await getDocs(
        this.cancionesRef
      );


    console.log(
      '🔥 Firestore respondió:',
      snapshot.size,
      'documentos'
    );


    const canciones =
      snapshot.docs.map(
        documento => ({

          id: documento.id,

          ...documento.data()

        } as Cancion)
      );


    console.log(
      '🔥 Canciones:',
      canciones
    );


    return canciones;

  }


  // ========================================
  // OBTENER UNA CANCIÓN
  // ========================================

  async obtenerCancion(
    id: string
  ): Promise<Cancion | null> {


    const referencia =
      doc(
        db,
        'canciones',
        id
      );


    const resultado =
      await getDoc(
        referencia
      );


    if (!resultado.exists()) {

      return null;

    }


    return {

      id: resultado.id,

      ...resultado.data()

    } as Cancion;

  }


  // ========================================
  // AGREGAR
  // ========================================

  async agregarCancion(
    cancion: Cancion
  ) {


    return await addDoc(
      this.cancionesRef,
      {

        titulo: cancion.titulo,

        artista: cancion.artista,

        categoria: cancion.categoria,

        letra: cancion.letra,

        acordes: cancion.acordes,

        youtube:
          cancion.youtube || '',

        fechaCreacion:
          new Date()

      }
    );

  }


  // ========================================
  // ACTUALIZAR
  // ========================================

  async actualizarCancion(
    id: string,
    datos: Partial<Cancion>
  ) {


    const referencia =
      doc(
        db,
        'canciones',
        id
      );


    await updateDoc(
      referencia,
      datos
    );

  }


  // ========================================
  // ELIMINAR
  // ========================================

  async eliminarCancion(
    id: string
  ) {


    const referencia =
      doc(
        db,
        'canciones',
        id
      );


    await deleteDoc(
      referencia
    );

  }

  

}

