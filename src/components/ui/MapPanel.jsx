import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const energyNodes = [
  { lat: 22.3072, lng: 73.1812, name: 'Jamnagar Refinery', type: 'Refinery', risk: 'LOW', capacity: '1.24M bbl/day' },
  { lat: 20.3117, lng: 85.8180, name: 'Paradip Refinery', type: 'Refinery', risk: 'MEDIUM', capacity: '300K bbl/day' },
  { lat: 17.6868, lng: 83.2185, name: 'Vizag Refinery', type: 'Refinery', risk: 'LOW', capacity: '166K bbl/day' },
  { lat: 22.9734, lng: 78.6569, name: 'Bhopal Refinery', type: 'Refinery', risk: 'LOW', capacity: '120K bbl/day' },
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai JNPT', type: 'Port', risk: 'ELEVATED', capacity: '70MT/year' },
  { lat: 13.0827, lng: 80.2707, name: 'Chennai Port', type: 'Port', risk: 'LOW', capacity: '45MT/year' },
  { lat: 9.9312, lng: 76.2673, name: 'Kochi Port', type: 'Port', risk: 'LOW', capacity: '30MT/year' },
  { lat: 22.5726, lng: 88.3639, name: 'Haldia Port', type: 'Port', risk: 'MEDIUM', capacity: '50MT/year' },
  { lat: 12.8698, lng: 74.8431, name: 'Mangaluru Port', type: 'Port', risk: 'LOW', capacity: '18MT/year' },
  { lat: 23.0225, lng: 72.5714, name: 'Kandla SPR', type: 'SPR', risk: 'LOW', capacity: '5MT storage' },
  { lat: 17.0005, lng: 81.8040, name: 'Vizag SPR', type: 'SPR', risk: 'LOW', capacity: '3.33MT storage' },
  { lat: 13.6288, lng: 79.4192, name: 'Padur SPR', type: 'SPR', risk: 'LOW', capacity: '2.5MT storage' },
  { lat: 28.7041, lng: 77.1025, name: 'Delhi Fuel Terminal', type: 'Pipeline', risk: 'MEDIUM', capacity: '8.4 MMSCMD' },
  { lat: 25.3176, lng: 82.9739, name: 'Varanasi Pipeline Hub', type: 'Pipeline', risk: 'LOW', capacity: '6.1 MMSCMD' },
];

const typeConfig = {
  Refinery: { color: '#00bfff', neon: '#00d4ff', label: '🏭' },
  Port:     { color: '#00ff9d', neon: '#00ffb3', label: '⚓' },
  SPR:      { color: '#8b5cf6', neon: '#a855f7', label: '🛢️' },
  Pipeline: { color: '#ff9500', neon: '#ffaa33', label: '🔧' },
};

const riskConfig = {
  LOW:      { color: '#4ade80', ring: 'rgba(74,222,128,0.3)' },
  MEDIUM:   { color: '#fbbf24', ring: 'rgba(251,191,36,0.3)' },
  ELEVATED: { color: '#f87171', ring: 'rgba(248,113,113,0.4)' },
  HIGH:     { color: '#ef4444', ring: 'rgba(239,68,68,0.5)' },
};

