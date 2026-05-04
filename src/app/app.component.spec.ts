import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { Validators } from '@angular/forms';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideAnimationsAsync(), provideEnvironmentNgxMask()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it(`should have as title 'LoanCalculator'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar span')?.textContent).toContain(
      'Tính Tiền Vay Hàng Tháng',
    );
  });

  describe('Calculation Logic', () => {
    let component: AppComponent;

    beforeEach(() => {
      const fixture = TestBed.createComponent(AppComponent);
      component = fixture.componentInstance;
    });

    it('should calculate Flat Rate correctly', () => {
      component.loanForm.patchValue({
        amount: 120000000,
        term: 12,
        method: 'flat-rate',
      });
      // Rate is 9.6% by default from constructor, let's set it to 12% for easier math
      component.rates.at(0).patchValue({ rate: 12 });

      component.calculate();

      const results = component.results();
      expect(results.length).toBe(12);

      // 120M * 12% / 12 = 1.2M interest per month
      // 120M / 12 = 10M principal per month
      expect(results[0].interest).toBe(1200000);
      expect(results[0].principal).toBe(10000000);
      expect(results[0].total).toBe(11200000);

      expect(component.totalInterest()).toBe(14400000);
      expect(component.totalPrincipal()).toBe(120000000);
      expect(component.totalPayable()).toBe(134400000);
    });

    it('should calculate Equal Principal correctly', () => {
      component.loanForm.patchValue({
        amount: 120000000,
        term: 12,
        method: 'equal-principal',
      });
      component.rates.at(0).patchValue({ rate: 12 });

      component.calculate();

      const results = component.results();
      // Month 1: Interest = 120M * 1% = 1.2M, Principal = 10M, Total = 11.2M
      expect(results[0].interest).toBe(1200000);
      expect(results[0].principal).toBe(10000000);

      // Month 2: Balance = 110M, Interest = 110M * 1% = 1.1M, Principal = 10M, Total = 11.1M
      expect(results[1].interest).toBe(1100000);
      expect(results[1].principal).toBe(10000000);

      expect(component.totalPrincipal()).toBe(120000000);
    });

    it('should calculate Flat Rate correctly with multiple interest rate periods', () => {
      component.loanForm.patchValue({
        amount: 100000000,
        term: 10,
        method: 'flat-rate',
      });
      // Clear initial rates
      while (component.rates.length > 0) {
        component.rates.removeAt(0);
      }
      // Add rate 1: months 1-5 @ 12%
      component.rates.push(
        component['fb'].group({
          fromMonth: [1, Validators.required],
          toMonth: component['fb'].control<number | null>(5),
          rate: [12, [Validators.required, Validators.min(0)]],
        }),
      );
      // Add rate 2: months 6-10 @ 24%
      component.rates.push(
        component['fb'].group({
          fromMonth: [6, Validators.required],
          toMonth: component['fb'].control<number | null>(null),
          rate: [24, [Validators.required, Validators.min(0)]],
        }),
      );

      component.calculate();

      const results = component.results();
      expect(results.length).toBe(10);

      // Months 1-5: Interest = 100M * 1% = 1M
      expect(results[0].interest).toBe(1000000);
      expect(results[4].interest).toBe(1000000);

      // Months 6-10: Interest = 100M * 2% = 2M
      expect(results[5].interest).toBe(2000000);
      expect(results[9].interest).toBe(2000000);

      expect(component.totalInterest()).toBe(5 * 1000000 + 5 * 2000000); // 15M
      expect(component.totalPayable()).toBe(115000000);
    });
  });
});
