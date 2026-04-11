import { DeduplicatorAgent } from './deduplicator.agent';

describe('DeduplicatorAgent', () => {
  let agent: DeduplicatorAgent;
  let mockLlm: { generateEmbedding: jest.Mock };
  let mockPrisma: { $queryRaw: jest.Mock };

  beforeEach(() => {
    mockLlm = { generateEmbedding: jest.fn() };
    mockPrisma = { $queryRaw: jest.fn(), pqrs: { findMany: jest.fn() } } as any;
    agent = new DeduplicatorAgent(mockLlm as any, mockPrisma as any);
  });

  it('returns similar PQRS ids when similarity is high', async () => {
    const fakeVector = new Array(1536).fill(0.1);
    mockLlm.generateEmbedding.mockResolvedValue(fakeVector);
    mockPrisma.$queryRaw.mockResolvedValue([
      { id: 'uuid-1', similarity: 0.92 },
      { id: 'uuid-2', similarity: 0.85 },
    ]);

    const result = await agent.findDuplicates('Hay basuras en la calle 72');
    expect(result).toEqual(['uuid-1', 'uuid-2']);
    expect(mockLlm.generateEmbedding).toHaveBeenCalledWith('Hay basuras en la calle 72');
  });

  it('filters out results below threshold', async () => {
    const fakeVector = new Array(1536).fill(0.1);
    mockLlm.generateEmbedding.mockResolvedValue(fakeVector);
    mockPrisma.$queryRaw.mockResolvedValue([
      { id: 'uuid-1', similarity: 0.72 },
    ]);

    const result = await agent.findDuplicates('Texto poco similar');
    expect(result).toEqual([]);
  });

  it('returns empty array when no similar PQRS exist', async () => {
    mockLlm.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await agent.findDuplicates('Texto completamente nuevo');
    expect(result).toEqual([]);
  });

  it('returns empty array when embedding generation fails', async () => {
    mockLlm.generateEmbedding.mockRejectedValue(new Error('API error'));
    (mockPrisma as any).pqrs.findMany.mockResolvedValue([]);

    const result = await agent.findDuplicates('Texto que falla');
    expect(result).toEqual([]);
  });

  it('falls back to text contains search when embedding fails', async () => {
    mockLlm.generateEmbedding.mockRejectedValue(new Error('API error'));
    (mockPrisma as any).pqrs.findMany.mockResolvedValue([{ id: 'legacy-1' }]);

    const result = await agent.findDuplicates('basuras acumuladas en calle 72');
    expect(result).toEqual(['legacy-1']);
  });
});
