export const mockUser = {
  id: 'usr-001',
  name: 'Arjun Mehta',
  role: 'Commander, NEMC',
  access: 'Cabinet Access',
  email: 'arjun.mehta@nemc.gov.in',
  avatar: 'AM',
  clearance: 'TOP SECRET',
  department: 'National Energy Management Council',
};

export const kpiData = {
  riskScore: 74,
  crisisLevel: 'ELEVATED',
  activeIncidents: 3,
  supplyGap: '2.4M bbl/day',
  spr_coverage: 64,
  activeSanctions: 12,
};

export const incidentFeed = [
  { id: 1, time: '02:14', type: 'CRITICAL', title: 'Strait of Hormuz tension escalates', detail: 'Iranian naval exercises causing 18% shipping delay', region: 'Middle East', icon: 'alert', color: 'red' },
  { id: 2, time: '01:52', type: 'WARNING', title: 'OPEC+ emergency meeting called', detail: 'Production cut of 1.2M bbl/day expected announcement', region: 'Vienna', icon: 'trending-down', color: 'amber' },
  { id: 3, time: '01:30', type: 'INFO', title: 'West Africa cargo rerouted', detail: 'VLCC MV Bharat Star rerouted via Cape of Good Hope', region: 'West Africa', icon: 'ship', color: 'blue' },
  { id: 4, time: '00:45', type: 'WARNING', title: 'Brent crude +$4.2 surge', detail: 'Geopolitical risk premium driving price spike', region: 'Global', icon: 'trending-up', color: 'amber' },
  { id: 5, time: '00:12', type: 'INFO', title: 'SPR drawdown approved', detail: 'Emergency release of 5M bbl authorized by Cabinet', region: 'India', icon: 'database', color: 'green' },
];

export const riskSignals = [
  { id: 1, source: 'Maritime Intelligence', signal: 'Hormuz shipping lane congestion +34%', score: 87, confidence: 92, trend: 'up', category: 'Shipping' },
  { id: 2, source: 'OPEC Monitor', signal: 'Emergency production cut deliberations', score: 78, confidence: 85, trend: 'up', category: 'OPEC' },
  { id: 3, source: 'Sanctions Tracker', signal: '3 new Russia oil tanker designations', score: 72, confidence: 94, trend: 'stable', category: 'Sanctions' },
  { id: 4, source: 'Weather Intelligence', signal: 'Category 4 cyclone approaching Gulf ports', score: 65, confidence: 78, trend: 'up', category: 'Weather' },
  { id: 5, source: 'Market Signals', signal: 'Brent-WTI spread widening to $8.4', score: 55, confidence: 88, trend: 'up', category: 'Market' },
  { id: 6, source: 'Satellite Analytics', signal: 'Reduced tanker activity Red Sea corridor', score: 81, confidence: 90, trend: 'up', category: 'Shipping' },
];

export const supplierData = [
  { id: 1, supplier: 'West Africa (Nigeria)', route: 'Cape of Good Hope', eta: '22 days', landedCost: '$84.2/bbl', riskScore: 28, compatibility: 94, sanctions: 'CLEAR', availability: 'HIGH', verdict: 'RECOMMENDED' },
  { id: 2, supplier: 'Saudi Arabia (Aramco)', route: 'Strait of Hormuz', eta: '18 days', landedCost: '$79.8/bbl', riskScore: 67, compatibility: 88, sanctions: 'CLEAR', availability: 'MEDIUM', verdict: 'CAUTION' },
  { id: 3, supplier: 'Russia (Rosneft)', route: 'Arctic/Cape', eta: '28 days', landedCost: '$72.1/bbl', riskScore: 85, compatibility: 71, sanctions: 'FLAGGED', availability: 'LOW', verdict: 'HIGH RISK' },
  { id: 4, supplier: 'Brazil (Petrobras)', route: 'Atlantic', eta: '26 days', landedCost: '$86.5/bbl', riskScore: 22, compatibility: 89, sanctions: 'CLEAR', availability: 'HIGH', verdict: 'VIABLE' },
  { id: 5, supplier: 'UAE (ADNOC)', route: 'Strait of Hormuz', eta: '16 days', landedCost: '$81.3/bbl', riskScore: 58, compatibility: 92, sanctions: 'CLEAR', availability: 'MEDIUM', verdict: 'CAUTION' },
];

