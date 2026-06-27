import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { Account } from '../models/account.ts';
import type { Scenario } from '../models/scenario.ts';
import type { Transfer } from '../models/transfer.ts';
import type { FutureRule, FutureRuleType } from '../models/futureRule.ts';
import { getDemoTransfers } from '../utils/transfers.ts';
import { futureRuleTypeLabels, futureRuleTypes } from '../utils/futureRules.ts';
import { getProjectedAccountBalanceForDate } from '../utils/simulation.ts';
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
  futureRules: FutureRule[];
  onFutureRulesChange: (futureRules: FutureRule[]) => void;
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

type FutureRuleFormState = {
  id: string | null;
  name: string;
  comments: string;
  type: FutureRuleType;
  isActive: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  amount: string;
  fromAccountId: string;
  toAccountId: string;
  activateDestinationAccount: boolean;
};

function createEmptyFutureRuleForm(startYear: number): FutureRuleFormState {
  return { id: null, name: '', comments: '', type: 'extraordinary-income', isActive: true, startMonth: '1', startYear: String(startYear), endMonth: '', endYear: '', amount: '', fromAccountId: '', toAccountId: '', activateDestinationAccount: false };
}

function futureRuleToForm(rule: FutureRule): FutureRuleFormState {
  return { id: rule.id, name: rule.name, comments: rule.comments, type: rule.type, isActive: rule.isActive, startMonth: String(rule.startMonth), startYear: String(rule.startYear), endMonth: rule.endMonth ? String(rule.endMonth) : '', endYear: rule.endYear ? String(rule.endYear) : '', amount: rule.amount ? String(rule.amount) : '', fromAccountId: rule.fromAccountId ?? '', toAccountId: rule.toAccountId ?? '', activateDestinationAccount: rule.activateDestinationAccount ?? false };
}

function createFutureRuleId(rules: FutureRule[]) {
  const existingIds = new Set(rules.map((rule) => rule.id));
  let id = `future-rule-${Date.now()}`;
  let suffix = 1;
  while (existingIds.has(id)) { id = `future-rule-${Date.now()}-${suffix}`; suffix += 1; }
  return id;
}

