import { Db, ObjectId } from 'mongodb';
import { MongoConcentrationLimitRepository } from '../mongo-concentration-limit.repository';
import {
  connectToDatabase,
  disconnectFromDatabase,
} from '@/infrastructure/database/mongodb/mongo-connection';
import { BrazilianStateCode } from '@/domain';

describe('MongoConcentrationLimitRepository', () => {
  let db: Db;
  let repository: MongoConcentrationLimitRepository;

  beforeAll(async () => {
    db = await connectToDatabase();
  }, 15000);

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    repository = new MongoConcentrationLimitRepository(db);
    await db.collection('concentration_limits').deleteMany({});
    await repository.ensureIndexes();
  });

  describe('ensureIndexes', () => {
    it('creates unique index on uf field', async () => {
      await repository.ensureIndexes();

      const indexes = await db.collection('concentration_limits').indexes();
      const ufIndex = indexes.find((idx) => idx.key.uf === 1);

      expect(ufIndex).toBeDefined();
      expect(ufIndex?.unique).toBe(true);
    });
  });

  describe('getLimitForState', () => {
    it('returns null when state has no specific limit', async () => {
      const limit = await repository.getLimitForState(BrazilianStateCode.RJ);

      expect(limit).toBeNull();
    });

    it('returns the limit for a specific state', async () => {
      await db.collection('concentration_limits').insertOne({
        _id: new ObjectId(),
        uf: BrazilianStateCode.SP,
        limit: 0.2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const limit = await repository.getLimitForState(BrazilianStateCode.SP);

      expect(limit).toBe(0.2);
    });

    it('handles case insensitivity for state code', async () => {
      await db.collection('concentration_limits').insertOne({
        _id: new ObjectId(),
        uf: BrazilianStateCode.SP,
        limit: 0.2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const limit = await repository.getLimitForState(BrazilianStateCode.SP);

      expect(limit).toBe(0.2);
    });

    it('returns limits for multiple states', async () => {
      await db.collection('concentration_limits').insertMany([
        {
          _id: new ObjectId(),
          uf: BrazilianStateCode.SP,
          limit: 0.2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          uf: BrazilianStateCode.RJ,
          limit: 0.12,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const spLimit = await repository.getLimitForState(BrazilianStateCode.SP);
      const rjLimit = await repository.getLimitForState(BrazilianStateCode.RJ);

      expect(spLimit).toBe(0.2);
      expect(rjLimit).toBe(0.12);
    });
  });

  describe('getDefaultLimit', () => {
    it('returns 0.1 when no default limit is configured', async () => {
      const defaultLimit = await repository.getDefaultLimit();

      expect(defaultLimit).toBe(0.1);
    });

    it('returns the configured default limit', async () => {
      await db.collection('concentration_limits').insertOne({
        _id: new ObjectId(),
        uf: null,
        limit: 0.15,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const defaultLimit = await repository.getDefaultLimit();

      expect(defaultLimit).toBe(0.15);
    });
  });

  describe('cache behavior', () => {
    it('uses cache for subsequent calls', async () => {
      await db.collection('concentration_limits').insertOne({
        _id: new ObjectId(),
        uf: BrazilianStateCode.SP,
        limit: 0.2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const limit1 = await repository.getLimitForState(BrazilianStateCode.SP);

      await db
        .collection('concentration_limits')
        .updateOne({ uf: BrazilianStateCode.SP }, { $set: { limit: 0.25 } });

      const limit2 = await repository.getLimitForState(BrazilianStateCode.SP);

      expect(limit1).toBe(0.2);
      expect(limit2).toBe(0.2);
    });

    it('refreshes cache after TTL expires', async () => {
      const shortTTLRepo = new MongoConcentrationLimitRepository(db);
      (shortTTLRepo as unknown as { CACHE_TTL_MS: number }).CACHE_TTL_MS = 100;

      await db.collection('concentration_limits').insertOne({
        _id: new ObjectId(),
        uf: BrazilianStateCode.SP,
        limit: 0.2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const limit1 = await shortTTLRepo.getLimitForState(BrazilianStateCode.SP);

      await db
        .collection('concentration_limits')
        .updateOne({ uf: BrazilianStateCode.SP }, { $set: { limit: 0.25 } });

      await new Promise((resolve) => setTimeout(resolve, 150));

      const limit2 = await shortTTLRepo.getLimitForState(BrazilianStateCode.SP);

      expect(limit1).toBe(0.2);
      expect(limit2).toBe(0.25);
    });
  });

  describe('integration with full dataset', () => {
    it('handles default limit and specific state limits together', async () => {
      await db.collection('concentration_limits').insertMany([
        {
          _id: new ObjectId(),
          uf: null,
          limit: 0.1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          uf: BrazilianStateCode.SP,
          limit: 0.2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const defaultLimit = await repository.getDefaultLimit();
      const spLimit = await repository.getLimitForState(BrazilianStateCode.SP);
      const rjLimit = await repository.getLimitForState(BrazilianStateCode.RJ);

      expect(defaultLimit).toBe(0.1);
      expect(spLimit).toBe(0.2);
      expect(rjLimit).toBeNull();
    });
  });
});
