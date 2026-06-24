import { useMemo, useState } from 'react';
import type { Account } from '../models/account.ts';
import type { Scenario } from '../models/scenario.ts';
import { formatCompactEuros, formatEuros, formatPercent } from '../utils/formatters.ts';
import { runAnnualSimulation } from '../utils/simulation.ts';

type ResultsProps = {
  accounts: Account[];
  scenario: Scenario;
};

type ResultsFilter = 'all' | 'fire' | `account:${string}`;

export function Results({ accounts, scenario }: ResultsProps) {
  const [selectedFilter, setSelectedFilter] = useState<ResultsFilter>('all');
  const simulation = runAnnualSimulation(accounts, scenario);
  const activeAccounts = useMemo(() => accounts.filter((account) => account.active), [accounts]);
  const selectedAccountId = selectedFilter.startsWith('account:')
    ? selectedFilter.replace('account:', '')
    : null;
  const selectedAccount = selectedAccountId
    ? simulation.accounts.find((account) => account.id === selectedAccountId)
    : null;
  const projectedValues = selectedAccount
    ? selectedAccount.rows.map((row) => row.endingBalance)
    : simulation.rows.map((row) => (selectedFilter === 'fire' ? row.endingFireNetWorth : row.endingNetWorth));
  const initialValue = selectedAccount
    ? selectedAccount.initialBalance
    : selectedFilter === 'fire'
      ? simulation.initialFireNetWorth
      : simulation.initialNetWorth;
  const finalValue = selectedAccount
    ? selectedAccount.finalBalance
    : selectedFilter === 'fire'
      ? simulation.finalFireNetWorth
      : simulation.finalNetWorth;
  const chartCeiling = Math.max(
    selectedAccount ? 0 : scenario.fireTarget,
    initialValue,
    finalValue,
    ...projectedValues,
    1,
  );

  const chartPoints = projectedValues
    .map((value, index) => {
      const x = (index / Math.max(projectedValues.length - 1, 1)) * 100;
      const y = Math.min(100, Math.max(0, 100 - (value / chartCeiling) * 88));

      return `${x},${y}`;
    })
    .join(' ');

  const fireLineY = Math.min(100, Math.max(0, 100 - (scenario.fireTarget / chartCeiling) * 88));
  const hasNegativeBalance = selectedAccount?.hasNegativeBalance ?? simulation.hasNegativeBalance;

  return (
    <section className="results-page">
      <div className="results-header">
        <p className="eyebrow">Resultats de l’escenari</p>
        <h2>Resultats</h2>
        <p>
          Projecció anual calculada internament mes a mes amb la rendibilitat pròpia de cada compte actiu.
          Els ingressos i les despeses de l’escenari s’apliquen com a flux mensual simple.
        </p>
      </div>

      <article className="chart-card">
        <label className="results-filter">
          <span>Filtre de resultats</span>
          <select value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value as ResultsFilter)}>
            <option value="all">Totes les comptes</option>
            <option value="fire">Patrimoni FIRE</option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={`account:${account.id}`}>{account.name}</option>
            ))}
          </select>
        </label>
      </article>

      {hasNegativeBalance && (
        <p className="warning-message">Aquest compte podria quedar en negatiu durant la simulació.</p>
      )}

      <div className="results-kpis" aria-label="Indicadors principals">
        <article className="summary-card">
          <span>{selectedAccount ? 'Saldo inicial' : 'Patrimoni inicial'}</span>
          <strong>{formatEuros(initialValue)}</strong>
        </article>
        <article className="summary-card">
          <span>{selectedAccount ? 'Saldo final projectat' : 'Patrimoni final projectat'}</span>
          <strong>{formatEuros(finalValue)}</strong>
        </article>
        {selectedAccount ? (
          <article className="summary-card">
            <span>Rendibilitat acumulada aproximada</span>
            <strong>{formatPercent(selectedAccount.approximateCumulativeReturn)}</strong>
          </article>
        ) : (
          <>
            <article className="summary-card">
              <span>Objectiu FIRE</span>
              <strong>{formatEuros(scenario.fireTarget)}</strong>
            </article>
            <article className="summary-card">
              <span>Any estimat FIRE</span>
              <strong>{simulation.fireYear ?? 'No assolit'}</strong>
            </article>
          </>
        )}
      </div>

      <article className="chart-card">
        <div className="chart-header">
          <div>
            <p className="eyebrow">{selectedAccount ? 'Saldo projectat' : 'Patrimoni projectat'}</p>
            <h3>Evolució anual</h3>
          </div>
          <span>{scenario.startYear}–{scenario.startYear + scenario.horizonYears - 1}</span>
        </div>
        <svg className="projection-chart" role="img" aria-label="Gràfic de la projecció anual" viewBox="0 0 100 100" preserveAspectRatio="none">
          {!selectedAccount && <line className="fire-line" x1="0" x2="100" y1={fireLineY} y2={fireLineY} />}
          <polyline className="projection-line" points={chartPoints} />
        </svg>
        <div className="chart-legend">
          <span>Inici: {formatCompactEuros(initialValue)}</span>
          {!selectedAccount && <span>Objectiu: {formatCompactEuros(scenario.fireTarget)}</span>}
          <span>Final: {formatCompactEuros(finalValue)}</span>
        </div>
      </article>

      <article className="annual-table-card">
        <div className="chart-header"><div><p className="eyebrow">Taula anual</p><h3>Detall de la projecció</h3></div></div>
        <div className="table-scroll">
          <table className="annual-table">
            <thead>
              {selectedAccount ? (
                <tr><th>Any</th><th>Saldo inicial</th><th>Saldo final projectat</th><th>Rendibilitat acumulada aproximada</th></tr>
              ) : (
                <tr><th>Any</th><th>Ingressos</th><th>Despeses</th><th>Estalvi anual</th><th>{selectedFilter === 'fire' ? 'Patrimoni FIRE final' : 'Patrimoni net final'}</th><th>FIRE</th></tr>
              )}
            </thead>
            <tbody>
              {selectedAccount ? selectedAccount.rows.map((row) => (
                <tr key={row.year}><td>{row.year}</td><td>{formatEuros(row.startingBalance)}</td><td>{formatEuros(row.endingBalance)}</td><td>{formatPercent(row.approximateCumulativeReturn)}</td></tr>
              )) : simulation.rows.map((row) => (
                <tr key={row.year}><td>{row.year}</td><td>{formatEuros(row.income)}</td><td>{formatEuros(row.expenses)}</td><td>{formatEuros(row.annualSavings)}</td><td>{formatEuros(selectedFilter === 'fire' ? row.endingFireNetWorth : row.endingNetWorth)}</td><td>{row.fireReached ? 'Sí' : 'No'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
