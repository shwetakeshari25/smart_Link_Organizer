import React from 'react';
import { 
  BarChart as ReChartsBar, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as ReChartsPie, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { 
  BarChart2, PieChart as PieChartIcon, Activity, 
  CheckCircle, Clock, FileText, Tag
} from 'lucide-react';
import type { LinkItem } from './LinkCard';

interface AnalyticsViewProps {
  links: LinkItem[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ links }) => {
  
  // 1. Calculate General Stats
  const totalLinks = links.length;
  
  const completedLinks = links.filter(l => l.progress === 'Completed').length;
  const watchingLinks = links.filter(l => l.progress === 'Watching').length;
  
  const completionRate = totalLinks > 0 ? Math.round((completedLinks / totalLinks) * 100) : 0;
  const uniqueTagsCount = new Set(links.flatMap(l => l.tags)).size;

  // 2. Platform Data for Pie Chart
  const getPlatformData = () => {
    const counts: Record<string, number> = {};
    links.forEach(l => {
      counts[l.platform] = (counts[l.platform] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const platformData = getPlatformData();
  const COLORS = ['#2563EB', '#14B8A6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#64748B'];

  // 3. Category Data for Bar Chart
  const getCategoryData = () => {
    const counts: Record<string, number> = {};
    links.forEach(l => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const categoryData = getCategoryData();

  // 4. Weekly Activity Data for Area Chart (Last 7 Days)
  const getWeeklyActivityData = () => {
    const data = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last 7 days with 0 counts
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toDateString();
      const dayName = days[d.getDay()];
      
      const count = links.filter(l => new Date(l.savedAt).toDateString() === dateString).length;
      
      data.push({
        name: dayName,
        linksSaved: count
      });
    }
    return data;
  };

  const weeklyData = getWeeklyActivityData();

  return (
    <div className="space-y-6">
      <h1 className="heading-font text-2xl font-extrabold text-slate-800 dark:text-white">
        Productivity Analytics
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm -mt-4">
        Track your learning consistency, platform distribution, and categories.
      </p>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 card-sky-blue rounded-3xl border border-[#49C6F8]/20 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-white/30 rounded-2xl text-[#2E3558]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-black text-[#2E3558] heading-font">{totalLinks}</span>
            <span className="text-[10px] uppercase font-bold text-[#2E3558]/80 tracking-wider">Total Links</span>
          </div>
        </div>

        <div className="p-5 card-mint-green rounded-3xl border border-[#7EE7C4]/20 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-white/30 rounded-2xl text-[#2E3558]">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-black text-[#2E3558] heading-font">{completionRate}%</span>
            <span className="text-[10px] uppercase font-bold text-[#2E3558]/80 tracking-wider">Completion Rate</span>
          </div>
        </div>

        <div className="p-5 card-peach rounded-3xl border border-[#F8C79A]/20 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-white/30 rounded-2xl text-[#2E3558]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-black text-[#2E3558] heading-font">{watchingLinks}</span>
            <span className="text-[10px] uppercase font-bold text-[#2E3558]/80 tracking-wider">In Progress</span>
          </div>
        </div>

        <div className="p-5 card-baby-pink rounded-3xl border border-[#F8B4D9]/20 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-white/30 rounded-2xl text-[#2E3558]">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-black text-[#2E3558] heading-font">{uniqueTagsCount}</span>
            <span className="text-[10px] uppercase font-bold text-[#2E3558]/80 tracking-wider">Unique Tags</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Weekly Activity Chart */}
        <div className="p-6 bg-gradient-to-br from-white/95 to-[#5B5FEF]/10 border border-[#5B5FEF]/30 rounded-3xl shadow-lg">
          <h3 className="heading-font text-base font-bold text-[#2E3558] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#6850F2]" /> Weekly Saving Activity
          </h3>
          <div className="h-64">
            {totalLinks === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-450">No activity data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '11px',
                      fontFamily: "'Inter', sans-serif"
                    }} 
                  />
                  <Area type="monotone" dataKey="linksSaved" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorSaved)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Platform Distribution Pie Chart */}
        <div className="p-6 bg-gradient-to-br from-white/95 to-[#49C6F8]/10 border border-[#49C6F8]/30 rounded-3xl shadow-lg">
          <h3 className="heading-font text-base font-bold text-[#2E3558] mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-[#6850F2]" /> Platform Share
          </h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
            {totalLinks === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-450">No platform data yet</div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsPieChartWrapper platformData={platformData} colors={COLORS} />
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend */}
                <div className="w-full sm:w-1/2 overflow-y-auto max-h-56 pr-2 space-y-2">
                  {platformData.map((entry, index) => {
                    const percent = Math.round((entry.value / totalLinks) * 100);
                    return (
                      <div key={entry.name} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-350">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="truncate max-w-[100px]">{entry.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white">{entry.value} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Category Distribution Bar Chart */}
        <div className="p-6 bg-gradient-to-br from-white/95 to-[#7EE7C4]/10 border border-[#7EE7C4]/30 rounded-3xl shadow-lg lg:col-span-2">
          <h3 className="heading-font text-base font-bold text-[#2E3558] mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#34BEA9]" /> Category Breakdown
          </h3>
          <div className="h-64">
            {totalLinks === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-450">No category data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ReChartsBar data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '11px'
                    }} 
                  />
                  <Bar dataKey="value" fill="#14B8A6" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </ReChartsBar>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

// Isolated Pie chart component to satisfy TypeScript nesting compiler
interface PieWrapperProps {
  platformData: { name: string; value: number }[];
  colors: string[];
}

const ReChartsPieChartWrapper: React.FC<PieWrapperProps> = ({ platformData, colors }) => {
  return (
    <ReChartsPie>
      <Pie
        data={platformData}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={2}
        dataKey="value"
      >
        {platformData.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
          border: 'none', 
          borderRadius: '12px',
          color: '#F8FAFC',
          fontSize: '11px'
        }} 
      />
    </ReChartsPie>
  );
};
