import React from 'react';

export default function LiveAlertFeed({ alerts = [], onSelectAlert, onAlertAction }) {
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'PENDING').length;
  const unverifiedCount = alerts.filter(a => a.status === 'PENDING').length;

  return (
    <div className="flex flex-col h-full bg-[#181c21] border-l border-[#3c494a]/60 w-80 lg:w-96 select-none">
      {/* Header */}
      <div className="p-3 bg-[#1c2025] border-b border-[#3c494a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ffb4ab] text-lg animate-pulse">crisis_alert</span>
          <span className="font-mono-hud font-bold text-xs text-[#e0e2ea] tracking-wider uppercase">INCIDENT STREAM</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono-hud text-[10px]">
          <span className="px-2 py-0.5 bg-[#93000a] text-[#ffdad6] font-bold rounded">
            {criticalCount} CRITICAL
          </span>
          <span className="text-[#bbc9ca]">/ {unverifiedCount} PENDING</span>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {alerts.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-[#859394] font-mono-hud text-xs text-center p-4">
            <span className="material-symbols-outlined text-3xl text-[#45dee8]/40 mb-2">verified_user</span>
            <span className="text-[#e0e2ea] font-bold">NO ACTIVE PERIMETER BREACHES</span>
            <span className="text-[10px] text-[#bbc9ca] mt-1">Perimeter sentinels operating in normal ready status</span>
          </div>
        ) : (
          alerts.map((alert) => {
            const isDelayed = alert.is_delayed_sync === 1;
            const isPending = alert.status === 'PENDING';
            const isCritical = alert.severity === 'CRITICAL';
            
            const timeDisplay = alert.formatted_time || new Date(alert.detected_timestamp * 1000).toLocaleTimeString();
            const thumbUrl = alert.thumbnail_base64 
              ? `data:image/jpeg;base64,${alert.thumbnail_base64}` 
              : (alert.snapshot_path ? `http://127.0.0.1:8000/snapshots/${alert.snapshot_path.split(/[\\\\/]/).pop()}` : null);

            return (
              <div 
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className={`p-2.5 rounded border transition-all cursor-pointer relative ${
                  isPending 
                    ? (isCritical 
                        ? 'bg-[#93000a]/20 border-[#ffb4ab]/80 hover:border-[#ffb4ab] shadow-[0_0_8px_rgba(255,180,171,0.2)]' 
                        : 'bg-[#ff9089]/10 border-[#ff9089]/60 hover:border-[#ff9089]') 
                    : 'bg-[#1c2025]/60 border-[#3c494a] hover:border-[#859394] opacity-80'
                }`}
              >
                {/* Severity Left Border Stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                  alert.status === 'RESOLVED' ? 'bg-[#45dee8]' : (isCritical ? 'bg-[#ffb4ab]' : 'bg-[#ff9089]')
                }`} />

                {/* Top Row: Class & Delayed Sync Badge */}
                <div className="flex items-center justify-between mb-1.5 pl-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-mono-hud font-bold uppercase tracking-wider ${
                      isCritical ? 'text-[#ffb4ab]' : 'text-[#ff9089]'
                    }`}>
                      {alert.object_type} DETECTED
                    </span>
                    <span className="text-[10px] font-mono-hud text-[#bbc9ca]">
                      ({Math.round(Number(alert.confidence || 0.9) * 100)}%)
                    </span>
                  </div>

                  {/* Delayed Sync Badge (Proves Edge Offline Resilience) */}
                  {isDelayed && (
                    <span className="flex items-center gap-1 text-[9px] font-mono-hud px-1.5 py-0.5 bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/60 rounded font-semibold animate-pulse">
                      <span className="material-symbols-outlined text-[10px]">wifi_off</span>
                      <span>{alert.delayed_sync_label || 'Delayed Sync'}</span>
                    </span>
                  )}
                </div>

                {/* Main Content: Thumbnail & Details */}
                <div className="flex gap-2.5 pl-2">
                  {thumbUrl ? (
                    <img 
                      src={thumbUrl} 
                      alt="Incident" 
                      className="w-16 h-12 object-cover rounded border border-[#3c494a] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-[#0a0e13] border border-[#3c494a] rounded flex items-center justify-center text-[10px] text-[#859394] font-mono-hud flex-shrink-0">
                      FRAME CACHE
                    </div>
                  )}

                  <div className="flex-1 min-w-0 font-mono-hud space-y-0.5">
                    <p className="text-[#e0e2ea] truncate font-medium text-[11px]">{alert.zone_name}</p>
                    <p className="text-[#bbc9ca] text-[10px] truncate">{alert.camera_id} • {alert.bop_id}</p>
                    <p className="text-[#859394] text-[9px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">schedule</span>
                      <span>{timeDisplay}</span>
                    </p>
                  </div>
                </div>

                {/* Quick Action Footer Buttons */}
                <div className="mt-2 pt-2 border-t border-[#3c494a]/80 flex items-center justify-between pl-2">
                  <span className={`text-[9px] font-mono-hud font-bold px-1.5 py-0.2 rounded uppercase ${
                    alert.status === 'PENDING' ? 'bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/40' :
                    alert.status === 'ESCALATED' ? 'bg-[#ff9089] text-[#8b0012] border border-[#ff9089]' :
                    'bg-[#262a30] text-[#bbc9ca]'
                  }`}>
                    {alert.status}
                  </span>

                  <div className="flex items-center gap-1">
                    {isPending && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAlertAction(alert.id, 'ACKNOWLEDGE');
                          }}
                          className="px-2 py-0.5 bg-[#262a30] hover:bg-[#36393f] text-[#e0e2ea] text-[10px] font-mono-hud rounded border border-[#3c494a]"
                        >
                          Ack
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAlertAction(alert.id, 'ESCALATE');
                          }}
                          className="px-2 py-0.5 bg-[#93000a] hover:bg-[#ffb4ab] hover:text-[#690005] text-[#ffdad6] text-[10px] font-mono-hud rounded border border-[#ffb4ab]/60 font-bold transition-colors"
                        >
                          Escalate
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

