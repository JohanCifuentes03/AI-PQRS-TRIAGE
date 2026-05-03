import { Canal, TipoPqrs } from '@ai-pqrs-triage/shared';
import { z } from 'zod';

const optionalDate = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  z.coerce.date().optional(),
);

export const statsQuerySchema = z
  .object({
    from: optionalDate,
    to: optionalDate,
    canal: z.nativeEnum(Canal).optional(),
    tipo: z.nativeEnum(TipoPqrs).optional(),
    entidad: z.string().min(1).optional(),
  })
  .refine(({ from, to }) => !(from && to) || from <= to, {
    message: 'from must be before or equal to to',
    path: ['from'],
  });

export type StatsQueryDto = z.infer<typeof statsQuerySchema>;