export const scenarioOptions = [
  { id: 'hormuz', name: 'Strait of Hormuz Closure', impact: 'CRITICAL', probability: 34 },
  { id: 'russia', name: 'Russia Sanctions Escalation', impact: 'HIGH', probability: 62 },
  { id: 'opec', name: 'OPEC+ Production Cut 2M bbl', impact: 'HIGH', probability: 71 },
  { id: 'weather', name: 'Extreme Weather - Gulf Ports', impact: 'MEDIUM', probability: 45 },
  { id: 'custom', name: 'Custom Scenario', impact: 'VARIABLE', probability: 0 },
];

export const economicImpact = {
  inflation: { value: 1.8, unit: '%', trend: 'up', label: 'CPI Impact' },
  gdp: { value: -0.4, unit: '%', trend: 'down', label: 'GDP Impact' },
  fuelPrice: { value: 12.4, unit: '₹/L', trend: 'up', label: 'Petrol Price Rise' },
  fiscal: { value: 28000, unit: 'Cr', trend: 'up', label: 'Fiscal Cost' },
  currentAccount: { value: -1.2, unit: '% GDP', trend: 'down', label: 'CAD Widening' },
  tradeDeficit: { value: 18500, unit: 'Cr', trend: 'up', label: 'Trade Deficit' },
};

export const stateImpactData = [
  { state: 'Maharashtra', impact: 85, population: 112, gdpExposure: 'HIGH' },
  { state: 'Gujarat', impact: 78, population: 63, gdpExposure: 'HIGH' },
  { state: 'Rajasthan', impact: 72, population: 78, gdpExposure: 'MEDIUM' },
  { state: 'Tamil Nadu', impact: 68, population: 77, gdpExposure: 'HIGH' },
  { state: 'Uttar Pradesh', impact: 91, population: 240, gdpExposure: 'CRITICAL' },
  { state: 'Punjab', impact: 65, population: 30, gdpExposure: 'MEDIUM' },
  { state: 'Haryana', impact: 61, population: 28, gdpExposure: 'MEDIUM' },
  { state: 'West Bengal', impact: 58, population: 91, gdpExposure: 'MEDIUM' },
];

export const timeSeriesData = [
  { month: 'Jan', brent: 78, indianBasket: 75, wti: 73, import: 4.2 },
  { month: 'Feb', brent: 82, indianBasket: 79, wti: 77, import: 4.0 },
  { month: 'Mar', brent: 79, indianBasket: 76, wti: 74, import: 4.3 },
  { month: 'Apr', brent: 85, indianBasket: 82, wti: 80, import: 4.1 },
  { month: 'May', brent: 88, indianBasket: 85, wti: 83, import: 3.9 },
  { month: 'Jun', brent: 91, indianBasket: 88, wti: 86, import: 4.4 },
  { month: 'Jul', brent: 94, indianBasket: 91, wti: 89, import: 4.6 },
];

export const sprData = {
  currentLevel: 64,
  totalCapacity: 36.87,
  currentStock: 23.6,
  coverageDays: 21,
  predictedDepletion: '34 days',
  recommendedDrawdown: 8.5,
  reserveAfterAction: 15.1,
  cargoBuffer: '6 days',
  sites: [
    { name: 'Visakhapatnam', capacity: 13.3, current: 8.9, status: 'OPERATIONAL' },
    { name: 'Mangaluru', capacity: 11.5, current: 7.8, status: 'OPERATIONAL' },
    { name: 'Padur', capacity: 12.0, current: 6.9, status: 'MAINTENANCE' },
  ],
};

