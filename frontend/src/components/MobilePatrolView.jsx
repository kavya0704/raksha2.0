import React, { useState } from 'react';

export default function MobilePatrolView({ alerts = [], onAcknowledge }) {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});

  const handleAck = (id) => {
    setAcknowledgedAlerts(prev => ({ ...prev, [id]: true }));
    if (onAcknowledge) onAcknowledge(id, 'ACKNOWLEDGE');
  };

  const pendingAlerts = alerts.filter(a => a.status === 'PENDING' || a.status === 'ESCALATED');

  return (
    <div className="p-4 bg-surface-container-lowest min-h-screen text-on-surface font-mono select-none flex flex-col items-center">
      {/* Mobile Device Frame Header */}
      <div className="w-full max-w-md bg-surface-container-low border border-primary/50 rounded-t p-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl animate-pulse">radio</span>
          <span className="font-bold text-sm tracking-wider text-primary">QRT FIELD SENTINEL TERMINAL</span>
        </div>
        <span className="text-[10px] bg-primary-container text-on-primary-container font-bold px-2 py-0.5 rounded">
          HIGH CONTRAST
        </span>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-surface-container-low border-x border-b border-primary/40 rounded-b p-4 space-y-4 shadow-2xl flex-1">
        {/* Field Status Banner */}
        <div className="bg-surface-container border border-outline-variant p-3 rounded text-xs space-y-1">
          <div className="flex justify-between font-bold text-primary">
            <span>PATROL CALLSIGN: TIGER-01</span>
            <span>GRID: 27.38°N 88.83°E</span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-sans">BSF 112 BN • Nathu La Perimeter Ridge Patrol</p>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            ACTIVE TARGET DISPATCHES ({pendingAlerts.length})
          </h2>

          {pendingAlerts.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant rounded text-on-surface-variant text-xs flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">verified</span>
              <span>PERIMETER CLEAR — NO ACTIVE DISPATCHES</span>
            </div>
          ) : (
            pendingAlerts.map((a) => {
              const isAcked = acknowledgedAlerts[a.id];
              const thumbUrl = a.thumbnail_base64 
                ? `data:image/jpeg;base64,${a.thumbnail_base64}` 
                : (a.snapshot_path ? `http://127.0.0.1:8000/snapshots/${a.snapshot_path.split(/[\\\\/]/).pop()}` : null);

              return (
                <div 
                  key={a.id}
                  className="bg-surface-container-lowest border border-error p-3 rounded space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-error/30 pb-2">
                    <span className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-error">crisis_alert</span>
                      <span>{a.object_type} BREACH</span>
                    </span>
                    <span className="text-[10px] bg-error text-on-error font-bold px-2 py-0.5 rounded">
                      CRITICAL
                    </span>
                  </div>

                  {/* Thumbnail & GPS */}
                  <div className="flex gap-3">
                    {thumbUrl ? (
                      <img 
                        src={thumbUrl} 
                        alt="Target" 
                        className="w-24 h-18 object-cover rounded border border-error/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-18 bg-surface-container border border-outline-variant rounded flex items-center justify-center text-[10px] text-outline">
                        EVIDENCE
                      </div>
                    )}
                    <div className="text-xs space-y-1">
                      <p className="text-on-surface font-bold">{a.zone_name}</p>
                      <p className="text-primary text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        <span>27.3866° N, 88.8310° E</span>
                      </p>
                      <p className="text-on-surface-variant text-[10px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        <span>{a.formatted_time || 'Recent'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Tactical 1-Tap Acknowledge Button */}
                  <button
                    onClick={() => handleAck(a.id)}
                    disabled={isAcked}
                    className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                      isAcked 
                        ? 'bg-primary/20 text-primary border border-primary/40' 
                        : 'bg-primary hover:bg-primary-fixed-dim text-on-primary shadow-lg'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{isAcked ? 'check_circle' : 'navigation'}</span>
                    <span>{isAcked ? 'DISPATCH ACKNOWLEDGED' : 'TAP TO ACKNOWLEDGE INTERCEPT'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
