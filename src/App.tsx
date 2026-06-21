import { useState, type ReactNode } from 'react';
import { Header } from './components/Header.tsx';
import { useScenarioSettings } from './hooks/useScenarioSettings.ts';
import { Accounts } from './pages/Accounts.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Results } from './pages/Results.tsx';
import { ScenarioConfiguration } from './pages/ScenarioConfiguration.tsx';

export type PageKey = 'dashboard' | 'accounts' | 'scenario' | 'results';

const pageLabels: Record<PageKey, string> = {
  dashboard: 'Panell',
  accounts: 'Comptes',
  scenario: 'Configuració d’escenari',
  results: 'Resultats',
};

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const { scenario, setScenario, resetScenario } = useScenarioSettings();

  const pages: Record<PageKey, { label: string; content: ReactNode }> = {
    dashboard: {
      label: pageLabels.dashboard,
      content: <Dashboard scenario={scenario} />,
    },
    accounts: {
      label: pageLabels.accounts,
      content: <Accounts />,
    },
    scenario: {
      label: pageLabels.scenario,
      content: (
        <ScenarioConfiguration
          scenario={scenario}
          onResetScenario={resetScenario}
          onScenarioChange={setScenario}
        />
      ),
    },
    results: {
      label: pageLabels.results,
      content: <Results scenario={scenario} />,
    },
  };

  return (
    <div className="app-shell">
      <Header pages={pages} activePage={activePage} onNavigate={setActivePage} />
      <main className="page-container">{pages[activePage].content}</main>
    </div>
  );
}

export default App;
