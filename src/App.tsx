import { useEffect, useState, type ReactNode } from 'react';
import { Header } from './components/Header.tsx';
import { Accounts } from './pages/Accounts.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Results } from './pages/Results.tsx';
import { ScenarioConfiguration } from './pages/ScenarioConfiguration.tsx';
import type { Account } from './models/account.ts';
import { loadStoredAccounts, persistAccounts } from './utils/accounts.ts';

export type PageKey = 'dashboard' | 'accounts' | 'scenario' | 'results';

const pageLabels: Record<PageKey, string> = {
  dashboard: 'Panell',
  accounts: 'Comptes',
  scenario: 'Configuració d’escenari',
  results: 'Resultats',
};

function buildPages(
  accounts: Account[],
  setAccounts: (accounts: Account[]) => void,
): Record<PageKey, { label: string; content: ReactNode }> {
  return {
    dashboard: {
      label: pageLabels.dashboard,
      content: <Dashboard accounts={accounts} />,
    },
    accounts: {
      label: pageLabels.accounts,
      content: <Accounts accounts={accounts} onAccountsChange={setAccounts} />,
    },
    scenario: {
      label: pageLabels.scenario,
      content: <ScenarioConfiguration />,
    },
    results: {
      label: pageLabels.results,
      content: <Results accounts={accounts} />,
    },
  };
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>(loadStoredAccounts);
  const pages = buildPages(accounts, setAccounts);

  useEffect(() => {
    persistAccounts(accounts);
  }, [accounts]);

  return (
    <div className="app-shell">
      <Header pages={pages} activePage={activePage} onNavigate={setActivePage} />
      <main className="page-container">{pages[activePage].content}</main>
    </div>
  );
}

export default App;
