import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function TacticalMap({ cameras = [], alerts = [], onSelectCamera }) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayerRef = useRef(null);
  const onSelectCameraRef = useRef(onSelectCamera);
  const camerasRef = useRef(cameras);
  const alertsRef = useRef(alerts);
  const [mapMode, setMapMode] = useState('SATELLITE');
  const [radarAngle, setRadarAngle] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  // Keep refs in sync without causing re-renders
  useEffect(() => { onSelectCameraRef.current = onSelectCamera; }, [onSelectCamera]);
  useEffect(() => { camerasRef.current = cameras; }, [cameras]);
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);

  // Animated Radar Sweep
  useEffect(() => {
    if (mapMode !== 'RADAR') return;
    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 4) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [mapMode]);

  // Initialize Leaflet map ONCE — container is always in DOM (hidden via CSS when in RADAR mode)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Don't recreate if already initialized
    if (mapInstance.current) return;

    // Safety: clear any stale leaflet id
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    try {
      const map = L.map(container, {
        center: [27.3866, 88.8310],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'tactical-map-tiles'
      }).addTo(map);

      // Red Sterile Perimeter Buffer Polygon
      L.polygon([
        [27.395, 88.820],
        [27.400, 88.845],
        [27.380, 88.850],
        [27.375, 88.825]
      ], {
        color: '#EF4444',
        weight: 2,
        fillColor: '#EF4444',
        fillOpacity: 0.18,
        dashArray: '6, 6'
      }).addTo(map).bindTooltip("STERILE BORDER BUFFER ZONE (ZERO TOLERANCE)", {
        className: 'tactical-tooltip',
        permanent: false
      });

      // Tripwire Line Alpha
      L.polyline([
        [27.388, 88.820],
        [27.385, 88.848]
      ], {
        color: '#FFB4AB',
        weight: 3.5,
        dashArray: '8, 4'
      }).addTo(map).bindTooltip("LINE OF CONTROL TRIPWIRE ALPHA", {
        className: 'tactical-tooltip',
        permanent: false
      });

      // Layer group for dynamic markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstance.current = map;

      // Force tile load after layout
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          setMapReady(true);
        }
      }, 300);
    } catch (err) {
      console.warn("Leaflet map init error:", err);
    }

    return () => {
      if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch (e) {}
        mapInstance.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []); // Runs ONCE on mount — never again

  // When switching back to SATELLITE, invalidate map size so tiles reload
  useEffect(() => {
    if (mapMode === 'SATELLITE' && mapInstance.current) {
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 100);
    }
  }, [mapMode]);

  // Update markers when cameras/alerts data changes — no map rebuild
  useEffect(() => {
    if (!mapInstance.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    cameras.forEach((cam) => {
      if (!cam || !cam.location) return;
      const isAlert = alerts.some(a => a.camera_id === cam.id && a.status === 'PENDING');
      const markerColor = isAlert ? '#EF4444' : (cam.status === 'ONLINE' ? '#10B981' : '#64748B');

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background: ${markerColor};
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2.5px solid #0a0e13;
            box-shadow: 0 0 12px ${markerColor};
            ${isAlert ? 'box-shadow: 0 0 20px #ef4444; border: 2.5px solid #ffffff;' : ''}
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([cam.location.lat, cam.location.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; padding: 4px; color: #0f172a; background: white; border-radius: 4px; min-width: 180px;">
          <strong style="color: #0284c7; text-transform: uppercase;">${cam.name}</strong><br/>
          <b>ID:</b> ${cam.id}<br/>
          <b>Sector:</b> ${cam.sector}<br/>
          <b>Status:</b> <span style="color: ${markerColor}; font-weight: bold;">${cam.status}</span> (${cam.fps || 29.8} FPS)<br/>
          <b>Resolution:</b> ${cam.resolution}
        </div>
      `);
      marker.on('click', () => {
        if (onSelectCameraRef.current) onSelectCameraRef.current(cam);
      });
      markersLayerRef.current.addLayer(marker);
    });
  }, [cameras, alerts]);

  const activeIncursion = alerts.find(a => a.status === 'PENDING');

  return (
    <div className="relative w-full h-full min-h-[220px] bg-[#070b0e] rounded border border-[#3c494a] overflow-hidden select-none flex flex-col justify-between">
      {/* Top Tactical HUD Header */}
      <div className="absolute top-2 left-3 right-3 z-[500] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0a0e13]/90 border border-[#3c494a] px-2.5 py-1 rounded backdrop-blur-sm pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#45dee8] animate-ping"></span>
          <span className="font-mono-hud text-[10px] text-[#45dee8] font-bold tracking-wider uppercase">
            GIS TACTICAL GRID // SIKKIM FRONTIER 27.38°N 88.83°E
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center bg-[#1c2025]/90 border border-[#3c494a] p-0.5 rounded shadow-lg backdrop-blur-sm">
            <button
              onClick={() => setMapMode('SATELLITE')}
              className={`px-2 py-0.5 rounded font-mono-hud text-[10px] font-bold transition-all ${
                mapMode === 'SATELLITE'
                  ? 'bg-[#45dee8] text-[#00373a] shadow-sm'
                  : 'text-[#bbc9ca] hover:text-[#e0e2ea]'
              }`}
            >
              🗺️ GIS MAP
            </button>
            <button
              onClick={() => setMapMode('RADAR')}
              className={`px-2 py-0.5 rounded font-mono-hud text-[10px] font-bold transition-all ${
                mapMode === 'RADAR'
                  ? 'bg-[#45dee8] text-[#00373a] shadow-sm'
                  : 'text-[#bbc9ca] hover:text-[#e0e2ea]'
              }`}
            >
              📡 RADAR
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 bg-[#0a0e13]/90 border border-[#3c494a] px-2 py-1 rounded text-[9px] font-mono-hud text-[#bbc9ca] backdrop-blur-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span>SECURE</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse"></span>
              <span>INCURSION</span>
            </span>
          </div>
        </div>
      </div>

      {/* BOTH map and radar stay in DOM — CSS controls visibility */}
      {/* Leaflet Map Container — always mounted, hidden when in RADAR mode */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[220px] z-0"
        style={{ display: mapMode === 'SATELLITE' ? 'block' : 'none' }}
      />

      {/* Vector Tactical Radar Mode — shown only when RADAR */}
      {mapMode === 'RADAR' && (
        <svg
          className="w-full h-full absolute inset-0"
          viewBox="0 0 640 320"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#45dee8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#45dee8" stopOpacity="0" />
            </radialGradient>
            <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1c2b36" strokeWidth="0.75" />
            </pattern>
          </defs>

          <rect width="640" height="320" fill="url(#tacticalGrid)" />

          <circle cx="320" cy="160" r="60" fill="none" stroke="#223843" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="320" cy="160" r="110" fill="none" stroke="#223843" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="320" cy="160" r="150" fill="none" stroke="#1a2d36" strokeWidth="1" />
          <text x="325" y="105" fill="#3c525d" fontSize="8" fontFamily="monospace">RANGE 500m</text>
          <text x="325" y="55" fill="#3c525d" fontSize="8" fontFamily="monospace">RANGE 1000m</text>

          <line x1="320" y1="0" x2="320" y2="320" stroke="#1c2e38" strokeWidth="1" />
          <line x1="0" y1="160" x2="640" y2="160" stroke="#1c2e38" strokeWidth="1" />

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

          <line x1="40" y1="180" x2="600" y2="180" stroke="#ffb4ab" strokeWidth="1.5" strokeDasharray="8 4" />
          <text x="50" y="174" fill="#ffb4ab" fontSize="8" fontFamily="monospace" fontWeight="bold">
            TRIPWIRE ALPHA — RESTRICTED FRONTIER LINE
          </text>

          <g transform={`rotate(${radarAngle} 320 160)`}>
            <line x1="320" y1="160" x2="320" y2="10" stroke="#45dee8" strokeWidth="1.5" opacity="0.6" />
            <path d="M 320 160 L 320 10 A 150 150 0 0 1 370 18 Z" fill="url(#radarSweep)" opacity="0.4" />
          </g>

          {cameras.map((cam, idx) => {
            const positions = [
              { cx: 320, cy: 155 },
              { cx: 480, cy: 110 },
              { cx: 520, cy: 260 },
              { cx: 140, cy: 220 }
            ];
            const coords = positions[idx] || { cx: 320, cy: 160 };
            const isAlert = alerts.some(a => a.camera_id === cam.id && a.status === 'PENDING');
            const markerColor = isAlert ? '#ef4444' : (cam.status === 'ONLINE' ? '#10b981' : '#64748b');

            return (
              <g
                key={cam.id}
                className="cursor-pointer"
                onClick={() => { if (onSelectCameraRef.current) onSelectCameraRef.current(cam); }}
              >
                {isAlert && (
                  <circle cx={coords.cx} cy={coords.cy} r="18" fill="none" stroke="#ef4444" strokeWidth="1.5">
                    <animate attributeName="r" values="10;24;10" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={coords.cx} cy={coords.cy} r="7" fill="#0a0e13" stroke={markerColor} strokeWidth="2" />
                <circle cx={coords.cx} cy={coords.cy} r="3" fill={markerColor} />
                <text x={coords.cx} y={coords.cy + 18} fill={isAlert ? '#ffdad6' : '#45dee8'} fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {cam.id}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* Bottom Telemetry Footer */}
      <div className="absolute bottom-2 left-3 right-3 z-[500] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-[#0a0e13]/90 border border-[#3c494a] px-2.5 py-1 rounded text-[9px] font-mono-hud text-[#bbc9ca] backdrop-blur-sm">
          <span>LAT: 27.3866° N</span>
          <span>LNG: 88.8310° E</span>
          <span className="text-[#45dee8]">AZ: 142.4° // EL: -12.1°</span>
          <span className="text-[#5de6ff]">GPS LOCK: 14 SATELLITES</span>
        </div>

        {activeIncursion && (
          <div className="bg-[#93000a]/90 border border-[#ffb4ab] text-[#ffdad6] px-2.5 py-1 rounded text-[9px] font-mono-hud font-bold animate-pulse backdrop-blur-sm">
            🚨 BREACH DETECTED: {activeIncursion.object_type?.toUpperCase()} AT {activeIncursion.camera_id}
          </div>
        )}
      </div>
    </div>
  );
}
