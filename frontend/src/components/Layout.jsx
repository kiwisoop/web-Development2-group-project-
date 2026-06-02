import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  return (
    <div className="sl-app">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <main className="sl-main">
        <ErrorBoundary>
          <Topbar />
        </ErrorBoundary>
        <div className="sl-page">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
