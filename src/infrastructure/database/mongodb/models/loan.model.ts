import { ObjectId } from 'mongodb';
import { LoanEntity } from '../../../../domain/entities/loan.entity';
import { UF } from '../../../../domain/constants/brazilian-states';

export interface LoanDocument {
  _id: ObjectId;
  amount: number;
  uf: string;
}

export function toLoanEntity(doc: LoanDocument): LoanEntity {
  return new LoanEntity({ amount: doc.amount, uf: doc.uf as UF }, doc._id.toString());
}
