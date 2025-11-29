
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
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34,211,238,0.3);
          border-radius: 2px;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      <div className="w-full max-w-sm h-[800px] max-h-[90vh] bg-black rounded-[40px] border-8 border-gray-700 shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-700 rounded-b-xl z-30 pointer-events-none"></div>

        <div className="flex-grow bg-slate-900 flex flex-col relative overflow-hidden">
          <Header />
          <main className="flex-grow overflow-y-auto overflow-x-hidden no-scrollbar pb-24">
            {view === 'camera' && (
              <CameraView 
                history={scanHistory}
                onScanComplete={handleScanComplete}
                onClearHistory={handleClearHistory}
              />
            )}
            {view === 'dashboard' && <Dashboard />}
          </main>
          
          <footer className="absolute bottom-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-lg border-t border-gray-700/50 rounded-b-[32px] z-20">
             <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-500 rounded-full mb-1"></div>
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
