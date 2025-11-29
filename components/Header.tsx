
import React from 'react';
import { LeafIcon } from './icons/LeafIcon';

const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 flex items-center justify-between p-4 text-white z-10 w-full">
      <div className="w-8"></div> {/* Spacer for balance */}
      
      <div className="flex items-center">
        <LeafIcon className="w-6 h-6 text-cyan-400 mr-2" />
        <h1 className="text-xl font-bold tracking-wider">
            <span className="text-cyan-400">Eco</span>
            <span className="text-gray-300">Sense</span>
        </h1>
      </div>

      {/* Connectivity Status Indicator */}
      <div className="flex items-end space-x-1 w-8 justify-end" title="Signal Strength: Good">
         <div className="w-1 h-2 bg-cyan-500 rounded-sm"></div>
         <div className="w-1 h-3 bg-cyan-500 rounded-sm"></div>
         <div className="w-1 h-4 bg-cyan-500/30 rounded-sm"></div>
         <div className="w-1 h-5 bg-cyan-500/30 rounded-sm"></div>
      </div>
    </header>
  );
};

export default Header;