function createPinIcon(type, risk, width, height, isLight) {
  const tc = typeConfig[type] || typeConfig.Refinery;
  const rc = riskConfig[risk] || riskConfig.LOW;
  const c = tc.color;
  const neon = tc.neon;

  let pathContent = '';
  let cutoutContent = '';

  if (type === 'Refinery') {
    pathContent = `<path d="M18 2 L32 10 L28 32 L18 46 L8 32 L4 10 Z" fill="url(#pinGrad${type})" stroke="${neon}" stroke-width="1.8" />`;
    cutoutContent = `<path d="M13 25 L13 18 L16 20 L16 18 L19 20 L19 16 L23 16 L23 25 Z" fill="#fff" opacity="0.9" />`;
  } else if (type === 'Port') {
    pathContent = `<path d="M18 2 C8 2 2 8 2 18 C2 28 18 46 18 46 C18 46 34 28 34 18 C34 8 28 2 18 2 Z" fill="url(#pinGrad${type})" stroke="${neon}" stroke-width="1.8" />`;
    cutoutContent = `
      <circle cx="18" cy="18" r="7" stroke="#fff" stroke-width="2" fill="none" opacity="0.9" />
      <path d="M18 11 L18 25 M14 20 L22 20" stroke="#fff" stroke-width="2" opacity="0.9" />
    `;
  } else if (type === 'SPR') {
    pathContent = `<path d="M8 8 C8 4 18 4 18 4 C18 4 28 4 28 8 L28 28 C28 34 18 46 18 46 C18 46 8 34 8 28 Z" fill="url(#pinGrad${type})" stroke="${neon}" stroke-width="1.8" />`;
    cutoutContent = `<path d="M11 13 L25 13 M11 19 L25 19 M11 25 L25 25" stroke="#fff" stroke-width="2.2" opacity="0.8" />`;
  } else {
    // Pipeline
    pathContent = `<path d="M18 2 L32 20 L18 46 L4 20 Z" fill="url(#pinGrad${type})" stroke="${neon}" stroke-width="1.8" />`;
    cutoutContent = `<path d="M9 20 L27 20 M18 11 L18 29" stroke="#fff" stroke-width="2.2" opacity="0.9" />`;
  }

  return `
    <div style="position:relative;width:${width}px;height:${height}px;cursor:pointer;filter:drop-shadow(0 0 ${width * 0.16}px ${c}) drop-shadow(0 0 ${width * 0.3}px ${c}60);">
      <svg width="100%" height="100%" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pinGrad${type}" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stop-color="${neon}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${c}" stop-opacity="0.75"/>
          </radialGradient>
        </defs>
        <ellipse cx="18" cy="18" rx="17" ry="17" fill="${c}" opacity="0.12"/>
        ${pathContent}
        ${cutoutContent}
        <circle cx="27" cy="9" r="4.5" fill="${rc.color}" stroke="${isLight ? '#ffffff' : '#030712'}" stroke-width="1.5"/>
      </svg>
      <div style="
        position:absolute;top:10%;left:10%;
        width:80%;height:60%;border-radius:50%;
        border:1.5px solid ${c};
        animation:pinPulse 2s ease-out infinite;
        pointer-events:none;
      "></div>
    </div>
  `;
}

function createShipIcon(isLight) {
  const color = '#00e5ff';
  return `
    <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 6px ${color});">
      <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Hull / Bottom -->
        <path d="M6 38 L14 50 L50 50 L58 38 Z" fill="${color}25" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" />
        <!-- Deck line -->
        <path d="M14 38 L50 38" stroke="${color}" stroke-width="2" />
        <!-- Superstructure (Bridge/Cabin at rear) -->
        <path d="M44 38 L44 26 L52 26 L52 38 Z" fill="${color}4d" stroke="${color}" stroke-width="2" stroke-linejoin="round" />
        <path d="M46 26 L46 20 L50 20 L50 26 Z" stroke="${color}" stroke-width="2" />
        <!-- Radar / Mast -->
        <path d="M48 20 L48 14" stroke="${color}" stroke-width="1.5" />
        <path d="M46 16 L50 16" stroke="${color}" stroke-width="1.5" />
        <!-- Cargo Containers on deck -->
        <rect x="14" y="30" width="8" height="8" rx="1" fill="#ef4444" fill-opacity="0.85" stroke="#ef4444" stroke-width="1" />
        <rect x="24" y="30" width="8" height="8" rx="1" fill="#f59e0b" fill-opacity="0.85" stroke="#f59e0b" stroke-width="1" />
        <rect x="34" y="30" width="8" height="8" rx="1" fill="#1d8cff" fill-opacity="0.85" stroke="#1d8cff" stroke-width="1" />
      </svg>
      <div style="
        position:absolute;top:0;left:0;width:100%;height:100%;
        border-radius:50%;border:1px dashed ${color};
        animation:pinPulse 2.5s linear infinite;
        pointer-events:none;
      "></div>
    </div>
  `;
}

