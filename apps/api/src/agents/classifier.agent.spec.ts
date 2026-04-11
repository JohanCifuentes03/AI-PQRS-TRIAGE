import { ClassifierAgent } from './classifier.agent';

describe('ClassifierAgent', () => {
  let agent: ClassifierAgent;
  let mockLlm: { chat: jest.Mock };

  beforeEach(() => {
    mockLlm = { chat: jest.fn() };
    agent = new ClassifierAgent(mockLlm as any);
  });

  it('classifies a PQRS text into tipo, tema, subtema', async () => {
    mockLlm.chat.mockResolvedValue(
      JSON.stringify({ tipo: 'Queja', tema: 'Infraestructura', subtema: 'Alumbrado público' }),
    );

    const result = await agent.classify('Hay cables sueltos en la calle 72');

    expect(result).toEqual({
      tipo: 'Queja',
      tema: 'Infraestructura',
      subtema: 'Alumbrado público',
    });
    expect(mockLlm.chat).toHaveBeenCalledTimes(1);
    expect(mockLlm.chat).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: expect.stringContaining('cables sueltos') }),
      ]),
    );
  });

  it('retries once on invalid JSON response', async () => {
    mockLlm.chat
      .mockResolvedValueOnce('not valid json')
      .mockResolvedValueOnce(
        JSON.stringify({ tipo: 'Peticion', tema: 'Salud', subtema: 'EPS' }),
      );

    const result = await agent.classify('Necesito cita con especialista');
    expect(result.tipo).toBe('Peticion');
    expect(mockLlm.chat).toHaveBeenCalledTimes(2);
  });

  it('falls back after max retries with invalid JSON', async () => {
    mockLlm.chat.mockResolvedValue('not json at all');

    const result = await agent.classify('test');
    expect(result.tipo).toBeDefined();
  });

  it('falls back when JSON misses expected keys', async () => {
    mockLlm.chat.mockResolvedValue(JSON.stringify({ tipo: 'Queja' }));
    const result = await agent.classify('test incompleto');
    expect(result.tema).toBeDefined();
  });
});
