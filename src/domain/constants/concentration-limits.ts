import type { UF } from './brazilian-states';

export const DEFAULT_STATE_LIMIT = 0.1;

export interface StateLimitConfig {
  uf: UF;
  limit: number;
}

export const STATE_LIMITS: StateLimitConfig[] = [{ uf: 'SP', limit: 0.2 }];
