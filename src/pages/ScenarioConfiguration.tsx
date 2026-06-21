import { baseScenario } from '../data/mockScenarios.ts';
import { formatEuros, formatPercent } from '../utils/formatters.ts';

const filterTabs = [
  'Totes',
  'Ingressos',
  'Despeses',
  'Transferències',
  'Deutes',
  'Esdeveniments',
  'FIRE',
];

const configurationItems = [
  {
    label: 'Ingrés anual estructural',
    value: formatEuros(baseScenario.annualIncome),
    category: 'Ingressos',
  },
  {
    label: 'Despesa anual estructural',
    value: formatEuros(baseScenario.annualExpenses),
    category: 'Despeses',
  },
  {
    label: 'Inflació de despesa',
    value: formatPercent(baseScenario.annualExpenseInflation),
    category: 'Despeses',
  },
  {
    label: 'Objectiu FIRE',
    value: formatEuros(baseScenario.fireTarget),
    category: 'FIRE',
  },
];

export function ScenarioConfiguration() {
  return (
    <section className="scenario-page">
      <div className="scenario-header">
        <p className="eyebrow">Flux de demostració local</p>
        <h2>Configuració d’escenari</h2>
        <p>
          Revisa l’escenari base i les regles de mostra que alimenten els primers
          resultats projectats. Encara no hi ha edició ni persistència.
        </p>
      </div>

      <article className="scenario-card">
        <div className="scenario-card-header">
          <div>
            <p className="eyebrow">Escenari seleccionat</p>
            <h3>{baseScenario.name}</h3>
            <p>{baseScenario.description}</p>
          </div>
          <span className="status active">Actiu</span>
        </div>

        <dl className="scenario-assumptions" aria-label="Supòsits clau de l’escenari">
          <div>
            <dt>Ingressos</dt>
            <dd>{formatEuros(baseScenario.annualIncome)}</dd>
          </div>
          <div>
            <dt>Despeses</dt>
            <dd>{formatEuros(baseScenario.annualExpenses)}</dd>
          </div>
          <div>
            <dt>Inflació</dt>
            <dd>{formatPercent(baseScenario.annualExpenseInflation)}</dd>
          </div>
          <div>
            <dt>Rendibilitat esperada</dt>
            <dd>{formatPercent(baseScenario.annualExpectedReturn)}</dd>
          </div>
          <div>
            <dt>Objectiu FIRE</dt>
            <dd>{formatEuros(baseScenario.fireTarget)}</dd>
          </div>
          <div>
            <dt>Horitzó</dt>
            <dd>{baseScenario.horizonYears} anys</dd>
          </div>
        </dl>
      </article>

      <div className="configuration-toolbar">
        <div className="filter-tabs" aria-label="Filtres visuals de configuració">
          {filterTabs.map((tab, index) => (
            <button className={index === 0 ? 'filter-tab active' : 'filter-tab'} key={tab} type="button">
              {tab}
            </button>
          ))}
        </div>
        <button className="placeholder-action" disabled type="button">
          + Nova configuració
        </button>
      </div>

      <div className="configuration-list">
        {configurationItems.map((item) => (
          <article className="configuration-item" key={item.label}>
            <div>
              <p className="account-type">{item.category}</p>
              <h3>{item.label}</h3>
            </div>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
