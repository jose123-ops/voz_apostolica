import { Injectable } from '@angular/core';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface CancionEvento { cancionId: string; dirige: string; }
export interface Evento {
  id?: string;
  nombre: string;
  fecha: string;
  ministracion: CancionEvento[];
  lectura: CancionEvento[];
  ofrenda: CancionEvento[];
  despedida: CancionEvento[];
  especiales: CancionEvento[];
  /** Ausente en eventos anteriores. 2 indica el orden nuevo. */
  versionPrograma?: number;
}

@Injectable({ providedIn: 'root' })
export class EventosService {
  private eventosRef = collection(db, 'eventos');

  async obtenerEventos(): Promise<Evento[]> {
    const consulta = query(this.eventosRef, orderBy('fecha', 'desc'));
    const resultado = await getDocs(consulta);
    return resultado.docs.map(documento => ({ id: documento.id, ...documento.data() } as Evento));
  }

  async obtenerEvento(id: string): Promise<Evento | null> {
    const resultado = await getDoc(doc(db, 'eventos', id));
    if (!resultado.exists()) return null;
    return { id: resultado.id, ...resultado.data() } as Evento;
  }

  async agregarEvento(evento: Evento) {
    return await addDoc(this.eventosRef, {
      nombre: evento.nombre,
      fecha: evento.fecha,
      versionPrograma: 2,
      ministracion: evento.ministracion || [],
      lectura: evento.lectura || [],
      ofrenda: evento.ofrenda || [],
      despedida: evento.despedida || [],
      especiales: evento.especiales || [],
      fechaCreacion: Timestamp.now()
    });
  }

  async actualizarEvento(id: string, datos: Partial<Evento>) {
    // No forzar versión 2: editar un evento antiguo no debe reinterpretar sus secciones.
    const { id: _id, ...campos } = datos;
    await updateDoc(doc(db, 'eventos', id), campos);
  }

  async eliminarEvento(id: string) {
    await deleteDoc(doc(db, 'eventos', id));
  }
}
