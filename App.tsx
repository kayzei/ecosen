
import React, { useState } from 'react';
import CameraView from './components/CameraView';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import { CameraIcon } from './components/icons/CameraIcon';
import { DashboardIcon } from './components/icons/DashboardIcon';
import { DetectedObject, ScanHistoryItem, ScanMode } from './types';

type View = 'camera' | 'dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<View>('camera');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const handleScanComplete = (image: string, detections: DetectedObject[], mode: ScanMode) => {
    const newScan: ScanHistoryItem = {
      id: Date.now(),
      image,
      detections,
      mode,
    };
    setScanHistory(prevHistory => [newScan, ...prevHistory]);
  };

  const handleClearHistory = () => {
    setScanHistory([]);
  };


  const NavItem = ({
    label,
    icon,
    isActive,
    onClick,
  }: {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-300 ${
        isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-300'
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm h-[800px] max-h-[90vh] bg-black rounded-[40px] border-8 border-gray-700 shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-700 rounded-b-xl z-20"></div>

        <div className="flex-grow bg-gradient-to-br from-slate-900 via-slate-900 to-gray-800 flex flex-col relative">
          <Header />
          <main className="flex-grow overflow-y-auto p-4 pb-20">
            {view === 'camera' && (
              <CameraView 
                history={scanHistory}
                onScanComplete={handleScanComplete}
                onClearHistory={handleClearHistory}
              />
            )}
            {view === 'dashboard' && <Dashboard />}
          </main>
          
          <footer className="absolute bottom-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-sm border-t border-gray-700/50 rounded-b-[32px]">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-400 rounded-full mb-2"></div>
            <nav className="flex h-full items-center justify-around px-4 pt-1">
              <NavItem
                label="Detect"
                icon={<CameraIcon className="w-6 h-6" />}
                isActive={view === 'camera'}
                onClick={() => setView('camera')}
              />
              <NavItem
                label="Dashboard"
                icon={<DashboardIcon className="w-6 h-6" />}
                isActive={view === 'dashboard'}
                onClick={() => setView('dashboard')}
              />
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;