import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, unreadCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Tactical HQ Wall', icon: 'dashboard' },
    { id: 'cameras', label: 'Live Cameras Matrix', icon: 'videocam' },
    { id: 'alerts', label: 'Alerts & Breaches', icon: 'warning', badge: unreadCount },
    { id: 'ai-copilot', label: 'Tactical AI Copilot', icon: 'smart_toy', isNew: true },
    { id: 'map', label: 'Tactical GIS Map', icon: 'map' },
    { id: 'zones', label: 'Tripwire Config', icon: 'polyline' },
    { id: 'analytics', label: 'Analytics & KPIs', icon: 'insights' },
    { id: 'mobile', label: 'Patrol Units QRT', icon: 'military_tech' },
    { id: 'audit', label: 'System / Logs', icon: 'terminal' },
  ];

  return (
    <aside className="w-64 bg-[#181c21] border-r border-[#3c494a]/60 flex flex-col justify-between select-none z-40">
      <div className="flex flex-col">
        {/* Header Strip */}
        <div className="px-4 py-3 border-b border-[#3c494a]/40 flex items-center justify-between">
          <span className="font-mono-hud text-[9px] text-[#bbc9ca] tracking-widest uppercase font-bold">
            TACTICAL NAVIGATION
          </span>
          <span className="font-mono-hud text-[9px] text-[#45dee8] font-bold">SYS-ACTIVE</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded transition-colors text-left ${
                  isActive
                    ? 'bg-[#00c2cc] text-[#004a4f] font-bold border-l-2 border-[#45dee8]'
                    : 'text-[#bbc9ca] hover:bg-[#262a30] hover:text-[#e0e2ea]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-base ${isActive ? 'text-[#004a4f]' : 'text-[#bbc9ca]'}`}>
                    {item.icon}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-semibold">{item.label}</span>
                </div>
                {item.isNew && (
                  <span className="font-mono-hud text-[9px] px-1.5 py-0.5 bg-[#101419] text-[#45dee8] border border-[#45dee8]/40 font-bold rounded">
                    GROQ AI
                  </span>
                )}
                {item.badge > 0 && (
                  <span className="font-mono-hud text-[10px] px-1.5 py-0.2 bg-[#93000a] text-[#ffdad6] font-bold rounded animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Edge Nodes Security Telemetry Box */}
      <div className="p-2 border-t border-[#3c494a]/60 bg-[#0a0e13]">
        <div className="flex flex-col gap-1 border border-[#3c494a] p-2 bg-[#181c21] rounded">
          <div className="flex items-center justify-between">
            <span className="font-mono-hud text-[9px] text-[#bbc9ca] tracking-wider uppercase font-bold">HQ LINK:</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#45dee8] rounded-full animate-pulse"></span>
              <span className="font-mono-hud text-[11px] text-[#45dee8] font-bold">CONNECTED</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono-hud text-[9px] text-[#bbc9ca] tracking-wider uppercase font-bold">EDGE NODES:</span>
            <span className="font-mono-hud text-[11px] text-[#e0e2ea] font-bold">4/4 SYNCED</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono-hud text-[9px] text-[#bbc9ca] tracking-wider uppercase font-bold">ENCRYPTION:</span>
            <span className="font-mono-hud text-[11px] text-[#5de6ff] font-bold">AES-128-CBC</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

