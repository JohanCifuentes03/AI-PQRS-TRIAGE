import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('calls $connect on module init', async () => {
    const service = new PrismaService();
    const connectSpy = jest
      .spyOn(service, '$connect')
      .mockImplementation(async () => undefined as never);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    connectSpy.mockRestore();
  });
});
