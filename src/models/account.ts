export type AccountType = 'current' | 'savings' | 'investment' | 'debt';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  annualReturn: number;
  notes: string;
  active: boolean;
  includeInFireNetWorth?: boolean;
};
