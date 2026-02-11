import { Collection, Db } from 'mongodb';
import type { ConcentrationLimitRepository } from '../../domain/repositories/concentration-limit.repository';
import type { UF } from '../../domain/constants/brazilian-states';
import { ConcentrationLimitDocument } from '../database/mongodb/models/concentration-limit.model';

export class MongoConcentrationLimitRepository implements ConcentrationLimitRepository {
  private collection: Collection<ConcentrationLimitDocument>;
  private cache: Map<string, number> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(db: Db) {
    this.collection = db.collection<ConcentrationLimitDocument>('concentration_limits');
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ uf: 1 }, { unique: true, background: true });
  }

  private async refreshCache(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp < this.CACHE_TTL_MS && this.cache.size > 0) {
      return;
    }

    const limits = await this.collection.find({}).toArray();
    this.cache.clear();

    for (const limit of limits) {
      const key = limit.uf ?? 'DEFAULT';
      this.cache.set(key, limit.limit);
    }

    this.cacheTimestamp = now;
  }

  async getLimitForState(uf: UF): Promise<number | null> {
    await this.refreshCache();
    return this.cache.get(uf.toUpperCase()) ?? null;
  }

  async getDefaultLimit(): Promise<number> {
    await this.refreshCache();
    return this.cache.get('DEFAULT') ?? 0.1;
  }
}
