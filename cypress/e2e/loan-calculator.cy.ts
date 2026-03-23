describe('Loan Calculator E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should calculate loan results correctly', () => {
    // Fill in the form
    cy.get('input[formControlName="amount"]').clear().type('120000000');
    cy.get('input[formControlName="term"]').clear().type('12');
    cy.get('mat-select[formControlName="method"]').click();
    cy.get('mat-option').contains('Trả gốc đều, lãi giảm dần').click();

    // Submit form
    cy.get('button[type="submit"]').click();

    // Check results are displayed
    cy.get('.results-container').should('be.visible');
    cy.get('.summary-cards').should('contain', '120.000.000'); // Check total principal
    
    // Check table
    cy.get('table').should('exist');
    cy.get('table tbody tr').should('have.length', 12);
  });

  it('should allow adding rate periods', () => {
    cy.get('.rate-row').should('have.length', 1);
    cy.get('button').contains('Thêm lãi suất điều chỉnh').click();
    cy.get('.rate-row').should('have.length', 2);
    
    // Check remove button
    cy.get('.rate-row').last().find('button[color="warn"]').click();
    cy.get('.rate-row').should('have.length', 1);
  });
});
