import { LlmProvider } from './llm.provider';

describe('LlmProvider', () => {
  describe('chat', () => {
    it('calls OpenAI client and returns content', async () => {
      const provider = new LlmProvider();
      (provider as any).enabled = true;
      (provider as any).client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: '{"tipo":"Queja"}' } }],
            }),
          },
        },
      };

      const result = await provider.chat([{ role: 'user', content: 'texto' }]);
      expect(result).toBe('{"tipo":"Queja"}');
    });

    it('returns parsed content from mock', async () => {
      const provider = new LlmProvider();
      provider.chat = jest.fn().mockResolvedValue('{"tipo": "Queja"}');

      const result = await provider.chat([
        { role: 'system', content: 'Eres un clasificador' },
        { role: 'user', content: 'Hay basuras en la calle' },
      ]);

      expect(result).toBe('{"tipo": "Queja"}');
    });

    it('throws when no content returned', async () => {
      const provider = new LlmProvider();
      (provider as any).enabled = true;
      (provider as any).client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({ choices: [] }),
          },
        },
      };

      await expect(
        provider.chat([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow('LLM returned no choices');
    });
  });

  describe('generateEmbedding', () => {
    it('calls OpenAI embeddings and returns vector', async () => {
      const fakeVector = new Array(1536).fill(0.1);
      const provider = new LlmProvider();
      (provider as any).enabled = true;
      (provider as any).client = {
        embeddings: {
          create: jest.fn().mockResolvedValue({ data: [{ embedding: fakeVector }] }),
        },
      };

      const result = await provider.generateEmbedding('texto de prueba');
      expect(result).toEqual(fakeVector);
    });

    it('returns embedding vector', async () => {
      const fakeVector = new Array(1536).fill(0.1);
      const provider = new LlmProvider();
      provider.generateEmbedding = jest.fn().mockResolvedValue(fakeVector);

      const result = await provider.generateEmbedding('texto de prueba');
      expect(result).toEqual(fakeVector);
    });

    it('throws when embedding fails', async () => {
      const provider = new LlmProvider();
      (provider as any).enabled = true;
      (provider as any).client = {
        embeddings: {
          create: jest.fn().mockResolvedValue({ data: [] }),
        },
      };

      await expect(provider.generateEmbedding('texto')).rejects.toThrow(
        'Embedding generation failed',
      );
    });

    it('throws disabled error when key missing', async () => {
      const provider = new LlmProvider();
      (provider as any).enabled = false;
      await expect(provider.generateEmbedding('x')).rejects.toThrow('Embedding disabled');
    });
  });
});
