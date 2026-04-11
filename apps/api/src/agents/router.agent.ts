import { Injectable } from '@nestjs/common';
import { LlmProvider } from '../llm/llm.provider';

const SYSTEM_PROMPT = `Eres un agente enrutador de PQRS para el sistema "Bogotá Te Escucha" de Bogotá.

Asigna la entidad distrital responsable según la taxonomía oficial:
- CODENSA S.A.: alumbrado público, cables, red eléctrica
- UAESP: recolección de residuos, basuras, limpieza
- SDIS: bomberos, emergencias, prevención de desastres
- SDS: salud pública, EPS, servicios de salud
- Secretaría de Gobierno: convivencia, ruido, establecimientos comerciales
- Secretaría de Movilidad: tráfico, semáforos, transporte
- IDU: infraestructura vial, puentes, mallas viales, ciclo-rutas
- SED: educación, colegios, calidad educativa
- Jardín Botánico: árboles, poda, zonas verdes
- DADEP: parqueaderos, espacio público
- Secretaría de Planeación: usos del suelo, licencias
- Secretaría de Hacienda: impuestos, tributos
- Secretaría de Cultura: eventos, bibliotecas
- Secretaría TIC: tecnología, conectividad
- Secretaría de Desarrollo Social: programas sociales
- Alcaldía Local: asuntos menores de la localidad

Responde SOLO en JSON con la clave: entidad

Ejemplos:
Texto: "Alumbrado público dañado"
→ {"entidad": "CODENSA S.A."}

Texto: "Mi EPS no me da cita"
→ {"entidad": "SDS"}

Texto: "Basuras en la calle"
→ {"entidad": "UAESP"}

Texto: "Hueco en la vía principal"
→ {"entidad": "IDU"}`;

const MAX_RETRIES = 2;

function fallbackRouting(texto: string): { entidad: string } {
  const t = texto.toLowerCase();
  if (t.includes('alumbrado') || t.includes('cable') || t.includes('eléctr')) return { entidad: 'CODENSA S.A.' };
  if (t.includes('basura') || t.includes('residuo')) return { entidad: 'UAESP' };
  if (t.includes('eps') || t.includes('salud') || t.includes('hospital')) return { entidad: 'SDS' };
  if (t.includes('ruido') || t.includes('bar') || t.includes('discoteca')) return { entidad: 'Secretaría de Gobierno' };
  if (t.includes('hueco') || t.includes('vía') || t.includes('cicloruta')) return { entidad: 'IDU' };
  return { entidad: 'Alcaldía Local' };
}

@Injectable()
export class RouterAgent {
  constructor(private readonly llm: LlmProvider) {}

  async route(texto: string): Promise<{ entidad: string }> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const raw = await this.llm.chat([
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: texto },
        ]);
        const parsed = JSON.parse(raw);
        if (parsed.entidad) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
    return fallbackRouting(texto);
  }
}
