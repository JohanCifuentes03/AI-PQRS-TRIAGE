import {
  triageInputSchema,
  triageOutputSchema,
  pqrsCreateSchema,
  pqrsApproveSchema,
  pqrsCorrectSchema,
  pqrsRouteSchema,
  pqrsQuerySchema,
} from '../schemas/triage.schema';
import { Canal, Urgencia, EstadoPqrs, TipoPqrs } from '../types/enums';

describe('triageInputSchema', () => {
  it('accepts valid input with texto and canal', () => {
    const result = triageInputSchema.safeParse({
      texto: 'Hay un hueco en la calle 72',
      canal: Canal.WEB,
    });
    expect(result.success).toBe(true);
  });

  it('rejects texto shorter than 10 characters', () => {
    const result = triageInputSchema.safeParse({
      texto: 'Hola',
      canal: Canal.WEB,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid canal', () => {
    const result = triageInputSchema.safeParse({
      texto: 'Un texto valido para probar',
      canal: 'telefono',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing texto', () => {
    const result = triageInputSchema.safeParse({
      canal: Canal.WEB,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing canal', () => {
    const result = triageInputSchema.safeParse({
      texto: 'Un texto valido para probar',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid canal values', () => {
    for (const canal of Object.values(Canal)) {
      const result = triageInputSchema.safeParse({
        texto: 'Un texto valido para probar',
        canal,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('triageOutputSchema', () => {
  const validOutput = {
    tipo: 'Queja',
    tema: 'Infraestructura',
    subtema: 'Alumbrado publico',
    urgencia: Urgencia.ALTA,
    entidad: 'CODENSA S.A.',
    riesgo: 'Riesgo electrico',
    duplicados: ['uuid-1', 'uuid-2'],
    confianza: 0.92,
    resumen: 'Ciudadano reporta cables sueltos en zona residencial',
  };

  it('accepts valid complete output', () => {
    const result = triageOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it('rejects confianza above 1', () => {
    const result = triageOutputSchema.safeParse({
      ...validOutput,
      confianza: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects confianza below 0', () => {
    const result = triageOutputSchema.safeParse({
      ...validOutput,
      confianza: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid urgencia', () => {
    const result = triageOutputSchema.safeParse({
      ...validOutput,
      urgencia: 'Super Alta',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = triageOutputSchema.safeParse({
      tipo: 'Queja',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty duplicados array', () => {
    const result = triageOutputSchema.safeParse({
      ...validOutput,
      duplicados: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts confianza of exactly 0', () => {
    const result = triageOutputSchema.safeParse({
      ...validOutput,
      confianza: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts confianza of exactly 1', () => {
    const result = triageOutputSchema.safeParse({
      ...validOutput,
      confianza: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe('pqrsCreateSchema', () => {
  it('accepts valid create input', () => {
    const result = pqrsCreateSchema.safeParse({
      texto: 'Solicito reparacion del parque',
      canal: Canal.PRESENCIAL,
    });
    expect(result.success).toBe(true);
  });

  it('rejects short texto', () => {
    const result = pqrsCreateSchema.safeParse({
      texto: 'Corto',
      canal: Canal.WEB,
    });
    expect(result.success).toBe(false);
  });
});

describe('pqrsApproveSchema', () => {
  it('accepts valid approve input', () => {
    const result = pqrsApproveSchema.safeParse({
      usuario: 'funcionario1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty usuario', () => {
    const result = pqrsApproveSchema.safeParse({
      usuario: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing usuario', () => {
    const result = pqrsApproveSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('pqrsCorrectSchema', () => {
  it('accepts correction with all optional fields', () => {
    const result = pqrsCorrectSchema.safeParse({
      usuario: 'funcionario1',
      tipo: TipoPqrs.QUEJA,
      tema: 'Salud',
      subtema: 'EPS',
      urgencia: Urgencia.ALTA,
      entidad: 'SDS',
      riesgo: 'Salud publica',
    });
    expect(result.success).toBe(true);
  });

  it('accepts correction with only usuario', () => {
    const result = pqrsCorrectSchema.safeParse({
      usuario: 'funcionario1',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial correction', () => {
    const result = pqrsCorrectSchema.safeParse({
      usuario: 'funcionario1',
      urgencia: Urgencia.MEDIA,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty usuario', () => {
    const result = pqrsCorrectSchema.safeParse({
      usuario: '',
      tipo: TipoPqrs.QUEJA,
    });
    expect(result.success).toBe(false);
  });
});

describe('pqrsRouteSchema', () => {
  it('accepts valid route input', () => {
    const result = pqrsRouteSchema.safeParse({
      usuario: 'funcionario1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing usuario', () => {
    const result = pqrsRouteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('pqrsQuerySchema', () => {
  it('applies defaults for page and limit', () => {
    const result = pqrsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('parses page and limit from strings', () => {
    const result = pqrsQuerySchema.safeParse({
      page: '3',
      limit: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit above 100', () => {
    const result = pqrsQuerySchema.safeParse({
      limit: 200,
    });
    expect(result.success).toBe(false);
  });

  it('rejects limit of 0', () => {
    const result = pqrsQuerySchema.safeParse({
      limit: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative page', () => {
    const result = pqrsQuerySchema.safeParse({
      page: -1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid estado filter', () => {
    const result = pqrsQuerySchema.safeParse({
      estado: EstadoPqrs.PENDIENTE,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid urgencia filter', () => {
    const result = pqrsQuerySchema.safeParse({
      urgencia: Urgencia.ALTA,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid tipo filter', () => {
    const result = pqrsQuerySchema.safeParse({
      tipo: TipoPqrs.RECLAMO,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid estado', () => {
    const result = pqrsQuerySchema.safeParse({
      estado: 'eliminado',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all filters combined', () => {
    const result = pqrsQuerySchema.safeParse({
      estado: EstadoPqrs.PENDIENTE,
      urgencia: Urgencia.ALTA,
      tipo: TipoPqrs.QUEJA,
      page: 2,
      limit: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estado).toBe(EstadoPqrs.PENDIENTE);
      expect(result.data.urgencia).toBe(Urgencia.ALTA);
      expect(result.data.tipo).toBe(TipoPqrs.QUEJA);
    }
  });
});

describe('Enums completeness', () => {
  it('Canal has all expected values', () => {
    expect(Object.values(Canal)).toEqual(['web', 'escrito', 'presencial', 'email', 'api_externa']);
  });

  it('Urgencia has all expected values', () => {
    expect(Object.values(Urgencia)).toEqual(['Alta', 'Media', 'Baja']);
  });

  it('EstadoPqrs has all expected values', () => {
    expect(Object.values(EstadoPqrs)).toEqual([
      'pendiente',
      'aprobado',
      'corregido',
      'enrutado',
    ]);
  });

  it('TipoPqrs has all expected values', () => {
    expect(Object.values(TipoPqrs)).toEqual([
      'Peticion',
      'Queja',
      'Reclamo',
      'Sugerencia',
      'Felicitacion',
    ]);
  });
});
