import { mockAccounts } from '../data/mockAccounts.ts';
import type { Account, AccountType } from '../models/account.ts';

export const ACCOUNTS_STORAGE_KEY = 'sequoia.accounts';

const accountTypes: AccountType[] = ['current', 'savings', 'investment', 'debt'];

function cloneMockAccounts() {
  return mockAccounts.map((account) => ({ ...account }));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidAccountType(value: unknown): value is AccountType {
  return typeof value === 'string' && accountTypes.includes(value as AccountType);
}

function isValidAccount(value: unknown): value is Account {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const account = value as Partial<Account>;

  return (
    typeof account.id === 'string' &&
    account.id.trim().length > 0 &&
    typeof account.name === 'string' &&
    isValidAccountType(account.type) &&
    isFiniteNumber(account.balance) &&
    isFiniteNumber(account.annualReturn) &&
    typeof account.notes === 'string' &&
    typeof account.active === 'boolean'
  );
}

export function loadStoredAccounts(): Account[] {
  try {
    const storedAccounts = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);

    if (!storedAccounts) {
      return cloneMockAccounts();
    }

    const parsedAccounts: unknown = JSON.parse(storedAccounts);

    if (!Array.isArray(parsedAccounts) || !parsedAccounts.every(isValidAccount)) {
      return cloneMockAccounts();
    }

    return parsedAccounts.map((account) => ({ ...account }));
  } catch {
    return cloneMockAccounts();
  }
}

export function persistAccounts(accounts: Account[]) {
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

export function getDefaultAccounts(): Account[] {
  return cloneMockAccounts();
}

export function calculateAccountSummary(accounts: Account[]) {
  return accounts.reduce(
    (summary, account) => {
      if (!account.active) {
        return summary;
      }

      if (account.type === 'debt') {
        return {
          ...summary,
          totalDebt: summary.totalDebt + account.balance,
          activeAccountCount: summary.activeAccountCount + 1,
        };
      }

      return {
        ...summary,
        totalGrossAssets: summary.totalGrossAssets + account.balance,
        activeAccountCount: summary.activeAccountCount + 1,
      };
    },
    { totalGrossAssets: 0, totalDebt: 0, activeAccountCount: 0 },
  );
}
