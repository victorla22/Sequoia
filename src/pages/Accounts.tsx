import { mockAccounts } from '../data/mockAccounts.ts';
import type { Account } from '../models/account.ts';
import { formatEuros, formatPercent } from '../utils/formatters.ts';


const accountTypeLabels: Record<Account['type'], string> = {
  current: 'Corrent',
  savings: 'Estalvis',
  investment: 'Inversió',
  debt: 'Deute',
};


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
        <p className="eyebrow">Vista general de comptes de mostra</p>
        <h2>Comptes</h2>
        <p>
          Una primera versió de l’àrea de comptes que només utilitza dades d’exemple.
          La creació, l’edició, l’eliminació i la persistència arribaran més endavant.
        </p>
      </div>

      <div className="accounts-summary" aria-label="Resum de comptes">
        <article className="summary-card">
          <span>Patrimoni brut</span>
          <strong>{formatEuros(totalGrossAssets)}</strong>
        </article>
        <article className="summary-card">
          <span>Deute total</span>
          <strong>{formatEuros(totalDebt)}</strong>
        </article>
        <article className="summary-card">
          <span>Patrimoni net</span>
          <strong>{formatEuros(netWorth)}</strong>
        </article>
        <article className="summary-card">
          <span>Comptes actius</span>
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
                {account.active ? 'Actiu' : 'Inactiu'}
              </span>
            </div>

            <dl className="account-details">
              <div>
                <dt>Saldo</dt>
                <dd>{formatEuros(account.balance)}</dd>
              </div>
              <div>
                <dt>Rendibilitat anual</dt>
                <dd>{formatPercent(account.annualReturn)}</dd>
              </div>
            </dl>

            {account.notes && <p className="account-notes">{account.notes}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
