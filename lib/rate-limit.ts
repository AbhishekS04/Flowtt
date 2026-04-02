interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

export const RATE_LIMITS = {
  default: { windowMs: 60 * 1000, maxRequests: 30 },
  strict: { windowMs: 60 * 1000, maxRequests: 10 },
  push: { windowMs: 60 * 1000, maxRequests: 5 },
  transactions: { windowMs: 60 * 1000, maxRequests: 60 },
} as const;

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

export function getClientIdentifier(userId: string | null, ip: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${ip}`;
}

export function getRateLimitHeaders(remaining: number, resetIn: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': remaining.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': Math.ceil((Date.now() + resetIn) / 1000).toString(),
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);
