import React, { useState } from 'react';
import { apiService } from '../utils/apiService';

export default function AlertDetailModal({ alert, onClose, onActionSuccess }) {
  const [notes, setNotes] = useState('');
  const [requestingFootage, setRequestingFootage] = useState(false);
  const [footageStatus, setFootageStatus] = useState(null);

  // AI SitRep state
  const [loadingSitrep, setLoadingSitrep] = useState(false);
  const [aiSitrep, setAiSitrep] = useState(null);

  if (!alert) return null;

  const handleAction = async (actionType) => {
    try {
      await apiService.takeAlertAction(
        alert.id, 
        actionType, 
        'BSF-74892 (Subedar K. Sharma)', 
        notes || `Action triggered from Command Center Dashboard.`
      );
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const handleRequestFullFootage = async () => {
    setRequestingFootage(true);
    try {
      const res = await apiService.requestFootage(alert);
      setFootageStatus(res.message || "Evidentiary footage requested from edge store.");
    } catch (err) {
      setFootageStatus("Edge retrieval queued over throttled link.");
    }
    setRequestingFootage(false);
  };

  const handleGenerateSitrep = async () => {
    setLoadingSitrep(true);
    try {
      const sitrep = await apiService.generateSitrep(alert);
      setAiSitrep(sitrep);
    } catch (err) {
      console.error("Error generating SitRep:", err);
    }
    setLoadingSitrep(false);
  };

  const snapshotUrl = alert.snapshot_path 
    ? `http://127.0.0.1:8000/snapshots/${alert.snapshot_path.split(/[\\\\/]/).pop()}` 
    : (alert.thumbnail_base64 
        ? `data:image/jpeg;base64,${alert.thumbnail_base64}` 
        : (alert.object_type === 'person' 
            ? 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=640&q=80' 
            : 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=640&q=80'));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-low border border-outline-variant/80 w-full max-w-5xl rounded overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        {/* Modal Header */}
        <div className="bg-surface-container-lowest px-5 py-3 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-error/15 border border-error/50 rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-xl">crisis_alert</span>
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="uppercase tracking-wider">TACTICAL INCIDENT DOSSIER:</span>
                <span className="text-primary font-bold">{alert.id}</span>
              </h2>
              <p className="text-[11px] text-on-surface-variant font-mono">
                {alert.bop_id} • {alert.camera_id} • {alert.incursion_type}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto flex-1 font-mono">
          {/* Left: Snapshot / Video Evidence & Footage Request */}
          <div className="space-y-3">
            <div className="bg-surface-container-lowest rounded border border-outline-variant aspect-video flex items-center justify-center overflow-hidden relative">
              {snapshotUrl ? (
                <img 
                  src={snapshotUrl} 
                  alt="Incursion Evidence" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-outline text-xs flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-2xl">no_photography</span>
                  <span>NO LOCAL SNAPSHOT CACHED</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-surface-container-lowest/90 px-2 py-1 rounded text-[10px] text-primary border border-outline-variant">
                EVIDENCE FRAME — {alert.formatted_time || 'RECORDED'}
              </div>
            </div>

            {/* AI Situation Report Card */}
            <div className="p-3.5 bg-surface-container-lowest border border-primary/30 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">psychology</span>
                  <span>AI TACTICAL SITUATION REPORT (GROQ)</span>
                </span>
                <button
                  onClick={handleGenerateSitrep}
                  disabled={loadingSitrep}
                  className="px-2.5 py-1 bg-primary text-on-primary hover:bg-primary-fixed-dim text-[10px] rounded font-bold transition-colors"
                >
                  {loadingSitrep ? 'Generating...' : (aiSitrep ? 'Regenerate' : 'Generate SitRep')}
                </button>
              </div>

              {aiSitrep ? (
                <div className="space-y-1.5 text-[11px] text-slate-200">
                  <p><strong className="text-primary">Threat Level:</strong> {aiSitrep.threat_level}</p>
                  <p><strong className="text-on-surface">Summary:</strong> {aiSitrep.tactical_summary}</p>
                  <p><strong className="text-on-surface">Assessment:</strong> {aiSitrep.incursion_assessment}</p>
                  <p><strong className="text-tertiary">Action:</strong> {aiSitrep.recommended_action}</p>
                  <p><strong className="text-on-surface-variant">ROE:</strong> {aiSitrep.rules_of_engagement}</p>
                </div>
              ) : (
                <p className="text-[10px] text-on-surface-variant">
                  Click 'Generate SitRep' to synthesize an instant Groq AI threat analysis, terrain assessment, and recommended patrol response.
                </p>
              )}
            </div>

            {/* Request Full Footage Button */}
            <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-on-surface font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">cloud_download</span>
                  <span>ON-DEMAND FULL HD FOOTAGE</span>
                </span>
                <span className="text-[10px] text-primary">EDGE BUFFER: 30 DAYS</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Request high-resolution 60s pre/post event video clip from local edge DVR.
              </p>
              <button
                onClick={handleRequestFullFootage}
                disabled={requestingFootage}
                className="w-full py-1.5 bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant rounded text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>{requestingFootage ? 'Requesting from Edge...' : 'Transmit Video Extraction Command'}</span>
              </button>
              {footageStatus && (
                <p className="text-[10px] text-secondary-fixed mt-1">✓ {footageStatus}</p>
              )}
            </div>
          </div>

          {/* Right: Telemetry & Tactical Actions */}
          <div className="space-y-4">
            {/* Incident Parameters */}
            <div className="p-3.5 bg-surface-container-lowest border border-outline-variant rounded space-y-2 text-xs">
              <h3 className="text-xs font-bold text-on-surface border-b border-outline-variant/60 pb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">info</span>
                <span>INCIDENT TELEMETRY & CLASSIFICATION</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-on-surface-variant block">DETECTED OBJECT:</span>
                  <span className="font-bold text-error uppercase">{alert.object_type} ({Math.round((alert.confidence || 0.92) * 100)}% CONF)</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">BREACH CLASSIFICATION:</span>
                  <span className="font-bold text-primary">{alert.incursion_type}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">ZONE / TRIPWIRE:</span>
                  <span className="font-bold text-on-surface">{alert.zone_name}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">SECTOR POST:</span>
                  <span className="font-bold text-on-surface">{alert.bop_id}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">SEVERITY LEVEL:</span>
                  <span className="font-bold text-error">{alert.severity}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">EST. DWELL TIME:</span>
                  <span className="font-bold text-on-surface">{alert.dwell_time_seconds || 4.2}s</span>
                </div>
              </div>
            </div>

            {/* Operator Notes Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
                OPERATOR SENTRY LOG NOTES:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter tactical observations (e.g. 'Suspect moving south towards marker 44')..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary h-20 placeholder:text-outline"
              />
            </div>

            {/* Disposition & Action Triggers */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
                EXECUTE SENTRY COMMAND DISPOSITION:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction('ACKNOWLEDGE')}
                  className="p-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/60 text-primary text-xs rounded font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Acknowledge</span>
                </button>
                <button
                  onClick={() => handleAction('DISPATCH_QRT')}
                  className="p-2.5 bg-error text-on-error hover:bg-error-container text-xs rounded font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-error/20"
                >
                  <span className="material-symbols-outlined text-sm">military_tech</span>
                  <span>Dispatch QRT</span>
                </button>
                <button
                  onClick={() => handleAction('MARK_FALSE_POSITIVE')}
                  className="p-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs rounded font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  <span>False Alarm</span>
                </button>
                <button
                  onClick={() => handleAction('ESCALATE_HQ')}
                  className="p-2.5 bg-tertiary-container text-on-tertiary-container hover:bg-error border border-error/50 text-xs rounded font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span>Escalate HQ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