export const refineryData = [
  { name: 'Jamnagar (IOC)', location: 'Gujarat', capacity: '1.24M bbl/day', compatibility: 96, status: 'COMPATIBLE', crude: 'Arab Light, West Africa' },
  { name: 'Vadinar (Nayara)', location: 'Gujarat', capacity: '0.4M bbl/day', compatibility: 88, status: 'COMPATIBLE', crude: 'Urals, Arab Heavy' },
  { name: 'Kochi (BPCL)', location: 'Kerala', capacity: '0.31M bbl/day', compatibility: 72, status: 'PARTIAL', crude: 'Arab Light' },
  { name: 'Chennai (CPCL)', location: 'Tamil Nadu', capacity: '0.21M bbl/day', compatibility: 41, status: 'INCOMPATIBLE', crude: 'Bonny Light' },
  { name: 'Haldia (IOC)', location: 'West Bengal', capacity: '0.175M bbl/day', compatibility: 65, status: 'PARTIAL', crude: 'Arab Light' },
  { name: 'Mathura (IOC)', location: 'UP', capacity: '0.16M bbl/day', compatibility: 79, status: 'COMPATIBLE', crude: 'Arab Light, Basrah' },
];

export const complianceData = [
  { supplier: 'West Africa (Nigeria)', legal: 'COMPLIANT', sanctions: 'CLEAR', insurance: 'VALID', policy: 'ALIGNED', overall: 'GREEN' },
  { supplier: 'Saudi Arabia', legal: 'COMPLIANT', sanctions: 'CLEAR', insurance: 'VALID', policy: 'ALIGNED', overall: 'GREEN' },
  { supplier: 'Russia (Rosneft)', legal: 'REVIEW', sanctions: 'FLAGGED', insurance: 'RESTRICTED', policy: 'MISALIGNED', overall: 'RED' },
  { supplier: 'Brazil (Petrobras)', legal: 'COMPLIANT', sanctions: 'CLEAR', insurance: 'VALID', policy: 'ALIGNED', overall: 'GREEN' },
  { supplier: 'UAE (ADNOC)', legal: 'COMPLIANT', sanctions: 'CLEAR', insurance: 'VALID', policy: 'MINOR FLAG', overall: 'AMBER' },
];

export const auditLogs = [
  { id: 'EVT-4821', time: '02:14:33', user: 'AI Agent', action: 'Risk Assessment Updated', module: 'Risk Intelligence', status: 'COMPLETED', type: 'AI' },
  { id: 'EVT-4820', time: '02:10:11', user: 'Arjun Mehta', action: 'Procurement Plan Approved', module: 'Procurement Optimizer', status: 'COMPLETED', type: 'USER' },
  { id: 'EVT-4819', time: '01:58:44', user: 'AI Agent', action: 'Scenario Simulation Run', module: 'Scenario Simulator', status: 'COMPLETED', type: 'AI' },
  { id: 'EVT-4818', time: '01:45:22', user: 'Priya Singh', action: 'User Role Modified', module: 'User Management', status: 'COMPLETED', type: 'SECURITY' },
  { id: 'EVT-4817', time: '01:30:09', user: 'Vikram Nair', action: 'Report Exported (PDF)', module: 'Reports Library', status: 'COMPLETED', type: 'USER' },
  { id: 'EVT-4816', time: '01:15:55', user: 'AI Agent', action: 'Supply Chain Twin Updated', module: 'Supply Chain Twin', status: 'COMPLETED', type: 'AI' },
  { id: 'EVT-4815', time: '00:58:33', user: 'Arjun Mehta', action: 'Crisis Mode Activated', module: 'Command Center', status: 'COMPLETED', type: 'SECURITY' },
  { id: 'EVT-4814', time: '00:42:17', user: 'System', action: 'Data Source Sync', module: 'Data Sources', status: 'COMPLETED', type: 'SYSTEM' },
];

export const usersData = [
  { id: 'usr-001', name: 'Arjun Mehta', email: 'arjun.mehta@nemc.gov.in', role: 'Commander', department: 'NEMC', status: 'ACTIVE', lastActive: '2 min ago', clearance: 'TOP SECRET' },
  { id: 'usr-002', name: 'Priya Singh', email: 'priya.singh@nemc.gov.in', role: 'Analyst', department: 'Risk Intelligence', status: 'ACTIVE', lastActive: '15 min ago', clearance: 'SECRET' },
  { id: 'usr-003', name: 'Vikram Nair', email: 'vikram.nair@mop.gov.in', role: 'Director', department: 'Ministry of Petroleum', status: 'ACTIVE', lastActive: '1 hr ago', clearance: 'TOP SECRET' },
  { id: 'usr-004', name: 'Ananya Kapoor', email: 'ananya.k@iocl.gov.in', role: 'Procurement Lead', department: 'IOCL', status: 'INACTIVE', lastActive: '3 days ago', clearance: 'CONFIDENTIAL' },
  { id: 'usr-005', name: 'Rohan Desai', email: 'rohan.d@nemc.gov.in', role: 'Analyst', department: 'Economic Impact', status: 'PENDING', lastActive: 'Never', clearance: 'SECRET' },
];

