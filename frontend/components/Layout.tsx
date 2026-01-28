import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { Page } from '../App';
import type { ReactNode } from 'react';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  title?: string;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, title, children }: LayoutProps) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F8FAFC' }}>
      {/* Fixed Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      
      {/* Main content wrapper - offset by sidebar width */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          bottom: 0, 
          left: '256px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Fixed TopBar */}
        <div style={{ flexShrink: 0 }}>
          <TopBar title={title} />
        </div>
        
        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
