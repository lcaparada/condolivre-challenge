import { ObjectId } from 'mongodb';
import type { UF } from '../../../../domain/constants/brazilian-states';

export interface ConcentrationLimitDocument {
  _id: ObjectId;
  uf: string | null;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConcentrationLimitConfig {
  uf: UF | null;
  limit: number;
}

export function toConcentrationLimitConfig(
  doc: ConcentrationLimitDocument
): ConcentrationLimitConfig {
  return {
    uf: doc.uf as UF | null,
    limit: doc.limit,
  };
}
