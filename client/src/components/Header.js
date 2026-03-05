import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-mark">▰</span>
          <h1>ECG Hub</h1>
        </div>

        <nav className="top-nav" aria-label="Main navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#analysis" className="active">Analysis</a>
          <a href="#patients">Patients</a>
          <a href="#knowledge">Knowledge Base</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
