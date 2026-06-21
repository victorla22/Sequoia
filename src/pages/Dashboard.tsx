import { mockAccounts } from '../data/mockAccounts.ts';
import type { Scenario } from '../models/scenario.ts';
import { formatEuros } from '../utils/formatters.ts';
import { runAnnualSimulation } from '../utils/simulation.ts';
import { PageCard } from './PageCard.tsx';

type DashboardProps = {
  scenario: Scenario;
};

export function Dashboard({ scenario }: DashboardProps) {
  const simulation = runAnnualSimulation(mockAccounts, scenario);

  return (
    <section className="dashboard-page">
      <PageCard
        title="Panell"
        description="Un punt de partida senzill per revisar l’experiència global de planificació de Sequoia."
      />

      <div className="accounts-summary" aria-label="Resum de l’escenari actual">
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
      </div>
    </section>
  );
}
