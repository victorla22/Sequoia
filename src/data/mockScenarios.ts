import type { Scenario } from '../models/scenario.ts';

export const mockScenarios: Scenario[] = [
  {
    id: 'base-scenario',
    name: 'Escenari base',
    description:
      'Una projecció local de demostració amb ingressos, despeses i rendibilitat anuals constants.',
    startYear: 2026,
    horizonYears: 40,
    annualIncome: 82000,
    annualExpenses: 50000,
    annualExpenseInflation: 2.5,
    annualExpectedReturn: 5,
    fireTarget: 1200000,
    withdrawalRate: 3.5,
  },
];

export const baseScenario = mockScenarios[0];
