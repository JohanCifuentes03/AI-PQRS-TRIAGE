import { Injectable } from '@nestjs/common';
import { LlmProvider } from '../llm/llm.provider';
import { TipoPqrs } from '@ai-pqrs-triage/shared';

const SYSTEM_PROMPT = `Eres un agente clasificador de PQRS (Peticiones, Quejas, Reclamos, Sugerencias, Felicitaciones) para el sistema "Bogotá Te Escucha" de la Alcaldía de Bogotá.

Tu trabajo es analizar el texto de una PQRS y clasificarla en:
- tipo: uno de [${Object.values(TipoPqrs).join(', ')}]
- tema: categoría principal según taxonomía distrital (Infraestructura, Salud, Medio Ambiente, Movilidad, Convivencia, Educación, Gobierno, Hacienda, Cultura, Planeación, Desarrollo Social, Seguridad, TIC, Servicios Públicos)
- subtema: subcategoría específica del tema

Responde SOLO en JSON válido con las claves: tipo, tema, subtema

Ejemplos:
Texto: "Hay basuras acumuladas en la Calle 72 hace una semana"
→ {"tipo": "Queja", "tema": "Medio Ambiente", "subtema": "Recolección de residuos"}

Texto: "Solicito la reparación del parque de mi barrio"
→ {"tipo": "Peticion", "tema": "Infraestructura", "subtema": "Espacio público"}

Texto: "Los semáforos de la Av. El Dorado están dañados"
→ {"tipo": "Peticion", "tema": "Movilidad", "subtema": "Semáforos"}

Texto: "Mi EPS no me autoriza la cita con el especialista"
→ {"tipo": "Reclamo", "tema": "Salud", "subtema": "Servicio de EPS"}`;

const MAX_RETRIES = 2;

@Injectable()
export class ClassifierAgent {
  constructor(private readonly llm: LlmProvider) {}

  async classify(texto: string): Promise<{ tipo: string; tema: string; subtema: string }> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const raw = await this.llm.chat([
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: texto },
        ]);
        const parsed = JSON.parse(raw);
        if (parsed.tipo && parsed.tema && parsed.subtema) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
    throw new Error('ClassifierAgent failed after retries');
  }
}
