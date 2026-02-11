import { Collection, Db, ObjectId } from 'mongodb';
import type { LoanRepository } from '../../domain/repositories/loan.repository';
import { LoanEntity } from '../../domain/entities/loan.entity';
import { LoanDocument, toLoanEntity } from '../database/mongodb/models/loan.model';

export class MongoLoanRepository implements LoanRepository {
  private collection: Collection<LoanDocument>;

  constructor(db: Db) {
    this.collection = db.collection<LoanDocument>('loans');
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { uf: 1, amountInCents: 1 },
      { background: true, name: 'uf_amount_idx' }
    );

    await this.collection.createIndex({ createdAt: 1 }, { background: true });
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
