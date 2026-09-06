import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function TacticalMap({ cameras = [], alerts = [], onSelectCamera }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      // Initialize Leaflet map centered at Sikkim / Nathu La border sector
      const map = L.map(mapRef.current, {
        center: [27.3866, 88.8310],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // Free tactical tile layer without API keys (OSM with tactical CSS filter)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'tactical-map-tiles'
      }).addTo(map);

      // Add border sterile zone buffer line
      const borderPoly = L.polygon([
        [27.395, 88.820],
        [27.400, 88.845],
        [27.380, 88.850],
        [27.375, 88.825]
      ], {
        color: '#EF4444',
        weight: 1,
        fillColor: '#EF4444',
        fillOpacity: 0.1,
        dashArray: '4, 8'
      }).addTo(map);
      borderPoly.bindTooltip("STERILE BORDER BUFFER ZONE (ZERO TOLERANCE)", { className: 'tactical-tooltip' });

      mapInstance.current = map;
    }

    const map = mapInstance.current;

    // Plot Camera Markers
    cameras.forEach((cam) => {
      const isAlertActive = alerts.some(a => a.camera_id === cam.id && a.status === 'PENDING');
      const markerColor = isAlertActive ? '#EF4444' : (cam.status === 'ONLINE' ? '#10B981' : '#64748B');

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background: ${markerColor};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid #0B0F17;
            box-shadow: 0 0 10px ${markerColor};
            animation: ${isAlertActive ? 'pulse-red 1s infinite' : 'none'};
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      if (markersRef.current[cam.id]) {
        markersRef.current[cam.id].setIcon(customIcon);
      } else {
        const marker = L.marker([cam.location.lat, cam.location.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; color: #0B0F17;">
            <strong>${cam.name}</strong><br/>
            ID: ${cam.id}<br/>
            Status: ${cam.status}<br/>
            Resolution: ${cam.resolution}
          </div>
        `);
        marker.on('click', () => {
          if (onSelectCamera) onSelectCamera(cam);
        });
        markersRef.current[cam.id] = marker;
      }
    });
  }, [cameras, alerts, onSelectCamera]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-950 rounded border border-tactical-border overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Tactical Map Overlay HUD */}
      <div className="absolute top-2 left-2 z-[400] bg-slate-900/90 border border-slate-700 px-2.5 py-1.5 rounded text-[10px] font-mono space-y-1">
        <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>GIS TACTICAL GRID (SIKKIM 27.38°N 88.83°E)</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-300 text-[9px]">
          <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span><span>Normal</span></span>
          <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span><span>Active Incursion</span></span>
          <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-slate-500 rounded-full inline-block"></span><span>Offline</span></span>
        </div>
      </div>
    </div>
  );
}
