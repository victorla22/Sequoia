import type { Account } from '../models/account.ts';
import type { Scenario } from '../models/scenario.ts';

export type AnnualSimulationRow = {
  year: number;
  income: number;
  expenses: number;
  annualSavings: number;
  endingNetWorth: number;
  fireReached: boolean;
};

export type SimulationResult = {
  initialNetWorth: number;
  fireYear: number | null;
  finalNetWorth: number;
  rows: AnnualSimulationRow[];
};

export function calculateInitialNetWorth(accounts: Account[]) {
  return accounts.reduce((total, account) => {
    if (account.type === 'debt') {
      return total - account.balance;
    }

    return total + account.balance;
  }, 0);
}

export function runAnnualSimulation(
  accounts: Account[],
  scenario: Scenario,
): SimulationResult {
  const initialNetWorth = calculateInitialNetWorth(accounts);
  const rows: AnnualSimulationRow[] = [];
  let previousNetWorth = initialNetWorth;
  let expenses = Number.isFinite(scenario.annualExpenses) ? scenario.annualExpenses : 0;
  let fireYear: number | null = null;
  const horizonYears = Math.max(0, Math.floor(scenario.horizonYears || 0));
  const startYear = Number.isFinite(scenario.startYear) ? scenario.startYear : new Date().getFullYear();
  const annualIncome = Number.isFinite(scenario.annualIncome) ? scenario.annualIncome : 0;
  const annualExpectedReturn = Number.isFinite(scenario.annualExpectedReturn)
    ? scenario.annualExpectedReturn
    : 0;
  const annualExpenseInflation = Number.isFinite(scenario.annualExpenseInflation)
    ? scenario.annualExpenseInflation
    : 0;
  const fireTarget = Number.isFinite(scenario.fireTarget) ? scenario.fireTarget : 0;

  for (let index = 0; index < horizonYears; index += 1) {
    const year = startYear + index;
    const income = annualIncome;
    const annualSavings = income - expenses;
    const endingNetWorth =
      previousNetWorth * (1 + annualExpectedReturn / 100) + annualSavings;
    const fireReached = endingNetWorth >= fireTarget;

    if (fireReached && fireYear === null) {
      fireYear = year;
    }

    rows.push({
      year,
      income,
      expenses,
      annualSavings,
      endingNetWorth,
      fireReached,
    });

    previousNetWorth = endingNetWorth;
    expenses *= 1 + annualExpenseInflation / 100;
  }

  return {
    initialNetWorth,
    fireYear,
    finalNetWorth: rows.at(-1)?.endingNetWorth ?? initialNetWorth,
    rows,
  };
}
