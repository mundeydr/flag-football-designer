import React, { useState, useRef, useCallback } from 'react';
import { MousePointer2, PenLine, PenTool, Trash2, RotateCcw } from 'lucide-react';

const INITIAL_PLAYERS = {
  center: { id: 'center', x: 300, y: 400, color: 'black', shape: 'square', label: 'C' },
  qb: { id: 'qb', x: 300, y: 470, color: '#f97316', shape: 'triangle', label: 'Q' }, // Orange
  p3: { id: 'p3', x: 100, y: 400, color: '#3b82f6', shape: 'circle', label: 'X' },   // Blue
  p4: { id: 'p4', x: 500, y: 400, color: '#22c55e', shape: 'circle', label: 'Y' },   // Green
  p5: { id: 'p5', x: 200, y: 400, color: '#ef4444', shape: 'circle', label: 'Z' },   // Red
};

export default function App() {
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [routes, setRoutes] = useState([]);
  const [currentRoute, setCurrentRoute] = useState(null);
  
  // App Modes: 'move', 'draw_solid', 'draw_dotted'
  const [mode, setMode] = useState('move');
  
  // Which player's color is currently selected for drawing routes
  const [activeColorId, setActiveColorId] = useState('qb');
  
  const [draggingPlayerId, setDraggingPlayerId] = useState(null);
  const svgRef = useRef(null);

  // Helper to convert screen coordinates to SVG viewBox coordinates
  const getMouseCoords = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  }, []);

  const handlePointerDown = (e) => {
    // Ensure all pointer events go to the SVG during dragging/drawing
    e.target.setPointerCapture(e.pointerId);
    const coords = getMouseCoords(e);

    if (mode === 'move') {
      // Find if we clicked on a player (within a 30 unit radius)
      for (const [id, p] of Object.entries(players)) {
        const dx = p.x - coords.x;
        const dy = p.y - coords.y;
        if (dx * dx + dy * dy <= 900) { // 30^2
          setDraggingPlayerId(id);
          return;
        }
      }
    } else if (mode.startsWith('draw')) {
      // Start a new route
      setCurrentRoute({
        id: Date.now().toString(),
        color: players[activeColorId].color,
        type: mode === 'draw_solid' ? 'solid' : 'dotted',
        points: [coords]
      });
    }
  };

  const handlePointerMove = (e) => {
    const coords = getMouseCoords(e);

    if (draggingPlayerId) {
      // Update player position
      setPlayers(prev => ({
        ...prev,
        [draggingPlayerId]: {
          ...prev[draggingPlayerId],
          x: coords.x,
          y: coords.y
        }
      }));
    } else if (currentRoute) {
      // Add points to the current route being drawn
      setCurrentRoute(prev => ({
        ...prev,
        points: [...prev.points, coords]
      }));
    }
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    
    if (draggingPlayerId) {
      setDraggingPlayerId(null);
    } else if (currentRoute) {
      // Save the route if it has more than just a starting point
      if (currentRoute.points.length > 2) {
        setRoutes(prev => [...prev, currentRoute]);
      }
      setCurrentRoute(null);
    }
  };

  const clearRoutes = () => setRoutes([]);
  const resetPlay = () => {
    setPlayers(INITIAL_PLAYERS);
    setRoutes([]);
  };

  // Render a player based on their shape property
  const renderPlayer = (p) => {
    const size = 20; // Base size for calculations
    
    if (p.shape === 'square') {
      return (
        <g key={p.id}>
          <rect x={p.x - size} y={p.y - size} width={size * 2} height={size * 2} fill={p.color} stroke="white" strokeWidth="2" />
          <text x={p.x} y={p.y} fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>
            {p.label}
          </text>
        </g>
      );
    }
    
    if (p.shape === 'triangle') {
      // Pointing upwards
      const points = `${p.x},${p.y - size - 4} ${p.x - size},${p.y + size - 2} ${p.x + size},${p.y + size - 2}`;
      return (
        <g key={p.id}>
          <polygon points={points} fill={p.color} stroke="white" strokeWidth="2" />
          <text x={p.x} y={p.y + 4} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>
            {p.label}
          </text>
        </g>
      );
    }
    
    return (
      <g key={p.id}>
        <circle cx={p.x} cy={p.y} r={size} fill={p.color} stroke="white" strokeWidth="2" />
        <text x={p.x} y={p.y} fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>
          {p.label}
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Toolbar */}
      <div className="bg-white shadow-md p-4 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-800 mr-4">Play Designer</h1>
          
          {/* Mode Controls */}
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setMode('move')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${mode === 'move' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              title="Move Players"
            >
              <MousePointer2 size={18} /> Move
            </button>
            <button
              onClick={() => setMode('draw_solid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${mode === 'draw_solid' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              title="Draw Solid Route"
            >
              <PenLine size={18} /> Solid
            </button>
            <button
              onClick={() => setMode('draw_dotted')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${mode === 'draw_dotted' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              title="Draw Dotted Route"
            >
              <PenTool size={18} /> Dotted
            </button>
          </div>
        </div>

        {/* Color/Player Selection (Only visible when drawing) */}
        <div className={`flex items-center gap-3 transition-opacity duration-300 ${mode.startsWith('draw') ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <span className="text-sm font-medium text-slate-600">Drawing Color:</span>
          <div className="flex gap-2">
            {Object.values(players).map(p => (
              <button
                key={`color-${p.id}`}
                onClick={() => setActiveColorId(p.id)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${activeColorId === p.id ? 'scale-110 border-slate-800 shadow-md' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: p.color }}
                title={`Select ${p.label} color`}
              />
            ))}
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearRoutes}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 size={16} /> Clear Routes
          </button>
          <button
            onClick={resetPlay}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw size={16} /> Reset All
          </button>
        </div>
      </div>

      {/* Play Canvas Area */}
      <div className="flex-1 p-6 flex justify-center items-start overflow-hidden bg-slate-200">
        <div 
          className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-slate-300 bg-white"
          style={{ width: '100%', maxWidth: '800px', aspectRatio: '1/1' }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 600 600"
            className={`w-full h-full touch-none ${mode === 'move' ? 'cursor-move' : 'cursor-crosshair'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp} // Safety catch if mouse leaves area
          >
            {/* --- Definitions for Arrowheads --- */}
            <defs>
              {Object.values(players).map(p => (
                <marker 
                  key={`arrow-${p.color}`} 
                  id={`arrow-${p.color.replace('#', '')}`} 
                  viewBox="0 0 10 10" 
                  refX="8" 
                  refY="5" 
                  markerWidth="6" 
                  markerHeight="6" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={p.color} />
                </marker>
              ))}
            </defs>

            {/* --- Field Markings --- */}
            {/* Yard Lines */}
            {[100, 200, 300, 400, 500].map(y => (
              <g key={`yard-${y}`}>
                <line x1="0" y1={y} x2="600" y2={y} stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                {/* Hash marks */}
                <line x1="250" y1={y} x2="260" y2={y} stroke="black" strokeWidth="2" />
                <line x1="340" y1={y} x2="350" y2={y} stroke="black" strokeWidth="2" />
              </g>
            ))}

            {/* Line of Scrimmage */}
            <line x1="0" y1="400" x2="600" y2="400" stroke="#fde047" strokeWidth="4" />
            <text x="10" y="390" fill="#fde047" fontSize="16" fontWeight="bold" className="drop-shadow-md">
            </text>

            {/* --- Render Saved Routes --- */}
            {routes.map(route => (
              <polyline
                key={route.id}
                points={route.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={route.color}
                strokeWidth="4"
                strokeDasharray={route.type === 'dotted' ? '8,8' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#arrow-${route.color.replace('#', '')})`}
              />
            ))}

            {/* --- Render Current Route (Being drawn) --- */}
            {currentRoute && (
              <polyline
                points={currentRoute.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={currentRoute.color}
                strokeWidth="4"
                strokeDasharray={currentRoute.type === 'dotted' ? '8,8' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#arrow-${currentRoute.color.replace('#', '')})`}
              />
            )}

            {/* --- Render Players --- */}
            {Object.values(players).map(renderPlayer)}
          </svg>
        </div>
      </div>
    </div>
  );
}
