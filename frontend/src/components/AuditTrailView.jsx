import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AuditTrailView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/alerts/audit-trail');
      setLogs(res.data || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
    setLoading(false);
  };

  return (
    <div className="p-5 bg-surface-container-lowest flex-1 overflow-y-auto font-mono select-none space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
        <div>
          <h1 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">terminal</span>
            <span className="font-headline-sm uppercase tracking-wider text-primary">IMMUTABLE OPERATOR AUDIT TRAIL LOG</span>
          </h1>
          <p className="text-[11px] text-on-surface-variant font-sans">Non-repudiable log of all sentry actions, alert dispositions, and zone calibrations</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary text-xs rounded border border-outline-variant transition-colors"
        >
          <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          <span>Refresh Trail</span>
        </button>
      </div>

      <div className="bg-surface-container-low rounded border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-container text-on-surface-variant text-[10px] uppercase border-b border-outline-variant">
              <tr>
                <th className="p-3">LOG ID</th>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">OPERATOR / SENTRY ID</th>
                <th className="p-3">ACTION TRIGGERED</th>
                <th className="p-3">ASSOCIATED INCIDENT</th>
                <th className="p-3">NOTES & DETAILS</th>
                <th className="p-3">IP ORIGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-outline">
                    No operator actions logged in current session.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="p-3 font-bold text-outline">#{log.id}</td>
                    <td className="p-3 text-on-surface">{log.formatted_time}</td>
                    <td className="p-3 text-primary font-bold">{log.operator_id}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('ESCALATE') ? 'bg-error-container text-on-error-container border border-error/50' :
                        log.action.includes('ACKNOWLEDGE') ? 'bg-primary-container/30 text-primary border border-primary/50' :
                        log.action.includes('FALSE_POSITIVE') ? 'bg-tertiary-container text-on-tertiary-container border border-tertiary/50' :
                        'bg-surface-container text-on-surface'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-on-surface font-mono">{log.alert_id || 'SYSTEM'}</td>
                    <td className="p-3 text-on-surface-variant text-[11px] truncate max-w-xs">{log.details || '-'}</td>
                    <td className="p-3 text-outline text-[10px]">{log.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
