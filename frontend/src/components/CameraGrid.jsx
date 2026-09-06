import React, { useState } from 'react';

export default function CameraGrid({ cameras = [], onToggleFog, onSelectCamera }) {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [activeSpectrum, setActiveSpectrum] = useState('ALL'); // ALL, OPTICAL, THERMAL, IRONBOW
  const [viewMode, setViewMode] = useState('2x2'); // 2x2, 3x2, focus

  const toggleWebcam = async (camId) => {
    try {
      const nextSource = isWebcamActive ? "demo" : "webcam";
      await fetch(`http://127.0.0.1:8000/api/cameras/${camId}/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: nextSource })
      });
      setIsWebcamActive(!isWebcamActive);
    } catch (e) {
      console.error("Failed to switch camera source:", e);
    }
  };

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

        {/* Layout Controls & Spectrum Presets */}
        <div className="flex items-center gap-2 flex-wrap">
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

          <div className="h-4 w-px bg-[#3c494a]"></div>

          {/* Spectrum Presets */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setActiveSpectrum('OPTICAL')}
              className={`px-2 py-0.5 rounded font-mono-hud text-[11px] ${activeSpectrum === 'OPTICAL' ? 'bg-[#00c2cc] text-[#004a4f] font-bold' : 'bg-[#1c2025] text-[#bbc9ca] hover:text-[#e0e2ea]'}`}
            >
              OPTICAL 4K
            </button>
            <button 
              onClick={() => setActiveSpectrum('THERMAL')}
              className={`px-2 py-0.5 rounded font-mono-hud text-[11px] ${activeSpectrum === 'THERMAL' ? 'bg-[#00c2cc] text-[#004a4f] font-bold' : 'bg-[#1c2025] text-[#bbc9ca] hover:text-[#e0e2ea]'}`}
            >
              THERMAL FLIR
            </button>
            <button 
              onClick={() => setActiveSpectrum('IRONBOW')}
              className={`px-2 py-0.5 rounded font-mono-hud text-[11px] ${activeSpectrum === 'IRONBOW' ? 'bg-[#00c2cc] text-[#004a4f] font-bold' : 'bg-[#1c2025] text-[#bbc9ca] hover:text-[#e0e2ea]'}`}
            >
              IRONBOW DE-FOG
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
                  ? 'border-[#ffb4ab] ring-1 ring-[#93000a] shadow-lg shadow-[#93000a]/15' 
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
                    {cam.fps || 28.5} FPS
                  </span>
                </div>
              </div>

              {/* Video Viewport with HUD Elements */}
              <div className="relative w-full aspect-video bg-[#101419] overflow-hidden flex items-center justify-center">
                <img 
                  src={streamUrl} 
                  alt={cam.name}
                  className="w-full h-full object-cover select-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=640&q=80';
                  }}
                />

                {/* Optical Sensor Corner Crop Marks */}
                <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#45dee8] pointer-events-none opacity-80"></div>
                <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#45dee8] pointer-events-none opacity-80"></div>
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#45dee8] pointer-events-none opacity-80"></div>
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#45dee8] pointer-events-none opacity-80"></div>

                {/* Crosshairs Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                  <div className="w-12 h-12 relative flex items-center justify-center">
                    <div className="absolute w-full h-px bg-[#45dee8]"></div>
                    <div className="absolute h-full w-px bg-[#45dee8]"></div>
                    <div className="w-5 h-5 rounded-full border border-[#45dee8]"></div>
                  </div>
                </div>

                {/* Fog De-Noising Active Badge */}
                {isFogActive && (
                  <div className="absolute top-2 left-3 bg-[#004a4f]/90 border border-[#45dee8] text-[#45dee8] font-mono-hud text-[9px] px-2 py-0.5 rounded flex items-center gap-1 shadow-lg z-10">
                    <span className="material-symbols-outlined text-xs">filter_drama</span>
                    <span>ALL-WEATHER CLAHE ACTIVE</span>
                  </div>
                )}

                {/* In-Feed Telemetry Data Readout at Bottom-Left */}
                <div className="absolute bottom-2 left-3 flex flex-col bg-[#0a0e13]/90 border border-[#3c494a] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10">
                  <span className="font-mono-hud text-[9px] text-[#45dee8] font-bold">
                    {cam.scenario || `${cam.sector} // 1080p HD`}
                  </span>
                  <span className="font-mono-hud text-[8px] text-[#bbc9ca]">
                    AZ: 142.4° // EL: -12.1° // LATENCY: 12ms
                  </span>
                </div>

                {/* Scanline HUD lines */}
                <div className="absolute inset-0 tactical-scanline pointer-events-none opacity-30"></div>
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
                      title="Switch between live laptop webcam and demo file"
                    >
                      <span className="material-symbols-outlined text-xs">videocam</span>
                      <span>{isWebcamActive ? '🔴 WEBCAM (ACTIVE)' : '📷 WEBCAM'}</span>
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

