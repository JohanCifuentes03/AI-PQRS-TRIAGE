import { Injectable } from '@nestjs/common';
import { LlmProvider } from '../llm/llm.provider';
import { Urgencia } from '@ai-pqrs-triage/shared';

const SYSTEM_PROMPT = `Eres un agente detector de riesgo y urgencia para PQRS del sistema "Bogotá Te Escucha".

Analiza el texto y determina:
- urgencia: uno de [${Object.values(Urgencia).join(', ')}]
- riesgo: descripción breve del riesgo detectado

REGLAS CRÍTICAS:
- Ante CUALQUIER duda, asigna urgencia "Alta"
- Si menciona cables sueltos, electrocución, riesgo vital, violencia, emergencia sanitaria → SIEMPRE Alta
- Si menciona demoras en servicios, ruido, infraestructura menor → Media
- Si es solicitud informativa, sugerencia, felicitación → Baja

Responde SOLO en JSON válido con las claves: urgencia, riesgo

Ejemplos:
Texto: "Cables sueltos colgando y niños jugando cerca"
→ {"urgencia": "Alta", "riesgo": "Riesgo vital - electrocución"}

Texto: "Basuras acumuladas en mi cuadra hace dos semanas"
→ {"urgencia": "Alta", "riesgo": "Riesgo sanitario por acumulación de residuos"}

Texto: "Ruido excesivo del bar vecino después de las 11PM"
→ {"urgencia": "Media", "riesgo": "Contaminación auditiva"}

Texto: "Quiero sugerir ciclo-rutas en mi barrio"
→ {"urgencia": "Baja", "riesgo": "Ninguno"}`;

const MAX_RETRIES = 2;

@Injectable()
export class RiskDetectorAgent {
  constructor(private readonly llm: LlmProvider) {}

  async detect(texto: string): Promise<{ urgencia: string; riesgo: string }> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const raw = await this.llm.chat([
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: texto },
        ]);
        const parsed = JSON.parse(raw);
        if (parsed.urgencia && parsed.riesgo) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
    return { urgencia: 'Alta', riesgo: 'No se pudo determinar - marcado como Alto por seguridad' };
  }
}
