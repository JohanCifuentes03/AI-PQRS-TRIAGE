import { apiClient } from './api-client';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed JSON on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const result = await apiClient<{ ok: boolean }>('/test');
    expect(result.ok).toBe(true);
  });

  it('throws error on failed request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'boom' }),
    } as Response);

    await expect(apiClient('/test')).rejects.toThrow('boom');
  });

  it('falls back to status message when response json fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Response);

    await expect(apiClient('/test')).rejects.toThrow('Request failed');
  });
});
