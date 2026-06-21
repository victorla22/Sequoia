import type { Dispatch, SetStateAction } from 'react';
import type { Scenario } from '../models/scenario.ts';
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

type ScenarioConfigurationProps = {
  scenario: Scenario;
  onScenarioChange: Dispatch<SetStateAction<Scenario>>;
  onResetScenario: () => void;
};

const numberFields = [
  { key: 'startYear', label: 'Any inicial', step: 1 },
  { key: 'horizonYears', label: 'Horitzó en anys', step: 1 },
  { key: 'annualIncome', label: 'Ingressos anuals', step: 1000 },
  { key: 'annualExpenses', label: 'Despeses anuals', step: 1000 },
  { key: 'annualExpenseInflation', label: 'Inflació anual de despeses', step: 0.1 },
  { key: 'annualExpectedReturn', label: 'Rendibilitat anual esperada', step: 0.1 },
  { key: 'fireTarget', label: 'Objectiu FIRE', step: 10000 },
  { key: 'withdrawalRate', label: 'Taxa de retirada', step: 0.1 },
] satisfies { key: keyof Pick<Scenario, 'startYear' | 'horizonYears' | 'annualIncome' | 'annualExpenses' | 'annualExpenseInflation' | 'annualExpectedReturn' | 'fireTarget' | 'withdrawalRate'>; label: string; step: number }[];

function parseNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function ScenarioConfiguration({
  scenario,
  onScenarioChange,
  onResetScenario,
}: ScenarioConfigurationProps) {
  const configurationItems = [
    {
      label: 'Ingrés anual estructural',
      value: formatEuros(scenario.annualIncome),
      category: 'Ingressos',
    },
    {
      label: 'Despesa anual estructural',
      value: formatEuros(scenario.annualExpenses),
      category: 'Despeses',
    },
    {
      label: 'Inflació de despesa',
      value: formatPercent(scenario.annualExpenseInflation),
      category: 'Despeses',
    },
    {
      label: 'Objectiu FIRE',
      value: formatEuros(scenario.fireTarget),
      category: 'FIRE',
    },
  ];

  return (
    <section className="scenario-page">
      <div className="scenario-header">
        <p className="eyebrow">Flux local editable</p>
        <h2>Configuració d’escenari</h2>
        <p>
          Edita l’escenari base i revisa els resultats projectats immediatament. Les dades
          es desen en aquest navegador amb emmagatzematge local.
        </p>
      </div>

      <article className="scenario-card">
        <div className="scenario-card-header">
          <div>
            <p className="eyebrow">Escenari seleccionat</p>
            <h3>{scenario.name || 'Escenari sense nom'}</h3>
            <p>{scenario.description}</p>
          </div>
          <span className="status active">Actiu</span>
        </div>

        <form className="scenario-form" aria-label="Formulari de supòsits de l’escenari">
          <label className="scenario-field">
            <span>Nom de l’escenari</span>
            <input
              type="text"
              value={scenario.name}
              onChange={(event) =>
                onScenarioChange((currentScenario) => ({
                  ...currentScenario,
                  name: event.target.value,
                }))
              }
            />
          </label>

          {numberFields.map((field) => (
            <label className="scenario-field" key={field.key}>
              <span>{field.label}</span>
              <input
                type="number"
                step={field.step}
                value={scenario[field.key]}
                onChange={(event) =>
                  onScenarioChange((currentScenario) => ({
                    ...currentScenario,
                    [field.key]: parseNumber(event.target.value),
                  }))
                }
              />
            </label>
          ))}
        </form>

        <button className="reset-action" type="button" onClick={onResetScenario}>
          Restablir dades de mostra
        </button>

        <dl className="scenario-assumptions" aria-label="Supòsits clau de l’escenari">
          <div>
            <dt>Ingressos</dt>
            <dd>{formatEuros(scenario.annualIncome)}</dd>
          </div>
          <div>
            <dt>Despeses</dt>
            <dd>{formatEuros(scenario.annualExpenses)}</dd>
          </div>
          <div>
            <dt>Inflació</dt>
            <dd>{formatPercent(scenario.annualExpenseInflation)}</dd>
          </div>
          <div>
            <dt>Rendibilitat esperada</dt>
            <dd>{formatPercent(scenario.annualExpectedReturn)}</dd>
          </div>
          <div>
            <dt>Objectiu FIRE</dt>
            <dd>{formatEuros(scenario.fireTarget)}</dd>
          </div>
          <div>
            <dt>Horitzó</dt>
            <dd>{scenario.horizonYears} anys</dd>
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
