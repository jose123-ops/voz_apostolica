
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface LetraResultado {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LetrasService {

  private readonly api = 'https://lrclib.net/api';

  private readonly headers = new HttpHeaders({
    'Lrclib-Client': 'Voz Apostolica v1.0'
  });

  constructor(private http: HttpClient) {}

  async buscar(
    titulo: string,
    artista: string = ''
  ): Promise<LetraResultado[]> {

    const nombre = titulo.trim();
    const cantante = artista.trim();

    if (!nombre) {
      return [];
    }

    let params = new HttpParams()
      .set('track_name', nombre);

    if (cantante) {
      params = params.set('artist_name', cantante);
    }

    return await firstValueFrom(
      this.http.get<LetraResultado[]>(
        `${this.api}/search`,
        {
          params,
          headers: this.headers
        }
      )
    );
  }
}
