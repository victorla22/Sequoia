import type { PageKey } from '../App.tsx';

type HeaderProps = {
  pages: Record<PageKey, { label: string }>;
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
};

export function Header({ pages, activePage, onNavigate }: HeaderProps) {
  return (
    <header className="site-header">
      <div>
        <p className="eyebrow">Proyecto Sequoia</p>
        <h1>Sequoia</h1>
      </div>

      <nav className="site-nav" aria-label="Main navigation">
        {Object.entries(pages).map(([key, page]) => {
          const pageKey = key as PageKey;
          const isActive = activePage === pageKey;

          return (
            <button
              className={isActive ? 'nav-link active' : 'nav-link'}
              key={pageKey}
              onClick={() => onNavigate(pageKey)}
              type="button"
            >
              {page.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
