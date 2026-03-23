# GEMINI.md

This file contains foundational mandates for the **Loan Calculator** project. These instructions take absolute precedence over general workflows and tool defaults.

## Project Context
- **Framework:** Angular 21.x (Standalone components preferred)
- **Primary Domain:** Financial calculations (Loans, amortization, etc.)
- **Key Dependencies:** 
  - `ngx-mask` for input formatting.
  - `xlsx` for Excel generation.
  - `ReactiveFormsModule` for form handling.
  - `@angular/material` for UI components.
  - **Linting:** ESLint with `typescript-eslint` and `angular-eslint`.
  - **Unit Testing:** Vitest with official Angular builder.
  - **E2E Testing:** Cypress with `@cypress/schematic`.

## Engineering Standards

### Architecture & Components
- **Standalone First:** All new components, directives, and pipes MUST be `standalone: true`.
- **External Files:** Do NOT inline HTML templates or SCSS styles. Use `templateUrl` and `styleUrl`.
- **Logic Separation:** Keep complex financial calculations in dedicated services or utility functions (pure functions where possible) rather than in component logic.
- **Type Safety:** Rigorously use TypeScript interfaces for loan models, calculation results, and configuration objects. Avoid `any`.
- **Template Syntax:** Use Angular's built-in control flow syntax (`@if`, `@for`, `@switch`) instead of structural directives (`*ngIf`, `*ngFor`).

### Styling & UI
- **Angular Material:** Use Angular Material components for all UI elements (Inputs, Buttons, Cards, Tables, etc.).
- **SCSS:** Use SCSS (`.scss`) for all styling. The project is configured to default to SCSS for components.
- **Responsive Design:** Ensure calculations and tables are readable on mobile and desktop.
- **Feedback:** Provide immediate visual feedback for validation errors and calculation updates using `mat-error` and material feedback patterns.

### Testing & Quality
- **Unit Tests:** Use **Vitest**. Prioritize testing for calculation logic.
- **E2E Tests:** Use **Cypress** for critical user flows. All E2E tests MUST pass before deployment.
- **Linting:** Use **ESLint**. Ensure all new code passes linting without warnings.
- **Form Validation:** Ensure all financial inputs have robust validation (e.g., non-negative, required fields).

### Tooling
- **Prettier:** Follow the project's `.prettierrc` configuration for all file changes.
- **Angular CLI:** Use `ng` commands for generating boilerplate to maintain consistency.
