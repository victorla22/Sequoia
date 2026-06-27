import type { FutureRule, FutureRuleType } from '../models/futureRule.ts';

export const FUTURE_RULES_STORAGE_KEY = 'sequoia.futureRules';

export const futureRuleTypes: FutureRuleType[] = [
  'extraordinary-income',
  'one-off-expense',
  'one-off-transfer',
  'structural-cost-increase',
  'structural-salary-increase',
  'activate-account',
  'deactivate-account',
];

export const futureRuleTypeLabels: Record<FutureRuleType, string> = {
  'extraordinary-income': 'Ingrés extraordinari',
  'one-off-expense': 'Despesa puntual',
  'one-off-transfer': 'Transferència puntual',
  'structural-cost-increase': 'Increment de costos estructurals',
  'structural-salary-increase': 'Increment de sou estructural',
  'activate-account': 'Activar compte',
  'deactivate-account': 'Inactivar compte',
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeOptionalPositive(value: unknown) {
  if (!isFiniteNumber(value) || value <= 0) return undefined;
  return Math.floor(value);
}

function isFutureRuleType(value: unknown): value is FutureRuleType {
  return typeof value === 'string' && futureRuleTypes.includes(value as FutureRuleType);
}

function normalizeRule(value: unknown): FutureRule | null {
  if (!value || typeof value !== 'object') return null;
  const rule = value as Partial<FutureRule>;
  if (
    typeof rule.id !== 'string' || rule.id.trim().length === 0 ||
    typeof rule.name !== 'string' ||
    typeof rule.comments !== 'string' ||
    !isFutureRuleType(rule.type) ||
    typeof rule.isActive !== 'boolean' ||
    !isFiniteNumber(rule.startMonth) || rule.startMonth < 1 || rule.startMonth > 12 ||
    !isFiniteNumber(rule.startYear)
  ) return null;

  return {
    id: rule.id,
    name: rule.name,
    comments: rule.comments,
    type: rule.type,
    isActive: rule.isActive,
    startMonth: Math.floor(rule.startMonth),
    startYear: Math.floor(rule.startYear),
    endMonth: normalizeOptionalPositive(rule.endMonth),
    endYear: normalizeOptionalPositive(rule.endYear),
    amount: isFiniteNumber(rule.amount) ? Math.max(0, rule.amount) : undefined,
    fromAccountId: typeof rule.fromAccountId === 'string' ? rule.fromAccountId : undefined,
    toAccountId: typeof rule.toAccountId === 'string' ? rule.toAccountId : undefined,
    activateDestinationAccount: typeof rule.activateDestinationAccount === 'boolean' ? rule.activateDestinationAccount : undefined,
  };
}

export function loadStoredFutureRules(): FutureRule[] {
  try {
    const storedRules = window.localStorage.getItem(FUTURE_RULES_STORAGE_KEY);
    if (!storedRules) return [];
    const parsedRules: unknown = JSON.parse(storedRules);
    if (!Array.isArray(parsedRules)) return [];
    const normalizedRules = parsedRules.map(normalizeRule);
    if (normalizedRules.some((rule) => rule === null)) return [];
    return normalizedRules.filter((rule): rule is FutureRule => rule !== null).map((rule) => ({ ...rule }));
  } catch {
    return [];
  }
}

export function persistFutureRules(rules: FutureRule[]) {
  window.localStorage.setItem(FUTURE_RULES_STORAGE_KEY, JSON.stringify(rules));
}
