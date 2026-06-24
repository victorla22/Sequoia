import type { Account } from '../models/account.ts';
import type { Scenario } from '../models/scenario.ts';
import { formatCompactEuros, formatEuros } from '../utils/formatters.ts';
import { runAnnualSimulation } from '../utils/simulation.ts';

type ResultsProps = {
  accounts: Account[];
  scenario: Scenario;
};

export function Results({ accounts, scenario }: ResultsProps) {
  const simulation = runAnnualSimulation(accounts, scenario);
  const netWorthValues = simulation.rows.map((row) => row.endingNetWorth);
  const chartCeiling = Math.max(
    scenario.fireTarget,
    simulation.initialNetWorth,
    simulation.finalNetWorth,
    ...netWorthValues,
    1,
  );

  const chartPoints = simulation.rows
    .map((row, index) => {
      const x = (index / Math.max(simulation.rows.length - 1, 1)) * 100;
      const y = Math.min(100, Math.max(0, 100 - (row.endingNetWorth / chartCeiling) * 88));

      return `${x},${y}`;
    })
    .join(' ');

  const fireLineY = Math.min(100, Math.max(0, 100 - (scenario.fireTarget / chartCeiling) * 88));

  return (
    <section className="results-page">
      <div className="results-header">
        <p className="eyebrow">Resultats de l’escenari</p>
        <h2>Resultats</h2>
        <p>
          Projecció anual simplificada basada en els comptes editables i l’escenari actual.
          És una simulació temporal per validar el flux, no el motor financer final.
        </p>
      </div>

      <div className="results-kpis" aria-label="Indicadors principals">
        <article className="summary-card">
          <span>Patrimoni net inicial</span>
          <strong>{formatEuros(simulation.initialNetWorth)}</strong>
        </article>
        <article className="summary-card">
          <span>Objectiu FIRE</span>
          <strong>{formatEuros(scenario.fireTarget)}</strong>
        </article>
        <article className="summary-card">
          <span>Any estimat FIRE</span>
          <strong>{simulation.fireYear ?? 'No assolit'}</strong>
        </article>
        <article className="summary-card">
          <span>Patrimoni final projectat</span>
          <strong>{formatEuros(simulation.finalNetWorth)}</strong>
        </article>
      </div>

      <article className="chart-card">
        <div className="chart-header">
          <div>
            <p className="eyebrow">Patrimoni net projectat</p>
            <h3>Evolució anual</h3>
          </div>
          <span>
            {scenario.startYear}–{scenario.startYear + scenario.horizonYears - 1}
          </span>
        </div>
        <svg
          className="projection-chart"
          role="img"
          aria-label="Gràfic del patrimoni net projectat"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line className="fire-line" x1="0" x2="100" y1={fireLineY} y2={fireLineY} />
          <polyline className="projection-line" points={chartPoints} />
        </svg>
        <div className="chart-legend">
          <span>Inici: {formatCompactEuros(simulation.initialNetWorth)}</span>
          <span>Objectiu: {formatCompactEuros(scenario.fireTarget)}</span>
          <span>Final: {formatCompactEuros(simulation.finalNetWorth)}</span>
        </div>
      </article>

      <article className="annual-table-card">
        <div className="chart-header">
          <div>
            <p className="eyebrow">Taula anual</p>
            <h3>Detall de la projecció</h3>
          </div>
        </div>
        <div className="table-scroll">
          <table className="annual-table">
            <thead>
              <tr>
                <th>Any</th>
                <th>Ingressos</th>
                <th>Despeses</th>
                <th>Estalvi anual</th>
                <th>Patrimoni net final</th>
                <th>FIRE</th>
              </tr>
            </thead>
            <tbody>
              {simulation.rows.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{formatEuros(row.income)}</td>
                  <td>{formatEuros(row.expenses)}</td>
                  <td>{formatEuros(row.annualSavings)}</td>
                  <td>{formatEuros(row.endingNetWorth)}</td>
                  <td>{row.fireReached ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}