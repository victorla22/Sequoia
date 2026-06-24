import type { Account } from '../models/account.ts';
import type { Scenario } from '../models/scenario.ts';

export type SimulatedAccountYear = {
  year: number;
  startingBalance: number;
  endingBalance: number;
  approximateCumulativeReturn: number;
};

export type SimulatedAccount = {
  id: string;
  name: string;
  type: Account['type'];
  initialBalance: number;
  finalBalance: number;
  approximateCumulativeReturn: number;
  includedInFireNetWorth: boolean;
  hasNegativeBalance: boolean;
  rows: SimulatedAccountYear[];
};

export type AnnualSimulationRow = {
  year: number;
  income: number;
  expenses: number;
  annualSavings: number;
  endingNetWorth: number;
  endingFireNetWorth: number;
  fireReached: boolean;
};

export type SimulationResult = {
  initialNetWorth: number;
  initialFireNetWorth: number;
  fireYear: number | null;
  finalNetWorth: number;
  finalFireNetWorth: number;
  rows: AnnualSimulationRow[];
  accounts: SimulatedAccount[];
  hasNegativeBalance: boolean;
};

function safeNumber(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function isIncludedInFireNetWorth(account: Account) {
  return account.active && account.type !== 'debt' && account.includeInFireNetWorth !== false;
}

export function calculateInitialNetWorth(accounts: Account[]) {
  return accounts.reduce((total, account) => {
    if (!account.active) {
      return total;
    }

    const balance = safeNumber(account.balance);

    if (account.type === 'debt') {
      return total - balance;
    }

    return total + balance;
  }, 0);
}

export function calculateInitialFireNetWorth(accounts: Account[]) {
  return accounts.reduce((total, account) => {
    if (!isIncludedInFireNetWorth(account)) {
      return total;
    }

    return total + safeNumber(account.balance);
  }, 0);
}

export function runAnnualSimulation(
  accounts: Account[],
  scenario: Scenario,
): SimulationResult {
  const activeAccounts = accounts.filter((account) => account.active);
  const simulatedAccounts: SimulatedAccount[] = activeAccounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    initialBalance: safeNumber(account.balance),
    finalBalance: safeNumber(account.balance),
    approximateCumulativeReturn: 0,
    includedInFireNetWorth: isIncludedInFireNetWorth(account),
    hasNegativeBalance: safeNumber(account.balance) < 0,
    rows: [],
  }));
  const initialNetWorth = calculateInitialNetWorth(activeAccounts);
  const initialFireNetWorth = calculateInitialFireNetWorth(activeAccounts);
  const rows: AnnualSimulationRow[] = [];
  let fireYear: number | null = null;
  const horizonYears = Math.max(0, Math.floor(scenario.horizonYears || 0));
  const startYear = Number.isFinite(scenario.startYear) ? scenario.startYear : new Date().getFullYear();
  const annualIncome = safeNumber(scenario.annualIncome);
  let annualExpenses = safeNumber(scenario.annualExpenses);
  const annualExpenseInflation = safeNumber(scenario.annualExpenseInflation);
  const fireTarget = safeNumber(scenario.fireTarget);
  const monthlyIncome = annualIncome / 12;
  let monthlyExpenses = annualExpenses / 12;
  const cashflowAccountIndex = simulatedAccounts.findIndex((account) => account.type === 'current') >= 0
    ? simulatedAccounts.findIndex((account) => account.type === 'current')
    : simulatedAccounts.findIndex((account) => account.type !== 'debt');

  for (let yearIndex = 0; yearIndex < horizonYears; yearIndex += 1) {
    const year = startYear + yearIndex;
    const yearStartingBalances = simulatedAccounts.map((account) => account.finalBalance);

    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      simulatedAccounts.forEach((account, accountIndex) => {
        if (account.type === 'debt') {
          return;
        }

        const sourceAccount = activeAccounts[accountIndex];
        const annualReturn = safeNumber(sourceAccount?.annualReturn);
        const monthlyReturn = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
        account.finalBalance *= Number.isFinite(monthlyReturn) ? 1 + monthlyReturn : 1;
      });

      // Temporary simple cashflow rule: until transfers/allocation rules exist,
      // add the net monthly cashflow to the first active non-debt account,
      // preferring a current account when available.
      if (cashflowAccountIndex >= 0) {
        simulatedAccounts[cashflowAccountIndex].finalBalance += monthlyIncome - monthlyExpenses;
      }

      simulatedAccounts.forEach((account) => {
        if (account.finalBalance < 0) {
          account.hasNegativeBalance = true;
        }
      });
    }

    const endingNetWorth = simulatedAccounts.reduce((total, account) => {
      if (account.type === 'debt') {
        return total - account.finalBalance;
      }

      return total + account.finalBalance;
    }, 0);
    const endingFireNetWorth = simulatedAccounts.reduce((total, account) => {
      if (!account.includedInFireNetWorth) {
        return total;
      }

      return total + account.finalBalance;
    }, 0);
    const fireReached = endingFireNetWorth >= fireTarget;

    if (fireReached && fireYear === null) {
      fireYear = year;
    }

    simulatedAccounts.forEach((account, accountIndex) => {
      const startingBalance = yearStartingBalances[accountIndex] ?? 0;
      const endingBalance = account.finalBalance;
      const approximateCumulativeReturn = account.initialBalance === 0
        ? 0
        : ((endingBalance - account.initialBalance) / Math.abs(account.initialBalance)) * 100;

      account.approximateCumulativeReturn = approximateCumulativeReturn;
      account.rows.push({
        year,
        startingBalance,
        endingBalance,
        approximateCumulativeReturn,
      });
    });

    rows.push({
      year,
      income: annualIncome,
      expenses: annualExpenses,
      annualSavings: annualIncome - annualExpenses,
      endingNetWorth,
      endingFireNetWorth,
      fireReached,
    });

    annualExpenses *= 1 + annualExpenseInflation / 100;
    monthlyExpenses = annualExpenses / 12;
  }

  return {
    initialNetWorth,
    initialFireNetWorth,
    fireYear,
    finalNetWorth: rows.at(-1)?.endingNetWorth ?? initialNetWorth,
    finalFireNetWorth: rows.at(-1)?.endingFireNetWorth ?? initialFireNetWorth,
    rows,
    accounts: simulatedAccounts,
    hasNegativeBalance: simulatedAccounts.some((account) => account.hasNegativeBalance),
  };
}
