import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CameraGrid from './components/CameraGrid';
import TacticalMap from './components/TacticalMap';
import LiveAlertFeed from './components/LiveAlertFeed';
import AlertDetailModal from './components/AlertDetailModal';
import ZoneConfigView from './components/ZoneConfigView';
import AnalyticsView from './components/AnalyticsView';
import MobilePatrolView from './components/MobilePatrolView';
import AuditTrailView from './components/AuditTrailView';
import AICopilotView from './components/AICopilotView';
import LoginModal from './components/LoginModal';
import { alarmSystem } from './utils/alarmSystem';
import axios from 'axios';

const DEFAULT_CAMERAS = [
  {
    id: 'CAM-01',
    name: 'BOP-01 NATHU LA (FORWARD SENTRY)',
    sector: 'SIKKIM_NATHULA',
    status: 'ONLINE',
    fps: 29.8,
    resolution: '1920x1080',
    fog_enhancer_active: false,
    scenario: 'High-Altitude Ridge Pass // Primary Sentinel',
    location: { lat: 27.3866, lng: 88.8310 }
  },
  {
    id: 'CAM-02',
    name: 'BOP-02 RIDGE DEFILE (LWIR THERMAL)',
    sector: 'SIKKIM_NATHULA',
    status: 'ONLINE',
    fps: 30.0,
    resolution: '1280x720',
    fog_enhancer_active: false,
    scenario: 'Perimeter Razorwire Fence // FLIR IR',
    location: { lat: 27.3910, lng: 88.8250 }
  },
  {
    id: 'CAM-03',
    name: 'BOP-03 VALLEY MARSH (FOG CORRIDOR)',
    sector: 'DOKLAM_TRIJUNCTION',
    status: 'ONLINE',
    fps: 28.5,
    resolution: '1920x1080',
    fog_enhancer_active: true,
    scenario: 'Doklam Defile // CLAHE De-Noised',
    location: { lat: 27.3820, lng: 88.8390 }
  },
  {
    id: 'CAM-04',
    name: 'BOP-04 THAR SECTOR (DESERT BUFFER)',
    sector: 'THAR_DESERT',
    status: 'ONLINE',
    fps: 30.0,
    resolution: '1920x1080',
    fog_enhancer_active: false,
    scenario: 'Sector-IV Dunes // Optical Recon',
    location: { lat: 27.3750, lng: 88.8220 }
  }
];

const DEFAULT_ALERTS = [
  {
    id: 'ALT-NATHULA-01',
    camera_id: 'CAM-01',
    bop_id: 'BOP-01-NATHULA',
    object_type: 'person',
    confidence: 0.96,
    incursion_type: 'STERILE_ZONE_BREACH',
    zone_name: 'Zone A - Primary Defile',
    severity: 'CRITICAL',
    status: 'PENDING',
    timestamp: Date.now() / 1000 - 60,
    formatted_time: '2 mins ago',
    dwell_time_seconds: 4.8
  },
  {
    id: 'ALT-THAR-04',
    camera_id: 'CAM-04',
    bop_id: 'BOP-04-THAR',
    object_type: 'cow',
    confidence: 0.91,
    incursion_type: 'WILDLIFE_PASSAGE',
    zone_name: 'Buffer Zone - Thar Dunes',
    severity: 'SAFE_SUPPRESSED',
    status: 'RESOLVED',
    timestamp: Date.now() / 1000 - 300,
    formatted_time: '5 mins ago',
    dwell_time_seconds: 12.4
  }
];

