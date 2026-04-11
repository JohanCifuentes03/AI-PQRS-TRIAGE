import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type Counter = { count: number; resetAt: number };

const store = new Map<string, Counter>();

@Injectable()
export class SimpleRateLimitGuard implements CanActivate {
  private readonly windowMs = 60_000;
  private readonly limit = 30;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.ip || 'unknown';
    const now = Date.now();

    const current = store.get(key);
    if (!current || current.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (current.count >= this.limit) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
    store.set(key, current);
    return true;
  }
}
