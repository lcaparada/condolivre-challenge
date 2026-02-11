import { UF } from '@/domain/constants/brazilian-states';
import { LoanEntity } from '@/domain/entities/loan.entity';
import { CreateLoanInput, CreateLoanOutput } from '../../dtos/create-loan.dto';
import { LoanRepository } from '@/domain/repositories/loan.repository';
import { ConcentrationRiskService } from '@/domain/services/concentration-risk.service';

export class CreateLoanUseCase {
  constructor(
    private loanRepository: LoanRepository,
    private concentrationRiskService: ConcentrationRiskService
  ) {}

  async execute(input: CreateLoanInput): Promise<CreateLoanOutput> {
    const loan = new LoanEntity({
      amount: input.amount,
      uf: input.uf as UF,
    });

    const totalPortfolioAmount = await this.loanRepository.getTotalAmount();
    const amountByState = await this.loanRepository.getAmountByState();

    await this.concentrationRiskService.validateConcentration({
      totalPortfolioAmount,
      amountByState,
      newLoanAmount: loan.amount,
      newLoanUf: loan.uf,
    });

    const savedLoan = await this.loanRepository.save(loan);

    return {
      id: savedLoan.id,
      amount: savedLoan.amount,
      uf: savedLoan.uf,
    };
  }
}
