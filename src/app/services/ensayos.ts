
import { Injectable } from '@angular/core';
import { db } from '../firebase';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';



// CANCIÓN QUE SE PRACTICARÁ
export interface CancionEnsayo {
  cancionId: string;
}

// ESTRUCTURA DEL ENSAYO
export interface Ensayo {
  id?: string;
  nombre: string;
  fecha: string;
  hora: string;
  lugar: string;
  observaciones: string;
  canciones: CancionEnsayo[];
  participantes: string[];
  fechaCreacion?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EnsayosService {

  private coleccion = collection(db, 'ensayos');

  // OBTENER TODOS LOS ENSAYOS
  async obtenerEnsayos(): Promise<Ensayo[]> {

    const consulta = query(
      this.coleccion,
      orderBy('fecha', 'asc')
    );

    const resultado = await getDocs(consulta);

    return resultado.docs.map(documento => ({
      id: documento.id,
      ...documento.data()
    } as Ensayo));
  }

  // OBTENER UN ENSAYO
  async obtenerEnsayo(id: string): Promise<Ensayo | null> {

    const referencia = doc(db, 'ensayos', id);
    const resultado = await getDoc(referencia);

    if (!resultado.exists()) {
      return null;
    }

    return {
      id: resultado.id,
      ...resultado.data()
    } as Ensayo;
  }

  // CREAR ENSAYO
  async agregarEnsayo(ensayo: Ensayo): Promise<string> {

    const { id, ...datos } = ensayo;

    const resultado = await addDoc(this.coleccion, {
      ...datos,
      fechaCreacion: new Date()
    });

    return resultado.id;
  }

  // ACTUALIZAR ENSAYO
  async actualizarEnsayo(
    id: string,
    datos: Partial<Ensayo>
  ): Promise<void> {

    const { id: _id, ...actualizacion } = datos;

    await updateDoc(
      doc(db, 'ensayos', id),
      actualizacion
    );
  }

  // ELIMINAR ENSAYO
  async eliminarEnsayo(id: string): Promise<void> {

    await deleteDoc(
      doc(db, 'ensayos', id)
    );
  }

}
