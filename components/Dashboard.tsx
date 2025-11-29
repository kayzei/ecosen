
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

const soilData = [
  { name: 'Moist', value: 65 },
  { name: 'Dry', value: 25 },
  { name: 'Critically Dry', value: 10 },
];

const yieldData = [
    { name: 'Maize', yield: 85 },
    { name: 'Cassava', yield: 65 },
    { name: 'Sorghum', yield: 92 },
    { name: 'Tomato', yield: 45 },
];

const COLORS = ['#34d399', '#facc15', '#f87171']; // emerald, amber, red

const DashboardCard: React.FC<{ title: string; children: React.ReactNode; badge?: React.ReactNode }> = ({ title, children, badge }) => (
  <div className="bg-slate-800/50 rounded-2xl p-4 border border-gray-700/50 relative overflow-hidden">
    <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-bold text-cyan-400">{title}</h3>
        {badge}
    </div>
    {children}
  </div>
);

const Dashboard: React.FC = () => {
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <div className="space-y-4 text-white">
      {/* Offline Mode Toggle Simulation */}
      <div className="flex justify-end items-center space-x-2 text-xs">
          <span className={offlineMode ? "text-gray-400" : "text-cyan-400 font-bold"}>Live Network</span>
          <button 
            onClick={() => setOfflineMode(!offlineMode)}
            className={`w-10 h-5 rounded-full relative transition-colors ${offlineMode ? 'bg-gray-600' : 'bg-cyan-500'}`}
          >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${offlineMode ? 'left-1' : 'right-1'}`}></div>
          </button>
          <span className={offlineMode ? "text-amber-400 font-bold" : "text-gray-400"}>Offline / Rural Mode</span>
      </div>

      <DashboardCard 
        title="Community Alerts" 
        badge={<span className="bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 rounded border border-red-500/30 animate-pulse">2 Active</span>}
      >
        <div className="space-y-3">
            <div className="bg-red-500/10 border-l-2 border-red-500 p-2 rounded-r flex flex-col">
                <span className="text-xs text-red-200 font-bold uppercase">Severe Weather</span>
                <span className="text-sm text-gray-300">Drought warning issued for Zone B. Soil moisture critically low.</span>
            </div>
             <div className="bg-amber-500/10 border-l-2 border-amber-500 p-2 rounded-r flex flex-col">
                <span className="text-xs text-amber-200 font-bold uppercase">Water Quality</span>
                <span className="text-sm text-gray-300">Borehole #4 flagged for high turbidity. Boil water advisory.</span>
            </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Soil Moisture Levels">
        <div className="flex items-center">
            <div className="w-1/2" style={{ height: 120 }}>
                <ResponsiveContainer>
                    <PieChart>
                    <Pie
                        data={soilData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {soilData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-1">
                {soilData.map((d, i) => (
                    <div key={i} className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: COLORS[i]}}></div>
                        <span className="text-gray-400">{d.name}</span>
                        <span className="ml-auto font-bold text-gray-200">{d.value}%</span>
                    </div>
                ))}
            </div>
        </div>
      </DashboardCard>
      
      <DashboardCard title="Crop Yield Forecast">
        <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
                <BarChart data={yieldData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="yield" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </DashboardCard>

       <DashboardCard title="Rural IoT Grid">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg">
                    <span className="text-gray-300 flex items-center">
                         <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                         Solar Pump Station A
                    </span>
                    <span className="text-emerald-400 text-xs font-mono">100% PWR</span>
                </div>
                 <div className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg">
                    <span className="text-gray-300 flex items-center">
                         <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                         Soil Sensor Array
                    </span>
                    <span className="text-emerald-400 text-xs font-mono">SYNCED</span>
                </div>
                 <div className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg opacity-70">
                    <span className="text-gray-300 flex items-center">
                         <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                         Remote Weather Unit
                    </span>
                    <span className="text-gray-500 text-xs font-mono">OFFLINE</span>
                </div>
            </div>
            {offlineMode && (
                <div className="mt-3 text-center">
                     <span className="text-xs text-amber-500 border border-amber-500/30 bg-amber-500/10 px-3 py-1 rounded-full">
                        Data queued for sync (12 items)
                     </span>
                </div>
            )}
        </DashboardCard>
    </div>
  );
};

export default Dashboard;
