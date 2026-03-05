import React from 'react';
import './Header.css';

function Header({ activeView, onNavigate }) {
  const handleNavigate = (event, view) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-mark">▰</span>
          <h1>ECG Hub</h1>
        </div>

        <nav className="top-nav" aria-label="Main navigation">
          <a href="#analysis" className={activeView === 'analysis' ? 'active' : ''} onClick={(event) => handleNavigate(event, 'analysis')}>
            Analysis
          </a>
          <a
            href="#knowledge-base"
            className={activeView === 'knowledge-base' ? 'active' : ''}
            onClick={(event) => handleNavigate(event, 'knowledge-base')}
          >
            Knowledge Base
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
