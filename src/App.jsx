import React, { useState } from 'react';
import { DbProvider } from './api/db-context';
import Layout from './components/Layout';
import RecordsPage from './pages/RecordsPage';
import CategoriesPage from './pages/CategoriesPage';
import StatsPage from './pages/StatsPage';
import BudgetsPage from './pages/BudgetsPage';
import AddRecordPage from './pages/AddRecordPage';
import ProfilePage from './pages/ProfilePage';
import ManagementPage from './pages/ManagementPage';

const pages = {
  records: RecordsPage,
  categories: CategoriesPage,
  stats: StatsPage,
  budgets: BudgetsPage,
  add: AddRecordPage,
  profile: ProfilePage,
  management: ManagementPage,
};

export default function App() {
  const [activeNav, setActiveNav] = useState('records');

  // Expose for AddRecordPage to navigate back
  window.__setActiveNav = setActiveNav;

  const PageComponent = pages[activeNav];

  return (
    <DbProvider>
      <Layout activeNav={activeNav} onNavChange={setActiveNav}>
        <PageComponent />
      </Layout>
    </DbProvider>
  );
}
