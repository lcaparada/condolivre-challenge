import { Collection, Db, ObjectId, MongoServerError } from 'mongodb';
import type { LoanRepository } from '../../domain/repositories/loan.repository';
import { LoanEntity } from '../../domain/entities/loan.entity';
import { LoanDocument, toLoanEntity } from '../database/mongodb/models/loan.model';

export class MongoLoanRepository implements LoanRepository {
  private collection: Collection<LoanDocument>;

  constructor(db: Db) {
    this.collection = db.collection<LoanDocument>('loans');
  }

  async ensureIndexes(): Promise<void> {
    // Verifica índices existentes
    const existingIndexes = await this.collection.indexes();
    const indexNames = existingIndexes.map((idx) => idx.name);

    // Se existe índice antigo com nome conflitante, remove
    if (indexNames.includes('uf_amount_idx')) {
      const existingIndex = existingIndexes.find((idx) => idx.name === 'uf_amount_idx');
      // Verifica se a estrutura é diferente (amount vs amountInCents)
      if (existingIndex && existingIndex.key.amount !== undefined) {
        await this.collection.dropIndex('uf_amount_idx');
      }
    }

    try {
      await this.collection.createIndex(
        { uf: 1, amountInCents: 1 },
        { background: true, name: 'uf_amount_idx' }
      );
    } catch (error) {
      if (error instanceof MongoServerError && error.code !== 86) {
        throw error;
      }
    }

    try {
      await this.collection.createIndex({ createdAt: 1 }, { background: true });
    } catch (error) {
      if (error instanceof MongoServerError && error.code !== 86) {
        throw error;
      }
    }
  }

  async save(loan: LoanEntity): Promise<LoanEntity> {
    const doc: LoanDocument = {
      _id: new ObjectId(),
      amountInCents: loan.amountInCents,
      uf: loan.uf,
      createdAt: loan.createdAt,
    };

    await this.collection.insertOne(doc);

    return toLoanEntity(doc);
  }

  async getTotalAmount(): Promise<number> {
    const result = await this.collection
      .aggregate<{ total: number }>([
        {
          $group: {
            _id: null,
            total: { $sum: '$amountInCents' },
          },
        },
      ])
      .toArray();

    return result[0]?.total ?? 0;
  }

  async getAmountByState(): Promise<Record<string, number>> {
    const result = await this.collection
      .aggregate<{ _id: string; total: number }>([
        {
          $group: {
            _id: '$uf',
            total: { $sum: '$amountInCents' },
          },
        },
      ])
      .toArray();

    return result.reduce(
      (acc, item) => {
        acc[item._id] = item.total;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}
