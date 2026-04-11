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

function fallbackClassifier(text: string): { tipo: string; tema: string; subtema: string } {
  const normalized = text.toLowerCase();

  if (normalized.includes('felicito') || normalized.includes('agradezco')) {
    return { tipo: 'Felicitacion', tema: 'Gobierno', subtema: 'Atención al ciudadano' };
  }

  if (normalized.includes('sugiero') || normalized.includes('propongo')) {
    return { tipo: 'Sugerencia', tema: 'Movilidad', subtema: 'Mejora de servicio' };
  }

  if (normalized.includes('eps') || normalized.includes('salud') || normalized.includes('cita')) {
    return { tipo: 'Reclamo', tema: 'Salud', subtema: 'Servicio de EPS' };
  }

  if (normalized.includes('basura') || normalized.includes('residuo')) {
    return { tipo: 'Queja', tema: 'Medio Ambiente', subtema: 'Recolección de residuos' };
  }

  if (normalized.includes('alumbrado') || normalized.includes('semáforo') || normalized.includes('hueco')) {
    return { tipo: 'Peticion', tema: 'Infraestructura', subtema: 'Mantenimiento urbano' };
  }

  return { tipo: 'Peticion', tema: 'Gobierno', subtema: 'Atención general' };
}

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

    return fallbackClassifier(texto);
  }
}
