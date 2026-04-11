import { RouterAgent } from './router.agent';

describe('RouterAgent', () => {
  let agent: RouterAgent;
  let mockLlm: { chat: jest.Mock };

  beforeEach(() => {
    mockLlm = { chat: jest.fn() };
    agent = new RouterAgent(mockLlm as any);
  });

  it('routes infrastructure issue to CODENSA', async () => {
    mockLlm.chat.mockResolvedValue(JSON.stringify({ entidad: 'CODENSA S.A.' }));

    const result = await agent.route('Alumbrado público dañado en Carrera 15');
    expect(result.entidad).toBe('CODENSA S.A.');
  });

  it('routes health issue to SDS', async () => {
    mockLlm.chat.mockResolvedValue(JSON.stringify({ entidad: 'SDS' }));

    const result = await agent.route('Mi EPS no me autoriza la cita');
    expect(result.entidad).toBe('SDS');
  });

  it('routes waste issue to UAESP', async () => {
    mockLlm.chat.mockResolvedValue(JSON.stringify({ entidad: 'UAESP' }));

    const result = await agent.route('Basuras acumuladas en mi barrio');
    expect(result.entidad).toBe('UAESP');
  });

  it('retries on invalid JSON', async () => {
    mockLlm.chat
      .mockResolvedValueOnce('nope')
      .mockResolvedValueOnce(JSON.stringify({ entidad: 'IDU' }));

    const result = await agent.route('Hueco en la vía');
    expect(result.entidad).toBe('IDU');
  });

  it('falls back to Alcaldia Local after retries', async () => {
    mockLlm.chat.mockResolvedValue('invalid-json');

    const result = await agent.route('Texto ambiguo');
    expect(result.entidad).toBe('Alcaldía Local');
  });

  it('falls back when JSON has no entidad key', async () => {
    mockLlm.chat.mockResolvedValue(JSON.stringify({ foo: 'bar' }));

    const result = await agent.route('Texto sin entidad');
    expect(result.entidad).toBe('Alcaldía Local');
  });
});
