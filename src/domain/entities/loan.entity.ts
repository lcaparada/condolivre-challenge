import { assertValidUF, type UF } from '../constants/brazilian-states';
import { Entity } from './entity';

export interface LoanEntityProps {
  amount: number;
  uf: UF;
}

export class LoanEntity extends Entity<LoanEntityProps> {
  constructor(props: LoanEntityProps, id?: string) {
    assertValidUF(props.uf);
    super(
      {
        ...props,
        uf: props.uf.toUpperCase() as UF,
      },
      id
    );
  }

  get amount() {
    return this.props.amount;
  }

  get uf() {
    return this.props.uf;
  }
}
