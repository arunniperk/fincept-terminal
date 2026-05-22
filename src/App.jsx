import React, { useState, lazy, Suspense } from 'react';
import { T, applyTheme } from './theme';
import { Sidebar } from './components/Sidebar';
import { Loading } from './components/ui';
import { getItem, setItem } from './storage';

const Dashboard = lazy(() => import('./modules/Dashboard').then(m => ({ default: m.Dashboard })));
const Markets = lazy(() => import('./modules/Markets').then(m => ({ default: m.Markets })));
const Portfolio = lazy(() => import('./modules/Portfolio').then(m => ({ default: m.Portfolio })));
const Watchlist = lazy(() => import('./modules/Watchlist').then(m => ({ default: m.Watchlist })));
const News = lazy(() => import('./modules/News').then(m => ({ default: m.News })));
const AIAgentChat = lazy(() => import('./modules/AIAgentChat').then(m => ({ default: m.AIAgentChat })));
const Economics = lazy(() => import('./modules/Economics').then(m => ({ default: m.Economics })));
const Brokers = lazy(() => import('./modules/Brokers').then(m => ({ default: m.Brokers })));
const Optimizer = lazy(() => import('./modules/Optimizer').then(m => ({ default: m.Optimizer })));
const Notes = lazy(() => import('./modules/Notes').then(m => ({ default: m.Notes })));
const Alerts = lazy(() => import('./modules/Alerts').then(m => ({ default: m.Alerts })));
const Settings = lazy(() => import('./modules/Settings').then(m => ({ default: m.Settings })));

applyTheme(T);

export default function App() {
  const [activeModule, setActiveModule] = useState(getItem('pm_active_module', 'dashboard'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleModuleChange = (id) => {
    setActiveModule(id);
    setItem('pm_active_module', id);
  };

  const renderModule = () => {
    const props = { T };
    switch (activeModule) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'markets': return <Markets {...props} />;
      case 'portfolio': return <Portfolio {...props} />;
      case 'watchlist': return <Watchlist {...props} />;
      case 'news': return <News {...props} />;
      case 'ai': return <AIAgentChat {...props} />;
      case 'economics': return <Economics {...props} />;
      case 'brokers': return <Brokers {...props} />;
      case 'optimizer': return <Optimizer {...props} />;
      case 'notes': return <Notes {...props} />;
      case 'alerts': return <Alerts {...props} />;
      case 'settings': return <Settings {...props} onThemeChange={(t) => {}} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      background: T.bg, color: T.text, fontFamily: T.font,
      overflow: 'hidden',
    }}>
      <Sidebar T={T} active={activeModule} onChange={handleModuleChange}
        collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
      }}>
        <Suspense fallback={<Loading T={T} />}>
          {renderModule()}
        </Suspense>
      </div>
    </div>
  );
}
