import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { OverviewSection } from '../components/admin/OverviewSection';
import { ServicesSection } from '../components/admin/ServicesSection';
import { UsersSection } from '../components/admin/UsersSection';
import { OrdersSection } from '../components/admin/OrdersSection';
import { ActivitySection } from '../components/admin/ActivitySection';
import { SettingsSection } from '../components/admin/SettingsSection';

export function Admin() {
  const [activeSection, setActiveSection] = useState('overview');
  return (
    <AdminLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}>
      
      {activeSection === 'overview' && <OverviewSection />}
      {activeSection === 'services' && <ServicesSection />}
      {activeSection === 'users' && <UsersSection />}
      {activeSection === 'orders' && <OrdersSection />}
      {activeSection === 'activity' && <ActivitySection />}
      {activeSection === 'settings' && <SettingsSection />}
    </AdminLayout>
  );
}