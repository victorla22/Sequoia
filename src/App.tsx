import { useState, type ReactNode } from 'react';
import { Header } from './components/Header.tsx';
import { Accounts } from './pages/Accounts.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Results } from './pages/Results.tsx';
import { ScenarioConfiguration } from './pages/ScenarioConfiguration.tsx';

export type PageKey = 'dashboard' | 'accounts' | 'scenario' | 'results';

const pages: Record<PageKey, { label: string; content: ReactNode }> = {
  dashboard: {
    label: 'Dashboard',
    content: <Dashboard />,
  },
  accounts: {
    label: 'Accounts',
    content: <Accounts />,
  },
  scenario: {
    label: 'Scenario Configuration',
    content: <ScenarioConfiguration />,
  },
  results: {
    label: 'Results',
    content: <Results />,
  },
};

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');

  return (
    <div className="app-shell">
      <Header pages={pages} activePage={activePage} onNavigate={setActivePage} />
      <main className="page-container">{pages[activePage].content}</main>
    </div>
  );
}

export default App;
