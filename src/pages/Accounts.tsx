import { mockAccounts } from '../data/mockAccounts.ts';
import type { Account } from '../models/account.ts';

const euroFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

const percentFormatter = new Intl.NumberFormat('en-IE', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: 'percent',
});

const accountTypeLabels: Record<Account['type'], string> = {
  current: 'Current',
  savings: 'Savings',
  investment: 'Investment',
  debt: 'Debt',
};

function formatEuros(value: number) {
  return euroFormatter.format(value);
}

function formatAnnualReturn(value: number) {
  return percentFormatter.format(value / 100);
}

export function Accounts() {
  const totalGrossAssets = mockAccounts
    .filter((account) => account.type !== 'debt')
    .reduce((total, account) => total + account.balance, 0);

  const totalDebt = mockAccounts
    .filter((account) => account.type === 'debt')
    .reduce((total, account) => total + account.balance, 0);

  const netWorth = totalGrossAssets - totalDebt;
  const activeAccountCount = mockAccounts.filter((account) => account.active).length;

  return (
    <section className="accounts-page">
      <div className="accounts-header">
        <p className="eyebrow">Mock account overview</p>
        <h2>Accounts</h2>
        <p>
          A first version of the accounts area using example data only. Create,
          edit, delete, and persistence will come later.
        </p>
      </div>

      <div className="accounts-summary" aria-label="Accounts summary">
        <article className="summary-card">
          <span>Total gross assets</span>
          <strong>{formatEuros(totalGrossAssets)}</strong>
        </article>
        <article className="summary-card">
          <span>Total debt</span>
          <strong>{formatEuros(totalDebt)}</strong>
        </article>
        <article className="summary-card">
          <span>Net worth</span>
          <strong>{formatEuros(netWorth)}</strong>
        </article>
        <article className="summary-card">
          <span>Active accounts</span>
          <strong>{activeAccountCount}</strong>
        </article>
      </div>

      <div className="account-grid">
        {mockAccounts.map((account) => (
          <article className="account-card" key={account.id}>
            <div className="account-card-header">
              <div>
                <p className="account-type">{accountTypeLabels[account.type]}</p>
                <h3>{account.name}</h3>
              </div>
              <span className={account.active ? 'status active' : 'status inactive'}>
                {account.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <dl className="account-details">
              <div>
                <dt>Balance</dt>
                <dd>{formatEuros(account.balance)}</dd>
              </div>
              <div>
                <dt>Annual return</dt>
                <dd>{formatAnnualReturn(account.annualReturn)}</dd>
              </div>
            </dl>

            {account.notes && <p className="account-notes">{account.notes}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
