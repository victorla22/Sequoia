import type { Account } from '../models/account.ts';
import { calculateAccountSummary } from '../utils/accounts.ts';
import { formatEuros } from '../utils/formatters.ts';

type DashboardProps = {
  accounts: Account[];
};

export function Dashboard({ accounts }: DashboardProps) {
  const summary = calculateAccountSummary(accounts);
  const netWorth = summary.totalGrossAssets - summary.totalDebt;

  return (
    <section className="dashboard-page">
      <article className="page-card">
        <p className="eyebrow">Panell local</p>
        <h2>Panell</h2>
        <p>Un punt de partida senzill per revisar l’experiència global de planificació de Sequoia.</p>
      </article>

      <div className="accounts-summary" aria-label="Resum inicial del panell">
        <article className="summary-card">
          <span>Patrimoni net inicial</span>
          <strong>{formatEuros(netWorth)}</strong>
        </article>
        <article className="summary-card">
          <span>Patrimoni brut</span>
          <strong>{formatEuros(summary.totalGrossAssets)}</strong>
        </article>
        <article className="summary-card">
          <span>Deute total</span>
          <strong>{formatEuros(summary.totalDebt)}</strong>
        </article>
      </div>
    </section>
  );
}
