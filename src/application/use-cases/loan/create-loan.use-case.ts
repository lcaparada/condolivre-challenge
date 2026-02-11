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
      amountInCents: input.amountInCents,
      uf: input.uf as UF,
    });

    const totalPortfolioAmount = await this.loanRepository.getTotalAmount();
    const amountByState = await this.loanRepository.getAmountByState();

    await this.concentrationRiskService.validateConcentration({
      totalPortfolioAmount,
      amountByState,
      newLoanAmount: loan.amountInCents,
      newLoanUf: loan.uf,
    });

    const savedLoan = await this.loanRepository.save(loan);

    return {
      id: savedLoan.id,
      amountInCents: savedLoan.amountInCents,
      uf: savedLoan.uf,
      createdAt: savedLoan.createdAt,
    };
  }
}
