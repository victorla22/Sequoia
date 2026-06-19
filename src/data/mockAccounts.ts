import type { Account } from '../models/account.ts';

export const mockAccounts: Account[] = [
  {
    id: 'main-current-account',
    name: 'Main Current Account',
    type: 'current',
    balance: 4200,
    annualReturn: 0,
    notes: 'Everyday spending and salary deposits.',
    active: true,
  },
  {
    id: 'emergency-savings',
    name: 'Emergency Savings',
    type: 'savings',
    balance: 12500,
    annualReturn: 2.1,
    notes: 'Target is six months of expenses.',
    active: true,
  },
  {
    id: 'long-term-index-fund',
    name: 'Long-term Index Fund',
    type: 'investment',
    balance: 38600,
    annualReturn: 5.5,
    notes: 'Simple placeholder growth assumption for future simulations.',
    active: true,
  },
  {
    id: 'car-loan',
    name: 'Car Loan',
    type: 'debt',
    balance: 7800,
    annualReturn: 4.2,
    notes: 'Example liability to include in net worth.',
    active: true,
  },
  {
    id: 'old-brokerage-account',
    name: 'Old Brokerage Account',
    type: 'investment',
    balance: 950,
    annualReturn: 3.4,
    notes: '',
    active: false,
  },
];