function interpolatePath(points, t) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) return points[0];
  const n = points.length - 1;
  const rawIdx = t * n;
  const idx = Math.min(Math.floor(rawIdx), n - 1);
  const segmentT = rawIdx - idx;
  const p1 = points[idx];
  const p2 = points[idx + 1];
  return [
    p1[0] + (p2[0] - p1[0]) * segmentT,
    p1[1] + (p2[1] - p1[1]) * segmentT
  ];
}

import { Maximize2, Minimize2 } from 'lucide-react';

export default function MapPanel({ 
  filterType = 'All', 
  nodes = null, 
  ships = null,
  activeLayers = null, 
  selectedNode = null, 
  onNodeSelect = null 
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const tileLayerRef = useRef(null);
  const labelLayerRef = useRef(null);
  const initializingRef = useRef(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const polylinesRef = useRef([]);
  const shipMarkersRef = useRef([]);

  const [approvedRouteState, setApprovedRouteState] = useState(() => {
    try {
      const c = localStorage.getItem('urja_approved_route');
      return c ? JSON.parse(c) : { route_id: 'cape_of_good_hope', route_name: 'Cape of Good Hope (West Africa / Atlantic Corridor)', supplier: 'West Africa (Nigeria)' };
    } catch {
      return { route_id: 'cape_of_good_hope', route_name: 'Cape of Good Hope (West Africa / Atlantic Corridor)', supplier: 'West Africa (Nigeria)' };
    }
  });

  useEffect(() => {
    const handleRouteApproved = (e) => {
      if (e.detail) {
        setApprovedRouteState(e.detail);
      }
    };
    window.addEventListener('urja-route-approved', handleRouteApproved);
    return () => window.removeEventListener('urja-route-approved', handleRouteApproved);
  }, []);

  // Ships moving animation along routes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    let animationFrameId;
    let startTime = Date.now();
    const duration = 60000; // 60 seconds to complete full route traversal

    const tick = () => {
      const elapsed = (Date.now() - startTime) % duration;
      const t = elapsed / duration;

      shipMarkersRef.current.forEach(item => {
        if (item.coords && item.status !== 'AT PORT') {
          const pos = interpolatePath(item.coords, t);
          if (pos) {
            item.marker.setLatLng(pos);
          }
        }
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ships, approvedRouteState]);

  // Native fullscreen event listener to sync React state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement === containerRef.current;
      setIsFullScreen(active);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Invalidate map size on fullscreen toggle
  useEffect(() => {
    if (leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current.invalidateSize();
      }, 100);
    }
  }, [isFullScreen]);

  // Center map on selectedNode prop change
  useEffect(() => {
    if (selectedNode && leafletMapRef.current) {
      const lat = selectedNode.lat || selectedNode.latitude;
      const lng = selectedNode.lng || selectedNode.longitude;
      if (lat && lng) {
        leafletMapRef.current.setView([lat, lng], 14, {
          animate: true,
          duration: 1.2
        });
        const label = selectedNode.label || selectedNode.name;
        const match = markersRef.current.find(m => m.name === label);
        if (match) {
          match.marker.openTooltip();
        }
      }
    }
  }, [selectedNode]);

  const updateMarkerSizes = (zoom) => {
    const scale = Math.max(0.4, Math.min(2.5, Math.pow(1.3, zoom - 5.5)));
    const width = Math.round(26 * scale);
    const height = Math.round(34 * scale);
    const isLight = document.body.classList.contains('light-theme');

    markersRef.current.forEach(({ marker, type, risk }) => {
      import('leaflet').then(L => {
        const icon = L.divIcon({
          className: '',
          html: createPinIcon(type, risk, width, height, isLight),
          iconSize: [width, height],
          iconAnchor: [width / 2, height],
          tooltipAnchor: [0, -height - 4],
        });
        marker.setIcon(icon);
      });
    });
  };

  useEffect(() => {
    if (leafletMapRef.current || initializingRef.current) return;
    initializingRef.current = true;

    import('leaflet').then(L => {
      if (!mapRef.current) {
        initializingRef.current = false;
        return;
      }

      if (mapRef.current._leaflet_id) {
        return;
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 18,
        doubleClickZoom: false,
      });

      const indiaBounds = [
        [7.0, 67.0],
        [36.5, 98.0]
      ];
      map.fitBounds(indiaBounds, { padding: [12, 12] });

      const isLightInit = document.body.classList.contains('light-theme');
      const tileUrl = isLightInit 
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
      
      const labelUrl = isLightInit
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        subdomains: 'abcd',
        maxZoom: 19,
        opacity: isLightInit ? 0.95 : 0.85,
      }).addTo(map);

      labelLayerRef.current = L.tileLayer(labelUrl, {
        subdomains: 'abcd',
        maxZoom: 19,
        opacity: isLightInit ? 0.85 : 0.7,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      leafletMapRef.current = map;
      initializingRef.current = false;

      map.on('dblclick', () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });

      map.on('zoomend', () => {
        updateMarkerSizes(map.getZoom());
      });

      const observer = new MutationObserver(() => {
        const isLight = document.body.classList.contains('light-theme');
        if (tileLayerRef.current) {
          tileLayerRef.current.setUrl(
            isLight
              ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
          );
        }
        if (labelLayerRef.current) {
          labelLayerRef.current.setUrl(
            isLight
              ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'
          );
        }
        updateMarkerSizes(map.getZoom());
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

      updateMarkerSizes(map.getZoom());

      const style = document.createElement('style');
      style.innerHTML = `
        body:not(.light-theme) .urja-map-container .leaflet-tile-pane {
          filter: brightness(1.1) contrast(1.15) hue-rotate(185deg) saturate(1.6);
        }
        body.light-theme .urja-map-container .leaflet-tile-pane {
          filter: saturate(1.1) brightness(0.98);
        }
        @keyframes pinPulse {
          0% { transform: scale(1); opacity: 0.8; }
          70%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes flowDash {
          to { stroke-dashoffset: -40; }
        }
        .urja-pipeline-flow {
          animation: flowDash 2.5s linear infinite;
        }
        .urja-sea-flow {
          animation: flowDash 4s linear infinite;
        }
        .urja-approved-sea-flow {
          animation: flowDash 2.2s linear infinite;
        }
      `;
      document.head.appendChild(style);

      return () => {
        observer.disconnect();
      };
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        initializingRef.current = false;
      }
    };
  }, []);

  // Dynamically create/filter markers on nodes list changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];

    shipMarkersRef.current.forEach(({ marker }) => marker.remove());
    shipMarkersRef.current = [];

    const sourceNodes = (nodes && nodes.length > 0) ? nodes : energyNodes;

    let filtered = sourceNodes;
    if (filterType && filterType !== 'All') {
      filtered = filtered.filter(n => (n.type || '').toLowerCase() === filterType.toLowerCase());
    }

    const layers = activeLayers || { refineries: true, ports: true, spr: true, pipelines: true, ships: true };
    filtered = filtered.filter(n => {
      const type = (n.type || '').toLowerCase();
      if (type === 'refinery') return layers.refineries;
      if (type === 'port') return layers.ports;
      if (type === 'spr') return layers.spr;
      if (type === 'pipeline') return layers.pipelines;
      if (type === 'ship') return layers.ships;
      return true;
    });

    import('leaflet').then(L => {
      // 1. Draw nodes markers
      filtered.forEach(node => {
        const label = node.label || node.name;
        let type = node.type || 'Refinery';
        if (type.toLowerCase() === 'refinery') type = 'Refinery';
        else if (type.toLowerCase() === 'port') type = 'Port';
        else if (type.toLowerCase() === 'spr') type = 'SPR';
        else if (type.toLowerCase() === 'pipeline') type = 'Pipeline';

        let riskStr = 'LOW';
        if (typeof node.risk === 'number') {
          if (node.risk > 65) riskStr = 'HIGH';
          else if (node.risk > 30) riskStr = 'ELEVATED';
          else if (node.risk > 15) riskStr = 'MEDIUM';
          else riskStr = 'LOW';
        } else {
          riskStr = node.risk || 'LOW';
        }

        const isLightInit = document.body.classList.contains('light-theme');
        const icon = L.divIcon({
          className: '',
          html: createPinIcon(type, riskStr, 34, 45, isLightInit),
          iconSize: [34, 45],
          iconAnchor: [17, 45],
          tooltipAnchor: [0, -49],
        });

        const lat = node.lat || node.latitude;
        const lng = node.lng || node.longitude;
        if (!lat || !lng) return;

        const marker = L.marker([lat, lng], { icon });
        marker.addTo(leafletMapRef.current);

        const tc = typeConfig[type] || typeConfig.Refinery;
        const rc = riskConfig[riskStr] || riskConfig.LOW;

        marker.bindTooltip(`
          <div class="urja-tooltip">
            <div class="urja-tt-header">
              <span class="urja-tt-dot" style="background:${tc.color};color:${tc.color}"></span>
              <span class="urja-tt-name">${label}</span>
            </div>
            <div class="urja-tt-row">
              <span class="urja-tt-label">Type</span>
              <span class="urja-tt-val" style="color:${tc.color}">${type}</span>
            </div>
            <div class="urja-tt-row">
              <span class="urja-tt-label">Capacity</span>
              <span class="urja-tt-val">${node.capacity || 'N/A'}</span>
            </div>
            <div class="urja-tt-row">
              <span class="urja-tt-label">Risk</span>
              <span class="urja-tt-val" style="color:${rc.color};font-weight:800">${typeof node.risk === 'number' ? node.risk + '/100' : node.risk}</span>
            </div>
          </div>`, {
          className: 'urja-tooltip-wrapper',
          direction: 'top',
          offset: [0, -46],
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onNodeSelect) {
            onNodeSelect(node);
          }
          leafletMapRef.current.setView([lat, lng], 14, {
            animate: true,
            duration: 1.2
          });
        });

        markersRef.current.push({ marker, type, risk: riskStr, name: label, lat, lng });
      });

      // 2. Draw pipelines and sea routes (Dynamic Backend Approved Route Connected)
      const isCapeApproved = (approvedRouteState?.route_id === 'cape_of_good_hope') ||
                             (approvedRouteState?.route_id === 'atlantic_corridor') ||
                             (approvedRouteState?.route_name || '').toLowerCase().includes('cape') ||
                             (approvedRouteState?.supplier || '').toLowerCase().includes('africa') ||
                             (approvedRouteState?.supplier || '').toLowerCase().includes('brazil');

      const routeCoords = {
        r1: [ // Strait of Hormuz (Persian Gulf to Vadinar/Jamnagar)
          [30.5081, 47.7835],
          [29.1, 49.0],
          [27.0, 52.0],
          [26.4, 56.5],
          [25.0, 58.0],
          [21.0, 65.0],
          [22.3072, 73.1812]
        ],
        r2: [ // Cape of Good Hope (West Africa / Bonny Light to Paradip / Jamnagar)
          [4.3, 6.2],
          [-10.0, 10.0],
          [-34.8, 20.0],
          [-25.0, 38.0],
          [-10.0, 55.0],
          [2.0, 68.0],
          [12.8698, 74.8431],
          [20.3117, 85.8180]
        ],
        r3: [ // Mumbai to Jamnagar pipeline
          [19.0760, 72.8777],
          [20.5, 72.9],
          [21.8, 72.5],
          [22.3072, 73.1812]
        ],
        r4: [ // Paradip to Vizag pipeline
          [20.3117, 85.8180],
          [19.0, 84.5],
          [17.0005, 81.8040]
        ]
      };

      // Draw Pipelines
      if (layers.pipelines) {
        const p3_base = L.polyline(routeCoords.r3, { color: '#ff9500', weight: 6, opacity: 0.15 }).addTo(leafletMapRef.current);
        polylinesRef.current.push(p3_base);
        const p4_base = L.polyline(routeCoords.r4, { color: '#ff9500', weight: 6, opacity: 0.15 }).addTo(leafletMapRef.current);
        polylinesRef.current.push(p4_base);

        const p3 = L.polyline(routeCoords.r3, { color: '#ff9500', weight: 1.5, dashArray: '2, 6', className: 'urja-pipeline-flow', opacity: 0.95 }).addTo(leafletMapRef.current);
        polylinesRef.current.push(p3);
        const p4 = L.polyline(routeCoords.r4, { color: '#ff9500', weight: 1.5, dashArray: '2, 6', className: 'urja-pipeline-flow', opacity: 0.95 }).addTo(leafletMapRef.current);
        polylinesRef.current.push(p4);
      }

      // Draw Sea Routes
      if (layers.ships) {
        if (isCapeApproved) {
          // APPROVED ALTERNATIVE ROUTE: Cape of Good Hope (Bright Neon Green Flow)
          const p2_base = L.polyline(routeCoords.r2, { color: '#22c55e', weight: 6, opacity: 0.25 }).addTo(leafletMapRef.current);
          polylinesRef.current.push(p2_base);
          const p2 = L.polyline(routeCoords.r2, { color: '#22c55e', weight: 2.5, dashArray: '3, 8', className: 'urja-approved-sea-flow', opacity: 0.95 }).addTo(leafletMapRef.current);
          polylinesRef.current.push(p2);

          // RESTRICTED HORMUZ ROUTE: Red Dotted Caution Line
          const p1_base = L.polyline(routeCoords.r1, { color: '#ef4444', weight: 4, opacity: 0.15 }).addTo(leafletMapRef.current);
          polylinesRef.current.push(p1_base);
          const p1 = L.polyline(routeCoords.r1, { color: '#ef4444', weight: 1.5, dashArray: '4, 8', opacity: 0.65 }).addTo(leafletMapRef.current);
          polylinesRef.current.push(p1);
        } else {
          const p1_base = L.polyline(routeCoords.r1, { color: '#00e5ff', weight: 5, opacity: 0.12 }).addTo(leafletMapRef.current);
          polylinesRef.current.push(p1_base);
          const p2_base = L.polyline(routeCoords.r2, { color: '#00e5ff', weight: 5, opacity: 0.12 }).addTo(leafletMapRef.current);
          polylinesRef.current.push(p2_base);

          const p1 = L.polyline(routeCoords.r1, { color: '#00e5ff', weight: 1.5, dashArray: '2, 6', className: 'urja-sea-flow', opacity: 0.9 }).addTo(leafletMapRef.current);
          polylinesRef.current.push(p1);
          const p2 = L.polyline(routeCoords.r2, { color: '#00e5ff', weight: 1.5, dashArray: '2, 6', className: 'urja-sea-flow', opacity: 0.9 }).addTo(leafletMapRef.current);
          polylinesRef.current.push(p2);
        }
      }

      // 3. Draw Ships (Dynamic Animation along Approved Route)
      if (layers.ships) {
        const activeShipList = (ships && ships.length > 0) ? ships : [
          { name: "VLCC Samudra Defender", status: "IN TRANSIT", route: isCapeApproved ? "West Africa ➜ Cape of Good Hope ➜ Paradip" : "Persian Gulf ➜ Kochi" },
          { name: "MT Rajendra", status: "IN TRANSIT", route: isCapeApproved ? "Bonny Light ➜ Cape of Good Hope ➜ Vadinar" : "Basra ➜ Vadinar" },
          { name: "MT Chola Express", status: "IN TRANSIT", route: isCapeApproved ? "Atlantic Corridor ➜ Cape of Good Hope ➜ Mangaluru" : "Riyadh ➜ Kochi" },
          { name: "MT Atlantic Pioneer", status: "IN TRANSIT", route: isCapeApproved ? "Petrobras Santos ➜ Atlantic ➜ Kochi" : "Sikka ➜ Haldia" },
        ];

        activeShipList.forEach((ship, idx) => {
          const name = ship.name || ship.label;
          const status = ship.status || 'IN TRANSIT';
          
          let coords = isCapeApproved ? routeCoords.r2 : routeCoords.r1;
          if (idx % 2 === 1 && !isCapeApproved) coords = routeCoords.r2;

          const startPos = coords[0];
          const isLightInit = document.body.classList.contains('light-theme');
          const shipIcon = L.divIcon({
            className: '',
            html: createShipIcon(isLightInit),
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            tooltipAnchor: [0, -14]
          });

          const marker = L.marker(startPos, { icon: shipIcon });
          marker.addTo(leafletMapRef.current);

          const activeRouteLabel = isCapeApproved ? "Cape of Good Hope (APPROVED & ACTIVE)" : "Strait of Hormuz Corridor";

          marker.bindTooltip(`
            <div class="urja-tooltip">
              <div class="urja-tt-header" style="border-bottom:1px solid rgba(0,229,255,0.2);padding-bottom:6px;margin-bottom:6px;">
                <span class="urja-tt-dot" style="background:${isCapeApproved ? '#22c55e' : '#00e5ff'};color:${isCapeApproved ? '#22c55e' : '#00e5ff'};box-shadow:0 0 8px ${isCapeApproved ? '#22c55e' : '#00e5ff'}"></span>
                <span class="urja-tt-name" style="color:${isCapeApproved ? '#22c55e' : '#00e5ff'}">${name}</span>
              </div>
              <div class="urja-tt-row">
                <span class="urja-tt-label">Status</span>
                <span class="urja-tt-val" style="color:#22c55e;font-weight:700">${status}</span>
              </div>
              <div class="urja-tt-row">
                <span class="urja-tt-label">Approved Corridor</span>
                <span class="urja-tt-val" style="font-size:10px;color:#22c55e;font-weight:700">${activeRouteLabel}</span>
              </div>
              <div class="urja-tt-row">
                <span class="urja-tt-label">Cargo Slate</span>
                <span class="urja-tt-val">2.4M bbl Sweet Crude</span>
              </div>
              <div class="urja-tt-row">
                <span class="urja-tt-label">Speed / ETA</span>
                <span class="urja-tt-val" style="color:#00e5ff">14.8 knots · 22 days</span>
              </div>
            </div>`, {
            className: 'urja-tooltip-wrapper',
            direction: 'top',
            offset: [0, -12],
          });

          shipMarkersRef.current.push({ marker, name, coords, status });
        });
      }
    });
  }, [nodes, activeLayers, filterType, ships, approvedRouteState]);terType, ships]);

  const displayNodesCount = nodes ? nodes.length : energyNodes.length;

  return (
    <div 
      ref={containerRef}
      className={`urja-map-container ${isFullScreen ? 'fullscreen-map-overlay' : ''}`} 
      style={isFullScreen ? {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, background: '#040a18'
      } : {
        position: 'relative', width: '100%', height: '100%'
      }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: 'var(--bg-deep)', borderRadius: isFullScreen ? 0 : '0 0 14px 14px' }} />

      {/* ESC hint when fullscreen */}
      {isFullScreen && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(4,10,24,0.85)', border: '1px solid rgba(0,229,255,0.25)',
          borderRadius: 20, padding: '6px 14px', color: '#00e5ff', fontSize: 11,
          fontWeight: 600, letterSpacing: '0.05em', zIndex: 2000, backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none'
        }}>
          <span>⌨</span> Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>ESC</kbd> to exit fullscreen
        </div>
      )}

      {/* Hint when not fullscreen */}
      {!isFullScreen && (
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(4,10,24,0.75)', border: '1px solid rgba(29,140,255,0.15)',
          borderRadius: 16, padding: '4px 12px', color: 'var(--text-dim)', fontSize: 9.5,
          fontWeight: 600, zIndex: 2000, backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          Double-click map for fullscreen
        </div>
      )}

      {/* Active Approved Route Indicator Banner */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
        background: 'rgba(8,18,35,0.92)', border: '1px solid rgba(34,197,94,0.4)',
        borderRadius: 8, padding: '6px 14px', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e', animation: 'pinPulse 2s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>
          Approved Route: <span style={{ color: '#22c55e' }}>{approvedRouteState?.route_name || 'Cape of Good Hope (West Africa / Atlantic Corridor)'}</span>
        </span>
        <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 800, border: '1px solid rgba(34,197,94,0.3)' }}>
          BACKEND CONNECTED
        </span>
      </div>

      {/* Grid overlay for matching UI */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 500,
        background: 'radial-gradient(ellipse 60% 40% at 50% 10%, rgba(29,140,255,0.03) 0%, transparent 70%)',
      }} />

      {/* Fullscreen control button - top-left area */}
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (!containerRef.current) return;
          if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }}
        title={isFullScreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen Map (double-click)'}
        style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2001,
          background: 'rgba(4, 10, 24, 0.92)', border: '1px solid rgba(0,229,255,0.3)',
          borderRadius: 8, padding: '6px 12px', color: '#00e5ff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
          boxShadow: '0 0 10px rgba(0,229,255,0.15)', backdropFilter: 'blur(8px)'
        }}
      >
        {isFullScreen ? (
          <><Minimize2 size={13} /> Exit Fullscreen</>
        ) : (
          <><Maximize2 size={13} /> Maximize Map</>
        )}
      </button>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: isFullScreen ? 24 : 46, left: 12, zIndex: 1000,
        background: 'var(--bg-panel)', border: '1px solid var(--border-soft)',
        borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Node Type</div>
        {Object.entries(typeConfig).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ width: 14, height: 16 }}>
              {type === 'Refinery' && (
                <svg width="100%" height="100%" viewBox="0 0 36 48">
                  <path d="M18 2 L32 10 L28 32 L18 46 L8 32 L4 10 Z" fill={cfg.color} />
                </svg>
              )}
              {type === 'Port' && (
                <svg width="100%" height="100%" viewBox="0 0 36 48">
                  <path d="M18 2 C8 2 2 8 2 18 C2 28 18 46 18 46 C18 46 34 28 34 18 C34 8 28 2 18 2 Z" fill={cfg.color} />
                </svg>
              )}
              {type === 'SPR' && (
                <svg width="100%" height="100%" viewBox="0 0 36 48">
                  <path d="M8 8 C8 4 18 4 18 4 C18 4 28 4 28 8 L28 28 C28 34 18 46 18 46 C18 46 8 34 8 28 Z" fill={cfg.color} />
                </svg>
              )}
              {type === 'Pipeline' && (
                <svg width="100%" height="100%" viewBox="0 0 36 48">
                  <path d="M18 2 L32 20 L18 46 L4 20 Z" fill={cfg.color} />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>{type}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 6, paddingTop: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Risk Level</div>
          {Object.entries(riskConfig).map(([risk, cfg]) => (
            <div key={risk} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
              <span style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>{risk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top-right stat */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 1000,
        background: 'var(--bg-panel)', border: '1px solid var(--border-soft)',
        borderRadius: 8, padding: '6px 12px', backdropFilter: 'blur(12px)',
        boxShadow: 'var(--shadow-card)', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 9.5, color: 'var(--text-dim)', marginBottom: 2 }}>Active Nodes</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cyan)' }}>
          {displayNodesCount} <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>● LIVE</span>
        </div>
      </div>
    </div>
  );
}
