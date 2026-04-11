import { RiskDetectorAgent } from './risk-detector.agent';

describe('RiskDetectorAgent', () => {
  let agent: RiskDetectorAgent;
  let mockLlm: { chat: jest.Mock };

  beforeEach(() => {
    mockLlm = { chat: jest.fn() };
    agent = new RiskDetectorAgent(mockLlm as any);
  });

  it('detects Alta urgency for cables sueltos', async () => {
    mockLlm.chat.mockResolvedValue(
      JSON.stringify({ urgencia: 'Alta', riesgo: 'Riesgo vital - electrocución' }),
    );

    const result = await agent.detect('Hay cables sueltos colgando, los niños juegan cerca');
    expect(result.urgencia).toBe('Alta');
    expect(result.riesgo).toContain('electrocución');
  });

  it('detects Media urgency for noise complaint', async () => {
    mockLlm.chat.mockResolvedValue(
      JSON.stringify({ urgencia: 'Media', riesgo: 'Ninguno' }),
    );

    const result = await agent.detect('Ruido excesivo después de las 11 PM');
    expect(result.urgencia).toBe('Media');
  });

  it('defaults to Alta on ambiguous input', async () => {
    mockLlm.chat.mockResolvedValue(
      JSON.stringify({ urgencia: 'Alta', riesgo: 'Posible riesgo no determinado' }),
    );

    const result = await agent.detect('Algo peligroso está pasando pero no sé qué');
    expect(result.urgencia).toBe('Alta');
  });

  it('retries on invalid JSON', async () => {
    mockLlm.chat
      .mockResolvedValueOnce('bad')
      .mockResolvedValueOnce(JSON.stringify({ urgencia: 'Baja', riesgo: 'Ninguno' }));

    const result = await agent.detect('Solicito podar un árbol');
    expect(result.urgencia).toBe('Baja');
  });

  it('falls back to Alta when retries fail', async () => {
    mockLlm.chat.mockResolvedValue('invalid-json');

    const result = await agent.detect('texto ambiguo');
    expect(result.urgencia).toBe('Alta');
  });

  it('falls back to Alta when JSON misses fields', async () => {
    mockLlm.chat.mockResolvedValue(JSON.stringify({ urgencia: 'Media' }));

    const result = await agent.detect('sin riesgo');
    expect(result.urgencia).toBe('Alta');
  });
});
