import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const ANIMAL_CLASSES = new Set(['cow', 'horse', 'sheep', 'dog', 'cat', 'bird', 'elephant', 'bear', 'zebra', 'giraffe']);
const VEHICLE_CLASSES = new Set(['car', 'truck', 'bus', 'motorcycle', 'bicycle']);

export default function CameraGrid({ 
  cameras = [], 
  onToggleFog, 
  onSelectCamera, 
  onTriggerAlert,
  onSilenceAlarm,
  activeAlarm 
}) {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [activeSpectrum, setActiveSpectrum] = useState('ALL');
  const [viewMode, setViewMode] = useState('2x2');
  const [webcamStream, setWebcamStream] = useState(null);
  
  // Real-time AI Detections from Browser TensorFlow / COCO-SSD
  const [liveDetections, setLiveDetections] = useState([]);
  const [modelLoading, setModelLoading] = useState(false);
  
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Load COCO-SSD model once
  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      try {
        setModelLoading(true);
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (isMounted) {
          modelRef.current = loadedModel;
          setModelLoading(false);
        }
      } catch (err) {
        console.warn("TensorFlow COCO-SSD load error:", err);
        setModelLoading(false);
      }
    };
    loadModel();
    return () => { isMounted = false; };
  }, []);

  // Attach webcam stream to video element and start real-time detection loop
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        startDetectionLoop();
      };
    }
  }, [webcamStream]);

  // Clean up webcam stream & animation loop on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  const startDetectionLoop = () => {
    const detectFrame = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && modelRef.current) {
        try {
          const predictions = await modelRef.current.detect(videoRef.current);
          
          let hasHumanBreach = false;
          let hasAnimal = false;
          const mappedDetections = [];

          const vWidth = videoRef.current.videoWidth || 640;
          const vHeight = videoRef.current.videoHeight || 360;

          predictions.forEach((pred, idx) => {
            const [bx, by, bw, bh] = pred.bbox;
            const cls = pred.class.toLowerCase();
            const score = Math.round(pred.score * 100);

            // Scale bounding box to percentage coordinates
            const leftPct = (bx / vWidth) * 100;
            const topPct = (by / vHeight) * 100;
            const widthPct = (bw / vWidth) * 100;
            const heightPct = (bh / vHeight) * 100;
            const centerY = by + bh / 2;

            if (ANIMAL_CLASSES.has(cls)) {
              hasAnimal = true;
              mappedDetections.push({
                id: 4100 + idx,
                type: 'animal',
                className: cls,
                label: `Safe — Animal (${cls.charAt(0).toUpperCase() + cls.slice(1)}), Suppressed`,
                color: '#10B981', // Emerald Green
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                score
              });
            } else if (cls === 'person') {
              hasHumanBreach = true;
              mappedDetections.push({
                id: 10 + idx,
                type: 'human',
                className: 'person',
                label: `ALERT: PERSON (${score}%)`,
                color: '#EF4444', // Crimson Red
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                score
              });
            } else if (VEHICLE_CLASSES.has(cls)) {
              mappedDetections.push({
                id: 30 + idx,
                type: 'vehicle',
                className: cls,
                label: `ALERT: VEHICLE (${cls.toUpperCase()})`,
                color: '#F59E0B', // Amber Orange
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                score
              });
            }
          });

          setLiveDetections(mappedDetections);

          // Trigger continuous alarm ONLY if human is present
          if (hasHumanBreach) {
            if (onTriggerAlert) {
              onTriggerAlert({
                id: `ALT-NATHULA-${Math.floor(10000 + Math.random() * 90000)}`,
                camera_id: 'CAM-01',
                bop_id: 'BOP-01-NATHULA',
                object_type: 'person',
                confidence: 0.96,
                incursion_type: 'STERILE_ZONE_BREACH',
                zone_name: 'Sterile Perimeter Zone (Zero-Tolerance)',
                severity: 'CRITICAL',
                timestamp: Date.now() / 1000,
                formatted_time: new Date().toLocaleTimeString()
              });
            }
          } else if (hasAnimal && !hasHumanBreach) {
            // Silence alarm for animals!
            if (onSilenceAlarm) onSilenceAlarm();
          }
        } catch (e) {}
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  };

  const toggleWebcam = async (camId = 'CAM-01') => {
    if (!isWebcamActive) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 360 } },
            audio: false
          });
          setWebcamStream(stream);
          setIsWebcamActive(true);
        }
      } catch (err) {
        console.warn("Direct webcam access error:", err);
      }
    } else {
      // Complete Shutdown of webcam
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        setWebcamStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        try { videoRef.current.pause(); } catch (e) {}
      }
      setIsWebcamActive(false);
      setLiveDetections([]);
      if (onSilenceAlarm) onSilenceAlarm();

      // Reset backend to demo file to free hardware
      try {
        fetch(`/api/cameras/${camId}/source`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'demo' })
        }).catch(() => {});
        fetch(`http://127.0.0.1:8000/api/cameras/${camId}/source`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'demo' })
        }).catch(() => {});
      } catch (e) {}
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
          {modelLoading && (
            <span className="font-mono-hud text-[9px] text-[#45dee8] bg-[#004a4f]/40 px-2 py-0.5 rounded border border-[#45dee8]/40 animate-pulse">
              INITIALIZING AI VISION MODEL...
            </span>
          )}
        </div>

        {/* View Toggle Matrix & Spectrum Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setActiveSpectrum('OPTICAL')}
              className={`px-2 py-0.5 rounded font-mono-hud text-[11px] ${activeSpectrum === 'OPTICAL' ? 'bg-[#00c2cc] text-[#004a4f] font-bold' : 'bg-[#1c2025] text-[#bbc9ca] hover:text-[#e0e2ea]'}`}
            >
              OPTICAL
            </button>
            <button 
              onClick={() => setActiveSpectrum('THERMAL')}
              className={`px-2 py-0.5 rounded font-mono-hud text-[11px] ${activeSpectrum === 'THERMAL' ? 'bg-[#00c2cc] text-[#004a4f] font-bold' : 'bg-[#1c2025] text-[#bbc9ca] hover:text-[#e0e2ea]'}`}
            >
              THERMAL
            </button>
            <button 
              onClick={() => setActiveSpectrum('IRONBOW')}
              className={`px-2 py-0.5 rounded font-mono-hud text-[11px] ${activeSpectrum === 'IRONBOW' ? 'bg-[#00c2cc] text-[#004a4f] font-bold' : 'bg-[#1c2025] text-[#bbc9ca] hover:text-[#e0e2ea]'}`}
            >
              IRONBOW
            </button>
          </div>

          <div className="h-4 w-px bg-[#3c494a]"></div>

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
                    <div className="flex items-center gap-1.5">
                      {isWebcamActive ? (
                        <button
                          onClick={() => toggleWebcam(cam.id)}
                          className="font-mono-hud text-[9px] bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab] hover:bg-[#ba1a1a] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 shadow-md animate-pulse cursor-pointer z-30"
                          title="Click to instantly turn off webcam"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                          <span>CLOSE CAMERA</span>
                        </button>
                      ) : (
                        <span className="font-mono-hud text-[9px] bg-[#ffb4ab] text-[#690005] px-1.5 py-0.5 rounded font-bold uppercase">
                          P1 INCURSION SENTINEL
                        </span>
                      )}
                    </div>
                  )}
                  <span className="font-mono-hud text-[9px] text-[#bbc9ca] font-bold">
                    {cam.fps || 29.8} FPS
                  </span>
                </div>
              </div>

              {/* Video Viewport */}
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

                {/* Tactical SVG HUD: Sterile Zone & Tripwire (rendered when client webcam is active) */}
                {isCam01 && isWebcamActive && (
                  <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                    viewBox="0 0 640 360" 
                    preserveAspectRatio="none"
                  >
                    {/* Yellow Sterile Perimeter Zone Polygon */}
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
                    >
                      Sterile Perimeter Zone (Zero-Tolerance)
                    </text>

                    {/* Red Horizontal Tripwire Line */}
                    <line 
                      x1="0" 
                      y1="210" 
                      x2="640" 
                      y2="210" 
                      stroke="#EF4444" 
                      strokeWidth="2.5" 
                    />
                    <text 
                      x="15" 
                      y="200" 
                      fill="#EF4444" 
                      fontFamily="monospace" 
                      fontSize="11" 
                      fontWeight="bold"
                    >
                      TRIPWIRE: Line of Control Tripwire Alpha
                    </text>

                    {/* Center Crosshair */}
                    <line x1="320" y1="140" x2="320" y2="200" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.8" />
                    <line x1="290" y1="170" x2="350" y2="170" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.8" />
                    <circle cx="320" cy="170" r="14" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.8" fill="none" />
                  </svg>
                )}

                {/* REAL-TIME TENSORFLOW AI DETECTIONS (GREEN FOR COW, RED FOR HUMAN) */}
                {isCam01 && isWebcamActive && liveDetections.map((det) => (
                  <div
                    key={det.id}
                    className="absolute pointer-events-none z-20 transition-all duration-75"
                    style={{
                      left: det.left,
                      top: det.top,
                      width: det.width,
                      height: det.height,
                      border: `2.5px solid ${det.color}`,
                      backgroundColor: det.type === 'animal' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                      boxShadow: `0 0 15px ${det.color}66`
                    }}
                  >
                    {/* Top Bounding Label Header */}
                    <div 
                      className="text-white px-2 py-0.5 text-[9px] font-mono-hud font-bold uppercase flex items-center justify-between"
                      style={{
                        backgroundColor: det.type === 'animal' ? '#064e3b' : '#991b1b',
                        borderBottom: `1px solid ${det.color}`
                      }}
                    >
                      <span>ID:{det.id} {det.label}</span>
                    </div>

                    {/* Target Centroid Dot */}
                    <div 
                      className="w-3 h-3 rounded-full mx-auto my-auto shadow-md border border-white"
                      style={{ backgroundColor: det.color }}
                    ></div>

                    {/* Bottom Status Banner */}
                    <div 
                      className="text-white px-1 py-0.2 text-[8px] font-mono-hud font-bold text-center uppercase tracking-wider"
                      style={{
                        backgroundColor: det.type === 'animal' ? 'rgba(6, 78, 59, 0.9)' : 'rgba(153, 27, 27, 0.9)',
                        color: det.type === 'animal' ? '#a7f3d0' : '#fecaca'
                      }}
                    >
                      {det.type === 'animal' ? 'SAFE — WILDLIFE SUPPRESSED // NO ALARM' : 'BREACH DETECTED // STERILE ZONE'}
                    </div>
                  </div>
                ))}

                {/* Corner Crop Marks */}
                <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#45dee8] pointer-events-none opacity-80 z-10"></div>
                <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#45dee8] pointer-events-none opacity-80 z-10"></div>
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#45dee8] pointer-events-none opacity-80 z-10"></div>
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#45dee8] pointer-events-none opacity-80 z-10"></div>

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
                      title="Switch between live laptop webcam and demo sentinel video"
                    >
                      <span className="material-symbols-outlined text-xs">videocam</span>
                      <span>{isWebcamActive ? '🔴 STOP / CLOSE WEBCAM' : '📷 OPEN WEBCAM'}</span>
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
