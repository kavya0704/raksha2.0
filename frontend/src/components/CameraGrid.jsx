import React, { useState, useRef, useEffect } from 'react';

export default function CameraGrid({ 
  cameras = [], 
  onToggleFog, 
  onSelectCamera, 
  onTriggerAlert,
  activeAlarm 
}) {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [activeSpectrum, setActiveSpectrum] = useState('ALL'); // ALL, OPTICAL, THERMAL, IRONBOW
  const [viewMode, setViewMode] = useState('2x2'); // 2x2, 3x2
  const [webcamStream, setWebcamStream] = useState(null);
  const [activeTargetType, setActiveTargetType] = useState('human'); // 'human', 'animal', 'vehicle', 'none'
  const videoRef = useRef(null);

  // Attach webcam stream to video element
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Clean up webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  const toggleWebcam = async (camId) => {
    if (!isWebcamActive) {
      try {
        fetch(`http://127.0.0.1:8000/api/cameras/${camId}/source`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'webcam' })
        }).catch(() => {});

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 360 } } 
          });
          setWebcamStream(stream);
          setIsWebcamActive(true);
          handleDetectTarget('human');
        }
      } catch (err) {
        console.warn("Webcam access error:", err);
        setIsWebcamActive(true);
        handleDetectTarget('human');
      }
    } else {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
      }
      setIsWebcamActive(false);

      fetch(`http://127.0.0.1:8000/api/cameras/${camId}/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'demo' })
      }).catch(() => {});
    }
  };

  const handleDetectTarget = (type) => {
    setActiveTargetType(type);

    if (type === 'human') {
      if (onTriggerAlert) {
        onTriggerAlert({
          id: `ALT-NATHULA-${Math.floor(10000 + Math.random() * 90000)}`,
          camera_id: 'CAM-01',
          bop_id: 'BOP-01-NATHULA',
          object_type: 'person',
          confidence: 0.96,
          incursion_type: 'STERILE_ZONE_BREACH',
          zone_name: 'Zone A - Primary Defile',
          severity: 'CRITICAL',
          timestamp: Date.now() / 1000,
          formatted_time: new Date().toLocaleTimeString()
        });
      }
    } else if (type === 'animal') {
      if (onTriggerAlert) {
        onTriggerAlert({
          id: `ALT-WILDLIFE-${Math.floor(10000 + Math.random() * 90000)}`,
          camera_id: 'CAM-01',
          bop_id: 'BOP-01-NATHULA',
          object_type: 'cow',
          confidence: 0.92,
          incursion_type: 'WILDLIFE_PASSAGE',
          zone_name: 'Sterile Perimeter Zone',
          severity: 'SAFE_SUPPRESSED',
          timestamp: Date.now() / 1000,
          formatted_time: new Date().toLocaleTimeString()
        });
      }
    } else if (type === 'vehicle') {
      if (onTriggerAlert) {
        onTriggerAlert({
          id: `ALT-VEHICLE-${Math.floor(10000 + Math.random() * 90000)}`,
          camera_id: 'CAM-01',
          bop_id: 'BOP-01-NATHULA',
          object_type: 'truck',
          confidence: 0.94,
          incursion_type: 'VEHICULAR_INCURSION',
          zone_name: 'Sterile Perimeter Zone',
          severity: 'HIGH',
          timestamp: Date.now() / 1000,
          formatted_time: new Date().toLocaleTimeString()
        });
      }
    }
  };

  const isCam01Breached = activeAlarm && activeAlarm.camera_id === 'CAM-01' && activeAlarm.severity === 'CRITICAL';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Sub-sector Filters, Layout View Toggles, Global Emergency Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0a0e13] border border-[#3c494a]/60 p-2 rounded">
        {/* Outpost Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono-hud text-[9px] text-[#bbc9ca] uppercase mr-1">OUTPOST:</span>
          <button className="px-2.5 py-0.5 rounded bg-[#1c2025] text-[#e0e2ea] font-mono-hud text-[11px] hover:bg-[#262a30] transition-colors border border-[#3c494a]" type="button">
            ALL ({cameras.length})
          </button>
          <button className="px-2.5 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-mono-hud text-[11px] font-bold shadow-md shadow-[#93000a]/20 flex items-center gap-1" type="button">
            <span className="material-symbols-outlined text-xs">crisis_alert</span> BOP-01 (NATHU LA ALERT)
          </button>
          <button className="px-2.5 py-0.5 rounded bg-[#1c2025] text-[#e0e2ea] font-mono-hud text-[11px] hover:bg-[#262a30] transition-colors" type="button">
            BOP-04 (THAR DESERT)
          </button>
          <button className="px-2.5 py-0.5 rounded bg-[#1c2025] text-[#e0e2ea] font-mono-hud text-[11px] hover:bg-[#262a30] transition-colors" type="button">
            BOP-03 (LADAKH FOG)
          </button>
        </div>

        {/* Live Target Detection Mode Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono-hud text-[9px] text-[#bbc9ca] uppercase mr-1">AI DETECT:</span>
          
          <button
            onClick={() => handleDetectTarget('human')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono-hud text-[10px] font-bold transition-all shadow-sm ${
              activeTargetType === 'human'
                ? 'bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab] shadow-[0_0_10px_rgba(255,180,171,0.4)] animate-pulse'
                : 'bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/40 hover:bg-[#ffb4ab]/30'
            }`}
            title="Detect human / person in sterile zone and trigger siren klaxon"
          >
            <span className="material-symbols-outlined text-xs">directions_run</span>
            <span>🚨 HUMAN (ALARM)</span>
          </button>

          <button
            onClick={() => handleDetectTarget('animal')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono-hud text-[10px] font-bold transition-all shadow-sm ${
              activeTargetType === 'animal'
                ? 'bg-[#00c2cc] text-[#004a4f] border border-[#45dee8] shadow-[0_0_10px_rgba(69,222,232,0.4)]'
                : 'bg-[#004a4f]/30 text-[#45dee8] border border-[#45dee8]/40 hover:bg-[#004a4f]/50'
            }`}
            title="Detect cow / wildlife with safe suppression (No false alarms)"
          >
            <span className="material-symbols-outlined text-xs">pets</span>
            <span>🐄 ANIMAL (SUPPRESSED)</span>
          </button>

          <button
            onClick={() => handleDetectTarget('vehicle')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono-hud text-[10px] font-bold transition-all shadow-sm ${
              activeTargetType === 'vehicle'
                ? 'bg-[#ff9089] text-[#8b0012] border border-[#ff9089] shadow-[0_0_10px_rgba(255,144,137,0.4)]'
                : 'bg-[#ff9089]/20 text-[#ff9089] border border-[#ff9089]/40 hover:bg-[#ff9089]/30'
            }`}
            title="Detect vehicle / truck in perimeter"
          >
            <span className="material-symbols-outlined text-xs">directions_car</span>
            <span>🚙 VEHICLE</span>
          </button>

          <div className="h-4 w-px bg-[#3c494a]"></div>

          {/* View Toggle Matrix */}
          <div className="flex items-center bg-[#1c2025] p-0.5 rounded border border-[#3c494a]">
            <button 
              onClick={() => setViewMode('2x2')}
              className={`px-2 py-1 rounded transition-colors ${viewMode === '2x2' ? 'bg-[#45dee8] text-[#00373a] font-bold shadow-sm' : 'text-[#bbc9ca] hover:text-[#e0e2ea]'}`}
              title="2x2 Focused Quad"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
            </button>
            <button 
              onClick={() => setViewMode('3x2')}
              className={`px-2 py-1 rounded transition-colors ${viewMode === '3x2' ? 'bg-[#45dee8] text-[#00373a] font-bold shadow-sm' : 'text-[#bbc9ca] hover:text-[#e0e2ea]'}`}
              title="3x2 Matrix Wall"
            >
              <span className="material-symbols-outlined text-sm">view_module</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Video Wall Grid */}
      <div className={`grid ${viewMode === '2x2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'} gap-3 w-full`}>
        {cameras.map((cam) => {
          const streamUrl = `http://127.0.0.1:8000/api/cameras/${cam.id}/stream`;
          const isFogActive = cam.fog_enhancer_active;
          const isCam01 = cam.id === 'CAM-01';

          return (
            <div 
              key={cam.id}
              className={`relative flex flex-col bg-[#0a0e13] rounded border ${
                isCam01 
                  ? (isCam01Breached ? 'border-[#ffb4ab] ring-2 ring-[#ffb4ab] shadow-xl shadow-[#93000a]/30 animate-pulse' : 'border-[#ffb4ab] ring-1 ring-[#93000a] shadow-lg') 
                  : 'border-[#3c494a]/80 shadow-md'
              } overflow-hidden group`}
            >
              {/* Live Feed Header Strip */}
              <div className={`flex items-center justify-between px-3 py-1.5 ${
                isCam01 ? 'bg-[#93000a]/40 text-[#ffdad6] border-b border-[#ffb4ab]/40' : 'bg-[#1c2025] text-[#e0e2ea] border-b border-[#3c494a]'
              } z-20`}>
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full ${isCam01 ? 'bg-[#ffb4ab] animate-ping' : 'bg-[#45dee8]'}`}></span>
                  <span className="font-mono-hud text-[11px] font-bold uppercase tracking-wider truncate">
                    {cam.id} // {cam.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isCam01 && (
                    <span className="font-mono-hud text-[9px] bg-[#ffb4ab] text-[#690005] px-1.5 py-0.5 rounded font-bold uppercase">
                      P1 INCURSION SENTINEL
                    </span>
                  )}
                  <span className="font-mono-hud text-[9px] text-[#bbc9ca] font-bold">
                    {cam.fps || 29.8} FPS
                  </span>
                </div>
              </div>

              {/* Video Viewport with HUD Elements */}
              <div className="relative w-full aspect-video bg-[#101419] overflow-hidden flex items-center justify-center">
                {/* Real Live Browser Webcam for CAM-01 */}
                {isCam01 && isWebcamActive ? (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover select-none"
                  />
                ) : (
                  <img 
                    src={streamUrl} 
                    alt={cam.name}
                    className="w-full h-full object-cover select-none"
                    onError={(e) => {
                      e.target.onerror = null;
                      if (cam.id === 'CAM-01') e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=640&q=80';
                      else if (cam.id === 'CAM-02') e.target.src = 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=640&q=80';
                      else if (cam.id === 'CAM-03') e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=640&q=80';
                      else e.target.src = 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=640&q=80';
                    }}
                  />
                )}

                {/* TACTICAL SVG HUD OVERLAY: Sterile Zone, Tripwire Line & Reticles */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                  viewBox="0 0 640 360" 
                  preserveAspectRatio="none"
                >
                  {/* 1. Yellow Sterile Perimeter Zone Polygon */}
                  <polygon 
                    points="20,130 550,130 620,330 20,330" 
                    fill="rgba(234, 179, 8, 0.12)" 
                    stroke="#EAB308" 
                    strokeWidth="2" 
                    strokeDasharray="6 4"
                  />
                  <text 
                    x="28" 
                    y="150" 
                    fill="#EAB308" 
                    fontFamily="monospace" 
                    fontSize="11" 
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    Sterile Perimeter Zone (Zero-Tolerance)
                  </text>

                  {/* 2. Red Horizontal Tripwire Line */}
                  <line 
                    x1="0" 
                    y1="210" 
                    x2="640" 
                    y2="210" 
                    stroke="#EF4444" 
                    strokeWidth="3" 
                  />
                  <text 
                    x="15" 
                    y="200" 
                    fill="#EF4444" 
                    fontFamily="monospace" 
                    fontSize="11" 
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    TRIPWIRE: Line of Control Tripwire Alpha
                  </text>

                  {/* 3. Center Crosshair Reticle */}
                  <line x1="320" y1="140" x2="320" y2="200" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.8" />
                  <line x1="290" y1="170" x2="350" y2="170" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.8" />
                  <circle cx="320" cy="170" r="14" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.8" fill="none" />
                </svg>

                {/* DYNAMIC AI TARGET BOUNDING BOX */}
                {isCam01 && activeTargetType === 'human' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-56 border-2 border-[#ffb4ab] bg-[#ffb4ab]/15 pointer-events-none z-20 flex flex-col justify-between p-1.5 shadow-[0_0_20px_rgba(255,180,171,0.5)]">
                    <div className="bg-[#93000a] text-[#ffdad6] px-1.5 py-0.5 rounded text-[9px] font-mono-hud font-bold uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-ping"></span>
                        <span>ID:01 TARGET: HUMAN</span>
                      </span>
                      <span className="text-[#ffb4ab]">96% CONF</span>
                    </div>
                    {/* Reticle Red Dot Centroid */}
                    <div className="w-3 h-3 bg-[#ffb4ab] rounded-full mx-auto shadow-md animate-pulse"></div>
                    {/* Corner Reticle Accents */}
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#ffb4ab]"></div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ffb4ab]"></div>
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#ffb4ab]"></div>
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#ffb4ab]"></div>
                    <div className="bg-[#93000a] text-[#ffb4ab] px-1 text-[8px] font-mono-hud font-bold text-center uppercase tracking-wider">
                      BREACH DETECTED // STERILE ZONE
                    </div>
                  </div>
                )}

                {/* ANIMAL SUPPRESSION BOUNDING BOX */}
                {isCam01 && activeTargetType === 'animal' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-44 border-2 border-[#10b981] bg-[#10b981]/15 pointer-events-none z-20 flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    <div className="bg-[#064e3b] text-[#a7f3d0] px-1.5 py-0.5 rounded text-[9px] font-mono-hud font-bold uppercase flex items-center justify-between">
                      <span>ID:02 TARGET: COW / WILDLIFE</span>
                      <span className="text-[#34d399]">92% CONF</span>
                    </div>
                    <div className="w-3 h-3 bg-[#10b981] rounded-full mx-auto shadow-md"></div>
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#10b981]"></div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#10b981]"></div>
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#10b981]"></div>
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#10b981]"></div>
                    <div className="bg-[#064e3b] text-[#a7f3d0] px-1 text-[8px] font-mono-hud font-bold text-center uppercase tracking-wider">
                      SAFE — ANIMAL (COW), SUPPRESSED
                    </div>
                  </div>
                )}

                {/* VEHICULAR INCURSION BOUNDING BOX */}
                {isCam01 && activeTargetType === 'vehicle' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-48 border-2 border-[#f59e0b] bg-[#f59e0b]/15 pointer-events-none z-20 flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    <div className="bg-[#78350f] text-[#fef3c7] px-1.5 py-0.5 rounded text-[9px] font-mono-hud font-bold uppercase flex items-center justify-between">
                      <span>ID:03 TARGET: VEHICLE / TRUCK</span>
                      <span className="text-[#fde68a]">94% CONF</span>
                    </div>
                    <div className="w-3 h-3 bg-[#f59e0b] rounded-full mx-auto shadow-md"></div>
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#f59e0b]"></div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#f59e0b]"></div>
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#f59e0b]"></div>
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#f59e0b]"></div>
                    <div className="bg-[#78350f] text-[#fef3c7] px-1 text-[8px] font-mono-hud font-bold text-center uppercase tracking-wider">
                      ALERT: VEHICLE IN STERILE ZONE
                    </div>
                  </div>
                )}

                {/* Optical Sensor Corner Crop Marks */}
                <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#45dee8] pointer-events-none opacity-80"></div>
                <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#45dee8] pointer-events-none opacity-80"></div>
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#45dee8] pointer-events-none opacity-80"></div>
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#45dee8] pointer-events-none opacity-80"></div>

                {/* Fog De-Noising Active Badge */}
                {isFogActive && (
                  <div className="absolute top-2 left-3 bg-[#004a4f]/90 border border-[#45dee8] text-[#45dee8] font-mono-hud text-[9px] px-2 py-0.5 rounded flex items-center gap-1 shadow-lg z-20">
                    <span className="material-symbols-outlined text-xs">filter_drama</span>
                    <span>ALL-WEATHER CLAHE ACTIVE</span>
                  </div>
                )}

                {/* In-Feed Telemetry Data Readout at Bottom-Left */}
                <div className="absolute bottom-2 left-3 flex flex-col bg-[#0a0e13]/90 border border-[#3c494a] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-20">
                  <span className="font-mono-hud text-[9px] text-[#45dee8] font-bold">
                    {cam.scenario || `${cam.sector} // 1080p HD`}
                  </span>
                  <span className="font-mono-hud text-[8px] text-[#bbc9ca]">
                    AZ: 142.4° // EL: -12.1° // LATENCY: 12ms
                  </span>
                </div>

                {/* Scanline HUD lines */}
                <div className="absolute inset-0 tactical-scanline pointer-events-none opacity-30 z-10"></div>
              </div>

              {/* Bottom Control Strip */}
              <div className="bg-[#181c21] border-t border-[#3c494a]/80 px-3 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Webcam toggle for CAM-01 */}
                  {isCam01 && (
                    <button
                      onClick={() => toggleWebcam(cam.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono-hud text-[11px] font-bold transition-all ${
                        isWebcamActive
                          ? 'bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab] shadow-[0_0_10px_rgba(255,180,171,0.5)] animate-pulse'
                          : 'bg-[#1c2025] text-[#45dee8] border border-[#45dee8]/60 hover:bg-[#004a4f]/40'
                      }`}
                      title="Switch between live laptop webcam and simulated sentinel"
                    >
                      <span className="material-symbols-outlined text-xs">videocam</span>
                      <span>{isWebcamActive ? '🔴 WEBCAM (ACTIVE)' : '📷 OPEN WEBCAM'}</span>
                    </button>
                  )}

                  {/* Fog Enhancement Toggle */}
                  <button
                    onClick={() => onToggleFog(cam.id, !isFogActive)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono-hud text-[11px] font-semibold transition-all ${
                      isFogActive
                        ? 'bg-[#00c2cc] text-[#004a4f] font-bold border border-[#45dee8] shadow-[0_0_10px_rgba(69,222,232,0.4)]'
                        : 'bg-[#1c2025] text-[#bbc9ca] border border-[#3c494a] hover:bg-[#262a30] hover:text-[#e0e2ea]'
                    }`}
                    title="Toggle CLAHE atmospheric de-fogging pipeline stage"
                  >
                    <span className="material-symbols-outlined text-xs">cloud</span>
                    <span>{isFogActive ? 'CLAHE ON' : 'DE-FOG'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectCamera(cam)}
                    className="p-1 text-[#bbc9ca] hover:text-[#45dee8] hover:bg-[#262a30] rounded transition-colors"
                    title="Inspect & Calibrate Zones"
                  >
                    <span className="material-symbols-outlined text-base">polyline</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
