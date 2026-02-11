import { ObjectId } from 'mongodb';
import { LoanEntity } from '../../../../domain/entities/loan.entity';
import { UF } from '../../../../domain/constants/brazilian-states';

export interface LoanDocument {
  _id: ObjectId;
  amountInCents: number;
  uf: string;
  createdAt: Date;
}

export function toLoanEntity(doc: LoanDocument): LoanEntity {
  return new LoanEntity(
    {
      amountInCents: doc.amountInCents,
      uf: doc.uf as UF,
      createdAt: doc.createdAt,
    },
    doc._id.toString()
  );
}
