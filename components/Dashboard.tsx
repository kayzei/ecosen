
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const soilData = [
  { name: 'Moist', value: 65 },
  { name: 'Dry', value: 25 },
  { name: 'Critical', value: 10 },
];

const yieldData = [
    { name: 'Maize', yield: 85 },
    { name: 'Cassava', yield: 65 },
    { name: 'Sorghum', yield: 92 },
    { name: 'Tomato', yield: 45 },
];

const COLORS = ['#10b981', '#fbbf24', '#ef4444']; // emerald-500, amber-400, red-500

const DashboardCard: React.FC<{ title: string; children: React.ReactNode; badge?: React.ReactNode }> = ({ title, children, badge }) => (
  <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors duration-500">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-2xl"></div>
    </div>
    <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-sm font-bold text-gray-200 tracking-wide uppercase">{title}</h3>
        {badge}
    </div>
    <div className="relative z-10">
        {children}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <div className="space-y-5 text-white p-4">
      {/* Offline Mode Toggle Simulation */}
      <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Environment</h2>
          <div className="flex items-center space-x-3 text-xs bg-slate-800/50 p-1.5 rounded-full border border-slate-700/50">
            <button 
                onClick={() => setOfflineMode(!offlineMode)}
                className={`flex items-center px-3 py-1.5 rounded-full transition-all duration-300 ${!offlineMode ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
                Live
            </button>
            <button 
                onClick={() => setOfflineMode(!offlineMode)}
                className={`flex items-center px-3 py-1.5 rounded-full transition-all duration-300 ${offlineMode ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
                Offline
            </button>
          </div>
      </div>

      <DashboardCard 
        title="Community Alerts" 
        badge={<span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">2 ALERT</span>}
      >
        <div className="space-y-3">
            <div className="bg-red-500/10 border-l-2 border-red-500 p-3 rounded-r-lg flex flex-col hover:bg-red-500/20 transition-colors cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-red-300 font-bold uppercase tracking-wider">Severe Weather</span>
                    <span className="text-[10px] text-red-300/60">10m ago</span>
                </div>
                <span className="text-sm text-gray-200 leading-tight">Drought warning issued for Zone B. Soil moisture critically low.</span>
            </div>
             <div className="bg-amber-500/10 border-l-2 border-amber-500 p-3 rounded-r-lg flex flex-col hover:bg-amber-500/20 transition-colors cursor-pointer">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">Water Quality</span>
                    <span className="text-[10px] text-amber-300/60">2h ago</span>
                </div>
                <span className="text-sm text-gray-200 leading-tight">Borehole #4 flagged for high turbidity. Boil water advisory.</span>
            </div>
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 gap-5">
        <DashboardCard title="Soil Moisture">
            <div className="flex items-center justify-between">
                <div className="w-32 h-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={soilData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {soilData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-white">65%</span>
                        <span className="text-[10px] text-gray-400 uppercase">Avg</span>
                    </div>
                </div>
                <div className="flex-1 pl-6 space-y-2">
                    {soilData.map((d, i) => (
                        <div key={i} className="flex items-center text-xs">
                            <div className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: COLORS[i]}}></div>
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
                    <BarChart data={yieldData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#bae6fd' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)', radius: 4}}
                        />
                        <Bar 
                            dataKey="yield" 
                            fill="#06b6d4" 
                            radius={[6, 6, 6, 6]} 
                            barSize={16}
                            animationDuration={1500}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </DashboardCard>
      </div>

       <DashboardCard title="Rural IoT Grid">
            <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center">
                         <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 border border-emerald-500/30">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></div>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">Pump Station A</span>
                            <span className="text-[10px] text-gray-500">Last sync: Just now</span>
                         </div>
                    </div>
                    <span className="text-emerald-400 text-xs font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded">ONLINE</span>
                </div>
                 <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center">
                         <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 border border-emerald-500/30">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></div>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">Soil Sensors</span>
                            <span className="text-[10px] text-gray-500">Last sync: 2m ago</span>
                         </div>
                    </div>
                    <span className="text-emerald-400 text-xs font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded">SYNCED</span>
                </div>
                 <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-white/5 opacity-60">
                    <div className="flex items-center">
                         <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center mr-3 border border-slate-600">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">Weather Unit</span>
                            <span className="text-[10px] text-gray-500">Last sync: 4h ago</span>
                         </div>
                    </div>
                    <span className="text-gray-400 text-xs font-mono font-bold bg-slate-700/30 px-2 py-1 rounded">OFFLINE</span>
                </div>
            </div>
            {offlineMode && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center space-x-2">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                     <span className="text-xs text-amber-200 font-medium">
                        12 data points queued for sync
                     </span>
                </div>
            )}
        </DashboardCard>
    </div>
  );
};

export default Dashboard;