function parseMonth(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Math.min(12, Math.max(1, Math.floor(parsedValue))) : 1;
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
  futureRules,
  onFutureRulesChange,
  onResetScenario,
}: ScenarioConfigurationProps) {
  const [transferForm, setTransferForm] = useState<TransferFormState>(emptyTransferForm);
  const [futureRuleForm, setFutureRuleForm] = useState<FutureRuleFormState>(() => createEmptyFutureRuleForm(scenario.startYear));
  const [futureRuleMessage, setFutureRuleMessage] = useState('');
  const activeAccounts = useMemo(() => accounts.filter((account) => account.active), [accounts]);
  const selectableAccounts = activeAccounts.filter((account) => account.type !== 'debt');
  const isEditingTransfer = transferForm.id !== null;
  const isEditingFutureRule = futureRuleForm.id !== null;
  const futureRuleAmount = parseNumber(futureRuleForm.amount);
  const projectedOriginBalance = futureRuleForm.type === 'one-off-transfer' && futureRuleForm.fromAccountId && futureRuleForm.startYear && futureRuleForm.startMonth
    ? getProjectedAccountBalanceForDate(accounts, scenario, transfers, futureRules.filter((rule) => rule.id !== futureRuleForm.id), futureRuleForm.fromAccountId, parseNumber(futureRuleForm.startYear), parseMonth(futureRuleForm.startMonth))
    : null;

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



  function resetFutureRuleForm() {
    setFutureRuleForm(createEmptyFutureRuleForm(scenario.startYear));
    setFutureRuleMessage('');
  }

  function validateFutureRuleForm() {
    if (!futureRuleForm.name.trim()) return 'Cal indicar el concepte de la regla.';
    if (!futureRuleForm.comments.trim()) return 'Cal indicar comentaris per a la regla.';
    const startYear = parseNumber(futureRuleForm.startYear);
    const startMonth = parseMonth(futureRuleForm.startMonth);
    if (startYear < scenario.startYear || startMonth < 1 || startMonth > 12) return 'Cal indicar una data inicial vàlida.';
    const needsAmount = ['extraordinary-income', 'one-off-expense', 'one-off-transfer', 'structural-cost-increase', 'structural-salary-increase'].includes(futureRuleForm.type);
    if (needsAmount && futureRuleAmount <= 0) return 'Cal indicar un import vàlid.';
    const needsOrigin = ['one-off-expense', 'one-off-transfer', 'structural-cost-increase', 'deactivate-account'].includes(futureRuleForm.type);
    const needsDestination = ['extraordinary-income', 'one-off-transfer', 'structural-salary-increase', 'activate-account'].includes(futureRuleForm.type);
    const origin = accounts.find((account) => account.id === futureRuleForm.fromAccountId);
    const destination = accounts.find((account) => account.id === futureRuleForm.toAccountId);
    if (needsOrigin && !origin) return 'Cal seleccionar un compte origen existent.';
    if (needsDestination && !destination) return 'Cal seleccionar un compte destí existent.';
    if (futureRuleForm.type === 'one-off-transfer') {
      if (futureRuleForm.fromAccountId === futureRuleForm.toAccountId) return 'El compte origen i el compte destí han de ser diferents.';
      if (destination && !destination.active && !futureRuleForm.activateDestinationAccount) return 'El compte destí està inactiu. Activa’l en aquesta data o crea una regla d’activació prèvia.';
      if (projectedOriginBalance !== null && futureRuleAmount > projectedOriginBalance) return `Com a màxim pots transferir ${formatEuros(projectedOriginBalance)} des d’aquest compte en aquesta data.`;
    }
    if (futureRuleForm.type === 'deactivate-account') {
      const projectedBalance = getProjectedAccountBalanceForDate(accounts, scenario, transfers, futureRules.filter((rule) => rule.id !== futureRuleForm.id), futureRuleForm.fromAccountId, startYear, startMonth);
      if (projectedBalance !== null && Math.abs(projectedBalance) >= 0.01) return `Aquest compte té un saldo projectat de ${formatEuros(projectedBalance)} en aquesta data. Abans d’inactivar-lo, registra una transferència puntual pel saldo projectat.`;
    }
    return '';
  }

  function handleFutureRuleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateFutureRuleForm();
    if (validationMessage) { setFutureRuleMessage(validationMessage); return; }
    const savedRule: FutureRule = {
      id: futureRuleForm.id ?? createFutureRuleId(futureRules),
      name: futureRuleForm.name.trim(),
      comments: futureRuleForm.comments.trim(),
      type: futureRuleForm.type,
      isActive: futureRuleForm.isActive,
      startMonth: parseMonth(futureRuleForm.startMonth),
      startYear: parseNumber(futureRuleForm.startYear),
      endMonth: parseOptionalMonth(futureRuleForm.endMonth),
      endYear: parseOptionalMonth(futureRuleForm.endYear),
      amount: futureRuleAmount > 0 ? futureRuleAmount : undefined,
      fromAccountId: futureRuleForm.fromAccountId || undefined,
      toAccountId: futureRuleForm.toAccountId || undefined,
      activateDestinationAccount: futureRuleForm.activateDestinationAccount || undefined,
    };
    onFutureRulesChange(isEditingFutureRule ? futureRules.map((rule) => rule.id === savedRule.id ? savedRule : rule) : [...futureRules, savedRule]);
    resetFutureRuleForm();
  }

  function handleDeleteFutureRule(ruleId: string) {
    onFutureRulesChange(futureRules.filter((rule) => rule.id !== ruleId));
    if (futureRuleForm.id === ruleId) resetFutureRuleForm();
  }

  function handleToggleFutureRule(ruleId: string) {
    onFutureRulesChange(futureRules.map((rule) => rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule));
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


      <article className="scenario-card">
        <div className="scenario-card-header"><div><p className="eyebrow">Regles futures</p><h3>Regles futures</h3><p>Programa canvis puntuals o estructurals sobre comptes existents sense crear comptes automàticament.</p></div></div>
        <form className="scenario-form" onSubmit={handleFutureRuleSubmit} aria-label="Formulari de regles futures">
          <div className="form-wide"><p className="eyebrow">Nova regla futura</p></div>
          <label className="scenario-field"><span>Tipus de regla</span><select value={futureRuleForm.type} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, type: event.target.value as FutureRuleType })}>{futureRuleTypes.map((type) => <option key={type} value={type}>{futureRuleTypeLabels[type]}</option>)}</select></label>
          <label className="scenario-field"><span>Concepte</span><input value={futureRuleForm.name} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, name: event.target.value })} /></label>
          <label className="scenario-field form-wide"><span>Comentaris</span><textarea value={futureRuleForm.comments} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, comments: event.target.value })} /></label>
          <label className="scenario-field"><span>Mes inicial</span><input min="1" max="12" type="number" value={futureRuleForm.startMonth} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, startMonth: event.target.value })} /></label>
          <label className="scenario-field"><span>Any inicial</span><input type="number" value={futureRuleForm.startYear} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, startYear: event.target.value })} /></label>
          {['structural-cost-increase', 'structural-salary-increase'].includes(futureRuleForm.type) && <><label className="scenario-field"><span>Mes final</span><input min="1" max="12" type="number" value={futureRuleForm.endMonth} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, endMonth: event.target.value })} /></label><label className="scenario-field"><span>Any final</span><input type="number" value={futureRuleForm.endYear} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, endYear: event.target.value })} /></label></>}
          {['extraordinary-income', 'one-off-expense', 'one-off-transfer', 'structural-cost-increase', 'structural-salary-increase'].includes(futureRuleForm.type) && <label className="scenario-field"><span>Import</span><input type="number" inputMode="decimal" value={futureRuleForm.amount} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, amount: event.target.value })} /></label>}
          {['one-off-expense', 'one-off-transfer', 'structural-cost-increase', 'deactivate-account'].includes(futureRuleForm.type) && <label className="scenario-field"><span>Compte origen</span><select value={futureRuleForm.fromAccountId} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, fromAccountId: event.target.value })}><option value="">Selecciona un compte</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}
          {['extraordinary-income', 'one-off-transfer', 'structural-salary-increase', 'activate-account'].includes(futureRuleForm.type) && <label className="scenario-field"><span>Compte destí</span><select value={futureRuleForm.toAccountId} onChange={(event) => setFutureRuleForm({ ...futureRuleForm, toAccountId: event.target.value })}><option value="">Selecciona un compte</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}
          {futureRuleForm.type === 'one-off-transfer' && projectedOriginBalance !== null && <p className="form-wide warning-message">Com a màxim pots transferir {formatEuros(projectedOriginBalance)} des d’aquest compte en aquesta data.</p>}
          {futureRuleForm.type === 'one-off-transfer' && accounts.find((account) => account.id === futureRuleForm.toAccountId && !account.active) && <label className="checkbox-field"><input checked={futureRuleForm.activateDestinationAccount} type="checkbox" onChange={(event) => setFutureRuleForm({ ...futureRuleForm, activateDestinationAccount: event.target.checked })} />Activa el compte destí en aquesta data</label>}
          <label className="checkbox-field"><input checked={futureRuleForm.isActive} type="checkbox" onChange={(event) => setFutureRuleForm({ ...futureRuleForm, isActive: event.target.checked })} />Activa</label>
          {futureRuleMessage && <p className="form-wide warning-message">{futureRuleMessage}</p>}
          <div className="form-actions form-wide"><button className="primary-action" type="submit">Desar regla</button><button className="secondary-action" type="button" onClick={resetFutureRuleForm}>Cancel·lar</button></div>
        </form>
        <div className="configuration-list transfer-list">{futureRules.map((rule) => { const fromAccount = accounts.find((account) => account.id === rule.fromAccountId); const toAccount = accounts.find((account) => account.id === rule.toAccountId); return <article className="configuration-item" key={rule.id}><div><p className="account-type">{rule.isActive ? 'Activa' : 'Inactiva'} · {futureRuleTypeLabels[rule.type]}</p><h3>{rule.name}</h3><p>{rule.comments}</p><p>{rule.startMonth}/{rule.startYear}{rule.endMonth && rule.endYear ? ` – ${rule.endMonth}/${rule.endYear}` : ''}{rule.amount ? ` · ${formatEuros(rule.amount)}` : ''}{fromAccount ? ` · Origen: ${fromAccount.name}` : ''}{toAccount ? ` · Destí: ${toAccount.name}` : ''}</p></div><div className="card-actions"><button className="secondary-action" type="button" onClick={() => setFutureRuleForm(futureRuleToForm(rule))}>Editar</button><button className="secondary-action" type="button" onClick={() => handleToggleFutureRule(rule.id)}>{rule.isActive ? 'Desactivar' : 'Activar'}</button><button className="danger-action" type="button" onClick={() => handleDeleteFutureRule(rule.id)}>Eliminar</button></div></article>; })}</div>
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
