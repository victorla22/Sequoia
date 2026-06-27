import type { Account } from '../models/account.ts';
import type { FutureRule } from '../models/futureRule.ts';
import type { Scenario } from '../models/scenario.ts';
import type { Transfer } from '../models/transfer.ts';

export type SimulatedAccountYear = { year: number; startingBalance: number; endingBalance: number; approximateCumulativeReturn: number };
export type SimulatedAccount = { id: string; name: string; type: Account['type']; initialBalance: number; finalBalance: number; approximateCumulativeReturn: number; incomingTransfers: number; outgoingTransfers: number; includedInFireNetWorth: boolean; hasNegativeBalance: boolean; rows: SimulatedAccountYear[] };
export type AnnualSimulationRow = { year: number; income: number; expenses: number; annualSavings: number; endingNetWorth: number; endingFireNetWorth: number; fireReached: boolean };
export type SimulationResult = { initialNetWorth: number; initialFireNetWorth: number; fireYear: number | null; finalNetWorth: number; finalFireNetWorth: number; rows: AnnualSimulationRow[]; accounts: SimulatedAccount[]; hasNegativeBalance: boolean; warnings: string[] };

type MutableSimulatedAccount = SimulatedAccount & { activeInSimulation: boolean; annualReturn: number };

function safeNumber(value: number | undefined) { return Number.isFinite(value) ? Number(value) : 0; }
function getMonthIndex(year: number, month: number, scenarioStartYear: number) {
  return (year - scenarioStartYear) * 12 + month;
}
function isRuleOneOffInMonth(rule: FutureRule, year: number, month: number) { return rule.startYear === year && rule.startMonth === month; }
function isRuleActiveInMonth(rule: FutureRule, year: number, month: number, scenarioStartYear: number) {
  const current = getMonthIndex(year, month, scenarioStartYear);
  const start = getMonthIndex(rule.startYear, rule.startMonth, scenarioStartYear);
  const end = rule.endYear && rule.endMonth ? getMonthIndex(rule.endYear, rule.endMonth, scenarioStartYear) : Number.POSITIVE_INFINITY;
  return current >= start && current <= end;
}

export function isIncludedInFireNetWorth(account: Pick<Account, 'active' | 'type' | 'includeInFireNetWorth'>) { return account.active && account.type !== 'debt' && account.includeInFireNetWorth !== false; }
export function calculateInitialNetWorth(accounts: Account[]) { return accounts.reduce((total, account) => !account.active ? total : total + (account.type === 'debt' ? -safeNumber(account.balance) : safeNumber(account.balance)), 0); }
export function calculateInitialFireNetWorth(accounts: Account[]) { return accounts.reduce((total, account) => !isIncludedInFireNetWorth(account) ? total : total + safeNumber(account.balance), 0); }

function createSimulationAccounts(accounts: Account[]): MutableSimulatedAccount[] {
  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    initialBalance: safeNumber(account.balance),
    finalBalance: safeNumber(account.balance),
    approximateCumulativeReturn: 0,
    incomingTransfers: 0,
    outgoingTransfers: 0,
    includedInFireNetWorth: isIncludedInFireNetWorth(account),
    hasNegativeBalance: safeNumber(account.balance) < 0,
    rows: [],
    activeInSimulation: account.active,
    annualReturn: safeNumber(account.annualReturn),
  }));
}

function accountWarning(account: MutableSimulatedAccount) { return `El compte ${account.name} podria quedar en negatiu per una regla futura.`; }
function addWarning(warnings: Set<string>, account: MutableSimulatedAccount) { if (account.finalBalance <= 0) warnings.add(accountWarning(account)); }
function findActiveAccount(accounts: MutableSimulatedAccount[], accountId?: string) { return accounts.find((account) => account.id === accountId && account.activeInSimulation); }

export function getProjectedAccountBalanceForDate(accounts: Account[], scenario: Scenario, transfers: Transfer[], futureRules: FutureRule[], accountId: string, year: number, month: number) {
  const months = Math.max(0, (year - scenario.startYear) * 12 + month);
  const projectedScenario = { ...scenario, horizonYears: Math.max(1, Math.ceil(months / 12)) };
  const result = runAnnualSimulation(accounts, projectedScenario, transfers, futureRules, { stopYear: year, stopMonth: month, includeTargetMonth: false });
  return result.accounts.find((account) => account.id === accountId)?.finalBalance ?? null;
}

