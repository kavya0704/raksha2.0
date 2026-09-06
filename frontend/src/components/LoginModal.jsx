import React, { useState } from 'react';

export default function LoginModal({ onLogin }) {
  const [personnelId, setPersonnelId] = useState('BSF-74892');
  const [rank, setRank] = useState('Subedar');
  const [name, setName] = useState('K. Sharma');
  const [sector, setSector] = useState('SIKKIM_NATHULA');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      id: personnelId,
      name: `${rank} ${name}`,
      role: rank,
      sector: sector
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-surface-container-low border border-outline-variant w-full max-w-md rounded p-6 shadow-2xl space-y-6">
        {/* Emblem */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-surface-container-lowest border border-primary/40 rounded-full mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(69,222,232,0.25)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="36" height="36" fill="none">
              <circle cx="80" cy="80" r="74" stroke="#45dee8" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 4"/>
              <circle cx="80" cy="80" r="64" stroke="#45dee8" strokeWidth="2.5" strokeOpacity="0.8"/>
              <line x1="80" y1="6" x2="80" y2="28" stroke="#45dee8" strokeWidth="2"/>
              <line x1="80" y1="132" x2="80" y2="154" stroke="#45dee8" strokeWidth="2"/>
              <line x1="6" y1="80" x2="28" y2="80" stroke="#45dee8" strokeWidth="2"/>
              <line x1="132" y1="80" x2="154" y2="80" stroke="#45dee8" strokeWidth="2"/>
              <polygon points="80,32 120,52 120,96 80,126 40,96 40,52" fill="#0a0e13" stroke="#5de6ff" strokeWidth="2.5"/>
              <circle cx="80" cy="78" r="26" stroke="#45dee8" strokeWidth="1.5" strokeOpacity="0.5"/>
              <circle cx="80" cy="78" r="14" stroke="#45dee8" strokeWidth="1.5" strokeOpacity="0.8"/>
              <circle cx="80" cy="78" r="4" fill="#ffb4ab"/>
            </svg>
          </div>
          <h1 className="text-base font-bold text-primary tracking-wider uppercase font-headline-sm">BSF SENTINEL-AI 2.0</h1>
          <p className="text-xs text-on-surface-variant font-sans">Tactical Sentinel Authentication Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">PERSONNEL SERVICE NUMBER</label>
            <input
              type="text"
              required
              value={personnelId}
              onChange={(e) => setPersonnelId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2.5 text-on-surface focus:outline-none focus:border-primary mt-1 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">RANK / APPOINTMENT</label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2.5 text-on-surface focus:outline-none focus:border-primary mt-1 font-mono"
              >
                <option value="Subedar">Subedar</option>
                <option value="Inspector">Inspector</option>
                <option value="Commandant">Commandant</option>
                <option value="Duty Sentry">Duty Sentry</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">NAME</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2.5 text-on-surface focus:outline-none focus:border-primary mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">OPERATIONAL SECTOR</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2.5 text-primary focus:outline-none focus:border-primary mt-1 font-mono font-bold"
            >
              <option value="SIKKIM_NATHULA">Sikkim Sector (BOP Nathu La)</option>
              <option value="TRIJUNCTION_DOKLAM">Doklam Tri-Junction Sector</option>
              <option value="EASTERN_LADAKH">Eastern Ladakh (Chushul Sector)</option>
              <option value="THAR_DESERT">Sector-IV (NW Rajasthan / Thar Desert)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold rounded text-xs transition-colors shadow-lg mt-2 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Authenticate & Access Tactical Grid</span>
          </button>
        </form>

        <div className="text-[10px] text-center text-outline border-t border-outline-variant/60 pt-3">
          SECURE BORDER SENTINEL • AIR-GAPPED & PRIVACY-COMPLIANT
        </div>
      </div>
    </div>
  );
}
