import React, { useState, useEffect } from 'react';

export default function Navbar({ 
  sector, 
  setSector, 
  networkStatus, 
  queuedCount, 
  user, 
  onLogout,
  isMuted,
  onToggleMute,
  onTestSiren,
  activeAlarm
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0') + ' ZULU');
    };
    update();
    const timer = setInterval(update, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-[#181c21] border-b border-[#3c494a]/60 z-50 px-4 flex items-center justify-between select-none">
      {/* Brand & Emblem */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Custom SVG Radar Emblem */}
          <div className="w-8 h-8 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="32" height="32" fill="none">
              <circle cx="80" cy="80" r="74" stroke="#00C2CC" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 4"/>
              <circle cx="80" cy="80" r="64" stroke="#00C2CC" strokeWidth="2.5" strokeOpacity="0.8"/>
              <polygon points="80,32 120,52 120,96 80,126 40,96 40,52" fill="#0B131D" stroke="#22D3EE" strokeWidth="2.5"/>
              <circle cx="80" cy="78" r="26" stroke="#00C2CC" strokeWidth="1.5" strokeOpacity="0.5"/>
              <circle cx="80" cy="78" r="14" stroke="#00C2CC" strokeWidth="1.5" strokeOpacity="0.8"/>
              <circle cx="80" cy="78" r="4" fill="#EF4444"/>
              <path d="M80 78 L98 62" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
              <path d="M80 78 L60 56 A32 32 0 0 1 100 56 Z" fill="#00C2CC" fillOpacity="0.25"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#45dee8] tracking-wider uppercase font-headline-sm">
              BSF SENTINEL-AI // TACTICAL SURVEILLANCE & RECON
            </span>
            <span className="font-mono-hud text-[9px] text-[#bbc9ca] uppercase tracking-widest font-bold">
              BORDER SECURITY FORCE MIL-INT CORE // SIH26187
            </span>
          </div>
        </div>

        {/* Sector Badge */}
        <div className="hidden xl:flex items-center border border-[#3c494a] bg-[#1c2025] px-2.5 py-1 rounded">
          <span className="w-1.5 h-1.5 bg-[#45dee8] mr-2"></span>
          <span className="font-mono-hud text-[10px] text-[#5de6ff] tracking-widest uppercase font-bold">
            SECTOR-IV (NORTH-WEST RAJASTHAN COMMAND)
          </span>
        </div>
      </div>

      {/* Middle: Mission Time & DEFCON status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#0a0e13] border border-[#3c494a] px-3 py-1.5 rounded">
          <span className="font-mono-hud text-[9px] text-[#bbc9ca] uppercase">MISSION TIME</span>
          <span className="font-mono-hud text-xs text-[#45dee8] tracking-widest font-bold">{timeStr}</span>
        </div>
        <div className="hidden md:flex items-center bg-[#1c2025] border border-[#3c494a] px-2.5 py-1 rounded">
          <span className="font-mono-hud text-[10px] px-1.5 py-0.5 bg-[#ff9089] text-[#8b0012] border border-[#ffb4ab]/50 font-bold uppercase rounded">
            DEFCON 3 // ELEVATED READY
          </span>
        </div>
      </div>

      {/* Right: Alarm Controls, Telemetry, Alerts & Officer Profile */}
      <div className="flex items-center gap-3">
        {/* Tactical Alarm / Siren Control */}
        <div className="flex items-center gap-1.5 bg-[#0a0e13] border border-[#3c494a] px-2 py-1 rounded">
          <button
            onClick={onTestSiren}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#ffb4ab]/20 hover:bg-[#ffb4ab]/30 border border-[#ffb4ab]/50 text-[#ffb4ab] font-mono-hud text-[10px] rounded font-bold transition-all"
            title="Test tactical intrusion siren sound"
          >
            <span className="material-symbols-outlined text-xs">crisis_alert</span>
            <span>TEST SIREN</span>
          </button>

          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono-hud text-[10px] font-bold transition-all border ${
              isMuted 
                ? 'bg-[#1c2025] text-[#bbc9ca] border-[#3c494a]' 
                : 'bg-[#004a4f]/60 text-[#45dee8] border-[#45dee8]/60 shadow-[0_0_8px_rgba(69,222,232,0.3)]'
            }`}
            title={isMuted ? "Unmute Tactical Klaxon Siren" : "Mute Tactical Klaxon Siren"}
          >
            <span className="material-symbols-outlined text-xs">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
            <span>{isMuted ? 'MUTED' : 'ARMED'}</span>
          </button>
        </div>

        {/* Network HQ Link */}
        <div className="hidden lg:flex items-center gap-2 bg-[#0a0e13] border border-[#3c494a] px-2.5 py-1 rounded">
          <div className="relative flex items-center justify-center w-2 h-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${networkStatus === 'ONLINE' ? 'bg-[#45dee8]' : 'bg-[#ffb4ab]'} opacity-75`}></span>
            <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${networkStatus === 'ONLINE' ? 'bg-[#45dee8]' : 'bg-[#ffb4ab]'}`}></span>
          </div>
          <span className="font-mono-hud text-[11px] text-[#bbc9ca] tracking-wider font-medium">
            {networkStatus === 'ONLINE' ? 'HQ LINK: 100% ONLINE // LATENCY 14ms' : `HQ LINK: OFFLINE // ${queuedCount} QUEUED`}
          </span>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#3c494a]">
          <div className="w-8 h-8 rounded-full bg-[#1c2025] border border-[#859394] flex items-center justify-center text-[#45dee8] font-mono-hud text-xs font-bold">
            {user?.role?.slice(0, 2) || 'OP'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="font-mono-hud text-[10px] text-[#e0e2ea] uppercase tracking-wider font-bold">
              {user?.name || 'CAPT. S. CHEN'}
            </span>
            <span className="font-mono-hud text-[9px] text-[#45dee8] uppercase tracking-widest font-bold">
              WATCH COMM.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
