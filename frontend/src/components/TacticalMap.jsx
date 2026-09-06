import React, { useState, useEffect } from 'react';

export default function TacticalMap({ cameras = [], alerts = [], onSelectCamera }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [radarAngle, setRadarAngle] = useState(0);

  // Animated Radar Sweep
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Node positions mapped across the tactical canvas
  const nodeCoords = {
    'CAM-01': { cx: 320, cy: 155, lat: '27.3866° N', lng: '88.8310° E', name: 'BOP-01 NATHU LA (FORWARD SENTRY)' },
    'CAM-02': { cx: 480, cy: 110, lat: '27.3910° N', lng: '88.8250° E', name: 'BOP-02 RIDGE DEFILE (LWIR THERMAL)' },
    'CAM-03': { cx: 520, cy: 260, lat: '27.3820° N', lng: '88.8390° E', name: 'BOP-03 VALLEY MARSH (FOG CORRIDOR)' },
    'CAM-04': { cx: 140, cy: 220, lat: '27.3750° N', lng: '88.8220° E', name: 'BOP-04 THAR SECTOR (DESERT BUFFER)' },
  };

  const activeIncursion = alerts.find(a => a.status === 'PENDING');

  return (
    <div className="relative w-full h-full min-h-[220px] bg-[#070b0e] rounded border border-[#3c494a] overflow-hidden select-none flex flex-col justify-between">
      {/* Top Tactical HUD Bar */}
      <div className="absolute top-2 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0a0e13]/90 border border-[#3c494a] px-2.5 py-1 rounded backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#45dee8] animate-ping"></span>
          <span className="font-mono-hud text-[10px] text-[#45dee8] font-bold tracking-wider">
            TACTICAL GIS RADAR MATRIX // SIKKIM FRONTIER 27.38°N 88.83°E
          </span>
        </div>

        <div className="flex items-center gap-3 bg-[#0a0e13]/90 border border-[#3c494a] px-2.5 py-1 rounded text-[9px] font-mono-hud text-[#bbc9ca] backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span>SECURE</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse"></span>
            <span>INCURSION</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#5de6ff]"></span>
            <span>CLAHE SENTINEL</span>
          </span>
        </div>
      </div>

      {/* SVG Military Tactical Radar Vector Canvas */}
      <svg 
        className="w-full h-full absolute inset-0"
        viewBox="0 0 640 320" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Radar Sweep Gradient */}
          <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#45dee8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#45dee8" stopOpacity="0" />
          </radialGradient>

          {/* Grid Pattern */}
          <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1c2b36" strokeWidth="0.75" />
          </pattern>
        </defs>

        {/* Grid Background */}
        <rect width="640" height="320" fill="url(#tacticalGrid)" />

        {/* Range Circles (500m, 1000m, 2000m) */}
        <circle cx="320" cy="160" r="60" fill="none" stroke="#223843" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="320" cy="160" r="110" fill="none" stroke="#223843" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="320" cy="160" r="150" fill="none" stroke="#1a2d36" strokeWidth="1" />
        <text x="325" y="105" fill="#3c525d" fontSize="8" fontFamily="monospace">RANGE 500m</text>
        <text x="325" y="55" fill="#3c525d" fontSize="8" fontFamily="monospace">RANGE 1000m</text>

        {/* Crosshair Axes */}
        <line x1="320" y1="0" x2="320" y2="320" stroke="#1c2e38" strokeWidth="1" />
        <line x1="0" y1="160" x2="640" y2="160" stroke="#1c2e38" strokeWidth="1" />

        {/* Sterile Buffer Zone Polygon */}
        <polygon 
          points="60,60 580,70 540,270 90,260" 
          fill="rgba(239, 68, 68, 0.04)" 
          stroke="#ef4444" 
          strokeWidth="1.2" 
          strokeDasharray="6 4"
        />
        <text x="75" y="80" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold" opacity="0.8">
          STERILE BUFFER ZONE // ZERO-TOLERANCE DEMARCATION LINE
        </text>

        {/* Line of Control Tripwire Vector */}
        <line x1="40" y1="180" x2="600" y2="180" stroke="#ffb4ab" strokeWidth="1.5" strokeDasharray="8 4" />
        <text x="50" y="174" fill="#ffb4ab" fontSize="8" fontFamily="monospace" fontWeight="bold">
          TRIPWIRE ALPHA — RESTRICTED FRONTIER LINE
        </text>

        {/* Rotating Radar Sweep Line */}
        <g transform={`rotate(${radarAngle} 320 160)`}>
          <line x1="320" y1="160" x2="320" y2="10" stroke="#45dee8" strokeWidth="1.5" opacity="0.6" />
          <path d="M 320 160 L 320 10 A 150 150 0 0 1 370 18 Z" fill="url(#radarSweep)" opacity="0.4" />
        </g>

        {/* Inter-BOP Tactical Data Links */}
        <line x1="140" y1="220" x2="320" y2="155" stroke="#004a4f" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="320" y1="155" x2="480" y2="110" stroke="#004a4f" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="480" y1="110" x2="520" y2="260" stroke="#004a4f" strokeWidth="1" strokeDasharray="3 3" />

        {/* Outpost Node Markers */}
        {cameras.map((cam) => {
          const coords = nodeCoords[cam.id] || { cx: 320, cy: 160, lat: '27.38°N', lng: '88.83°E' };
          const isAlert = alerts.some(a => a.camera_id === cam.id && a.status === 'PENDING');
          const isSelected = selectedNode === cam.id;
          const markerColor = isAlert ? '#ef4444' : (cam.status === 'ONLINE' ? '#10b981' : '#64748b');

          return (
            <g 
              key={cam.id} 
              className="cursor-pointer group"
              onClick={() => {
                setSelectedNode(cam.id);
                if (onSelectCamera) onSelectCamera(cam);
              }}
            >
              {/* Outer pulsing ring for breach */}
              {isAlert && (
                <circle 
                  cx={coords.cx} 
                  cy={coords.cy} 
                  r="18" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  opacity="0.8"
                >
                  <animate attributeName="r" values="10;26;10" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Node Outer Circle */}
              <circle 
                cx={coords.cx} 
                cy={coords.cy} 
                r={isSelected ? 10 : 8} 
                fill="#0a0e13" 
                stroke={markerColor} 
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all"
              />

              {/* Node Center Dot */}
              <circle 
                cx={coords.cx} 
                cy={coords.cy} 
                r={isSelected ? 4 : 3} 
                fill={markerColor} 
              />

              {/* Outpost Label Badge */}
              <rect 
                x={coords.cx - 36} 
                y={coords.cy + 12} 
                width="72" 
                height="15" 
                rx="3" 
                fill="rgba(10, 14, 19, 0.9)" 
                stroke={isAlert ? '#ef4444' : '#3c494a'} 
                strokeWidth="0.8" 
              />
              <text 
                x={coords.cx} 
                y={coords.cy + 23} 
                fill={isAlert ? '#ffdad6' : '#45dee8'} 
                fontSize="8" 
                fontFamily="monospace" 
                fontWeight="bold" 
                textAnchor="middle"
              >
                {cam.id} {isAlert ? '🚨' : '🟢'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Bottom Telemetry Footer */}
      <div className="absolute bottom-2 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-[#0a0e13]/90 border border-[#3c494a] px-2.5 py-1 rounded text-[9px] font-mono-hud text-[#bbc9ca] backdrop-blur-sm">
          <span>LAT: 27.3866° N</span>
          <span>LNG: 88.8310° E</span>
          <span className="text-[#45dee8]">AZ: 142.4° // EL: -12.1°</span>
          <span className="text-[#5de6ff]">GPS LOCK: 14 SATELLITES</span>
        </div>

        {activeIncursion && (
          <div className="bg-[#93000a]/90 border border-[#ffb4ab] text-[#ffdad6] px-2.5 py-1 rounded text-[9px] font-mono-hud font-bold animate-pulse backdrop-blur-sm">
            BREACH DETECTED: {activeIncursion.object_type?.toUpperCase()} AT {activeIncursion.camera_id}
          </div>
        )}
      </div>
    </div>
  );
}
