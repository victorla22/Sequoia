export type FutureRuleType =
  | 'extraordinary-income'
  | 'one-off-expense'
  | 'one-off-transfer'
  | 'structural-cost-increase'
  | 'structural-salary-increase'
  | 'activate-account'
  | 'deactivate-account';

export type FutureRule = {
  id: string;
  name: string;
  comments: string;
  type: FutureRuleType;
  isActive: boolean;
  startMonth: number;
  startYear: number;
  endMonth?: number;
  endYear?: number;
  amount?: number;
  fromAccountId?: string;
  toAccountId?: string;
  activateDestinationAccount?: boolean;
};
