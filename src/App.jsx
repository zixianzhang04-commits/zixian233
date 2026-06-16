import React, { useState } from 'react';
import { DbProvider } from './api/db-context';
import Layout from './components/Layout';
import RecordsPage from './pages/RecordsPage';
import CategoriesPage from './pages/CategoriesPage';
import StatsPage from './pages/StatsPage';
import BudgetsPage from './pages/BudgetsPage';

const pages = {
  records: RecordsPage,
  categories: CategoriesPage,
  stats: StatsPage,
  budgets: BudgetsPage,
};

export default function App() {
  const [activeNav, setActiveNav] = useState('records');
  const PageComponent = pages[activeNav];

  return (
    <DbProvider>
      <Layout activeNav={activeNav} onNavChange={setActiveNav}>
        <PageComponent />
      </Layout>
    </DbProvider>
  );
}
