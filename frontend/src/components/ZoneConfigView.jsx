import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ZoneConfigView({ cameras = [] }) {
  const [selectedCam, setSelectedCam] = useState(cameras[0]?.id || 'CAM-01');
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Form State for new Zone
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState('polygon');
  const [newZoneSeverity, setNewZoneSeverity] = useState('CRITICAL');

  useEffect(() => {
    fetchZones(selectedCam);
  }, [selectedCam]);

  const fetchZones = async (camId) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/zones/${camId}`);
      setZones(res.data || []);
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/zones/${selectedCam}`, zones);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      console.error("Error saving zones:", err);
    }
  };

  const handleAddZone = () => {
    if (!newZoneName) return;
    const newZone = {
      id: `zone-${Date.now()}`,
      name: newZoneName,
      type: newZoneType,
      severity: newZoneSeverity,
      coordinates: newZoneType === 'polygon' 
        ? [[100, 180], [540, 180], [620, 340], [20, 340]]
        : [[50, 240], [590, 240]],
      direction: 'inbound'
    };
    setZones([...zones, newZone]);
    setNewZoneName('');
  };

  const handleDeleteZone = (id) => {
    setZones(zones.filter(z => z.id !== id));
  };

  return (
    <div className="p-6 bg-[#0a0e13] flex-1 overflow-y-auto select-none">
      <div className="flex items-center justify-between pb-4 border-b border-[#3c494a]">
        <div>
          <h1 className="text-sm font-bold text-[#e0e2ea] flex items-center gap-2 font-mono-hud uppercase">
            <span className="material-symbols-outlined text-[#45dee8] text-lg">polyline</span>
            <span>VIRTUAL TRIPWIRE & STERILE ZONE CALIBRATION</span>
          </h1>
          <p className="text-xs text-[#bbc9ca]">Configure directional tripwires, multi-point exclusion zones, and consecutive frame confirmation</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCam}
            onChange={(e) => setSelectedCam(e.target.value)}
            className="bg-[#181c21] border border-[#3c494a] text-xs text-[#45dee8] font-mono-hud px-3 py-1.5 rounded focus:outline-none"
          >
            {cameras.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#45dee8] hover:bg-[#5de6ff] text-[#00373a] font-bold text-xs rounded transition-colors shadow-lg font-mono-hud uppercase"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            <span>Deploy to Edge</span>
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="mt-3 p-2 bg-[#004a4f]/80 border border-[#45dee8] text-[#45dee8] text-xs rounded flex items-center gap-2 font-mono-hud">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Zone definitions synced to Edge Sentinel successfully. Zero restart required.</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left 2 Cols: Live Camera Preview with Overlaid Zones */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-[#101419] rounded border border-[#3c494a] aspect-video overflow-hidden">
            <img 
              src={`http://127.0.0.1:8000/api/cameras/${selectedCam}/stream`}
              alt="Live Zone Preview"
              className="w-full h-full object-cover select-none"
            />
            <div className="absolute top-2 left-2 bg-[#0a0e13]/80 px-2.5 py-1 rounded text-[10px] text-[#45dee8] border border-[#3c494a] font-mono-hud uppercase">
              ACTIVE CAMERA VIEW WITH REAL-TIME ZONES
            </div>
          </div>

          <div className="bg-[#181c21] p-4 rounded border border-[#3c494a] text-xs space-y-2 font-mono-hud">
            <h3 className="font-bold text-[#e0e2ea] text-xs uppercase">SPATIAL CONSTRAINTS & FILTERING LOGIC:</h3>
            <ul className="list-disc pl-4 space-y-1 text-[#bbc9ca] text-[11px]">
              <li><strong className="text-[#e0e2ea]">Directional Tripwire:</strong> Triggers only on crossing from Outbound to Inbound vector.</li>
              <li><strong className="text-[#e0e2ea]">Consecutive Frame Filter:</strong> Requires 4 consecutive confirmed detection frames to avoid vegetation flicker.</li>
              <li><strong className="text-[#45dee8]">Animal Suppression Filter:</strong> Active by default. Wildlife (cattle, dogs, wild fauna) tagged as Safe.</li>
            </ul>
          </div>
        </div>

        {/* Right Col: Zone List & Add Zone Form */}
        <div className="space-y-4">
          {/* Add Zone Card */}
          <div className="bg-[#181c21] p-4 rounded border border-[#3c494a] space-y-3 font-mono-hud">
            <h3 className="text-xs font-bold text-[#45dee8] flex items-center gap-1.5 uppercase">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Define New Perimeter Zone</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-[#bbc9ca] uppercase">ZONE NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Forward Defile Tripwire Beta"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full bg-[#0a0e13] border border-[#3c494a] rounded p-1.5 text-xs text-[#e0e2ea] focus:outline-none focus:border-[#45dee8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#bbc9ca] uppercase">GEOMETRY</label>
                  <select
                    value={newZoneType}
                    onChange={(e) => setNewZoneType(e.target.value)}
                    className="w-full bg-[#0a0e13] border border-[#3c494a] rounded p-1.5 text-xs text-[#e0e2ea] focus:outline-none"
                  >
                    <option value="polygon">Polygon Zone</option>
                    <option value="tripwire">Tripwire Line</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#bbc9ca] uppercase">SEVERITY</label>
                  <select
                    value={newZoneSeverity}
                    onChange={(e) => setNewZoneSeverity(e.target.value)}
                    className="w-full bg-[#0a0e13] border border-[#3c494a] rounded p-1.5 text-xs text-[#e0e2ea] focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddZone}
                className="w-full py-1.5 bg-[#1c2025] hover:bg-[#262a30] text-[#45dee8] rounded border border-[#45dee8]/40 text-xs font-semibold mt-2 uppercase transition-colors"
              >
                + Add to Active List
              </button>
            </div>
          </div>

          {/* Active Zones List */}
          <div className="bg-[#181c21] p-4 rounded border border-[#3c494a] space-y-2 font-mono-hud">
            <h3 className="text-xs font-bold text-[#e0e2ea] uppercase">Configured Sentinel Zones ({zones.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {zones.map((z) => (
                <div key={z.id} className="p-2.5 bg-[#0a0e13] border border-[#3c494a] rounded flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#e0e2ea]">{z.name}</p>
                    <p className="text-[10px] text-[#bbc9ca] uppercase">{z.type} • {z.severity}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteZone(z.id)}
                    className="p-1 text-[#859394] hover:text-[#ffb4ab] rounded"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

