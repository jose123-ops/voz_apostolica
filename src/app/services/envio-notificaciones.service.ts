
import { Injectable } from '@angular/core';
import { auth } from '../firebase';

type TipoNotificacion =
  'cancion' | 'ensayo' | 'evento';

@Injectable({
  providedIn: 'root'
})
export class EnvioNotificacionesService {

  private readonly apiUrl =
    'https://voz-apostolica.onrender.com/api/notificar';

  async notificar(
    tipo: TipoNotificacion,
    documentoId: string
  ): Promise<{
    ok: boolean;
    enviados?: number;
    fallidos?: number;
    mensaje?: string;
  }> {

    const usuario = auth.currentUser;

    if (!usuario) {
      throw new Error(
        'Debés iniciar sesión para enviar notificaciones.'
      );
    }

    const token = await usuario.getIdToken();

    const respuesta = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tipo,
        documentoId
      })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje ||
        'No se pudo enviar la notificación.'
      );
    }

    return resultado;
  }
}