export const reportsData = [
  { id: 'RPT-2024-001', title: 'Q2 Energy Security Assessment', type: 'Quarterly', classification: 'SECRET', date: '2024-07-01', pages: 48, author: 'AI + Arjun Mehta', status: 'PUBLISHED' },
  { id: 'RPT-2024-002', title: 'Hormuz Closure Impact Analysis', type: 'Scenario', classification: 'TOP SECRET', date: '2024-06-28', pages: 32, author: 'AI Agent', status: 'PUBLISHED' },
  { id: 'RPT-2024-003', title: 'West Africa Procurement Strategy', type: 'Procurement', classification: 'CONFIDENTIAL', date: '2024-06-25', pages: 24, author: 'Vikram Nair', status: 'DRAFT' },
  { id: 'RPT-2024-004', title: 'SPR Optimization Study 2024', type: 'Strategic', classification: 'SECRET', date: '2024-06-20', pages: 56, author: 'AI + SPR Team', status: 'PUBLISHED' },
  { id: 'RPT-2024-005', title: 'India Refinery Compatibility Matrix', type: 'Technical', classification: 'CONFIDENTIAL', date: '2024-06-15', pages: 38, author: 'IOCL Team', status: 'UNDER REVIEW' },
];

export const notificationsData = [
  { id: 1, time: '02:14', type: 'CRITICAL', title: 'Hormuz tension escalates', detail: 'Risk score elevated to 87/100. Immediate action required.', read: false },
  { id: 2, time: '01:52', type: 'WARNING', title: 'OPEC emergency meeting', detail: 'Production cut announcement expected within 6 hours.', read: false },
  { id: 3, time: '01:30', type: 'INFO', title: 'Cargo rerouted successfully', detail: 'MV Bharat Star now on Cape of Good Hope route.', read: true },
  { id: 4, time: '00:45', type: 'WARNING', title: 'Brent crude surge', detail: 'Price up $4.2/bbl in last 2 hours.', read: true },
  { id: 5, time: '00:12', type: 'SUCCESS', title: 'SPR drawdown approved', detail: 'Cabinet approval received. Execution starting.', read: true },
];

export const dataSourcesData = [
  { name: 'Reuters Energy Feed', type: 'News', status: 'LIVE', latency: '< 1s', records: '24,891', quality: 98 },
  { name: 'Lloyd\'s Maritime Database', type: 'Shipping', status: 'LIVE', latency: '< 2s', records: '8,234', quality: 96 },
  { name: 'Sentinel-2 Satellite', type: 'Satellite', status: 'LIVE', latency: '< 5min', records: '1,204', quality: 94 },
  { name: 'Bloomberg Terminal', type: 'Commodity', status: 'LIVE', latency: '< 100ms', records: '156,400', quality: 99 },
  { name: 'OFAC Sanctions List', type: 'Government', status: 'LIVE', latency: '< 1min', records: '2,841', quality: 100 },
  { name: 'IMO Ship Registry', type: 'Shipping', status: 'DELAYED', latency: '5 min', records: '12,500', quality: 87 },
];

export const chatHistory = [
  {
    role: 'user',
    content: 'Show safest procurement route for next 30 days given current geopolitical situation',
    time: '02:15'
  },
  {
    role: 'ai',
    content: 'Based on current risk analysis, I recommend the **West Africa (Nigeria) → Cape of Good Hope → Paradip** route.',
    details: {
      route: 'Nigeria → Cape of Good Hope → Paradip Port, India',
      riskScore: 28,
      eta: '22 days',
      cost: '$84.2/bbl',
      reasons: [
        'Avoids Strait of Hormuz (current risk: 87/100)',
        'No active sanctions exposure',
        'Compatible with Jamnagar & Paradip refineries (96%)',
        'Good supplier reliability (Bonny Light — 94%)',
        'Insurance coverage available via Lloyd\'s'
      ]
    },
    time: '02:15'
  }
];