export default function App() {
  const [user, setUser] = useState({ id: 'BSF-74892', name: 'Subedar K. Sharma', role: 'Subedar', sector: 'SIKKIM_NATHULA' });
  const [sector, setSector] = useState('SIKKIM_NATHULA');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [cameras, setCameras] = useState(DEFAULT_CAMERAS);
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('ONLINE');
  const [queuedCount, setQueuedCount] = useState(0);

  // Tactical Alarm & Siren State
  const [isMuted, setIsMuted] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState(null);

  const wsRef = useRef(null);

  // Unlock Audio Context on first interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      alarmSystem.init();
    };
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Initial Data Fetch & Polling
  useEffect(() => {
    fetchCameras();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchCameras();
      fetchAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket Real-Time Connection
  useEffect(() => {
    const connectWS = () => {
      try {
        const wsUrl = window.location.protocol === 'https:' ? 'wss://127.0.0.1:8000/ws' : 'ws://127.0.0.1:8000/ws';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setNetworkStatus('ONLINE');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'NEW_ALERT') {
              handleNewAlert(msg.data);
            } else if (msg.type === 'ALERT_STATUS_UPDATED') {
              setAlerts((prev) => prev.map(a => a.id === msg.data.id ? { ...a, status: msg.data.status } : a));
              if (activeAlarm && activeAlarm.id === msg.data.id && msg.data.status !== 'PENDING') {
                setActiveAlarm(null);
                alarmSystem.stop();
              }
            }
          } catch (e) {
            console.error("WS message parse error:", e);
          }
        };

        ws.onclose = () => {
          // Cloud / Standalone mode
        };

        ws.onerror = () => {
          // Standalone mode
        };
      } catch (err) {}
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeAlarm]);

  const handleNewAlert = (alertData) => {
    setAlerts((prev) => {
      const exists = prev.some(a => a.id === alertData.id);
      if (exists) return prev;
      return [alertData, ...prev];
    });

    const objType = (alertData.object_type || '').toLowerCase();
    const isHuman = objType === 'person' || objType === 'human' || alertData.severity === 'CRITICAL';

    if (isHuman) {
      setActiveAlarm(alertData);
      // CONTINUOUS MILITARY SIREN: Rings indefinitely until silenced
      alarmSystem.startContinuousSiren();
    } else {
      // Animal or Safe Suppression: Stop siren immediately
      if (activeAlarm) {
        setActiveAlarm(null);
      }
      alarmSystem.stop();
    }
  };

  const fetchCameras = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/cameras');
      if (res.data && res.data.length > 0) {
        setCameras(res.data);
      }
    } catch (e) {}
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/alerts');
      if (res.data && res.data.length > 0) {
        setAlerts(res.data);
      }
    } catch (e) {}
  };

  const handleToggleFog = async (camId, enabled) => {
    setCameras(prev => prev.map(c => c.id === camId ? { ...c, fog_enhancer_active: enabled } : c));
    try {
      await axios.post(`http://127.0.0.1:8000/api/cameras/${camId}/fog-enhancer`, { enabled });
    } catch (e) {}
  };

  const handleAlertAction = async (alertId, actionType) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: actionType === 'ACKNOWLEDGE' ? 'ACKNOWLEDGED' : 'ESCALATED' } : a));
    
    if (activeAlarm && activeAlarm.id === alertId) {
      setActiveAlarm(null);
      alarmSystem.stop();
    }

    try {
      await axios.post(`http://127.0.0.1:8000/api/alerts/${alertId}/action`, {
        operator_id: user?.id || 'BSF-74892',
        action: actionType,
        notes: `Quick action ${actionType} triggered from dashboard.`
      });
      fetchAlerts();
    } catch (e) {}
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    alarmSystem.setMuted(nextMuted);
  };

  const handleTestSiren = () => {
    setIsMuted(false);
    alarmSystem.testSiren();
  };

  const handleSilenceAlarm = () => {
    alarmSystem.stop();
    setActiveAlarm(null);
  };

  if (!user) {
    return <LoginModal onLogin={(u) => setUser(u)} />;
  }

  const unreadAlerts = alerts.filter(a => a.status === 'PENDING').length;

  return (
    <div className="flex flex-col h-screen bg-[#0a0e13] overflow-hidden text-[#e0e2ea]">
      {/* Top Header */}
      <Navbar 
        sector={sector}
        setSector={setSector}
        networkStatus={networkStatus}
        queuedCount={queuedCount}
        user={user}
        onLogout={() => setUser(null)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onTestSiren={handleTestSiren}
        activeAlarm={activeAlarm}
      />

      {/* ACTIVE CRITICAL INCURSION CONTINUOUS SIREN BANNER */}
      {activeAlarm && (
        <div className="bg-[#93000a] text-[#ffdad6] border-b-2 border-[#ffb4ab] px-4 py-2 flex items-center justify-between z-50 animate-pulse shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl animate-spin text-[#ffdad6]">crisis_alert</span>
            <div>
              <div className="font-mono-hud text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <span>🚨 CRITICAL INCURSION DETECTED // PERSON BREACH AT {activeAlarm.camera_id}</span>
                <span className="bg-[#ffb4ab] text-[#690005] px-2 py-0.5 rounded text-[10px] font-bold">CONTINUOUS KLAXON RINGING</span>
              </div>
              <p className="font-mono-hud text-[11px] text-[#ffdad6]/90">
                Target: {activeAlarm.object_type?.toUpperCase()} • Zone: {activeAlarm.zone_name} • Sector: {activeAlarm.bop_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAlertAction(activeAlarm.id, 'DISPATCH_QRT')}
              className="px-3 py-1 bg-[#ffdad6] hover:bg-white text-[#690005] font-mono-hud text-xs font-black rounded uppercase tracking-wider transition-colors shadow"
            >
              1-TAP QRT DISPATCH
            </button>
            <button
              onClick={handleSilenceAlarm}
              className="px-3 py-1 bg-[#101419]/90 hover:bg-black text-[#ffdad6] border-2 border-[#ffb4ab] font-mono-hud text-xs font-bold rounded uppercase tracking-wider transition-colors shadow"
            >
              SILENCE SIREN
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          unreadCount={unreadAlerts}
        />

        {/* Dynamic Center View Container */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0a0e13]">
          {/* Top Console Telemetry Strip */}
          <div className="flex flex-col w-full bg-[#181c21] px-4 py-2 border-b border-[#3c494a]/60 gap-1.5 flex-shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#0a0e13] px-3 py-1 rounded border border-[#3c494a]">
                  <span className="material-symbols-outlined text-[#45dee8] text-base">videocam</span>
                  <span className="font-mono-hud text-xs text-[#45dee8] uppercase font-bold tracking-wider">
                    TACTICAL MATRIX WALL // SECTOR-IV
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[#1c2025] px-2 py-0.5 rounded border border-[#3c494a]">
                  <span className={`w-2 h-2 rounded-full ${unreadAlerts > 0 ? 'bg-[#ffb4ab] animate-ping' : 'bg-[#45dee8]'}`}></span>
                  <span className="font-mono-hud text-[10px] text-[#ffb4ab] uppercase font-bold">
                    {unreadAlerts > 0 ? `${unreadAlerts} INCURSIONS ACTIVE` : 'ALL SECTORS SECURE'}
                  </span>
                </div>
              </div>

              {/* Telemetry Diagnostics */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#0a0e13] px-2 py-0.5 rounded border border-[#3c494a]">
                  <span className="font-mono-hud text-[9px] text-[#bbc9ca]">ONLINE:</span>
                  <span className="font-mono-hud text-[11px] text-[#45dee8] font-bold">4 / 4 NODES</span>
                </div>
                <div className="flex items-center gap-1 bg-[#0a0e13] px-2 py-0.5 rounded border border-[#3c494a]">
                  <span className="font-mono-hud text-[9px] text-[#bbc9ca]">EDGE AI:</span>
                  <span className="font-mono-hud text-[11px] text-[#5de6ff] font-bold">12ms LATENCY</span>
                </div>
                <div className="flex items-center gap-1 bg-[#0a0e13] px-2 py-0.5 rounded border border-[#3c494a]">
                  <span className="font-mono-hud text-[9px] text-[#bbc9ca]">KLAXON ALARM:</span>
                  <span className={`font-mono-hud text-[11px] font-bold ${isMuted ? 'text-[#ff9089]' : 'text-[#45dee8]'}`}>
                    {isMuted ? 'MUTED' : 'ARMED & ACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Views */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-1 overflow-hidden">
              {/* Left & Center: GIS Map + Camera Wall Matrix */}
              <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
                <div className="h-56 flex-shrink-0">
                  <TacticalMap 
                    cameras={cameras} 
                    alerts={alerts}
                    onSelectCamera={(cam) => setActiveTab('cameras')}
                  />
                </div>

                <div className="flex-1 min-h-[380px]">
                  <CameraGrid 
                    cameras={cameras} 
                    onToggleFog={handleToggleFog}
                    onSelectCamera={(cam) => setActiveTab('zones')}
                    onTriggerAlert={handleNewAlert}
                    onSilenceAlarm={handleSilenceAlarm}
                    activeAlarm={activeAlarm}
                  />
                </div>
              </div>

              {/* Right Rail: Google Stitch Incident Stream */}
              <LiveAlertFeed 
                alerts={alerts}
                onSelectAlert={(a) => setSelectedAlert(a)}
                onAlertAction={handleAlertAction}
              />
            </div>
          )}

          {activeTab === 'cameras' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3 border-b border-[#3c494a] pb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#45dee8] text-lg">videocam</span>
                  <h2 className="text-sm font-bold text-[#e0e2ea] uppercase tracking-wider font-mono-hud">
                    ACTIVE SENTINEL MATRIX // 4-CAMERA MULTI-SECTOR
                  </h2>
                </div>
              </div>
              <CameraGrid 
                cameras={cameras} 
                onToggleFog={handleToggleFog}
                onSelectCamera={(cam) => setActiveTab('zones')}
                onTriggerAlert={handleNewAlert}
                onSilenceAlarm={handleSilenceAlarm}
                activeAlarm={activeAlarm}
              />
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 border-b border-[#3c494a] pb-2">
                  <span className="material-symbols-outlined text-[#ffb4ab] text-lg">warning</span>
                  <h1 className="text-sm font-bold text-[#e0e2ea] uppercase tracking-wider font-mono-hud">
                    TACTICAL ALERT REGISTRY & INCURSION AUDIT
                  </h1>
                </div>
                <div className="space-y-2.5">
                  {alerts.map((a) => (
                    <div 
                      key={a.id}
                      onClick={() => setSelectedAlert(a)}
                      className="p-3 bg-[#181c21] border border-[#3c494a] hover:border-[#45dee8] rounded flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${a.severity === 'CRITICAL' ? 'bg-[#ffb4ab]' : (a.severity === 'SAFE_SUPPRESSED' ? 'bg-[#10b981]' : 'bg-[#ff9089]')}`}></span>
                        <div>
                          <p className="font-bold text-[#e0e2ea] text-xs font-mono-hud uppercase">{a.object_type} {a.severity === 'SAFE_SUPPRESSED' ? 'SUPPRESSED (SAFE)' : 'INTRUSION'} — {a.zone_name}</p>
                          <p className="text-[11px] text-[#bbc9ca] font-mono-hud">{a.camera_id} • {a.bop_id} • {a.formatted_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.is_delayed_sync === 1 && (
                          <span className="text-[10px] text-[#ffdad6] bg-[#93000a] px-2 py-0.5 rounded border border-[#ffb4ab]/40 font-mono-hud font-bold">
                            {a.delayed_sync_label}
                          </span>
                        )}
                        <span className="text-xs text-[#45dee8] font-bold font-mono-hud uppercase">{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-copilot' && (
            <AICopilotView />
          )}

          {activeTab === 'map' && (
            <div className="p-4 flex-1 h-full">
              <TacticalMap 
                cameras={cameras} 
                alerts={alerts}
                onSelectCamera={(cam) => setSelectedAlert(alerts.find(a => a.camera_id === cam.id))}
              />
            </div>
          )}

          {activeTab === 'zones' && (
            <ZoneConfigView cameras={cameras} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView />
          )}

          {activeTab === 'mobile' && (
            <MobilePatrolView 
              alerts={alerts} 
              onAcknowledge={handleAlertAction}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTrailView />
          )}
        </main>
      </div>

      {/* Forensic Inspection Modal */}
      {selectedAlert && (
        <AlertDetailModal 
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onActionSuccess={() => fetchAlerts()}
        />
      )}
    </div>
  );
}
