import { assertValidUF, UF } from '../constants/brazilian-states';
import { InvalidAmountError } from '../errors/invalid-amount.error';
import { Entity } from './entity';

export interface LoanEntityProps {
  amountInCents: number;
  uf: UF;
  createdAt?: Date;
}

export class LoanEntity extends Entity<LoanEntityProps> {
  constructor(props: LoanEntityProps, id?: string) {
    LoanEntity.validate(props);
    super(
      {
        ...props,
        uf: props.uf.toUpperCase() as UF,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );
  }

  static validate(props: LoanEntityProps) {
    assertValidUF(props.uf);
    if (props.amountInCents <= 0) {
      throw new InvalidAmountError(props.amountInCents);
    }
    if (!Number.isInteger(props.amountInCents)) {
      throw new InvalidAmountError(props.amountInCents);
    }
  }

  get amountInCents() {
    return this.props.amountInCents;
  }

  get uf() {
    return this.props.uf;
  }

  get createdAt() {
    return this.props.createdAt!;
  }
}
