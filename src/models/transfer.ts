export type Transfer = {
  id: string;
  name: string;
  fromAccountId: string;
  toAccountId: string;
  monthlyAmount: number;
  isActive: boolean;
  startMonth?: number;
  endMonth?: number;
};
