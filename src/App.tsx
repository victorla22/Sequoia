import { useEffect, useState, type ReactNode } from 'react';
import { Header } from './components/Header.tsx';
import { useScenarioSettings } from './hooks/useScenarioSettings.ts';
import { Accounts } from './pages/Accounts.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Results } from './pages/Results.tsx';
import { ScenarioConfiguration } from './pages/ScenarioConfiguration.tsx';
import type { Account } from './models/account.ts';
import type { Transfer } from './models/transfer.ts';
import type { FutureRule } from './models/futureRule.ts';
import { loadStoredAccounts, persistAccounts } from './utils/accounts.ts';
import { loadStoredTransfers, persistTransfers } from './utils/transfers.ts';
import { loadStoredFutureRules, persistFutureRules } from './utils/futureRules.ts';

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
  transfers: Transfer[],
  setTransfers: (transfers: Transfer[]) => void,
  futureRules: FutureRule[],
  setFutureRules: (futureRules: FutureRule[]) => void,
  scenario: ReturnType<typeof useScenarioSettings>['scenario'],
  setScenario: ReturnType<typeof useScenarioSettings>['setScenario'],
  resetScenario: ReturnType<typeof useScenarioSettings>['resetScenario'],
): Record<PageKey, { label: string; content: ReactNode }> {
  return {
    dashboard: {
      label: pageLabels.dashboard,
      content: <Dashboard accounts={accounts} scenario={scenario} />,
    },
    accounts: {
      label: pageLabels.accounts,
      content: <Accounts accounts={accounts} onAccountsChange={setAccounts} />,
    },
    scenario: {
      label: pageLabels.scenario,
      content: (
        <ScenarioConfiguration
          scenario={scenario}
          onResetScenario={resetScenario}
          accounts={accounts}
          transfers={transfers}
          onTransfersChange={setTransfers}
          onScenarioChange={setScenario}
          futureRules={futureRules}
          onFutureRulesChange={setFutureRules}
        />
      ),
    },
    results: {
      label: pageLabels.results,
      content: <Results accounts={accounts} scenario={scenario} transfers={transfers} futureRules={futureRules} />,
    },
  };
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const { scenario, setScenario, resetScenario } = useScenarioSettings();
  const [accounts, setAccounts] = useState<Account[]>(loadStoredAccounts);
  const [transfers, setTransfers] = useState<Transfer[]>(() => loadStoredTransfers(accounts));
  const [futureRules, setFutureRules] = useState<FutureRule[]>(loadStoredFutureRules);

  useEffect(() => {
    persistAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    persistTransfers(transfers);
  }, [transfers]);

  useEffect(() => {
    persistFutureRules(futureRules);
  }, [futureRules]);

  const pages = buildPages(
    accounts,
    setAccounts,
    transfers,
    setTransfers,
    futureRules,
    setFutureRules,
    scenario,
    setScenario,
    resetScenario,
  );

  return (
    <div className="app-shell">
      <Header pages={pages} activePage={activePage} onNavigate={setActivePage} />
      <main className="page-container">{pages[activePage].content}</main>
    </div>
  );
}

export default App;