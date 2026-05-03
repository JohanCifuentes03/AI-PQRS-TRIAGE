import { z } from 'zod';

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const emailAttachmentSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  content: z.string(),
});

export const emailIngestSchema = z
  .object({
    from: z.string().email(),
    subject: z.string().min(1),
    text: z.string().optional(),
    html: z.string().optional(),
    attachments: z.array(emailAttachmentSchema).optional(),
  })
  .superRefine((value, ctx) => {
    const bodyText = getEmailBodyText(value);

    if (!value.text && !value.html) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one of text or html must be present',
        path: ['text'],
      });
    }

    if (bodyText.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El texto debe tener al menos 10 caracteres',
        path: ['text'],
      });
    }
  });

export type EmailIngestDto = z.infer<typeof emailIngestSchema>;

export function getEmailBodyText(payload: Pick<EmailIngestDto, 'text' | 'html'>): string {
  const text = payload.text?.trim() ?? '';

  if (text.length > 0) {
    return text;
  }

  return payload.html ? stripHtml(payload.html) : '';
}
