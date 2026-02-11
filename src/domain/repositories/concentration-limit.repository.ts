import type { UF } from '../constants/brazilian-states';

export interface ConcentrationLimitRepository {
  getLimitForState(uf: UF): Promise<number | null>;
  getDefaultLimit(): Promise<number>;
}
