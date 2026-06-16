import React from 'react';

export default function TopBar({ title, children }) {
  return (
    <header className="topbar">
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-actions">
        {children}
      </div>
    </header>
  );
}