export const explainabilityData = {
  question: 'Why West Africa?',
  recommendation: 'West Africa (Nigeria) via Cape of Good Hope',
  confidence: 92,
  factors: [
    { factor: 'Lower Maritime Risk', contribution: 94, description: 'Avoids Strait of Hormuz completely' },
    { factor: 'Sanctions Compliance', contribution: 98, description: 'No OFAC/EU sanctions exposure' },
    { factor: 'Refinery Compatibility', contribution: 89, description: 'Bonny Light compatible with 5/6 major refineries' },
    { factor: 'Supplier Reliability', contribution: 87, description: 'Nigeria delivery record: 94.2% on-time' },
    { factor: 'Cost Competitiveness', contribution: 78, description: 'Cost premium of only $4.4/bbl vs alternatives' },
    { factor: 'ETA Acceptability', contribution: 82, description: '22-day ETA within buffer threshold' },
  ],
  alternatives: [
    { name: 'Saudi Arabia', confidence: 71, risk: 67, reason: 'Hormuz exposure' },
    { name: 'Brazil', confidence: 85, risk: 22, reason: 'Higher cost' },
    { name: 'UAE', confidence: 74, risk: 58, reason: 'Hormuz exposure' },
  ]
};

export const ingestionChartData = [
  { hour: '18:00', news: 340, shipping: 120, satellite: 45, commodity: 890 },
  { hour: '19:00', news: 420, shipping: 145, satellite: 52, commodity: 960 },
  { hour: '20:00', news: 380, shipping: 132, satellite: 48, commodity: 910 },
  { hour: '21:00', news: 510, shipping: 168, satellite: 61, commodity: 1040 },
  { hour: '22:00', news: 620, shipping: 195, satellite: 74, commodity: 1180 },
  { hour: '23:00', news: 580, shipping: 178, satellite: 68, commodity: 1090 },
  { hour: '00:00', news: 740, shipping: 220, satellite: 89, commodity: 1340 },
  { hour: '01:00', news: 890, shipping: 256, satellite: 102, commodity: 1520 },
  { hour: '02:00', news: 1020, shipping: 298, satellite: 118, commodity: 1680 },
];

export const sectorImpactData = [
  { sector: 'Transport', impact: 92, fill: '#ef4444' },
  { sector: 'Manufacturing', impact: 74, fill: '#f59e0b' },
  { sector: 'Agriculture', impact: 68, fill: '#f59e0b' },
  { sector: 'Power Gen', impact: 55, fill: '#1d8cff' },
  { sector: 'Aviation', impact: 88, fill: '#ef4444' },
  { sector: 'Chemicals', impact: 61, fill: '#1d8cff' },
];

export const collaborationRooms = [
  { id: 'rm-01', name: 'Crisis Response Board', members: 8, unread: 12, active: true, type: 'CRISIS' },
  { id: 'rm-02', name: 'Procurement Strategy', members: 5, unread: 3, active: false, type: 'STRATEGY' },
  { id: 'rm-03', name: 'SPR Decision Room', members: 4, unread: 7, active: false, type: 'DECISION' },
  { id: 'rm-04', name: 'Risk Analytics Team', members: 6, unread: 0, active: false, type: 'ANALYTICS' },
];

export const timelineEvents = [
  { time: '09:00', event: 'Normal operations — Brent $88/bbl', type: 'INFO', risk: 32 },
  { time: '09:30', event: 'Iranian naval drill announced', type: 'WARNING', risk: 45 },
  { time: '10:00', event: 'Hormuz tanker traffic reduced 15%', type: 'WARNING', risk: 58 },
  { time: '10:30', event: 'OPEC emergency meeting called', type: 'CRITICAL', risk: 67 },
  { time: '11:00', event: 'Brent spikes to $96/bbl', type: 'CRITICAL', risk: 74 },
  { time: '11:30', event: 'AI recommends West Africa reroute', type: 'AI', risk: 74 },
  { time: '12:00', event: 'Cabinet briefed — SPR drawdown approved', type: 'ACTION', risk: 71 },
  { time: '12:30', event: 'Procurement orders placed West Africa', type: 'ACTION', risk: 65 },
  { time: '13:00', event: 'Situation stabilizing — risk dropping', type: 'INFO', risk: 58 },
];
