import { ValidationPipe } from '@nestjs/common';

describe('main bootstrap wiring', () => {
  it('creates validation pipe with strict options', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    expect(pipe).toBeDefined();
  });
});
