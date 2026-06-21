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
    if (!account.active) {
      return total;
    }

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
  let expenses = scenario.annualExpenses;
  let fireYear: number | null = null;

  for (let index = 0; index < scenario.horizonYears; index += 1) {
    const year = scenario.startYear + index;
    const income = scenario.annualIncome;
    const annualSavings = income - expenses;
    const endingNetWorth =
      previousNetWorth * (1 + scenario.annualExpectedReturn / 100) + annualSavings;
    const fireReached = endingNetWorth >= scenario.fireTarget;

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
    expenses *= 1 + scenario.annualExpenseInflation / 100;
  }

  return {
    initialNetWorth,
    fireYear,
    finalNetWorth: rows.at(-1)?.endingNetWorth ?? initialNetWorth,
    rows,
  };
}