export function runAnnualSimulation(accounts: Account[], scenario: Scenario, transfers: Transfer[] = [], futureRules: FutureRule[] = [], options?: { stopYear?: number; stopMonth?: number; includeTargetMonth?: boolean }): SimulationResult {
  const simulatedAccounts = createSimulationAccounts(accounts);
  const initialNetWorth = calculateInitialNetWorth(accounts);
  const initialFireNetWorth = calculateInitialFireNetWorth(accounts);
  const rows: AnnualSimulationRow[] = [];
  const warnings = new Set<string>();
  let fireYear: number | null = null;
  const horizonYears = Math.max(0, Math.floor(scenario.horizonYears || 0));
  const startYear = Number.isFinite(scenario.startYear) ? scenario.startYear : new Date().getFullYear();
  const annualIncome = safeNumber(scenario.annualIncome);
  let annualExpenses = safeNumber(scenario.annualExpenses);
  const annualExpenseInflation = safeNumber(scenario.annualExpenseInflation);
  const fireTarget = safeNumber(scenario.fireTarget);
  const monthlyIncome = annualIncome / 12;
  let monthlyExpenses = annualExpenses / 12;

  for (let yearIndex = 0; yearIndex < horizonYears; yearIndex += 1) {
    const year = startYear + yearIndex;
    const yearStartingBalances = simulatedAccounts.map((account) => account.finalBalance);
    let futureRuleIncome = 0;
    let futureRuleExpenses = 0;
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const calendarMonth = monthIndex + 1;
      if (options?.stopYear === year && options.stopMonth === calendarMonth && options.includeTargetMonth === false) break;
      const simulationMonth = getMonthIndex(year, calendarMonth, startYear);
      const activeRules = futureRules.filter((rule) => rule.isActive);

      // Monthly order: 1 account activations, 2 extraordinary income and structural salary, 3 one-off transfers,
      // 4 recurrent monthly transfers, 5 one-off expenses and structural costs, 6 account deactivations, 7 returns.
      activeRules.filter((rule) => rule.type === 'activate-account' && isRuleOneOffInMonth(rule, year, calendarMonth)).forEach((rule) => {
        const account = simulatedAccounts.find((candidate) => candidate.id === rule.toAccountId);
        if (account) account.activeInSimulation = true;
      });

      activeRules.forEach((rule) => {
        const amount = safeNumber(rule.amount);
        if (amount <= 0) return;
        if ((rule.type === 'extraordinary-income' && isRuleOneOffInMonth(rule, year, calendarMonth)) || (rule.type === 'structural-salary-increase' && isRuleActiveInMonth(rule, year, calendarMonth, startYear))) {
          const account = findActiveAccount(simulatedAccounts, rule.toAccountId);
          if (account) { account.finalBalance += amount; account.incomingTransfers += amount; futureRuleIncome += amount; }
        }
      });

      activeRules.filter((rule) => rule.type === 'one-off-transfer' && isRuleOneOffInMonth(rule, year, calendarMonth)).forEach((rule) => {
        const amount = safeNumber(rule.amount);
        const from = findActiveAccount(simulatedAccounts, rule.fromAccountId);
        const to = simulatedAccounts.find((account) => account.id === rule.toAccountId && (account.activeInSimulation || rule.activateDestinationAccount));
        if (!from || !to || from.id === to.id || amount <= 0) return;
        if (rule.activateDestinationAccount) to.activeInSimulation = true;
        from.finalBalance -= amount; from.outgoingTransfers += amount; to.finalBalance += amount; to.incomingTransfers += amount; addWarning(warnings, from);
      });

      transfers.forEach((transfer) => {
        const from = findActiveAccount(simulatedAccounts, transfer.fromAccountId);
        const to = findActiveAccount(simulatedAccounts, transfer.toAccountId);
        const startMonth = transfer.startMonth ?? 1;
        const endMonth = transfer.endMonth ?? horizonYears * 12;
        const amount = safeNumber(transfer.monthlyAmount);
        if (!transfer.isActive || !from || !to || from.id === to.id || amount <= 0 || simulationMonth < startMonth || simulationMonth > endMonth) return;
        from.finalBalance -= amount; from.outgoingTransfers += amount; to.finalBalance += amount; to.incomingTransfers += amount;
      });

      activeRules.forEach((rule) => {
        const amount = safeNumber(rule.amount);
        if (amount <= 0) return;
        if ((rule.type === 'one-off-expense' && isRuleOneOffInMonth(rule, year, calendarMonth)) || (rule.type === 'structural-cost-increase' && isRuleActiveInMonth(rule, year, calendarMonth, startYear))) {
          const account = findActiveAccount(simulatedAccounts, rule.fromAccountId);
          if (account) { account.finalBalance -= amount; account.outgoingTransfers += amount; futureRuleExpenses += amount; addWarning(warnings, account); }
        }
      });

      activeRules.filter((rule) => rule.type === 'deactivate-account' && isRuleOneOffInMonth(rule, year, calendarMonth)).forEach((rule) => {
        const account = findActiveAccount(simulatedAccounts, rule.fromAccountId);
        if (account && Math.abs(account.finalBalance) < 0.01) account.activeInSimulation = false;
      });

      const cashflowAccount = simulatedAccounts.find((account) => account.activeInSimulation && account.type === 'current') ?? simulatedAccounts.find((account) => account.activeInSimulation && account.type !== 'debt');
      if (cashflowAccount) cashflowAccount.finalBalance += monthlyIncome - monthlyExpenses;

      simulatedAccounts.forEach((account) => {
        if (!account.activeInSimulation || account.type === 'debt') return;
        const monthlyReturn = Math.pow(1 + account.annualReturn / 100, 1 / 12) - 1;
        account.finalBalance *= Number.isFinite(monthlyReturn) ? 1 + monthlyReturn : 1;
        if (account.finalBalance <= 0) account.hasNegativeBalance = true;
      });
      if (options?.stopYear === year && options.stopMonth === calendarMonth) break;
    }

    const activeForTotals = simulatedAccounts.filter((account) => account.activeInSimulation);
    const endingNetWorth = activeForTotals.reduce((total, account) => total + (account.type === 'debt' ? -account.finalBalance : account.finalBalance), 0);
    const endingFireNetWorth = activeForTotals.reduce((total, account) => !account.includedInFireNetWorth ? total : total + account.finalBalance, 0);
    const fireReached = endingFireNetWorth >= fireTarget;
    if (fireReached && fireYear === null) fireYear = year;
    simulatedAccounts.forEach((account, accountIndex) => {
      const startingBalance = yearStartingBalances[accountIndex] ?? 0;
      const approximateReturnAmount = account.finalBalance - account.initialBalance - account.incomingTransfers + account.outgoingTransfers;
      account.approximateCumulativeReturn = account.initialBalance === 0 ? 0 : (approximateReturnAmount / Math.abs(account.initialBalance)) * 100;
      account.rows.push({ year, startingBalance, endingBalance: account.finalBalance, approximateCumulativeReturn: account.approximateCumulativeReturn });
    });
    rows.push({ year, income: annualIncome + futureRuleIncome, expenses: annualExpenses + futureRuleExpenses, annualSavings: annualIncome + futureRuleIncome - annualExpenses - futureRuleExpenses, endingNetWorth, endingFireNetWorth, fireReached });
    annualExpenses *= 1 + annualExpenseInflation / 100; monthlyExpenses = annualExpenses / 12;
    if (options?.stopYear === year) break;
  }

  const visibleAccounts = simulatedAccounts.filter((account) => account.activeInSimulation || account.rows.some((row) => row.endingBalance !== 0) || accounts.find((source) => source.id === account.id)?.active);
  return { initialNetWorth, initialFireNetWorth, fireYear, finalNetWorth: rows.at(-1)?.endingNetWorth ?? initialNetWorth, finalFireNetWorth: rows.at(-1)?.endingFireNetWorth ?? initialFireNetWorth, rows, accounts: visibleAccounts, hasNegativeBalance: visibleAccounts.some((account) => account.hasNegativeBalance), warnings: Array.from(warnings) };
}
