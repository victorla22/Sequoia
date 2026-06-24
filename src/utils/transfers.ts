import type { Account } from '../models/account.ts';
import type { Transfer } from '../models/transfer.ts';

export const TRANSFERS_STORAGE_KEY = 'sequoia.transfers';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeOptionalMonth(value: unknown) {
  if (!isFiniteNumber(value)) {
    return undefined;
  }

  const month = Math.floor(value);
  return month >= 1 ? month : undefined;
}

function normalizeTransfer(value: unknown): Transfer | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const transfer = value as Partial<Transfer>;

  if (
    typeof transfer.id !== 'string' ||
    transfer.id.trim().length === 0 ||
    typeof transfer.name !== 'string' ||
    typeof transfer.fromAccountId !== 'string' ||
    typeof transfer.toAccountId !== 'string' ||
    typeof transfer.isActive !== 'boolean'
  ) {
    return null;
  }

  return {
    id: transfer.id,
    name: transfer.name,
    fromAccountId: transfer.fromAccountId,
    toAccountId: transfer.toAccountId,
    monthlyAmount: isFiniteNumber(transfer.monthlyAmount) ? Math.max(0, transfer.monthlyAmount) : 0,
    isActive: transfer.isActive,
    startMonth: normalizeOptionalMonth(transfer.startMonth),
    endMonth: normalizeOptionalMonth(transfer.endMonth),
  };
}

export function getDemoTransfers(accounts: Account[]): Transfer[] {
  const activeAssetAccounts = accounts.filter((account) => account.active && account.type !== 'debt');

  if (activeAssetAccounts.length < 2) {
    return [];
  }

  const origin = activeAssetAccounts.find((account) => account.type === 'current') ?? activeAssetAccounts[0];
  const destination = activeAssetAccounts.find(
    (account) => account.id !== origin.id && account.type === 'investment',
  ) ?? activeAssetAccounts.find((account) => account.id !== origin.id);

  if (!origin || !destination) {
    return [];
  }

  return [
    {
      id: 'demo-monthly-investment-transfer',
      name: 'Transferència mensual a inversió',
      fromAccountId: origin.id,
      toAccountId: destination.id,
      monthlyAmount: 200,
      isActive: true,
    },
  ];
}

export function loadStoredTransfers(accounts: Account[]): Transfer[] {
  try {
    const storedTransfers = window.localStorage.getItem(TRANSFERS_STORAGE_KEY);

    if (!storedTransfers) {
      return getDemoTransfers(accounts);
    }

    const parsedTransfers: unknown = JSON.parse(storedTransfers);

    if (!Array.isArray(parsedTransfers)) {
      return getDemoTransfers(accounts);
    }

    const normalizedTransfers = parsedTransfers.map(normalizeTransfer);

    if (normalizedTransfers.some((transfer) => transfer === null)) {
      return getDemoTransfers(accounts);
    }

    return normalizedTransfers.filter((transfer): transfer is Transfer => transfer !== null).map((transfer) => ({ ...transfer }));
  } catch {
    return getDemoTransfers(accounts);
  }
}

export function persistTransfers(transfers: Transfer[]) {
  window.localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));
}
