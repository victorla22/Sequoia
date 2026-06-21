export type Scenario = {
  id: string;
  name: string;
  description: string;
  startYear: number;
  horizonYears: number;
  fireTarget: number;
  withdrawalRate: number;
  annualIncome: number;
  annualExpenses: number;
  annualExpenseInflation: number;
  annualExpectedReturn: number;
};
