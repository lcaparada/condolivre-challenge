import { assertValidUF, type UF } from '../constants/brazilian-states';
import { InvalidAmountError } from '../errors';
import { Entity } from './entity';

export interface LoanEntityProps {
  amount: number;
  uf: UF;
}

export class LoanEntity extends Entity<LoanEntityProps> {
  constructor(props: LoanEntityProps, id?: string) {
    LoanEntity.validate(props);
    super(
      {
        ...props,
        uf: props.uf.toUpperCase() as UF,
      },
      id
    );
  }

  static validate(props: LoanEntityProps) {
    assertValidUF(props.uf);
    if (props.amount <= 0) {
      throw new InvalidAmountError(props.amount);
    }
  }

  get amount() {
    return this.props.amount;
  }

  get uf() {
    return this.props.uf;
  }
}
