import { Injectable } from '@angular/core';

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp
} from 'firebase/firestore';

import { db } from '../firebase';

export interface CancionEvento {
  cancionId: string;
  dirige: string;
}

export interface Evento {
  id?: string;

  nombre: string;

  fecha: string;

  ministracion: CancionEvento[];

  lectura: CancionEvento[];

  ofrenda: CancionEvento[];

  despedida: CancionEvento[];

  especiales: CancionEvento[];
}

@Injectable({
  providedIn: 'root'
})
export class EventosService {

  private eventosRef =
    collection(db, 'eventos');


  // ============================================
  // OBTENER TODOS LOS EVENTOS
  // ============================================

  async obtenerEventos(): Promise<Evento[]> {

    const consulta =
      query(
        this.eventosRef,
        orderBy('fecha', 'desc')
      );

    const resultado =
      await getDocs(consulta);

    return resultado.docs.map(
      documento => ({

        id: documento.id,

        ...documento.data()

      } as Evento)
    );
  }


  // ============================================
  // OBTENER UN EVENTO
  // ============================================

  async obtenerEvento(
    id: string
  ): Promise<Evento | null> {

    const referencia =
      doc(
        db,
        'eventos',
        id
      );

    const resultado =
      await getDoc(referencia);

    if (!resultado.exists()) {
      return null;
    }

    return {

      id: resultado.id,

      ...resultado.data()

    } as Evento;
  }


  // ============================================
  // CREAR EVENTO
  // ============================================

  async agregarEvento(
    evento: Evento
  ) {

    return await addDoc(
      this.eventosRef,
      {

        nombre:
          evento.nombre,

        fecha:
          evento.fecha,

        ministracion:
          evento.ministracion || [],

        lectura:
          evento.lectura || [],

        ofrenda:
          evento.ofrenda || [],

        despedida:
          evento.despedida || [],

        especiales:
          evento.especiales || [],

        fechaCreacion:
          Timestamp.now()

      }
    );
  }


  // ============================================
  // ACTUALIZAR EVENTO
  // ============================================

  async actualizarEvento(
    id: string,
    datos: Partial<Evento>
  ) {

    const referencia =
      doc(
        db,
        'eventos',
        id
      );

    await updateDoc(
      referencia,
      datos
    );
  }


  // ============================================
  // ELIMINAR EVENTO
  // ============================================

  async eliminarEvento(
    id: string
  ) {

    const referencia =
      doc(
        db,
        'eventos',
        id
      );

    await deleteDoc(
      referencia
    );
  }

}