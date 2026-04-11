import { LlmProvider } from './llm.provider';

describe('LlmProvider', () => {
  describe('chat', () => {
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
      provider.chat = jest.fn().mockRejectedValue(new Error('LLM returned no choices'));

      await expect(
        provider.chat([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow('LLM returned no choices');
    });
  });

  describe('generateEmbedding', () => {
    it('returns embedding vector', async () => {
      const fakeVector = new Array(1536).fill(0.1);
      const provider = new LlmProvider();
      provider.generateEmbedding = jest.fn().mockResolvedValue(fakeVector);

      const result = await provider.generateEmbedding('texto de prueba');
      expect(result).toEqual(fakeVector);
    });

    it('throws when embedding fails', async () => {
      const provider = new LlmProvider();
      provider.generateEmbedding = jest.fn().mockRejectedValue(
        new Error('Embedding generation failed'),
      );

      await expect(provider.generateEmbedding('texto')).rejects.toThrow(
        'Embedding generation failed',
      );
    });
  });
});
