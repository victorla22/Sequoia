import { useMemo, useState, type FormEvent } from 'react';
import type { Account, AccountType } from '../models/account.ts';
import { calculateAccountSummary, getDefaultAccounts } from '../utils/accounts.ts';
import { formatEuros, formatPercent } from '../utils/formatters.ts';

const accountTypeLabels: Record<AccountType, string> = {
  current: 'Compte corrent',
  savings: 'Estalvi',
  investment: 'Inversió',
  debt: 'Deute',
};

type AccountFormState = {
  id: string | null;
  name: string;
  type: AccountType;
  balance: string;
  annualReturn: string;
  notes: string;
  active: boolean;
  includeInFireNetWorth: boolean;
};

type AccountsProps = {
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
};

const emptyForm: AccountFormState = {
  id: null,
  name: '',
  type: 'current',
  balance: '',
  annualReturn: '',
  notes: '',
  active: true,
  includeInFireNetWorth: true,
};

function toSafeNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function createAccountId(accounts: Account[]) {
  const existingIds = new Set(accounts.map((account) => account.id));
  let id = `account-${Date.now()}`;
  let suffix = 1;

  while (existingIds.has(id)) {
    id = `account-${Date.now()}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function accountToForm(account: Account): AccountFormState {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: String(account.balance),
    annualReturn: String(account.annualReturn),
    notes: account.notes,
    active: account.active,
    includeInFireNetWorth: account.includeInFireNetWorth ?? account.type !== 'debt',
  };
}

export function Accounts({ accounts, onAccountsChange }: AccountsProps) {
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const summary = useMemo(() => calculateAccountSummary(accounts), [accounts]);
  const netWorth = summary.totalGrossAssets - summary.totalDebt;
  const isEditing = form.id !== null;

  function resetForm() {
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const savedAccount: Account = {
      id: form.id ?? createAccountId(accounts),
      name: form.name.trim() || 'Compte sense nom',
      type: form.type,
      balance: toSafeNumber(form.balance),
      annualReturn: toSafeNumber(form.annualReturn),
      notes: form.notes.trim(),
      active: form.active,
      includeInFireNetWorth: form.includeInFireNetWorth,
    };

    if (isEditing) {
      onAccountsChange(accounts.map((account) => (account.id === savedAccount.id ? savedAccount : account)));
    } else {
      onAccountsChange([...accounts, savedAccount]);
    }

    resetForm();
  }

  function handleDelete(accountId: string) {
    onAccountsChange(accounts.filter((account) => account.id !== accountId));

    if (form.id === accountId) {
      resetForm();
    }
  }

  function handleToggleActive(accountId: string) {
    onAccountsChange(
      accounts.map((account) =>
        account.id === accountId ? { ...account, active: !account.active } : account,
      ),
    );
  }

  function handleResetDemoAccounts() {
    onAccountsChange(getDefaultAccounts());
    resetForm();
  }

  return (
    <section className="accounts-page">
      <div className="accounts-header">
        <p className="eyebrow">Posició financera inicial</p>
        <h2>Comptes</h2>
        <p>
          Defineix manualment els comptes locals que alimenten el patrimoni inicial de la simulació.
          Els canvis es desen en aquest navegador.
        </p>
      </div>

      <div className="accounts-summary" aria-label="Resum de comptes">
        <article className="summary-card"><span>Patrimoni brut</span><strong>{formatEuros(summary.totalGrossAssets)}</strong></article>
        <article className="summary-card"><span>Deute total</span><strong>{formatEuros(summary.totalDebt)}</strong></article>
        <article className="summary-card"><span>Patrimoni net</span><strong>{formatEuros(netWorth)}</strong></article>
        <article className="summary-card"><span>Comptes actius</span><strong>{summary.activeAccountCount}</strong></article>
      </div>

      <form className="account-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">{isEditing ? 'Edita el compte' : 'Nou compte'}</p>
            <h3>{isEditing ? 'Actualitza les dades' : 'Afegeix un compte'}</h3>
          </div>
          <button className="secondary-action" onClick={handleResetDemoAccounts} type="button">Restablir comptes de mostra</button>
        </div>

        <div className="form-grid">
          <label>Nom del compte<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Tipus de compte<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AccountType })}>{Object.entries(accountTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Saldo<input inputMode="decimal" type="number" value={form.balance} onChange={(event) => setForm({ ...form, balance: event.target.value })} /></label>
          <label>Rendibilitat anual esperada<input inputMode="decimal" type="number" value={form.annualReturn} onChange={(event) => setForm({ ...form, annualReturn: event.target.value })} /></label>
          <label className="form-wide">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <label className="checkbox-field"><input checked={form.active} type="checkbox" onChange={(event) => setForm({ ...form, active: event.target.checked })} />Actiu</label>
          <label className="checkbox-field"><input checked={form.includeInFireNetWorth} type="checkbox" onChange={(event) => setForm({ ...form, includeInFireNetWorth: event.target.checked })} />Incloure en patrimoni FIRE</label>
        </div>

        <div className="form-actions">
          <button className="primary-action" type="submit">{isEditing ? 'Desar canvis' : 'Crear compte'}</button>
          {isEditing && <button className="secondary-action" onClick={resetForm} type="button">Cancel·lar edició</button>}
        </div>
      </form>

      <div className="account-grid">
        {accounts.map((account) => (
          <article className="account-card" key={account.id}>
            <div className="account-card-header"><div><p className="account-type">{accountTypeLabels[account.type]}</p><h3>{account.name}</h3></div><span className={account.active ? 'status active' : 'status inactive'}>{account.active ? 'Actiu' : 'Inactiu'}</span></div>
            <dl className="account-details"><div><dt>Saldo</dt><dd>{formatEuros(account.balance)}</dd></div><div><dt>Rendibilitat anual</dt><dd>{formatPercent(account.annualReturn)}</dd></div><div><dt>Patrimoni FIRE</dt><dd>{account.includeInFireNetWorth !== false && account.type !== 'debt' ? 'Sí' : 'No'}</dd></div></dl>
            {account.notes && <p className="account-notes">{account.notes}</p>}
            <div className="card-actions"><button className="secondary-action" onClick={() => setForm(accountToForm(account))} type="button">Editar</button><button className="secondary-action" onClick={() => handleToggleActive(account.id)} type="button">{account.active ? 'Marcar inactiu' : 'Marcar actiu'}</button><button className="danger-action" onClick={() => handleDelete(account.id)} type="button">Eliminar</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}
