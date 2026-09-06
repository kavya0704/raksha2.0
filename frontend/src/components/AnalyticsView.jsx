import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { apiService } from '../utils/apiService';

const COLORS = ['#ffb4ab', '#ff9089', '#45dee8', '#5de6ff', '#a2eeff'];

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const res = await apiService.getAnalytics();
    setData(res);
    setLoading(false);
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-outline font-mono">Loading Tactical Intelligence...</div>;
  }

  const { kpis, hourly_trends, classification_breakdown, heatmap_matrix } = data;

  return (
    <div className="p-5 bg-surface-container-lowest flex-1 overflow-y-auto font-mono select-none space-y-5">
      {/* View Title */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
        <div>
          <h1 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">insights</span>
            <span className="font-headline-sm uppercase tracking-wider text-primary">BORDER SECTOR INTELLIGENCE & THREAT ANALYTICS</span>
          </h1>
          <p className="text-[11px] text-on-surface-variant font-sans">Aggregated real-time metrics across all frontier outposts</p>
        </div>
        <span className="text-[10px] text-primary bg-surface-container px-2.5 py-1 border border-outline-variant rounded font-bold">
          SYSTEM HEALTH: 99.98% UPTIME
        </span>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-low p-3.5 rounded border border-outline-variant space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span className="font-hud-micro uppercase">TOTAL INCURSIONS</span>
            <span className="material-symbols-outlined text-error text-base">crisis_alert</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{kpis.total_alerts}</div>
          <div className="text-[10px] text-error flex items-center gap-1">
            <span>+3 in last 4 hours</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-3.5 rounded border border-primary/30 space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span className="font-hud-micro uppercase">FALSE-POSITIVE REDUCTION</span>
            <span className="material-symbols-outlined text-primary text-base">verified_user</span>
          </div>
          <div className="text-2xl font-bold text-primary">{kpis.false_positive_reduction_pct}</div>
          <div className="text-[10px] text-secondary">
            {kpis.suppressed_wildlife_count} wildlife alerts filtered
          </div>
        </div>

        <div className="bg-surface-container-low p-3.5 rounded border border-outline-variant space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span className="font-hud-micro uppercase">MEAN ACK TIME (MTTA)</span>
            <span className="material-symbols-outlined text-primary text-base">schedule</span>
          </div>
          <div className="text-2xl font-bold text-primary">{kpis.avg_response_time_seconds}s</div>
          <div className="text-[10px] text-on-surface-variant">Target SLA: &lt; 30s</div>
        </div>

        <div className="bg-surface-container-low p-3.5 rounded border border-outline-variant space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant text-xs">
            <span className="font-hud-micro uppercase">ACTIVE SENTINEL CAMERAS</span>
            <span className="material-symbols-outlined text-secondary text-base">videocam</span>
          </div>
          <div className="text-2xl font-bold text-secondary">4 / 4 ONLINE</div>
          <div className="text-[10px] text-primary">100% Perimeter Coverage</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Incursion Frequency */}
        <div className="bg-surface-container-low p-4 rounded border border-outline-variant space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">trending_up</span>
              <span>24-HOUR INCURSION HOURLY FREQUENCY</span>
            </span>
            <span className="text-[10px] text-on-surface-variant">UTC+5:30</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourly_trends}>
                <XAxis dataKey="hour" stroke="#859394" fontSize={10} />
                <YAxis stroke="#859394" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0e13', borderColor: '#3c494a', color: '#e0e2ea', fontSize: 11 }} />
                <Line type="monotone" dataKey="incursions" stroke="#ffb4ab" strokeWidth={2} dot={{ r: 3, fill: '#ffb4ab' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breach Classification Breakdown */}
        <div className="bg-surface-container-low p-4 rounded border border-outline-variant space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">pie_chart</span>
              <span>CLASSIFICATION SPECTRUM</span>
            </span>
            <span className="text-[10px] text-on-surface-variant">YOLOv8 + BEHAVIOR</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classification_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="category"
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {classification_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a0e13', borderColor: '#3c494a', color: '#e0e2ea', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
