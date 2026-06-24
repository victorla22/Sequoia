import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { Account } from '../models/account.ts';
import type { Scenario } from '../models/scenario.ts';
import type { Transfer } from '../models/transfer.ts';
import { getDemoTransfers } from '../utils/transfers.ts';
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
  accounts: Account[];
  transfers: Transfer[];
  onTransfersChange: (transfers: Transfer[]) => void;
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

type TransferFormState = {
  id: string | null;
  name: string;
  fromAccountId: string;
  toAccountId: string;
  monthlyAmount: string;
  isActive: boolean;
  startMonth: string;
  endMonth: string;
};

const emptyTransferForm: TransferFormState = {
  id: null,
  name: '',
  fromAccountId: '',
  toAccountId: '',
  monthlyAmount: '',
  isActive: true,
  startMonth: '',
  endMonth: '',
};

function createTransferId(transfers: Transfer[]) {
  const existingIds = new Set(transfers.map((transfer) => transfer.id));
  let id = `transfer-${Date.now()}`;
  let suffix = 1;

  while (existingIds.has(id)) {
    id = `transfer-${Date.now()}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function transferToForm(transfer: Transfer): TransferFormState {
  return {
    id: transfer.id,
    name: transfer.name,
    fromAccountId: transfer.fromAccountId,
    toAccountId: transfer.toAccountId,
    monthlyAmount: String(transfer.monthlyAmount),
    isActive: transfer.isActive,
    startMonth: transfer.startMonth ? String(transfer.startMonth) : '',
    endMonth: transfer.endMonth ? String(transfer.endMonth) : '',
  };
}

function parseOptionalMonth(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 1 ? Math.floor(parsedValue) : undefined;
}

export function ScenarioConfiguration({
  scenario,
  accounts,
  transfers,
  onTransfersChange,
  onScenarioChange,
  onResetScenario,
}: ScenarioConfigurationProps) {
  const [transferForm, setTransferForm] = useState<TransferFormState>(emptyTransferForm);
  const activeAccounts = useMemo(() => accounts.filter((account) => account.active), [accounts]);
  const selectableAccounts = activeAccounts.filter((account) => account.type !== 'debt');
  const isEditingTransfer = transferForm.id !== null;

  function resetTransferForm() {
    setTransferForm(emptyTransferForm);
  }

  function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fromAccountId = transferForm.fromAccountId || selectableAccounts[0]?.id || '';
    const fallbackDestination = selectableAccounts.find((account) => account.id !== fromAccountId)?.id || '';
    const toAccountId = transferForm.toAccountId || fallbackDestination;

    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      return;
    }

    const savedTransfer: Transfer = {
      id: transferForm.id ?? createTransferId(transfers),
      name: transferForm.name.trim() || 'Transferència sense nom',
      fromAccountId,
      toAccountId,
      monthlyAmount: Math.max(0, parseNumber(transferForm.monthlyAmount)),
      isActive: transferForm.isActive,
      startMonth: parseOptionalMonth(transferForm.startMonth),
      endMonth: parseOptionalMonth(transferForm.endMonth),
    };

    onTransfersChange(isEditingTransfer
      ? transfers.map((transfer) => (transfer.id === savedTransfer.id ? savedTransfer : transfer))
      : [...transfers, savedTransfer]);
    resetTransferForm();
  }

  function handleDeleteTransfer(transferId: string) {
    onTransfersChange(transfers.filter((transfer) => transfer.id !== transferId));
    if (transferForm.id === transferId) {
      resetTransferForm();
    }
  }

  function handleToggleTransfer(transferId: string) {
    onTransfersChange(transfers.map((transfer) => transfer.id === transferId ? { ...transfer, isActive: !transfer.isActive } : transfer));
  }

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

      <article className="scenario-card">
        <div className="scenario-card-header">
          <div>
            <p className="eyebrow">Supòsits de moviment</p>
            <h3>Transferències recurrents</h3>
            <p>Defineix moviments mensuals entre comptes. No compten com a ingressos ni despeses.</p>
          </div>
          <button className="secondary-action" type="button" onClick={() => onTransfersChange(getDemoTransfers(accounts))}>
            Restablir transferències de mostra
          </button>
        </div>

        <form className="scenario-form" onSubmit={handleTransferSubmit} aria-label="Formulari de transferències recurrents">
          <div className="form-wide"><p className="eyebrow">Nova transferència</p></div>
          <label className="scenario-field"><span>Nom</span><input value={transferForm.name} onChange={(event) => setTransferForm({ ...transferForm, name: event.target.value })} /></label>
          <label className="scenario-field"><span>Compte origen</span><select value={transferForm.fromAccountId} onChange={(event) => {
                const fromAccountId = event.target.value;
                const toAccountId = transferForm.toAccountId === fromAccountId
                  ? selectableAccounts.find((account) => account.id !== fromAccountId)?.id ?? ''
                  : transferForm.toAccountId;
                setTransferForm({ ...transferForm, fromAccountId, toAccountId });
              }}>{selectableAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
          <label className="scenario-field"><span>Compte destí</span><select value={transferForm.toAccountId} onChange={(event) => setTransferForm({ ...transferForm, toAccountId: event.target.value })}>{selectableAccounts.filter((account) => account.id !== transferForm.fromAccountId).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
          <label className="scenario-field"><span>Import mensual</span><input inputMode="decimal" type="number" value={transferForm.monthlyAmount} onChange={(event) => setTransferForm({ ...transferForm, monthlyAmount: event.target.value })} /></label>
          <label className="scenario-field"><span>Mes inicial</span><input inputMode="numeric" min="1" type="number" value={transferForm.startMonth} onChange={(event) => setTransferForm({ ...transferForm, startMonth: event.target.value })} /></label>
          <label className="scenario-field"><span>Mes final</span><input inputMode="numeric" min="1" type="number" value={transferForm.endMonth} onChange={(event) => setTransferForm({ ...transferForm, endMonth: event.target.value })} /></label>
          <label className="checkbox-field"><input checked={transferForm.isActive} type="checkbox" onChange={(event) => setTransferForm({ ...transferForm, isActive: event.target.checked })} />Activa</label>
          <div className="form-actions form-wide"><button className="primary-action" type="submit" disabled={selectableAccounts.length < 2}>Desar transferència</button><button className="secondary-action" type="button" onClick={resetTransferForm}>Cancel·lar</button></div>
        </form>

        <div className="configuration-list transfer-list">
          {transfers.map((transfer) => {
            const fromAccount = accounts.find((account) => account.id === transfer.fromAccountId);
            const toAccount = accounts.find((account) => account.id === transfer.toAccountId);
            return <article className="configuration-item" key={transfer.id}><div><p className="account-type">{transfer.isActive ? 'Activa' : 'Inactiva'}</p><h3>{transfer.name}</h3><p>{fromAccount?.name ?? 'Compte no trobat'} → {toAccount?.name ?? 'Compte no trobat'} · {formatEuros(transfer.monthlyAmount)}</p></div><div className="card-actions"><button className="secondary-action" type="button" onClick={() => setTransferForm(transferToForm(transfer))}>Editar</button><button className="secondary-action" type="button" onClick={() => handleToggleTransfer(transfer.id)}>{transfer.isActive ? 'Desactivar' : 'Activar'}</button><button className="danger-action" type="button" onClick={() => handleDeleteTransfer(transfer.id)}>Eliminar</button></div></article>;
          })}
        </div>
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
