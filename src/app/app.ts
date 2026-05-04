import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import * as XLSX from 'xlsx';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

interface InterestRatePeriod {
  fromMonth: number;
  toMonth: number | null;
  rate: number;
}

interface RateForm {
  fromMonth: FormControl<number>;
  toMonth: FormControl<number | null>;
  rate: FormControl<number>;
}

interface LoanForm {
  amount: FormControl<number>;
  term: FormControl<number>;
  method: FormControl<string>;
  rates: FormArray<FormGroup<RateForm>>;
}

interface CalculationRow {
  month: number;
  openingBalance: number;
  interest: number;
  principal: number;
  total: number;
  closingBalance: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  providers: [CurrencyPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private fb = inject(FormBuilder).nonNullable;

  loanForm: FormGroup<LoanForm>;
  results = signal<CalculationRow[]>([]);
  displayedColumns: string[] = [
    'month',
    'openingBalance',
    'interest',
    'principal',
    'total',
    'closingBalance',
  ];

  totalPrincipal = computed(() => this.results().reduce((acc, row) => acc + row.principal, 0));
  totalInterest = computed(() => this.results().reduce((acc, row) => acc + row.interest, 0));
  totalPayable = computed(() => this.results().reduce((acc, row) => acc + row.total, 0));

  constructor() {
    this.loanForm = this.fb.group({
      amount: [100000000, [Validators.required, Validators.min(1000000)]],
      term: [12, [Validators.required, Validators.min(1)]],
      method: ['annuity', Validators.required],
      rates: this.fb.array([
        this.fb.group({
          fromMonth: [1, Validators.required],
          toMonth: this.fb.control<number | null>(null),
          rate: [9.6, [Validators.required, Validators.min(0)]],
        }),
      ]),
    });
  }

  get rates() {
    return this.loanForm.controls.rates;
  }

  addRate() {
    const lastGroup = this.rates.at(this.rates.length - 1);
    const lastTo = lastGroup.controls.toMonth.value;
    const nextFrom = lastTo ? lastTo + 1 : 1;

    this.rates.push(
      this.fb.group({
        fromMonth: [nextFrom, Validators.required],
        toMonth: this.fb.control<number | null>(null),
        rate: [10.4, [Validators.required, Validators.min(0)]],
      }),
    );
  }

  removeRate(index: number) {
    this.rates.removeAt(index);
  }

  calculate() {
    const formValue = this.loanForm.getRawValue();
    const principalTotal = formValue.amount;
    const term = formValue.term;
    const method = formValue.method;
    const ratePeriods: InterestRatePeriod[] = formValue.rates;

    const schedule: CalculationRow[] = [];
    let remainingBalance = principalTotal;

    for (let m = 1; m <= term; m++) {
      const period =
        ratePeriods.find((p) => m >= p.fromMonth && (!p.toMonth || m <= p.toMonth)) ||
        ratePeriods[ratePeriods.length - 1];
      const monthlyRate = period.rate / 100 / 12;

      let interest = remainingBalance * monthlyRate;
      let principal: number;
      let total: number;

      if (method === 'equal-principal') {
        principal = principalTotal / term;
      } else if (method === 'flat-rate') {
        interest = principalTotal * monthlyRate;
        principal = principalTotal / term;
      } else {
        const remainingTerm = term - m + 1;
        if (monthlyRate > 0) {
          total =
            (remainingBalance * monthlyRate * Math.pow(1 + monthlyRate, remainingTerm)) /
            (Math.pow(1 + monthlyRate, remainingTerm) - 1);
        } else {
          total = remainingBalance / remainingTerm;
        }
        principal = total - interest;
      }

      const roundedInterest = Math.round(interest);
      const roundedPrincipal = m === term ? remainingBalance : Math.round(principal);
      const roundedTotal = roundedInterest + roundedPrincipal;

      const openingBalance = remainingBalance;
      remainingBalance -= roundedPrincipal;

      schedule.push({
        month: m,
        openingBalance,
        interest: roundedInterest,
        principal: roundedPrincipal,
        total: roundedTotal,
        closingBalance: Math.max(0, remainingBalance),
      });
    }

    this.results.set(schedule);
  }

  exportToExcel() {
    const formValue = this.loanForm.getRawValue();
    const ratePeriods: InterestRatePeriod[] = formValue.rates;
    const methodName =
      formValue.method === 'annuity'
        ? 'Trả góp đều (Annuity)'
        : formValue.method === 'equal-principal'
          ? 'Gốc đều, lãi giảm dần'
          : 'Lãi phẳng (Flat rate)';

    const data: Record<string, string | number | null>[] = this.results().map((row) => {
      const period =
        ratePeriods.find(
          (p) => row.month >= p.fromMonth && (!p.toMonth || row.month <= p.toMonth),
        ) || ratePeriods[ratePeriods.length - 1];
      return {
        'Tháng thứ': row.month,
        'Dư nợ đầu kỳ': row.openingBalance,
        'Lãi suất (%)': period.rate,
        'Lãi tháng đó': row.interest,
        'Gốc trả': row.principal,
        'Tổng phải trả': row.total,
        'Dư nợ cuối kỳ': row.closingBalance,
        'Phương thức trả': methodName,
      };
    });

    data.push({
      'Tháng thứ': 'TỔNG CỘNG',
      'Dư nợ đầu kỳ': null,
      'Lãi suất (%)': null,
      'Lãi tháng đó': this.totalInterest(),
      'Gốc trả': this.totalPrincipal(),
      'Tổng phải trả': this.totalPayable(),
      'Dư nợ cuối kỳ': null,
      'Phương thức trả': null,
    });

    const worksheetData = [
      ['THÔNG TIN KHOẢN VAY'],
      ['Số tiền vay:', formValue.amount],
      ['Thời hạn vay:', formValue.term + ' tháng'],
      ['Phương thức trả:', methodName],
      ['Tổng lãi phải trả:', this.totalInterest()],
      ['Tổng số tiền phải trả:', this.totalPayable()],
      [], // Empty row
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A8' });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch trả nợ');

    XLSX.writeFile(workbook, `Bang_Tinh_Vay_${new Date().getTime()}.xlsx`);
  }
}
