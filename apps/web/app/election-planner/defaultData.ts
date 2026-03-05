import { ElectionPlan } from './types';

export const defaultElectionPlan: ElectionPlan = {
  title: 'West Bengal Legislative Assembly Election 2026',
  electionDate: '2026-05-15',
  district: 'Your District',
  state: 'West Bengal',
  teams: [
    {
      id: 'team-training',
      name: 'Training & Capacity Building',
      color: '#6366f1',
      lead: 'ADM (Training)',
      description: 'Training of polling personnel, BLOs, microscopers and election officials',
    },
    {
      id: 'team-evm',
      name: 'EVM / VVPAT Management',
      color: '#f59e0b',
      lead: 'DEO (EVM)',
      description: 'First-level checking, storage, randomisation and deployment of EVMs and VVPATs',
    },
    {
      id: 'team-staff',
      name: 'Staff Deployment',
      color: '#10b981',
      lead: 'ADM (General)',
      description: 'Identification, roster preparation and deployment of polling and counting staff',
    },
    {
      id: 'team-logistics',
      name: 'Transport & Logistics',
      color: '#f97316',
      lead: 'District Transport Officer',
      description: 'Vehicle requisition, dispatch, material movement and polling-party logistics',
    },
    {
      id: 'team-it',
      name: 'IT & Communication',
      color: '#0ea5e9',
      lead: 'NIC / District IT Officer',
      description: 'Portal management, helplines, real-time monitoring and result transmission',
    },
    {
      id: 'team-law',
      name: 'Law & Order',
      color: '#ef4444',
      lead: 'SP / District Police',
      description: 'Security planning, force deployment, vulnerable-area mapping and election-day security',
    },
    {
      id: 'team-sveep',
      name: 'Voter Awareness (SVEEP)',
      color: '#8b5cf6',
      lead: 'DEO (SVEEP)',
      description: 'Systematic Voters\' Education and Electoral Participation campaigns',
    },
    {
      id: 'team-mcc',
      name: 'Model Code of Conduct',
      color: '#ec4899',
      lead: 'ADM (MCC)',
      description: 'MCC monitoring, flying squad operations and expenditure observation',
    },
  ],
  tasks: [
    // Training & Capacity Building
    {
      id: 't1', teamId: 'team-training', name: 'Master Trainer Identification',
      description: 'Identify and notify master trainers from each AC segment',
      startDate: '2026-03-10', endDate: '2026-03-20', status: 'completed',
      progress: 100, assignee: 'ADM Training', priority: 'high', dependencies: [],
    },
    {
      id: 't2', teamId: 'team-training', name: 'Master Trainer Training (ToT)',
      description: 'State-level Training of Trainers programme',
      startDate: '2026-03-22', endDate: '2026-03-28', status: 'completed',
      progress: 100, assignee: 'ADM Training', priority: 'high', dependencies: ['t1'],
    },
    {
      id: 't3', teamId: 'team-training', name: 'BLO Training',
      description: 'Booth Level Officers training on voter list management and facility check',
      startDate: '2026-03-28', endDate: '2026-04-05', status: 'in-progress',
      progress: 60, assignee: 'ERO / AERO', priority: 'high', dependencies: ['t2'],
    },
    {
      id: 't4', teamId: 'team-training', name: 'Polling Personnel Training — Round 1',
      description: 'First round training for presiding and polling officers',
      startDate: '2026-04-10', endDate: '2026-04-20', status: 'not-started',
      progress: 0, assignee: 'Training Cell', priority: 'critical', dependencies: ['t2'],
    },
    {
      id: 't5', teamId: 'team-training', name: 'Polling Personnel Training — Round 2',
      description: 'Refresher / mock poll training with EVMs and VVPATs',
      startDate: '2026-04-25', endDate: '2026-05-05', status: 'not-started',
      progress: 0, assignee: 'Training Cell', priority: 'critical', dependencies: ['t4'],
    },
    {
      id: 't6', teamId: 'team-training', name: 'Counting Staff Training',
      description: 'Training of counting supervisors and assistants',
      startDate: '2026-05-10', endDate: '2026-05-13', status: 'not-started',
      progress: 0, assignee: 'Training Cell', priority: 'high', dependencies: ['t2'],
    },
    // EVM / VVPAT
    {
      id: 'e1', teamId: 'team-evm', name: 'EVM First-Level Checking (FLC)',
      description: 'Technical checking of all EVM / VVPAT units by BEL / ECIL engineers',
      startDate: '2026-03-05', endDate: '2026-03-25', status: 'in-progress',
      progress: 70, assignee: 'DEO EVM', priority: 'critical', dependencies: [],
    },
    {
      id: 'e2', teamId: 'team-evm', name: 'EVM Storage & Inventory',
      description: 'Secure godown-wise storage and inventory maintenance post-FLC',
      startDate: '2026-03-26', endDate: '2026-04-05', status: 'not-started',
      progress: 0, assignee: 'Nodal Officer EVM', priority: 'high', dependencies: ['e1'],
    },
    {
      id: 'e3', teamId: 'team-evm', name: 'First Randomisation of EVMs',
      description: 'Random allocation of EVM sets to Assembly Constituencies',
      startDate: '2026-04-08', endDate: '2026-04-08', status: 'not-started',
      progress: 0, assignee: 'DEO', priority: 'critical', dependencies: ['e2'],
    },
    {
      id: 'e4', teamId: 'team-evm', name: 'Candidate Symbol Loading',
      description: 'Loading of candidate names and symbols in BUs after symbol allotment',
      startDate: '2026-04-20', endDate: '2026-04-25', status: 'not-started',
      progress: 0, assignee: 'EVM Nodal', priority: 'critical', dependencies: ['e3'],
    },
    {
      id: 'e5', teamId: 'team-evm', name: 'Second Randomisation (Booth-wise)',
      description: 'Final randomisation mapping EVM sets to specific polling booths',
      startDate: '2026-04-26', endDate: '2026-04-26', status: 'not-started',
      progress: 0, assignee: 'DEO', priority: 'critical', dependencies: ['e4'],
    },
    {
      id: 'e6', teamId: 'team-evm', name: 'Mock Poll & Dispatch to Booths',
      description: 'Mock poll before dispatch; despatch of EVM sets to distribution centres',
      startDate: '2026-05-12', endDate: '2026-05-14', status: 'not-started',
      progress: 0, assignee: 'EVM Nodal', priority: 'critical', dependencies: ['e5'],
    },
    // Staff Deployment
    {
      id: 's1', teamId: 'team-staff', name: 'Electoral Roll Finalisation',
      description: 'Special summary revision and publication of final electoral rolls',
      startDate: '2026-03-05', endDate: '2026-03-15', status: 'completed',
      progress: 100, assignee: 'ERO', priority: 'critical', dependencies: [],
    },
    {
      id: 's2', teamId: 'team-staff', name: 'Staff Database Preparation',
      description: 'Compilation of government employees available for election duty',
      startDate: '2026-03-15', endDate: '2026-03-30', status: 'in-progress',
      progress: 80, assignee: 'ADM General', priority: 'high', dependencies: [],
    },
    {
      id: 's3', teamId: 'team-staff', name: 'Polling Party Roster Preparation',
      description: 'Random selection and roster of polling parties booth-wise',
      startDate: '2026-04-01', endDate: '2026-04-10', status: 'not-started',
      progress: 0, assignee: 'ADM General', priority: 'critical', dependencies: ['s2'],
    },
    {
      id: 's4', teamId: 'team-staff', name: 'Micro-Observer Deployment Plan',
      description: 'Identification and briefing of Micro-Observers for critical booths',
      startDate: '2026-04-15', endDate: '2026-04-30', status: 'not-started',
      progress: 0, assignee: 'DEO Office', priority: 'high', dependencies: ['s3'],
    },
    {
      id: 's5', teamId: 'team-staff', name: 'Counting Staff Roster',
      description: 'Random selection of counting supervisors and assistants',
      startDate: '2026-05-05', endDate: '2026-05-10', status: 'not-started',
      progress: 0, assignee: 'ADM General', priority: 'high', dependencies: ['s2'],
    },
    // Transport & Logistics
    {
      id: 'l1', teamId: 'team-logistics', name: 'Vehicle Requisition Orders',
      description: 'Issue requisition orders for government and private vehicles',
      startDate: '2026-03-20', endDate: '2026-04-05', status: 'in-progress',
      progress: 50, assignee: 'DTO', priority: 'high', dependencies: [],
    },
    {
      id: 'l2', teamId: 'team-logistics', name: 'Polling Material Procurement',
      description: 'Procurement of stationery, seals, forms and other polling materials',
      startDate: '2026-03-25', endDate: '2026-04-10', status: 'in-progress',
      progress: 40, assignee: 'Treasury Officer', priority: 'high', dependencies: [],
    },
    {
      id: 'l3', teamId: 'team-logistics', name: 'Distribution Centre Setup',
      description: 'Establishment and equipping of material distribution centres (AC-wise)',
      startDate: '2026-04-15', endDate: '2026-04-25', status: 'not-started',
      progress: 0, assignee: 'DTO', priority: 'high', dependencies: ['l1', 'l2'],
    },
    {
      id: 'l4', teamId: 'team-logistics', name: 'Polling Party Dispatch Plan',
      description: 'Route-wise scheduling for despatch and return of polling parties',
      startDate: '2026-05-08', endDate: '2026-05-12', status: 'not-started',
      progress: 0, assignee: 'DTO', priority: 'critical', dependencies: ['l3', 's3'],
    },
    // IT & Communication
    {
      id: 'i1', teamId: 'team-it', name: 'ECI Portal Updates (ENCORE / Suvidha)',
      description: 'Ensure all portals are updated with district data and nominations',
      startDate: '2026-03-10', endDate: '2026-03-30', status: 'in-progress',
      progress: 65, assignee: 'NIC Officer', priority: 'high', dependencies: [],
    },
    {
      id: 'i2', teamId: 'team-it', name: 'cVIGIL Helpline Activation',
      description: 'Activate and publicise 1950 voter helpline and cVIGIL app monitoring cell',
      startDate: '2026-03-20', endDate: '2026-03-25', status: 'completed',
      progress: 100, assignee: 'NIC Officer', priority: 'high', dependencies: [],
    },
    {
      id: 'i3', teamId: 'team-it', name: 'Webcasting Setup for Critical Booths',
      description: 'Install webcasting equipment and test connectivity at critical polling stations',
      startDate: '2026-04-20', endDate: '2026-05-05', status: 'not-started',
      progress: 0, assignee: 'NIC Officer', priority: 'high', dependencies: ['i1'],
    },
    {
      id: 'i4', teamId: 'team-it', name: 'Counting Hall IT Setup',
      description: 'Result transmission system setup at counting hall',
      startDate: '2026-05-10', endDate: '2026-05-14', status: 'not-started',
      progress: 0, assignee: 'NIC Officer', priority: 'critical', dependencies: ['i3'],
    },
    // Law & Order
    {
      id: 'lo1', teamId: 'team-law', name: 'Vulnerable Area / Booth Mapping',
      description: 'Identify and classify vulnerable / critical polling stations',
      startDate: '2026-03-10', endDate: '2026-03-25', status: 'completed',
      progress: 100, assignee: 'SP', priority: 'critical', dependencies: [],
    },
    {
      id: 'lo2', teamId: 'team-law', name: 'Central Force Requisition',
      description: 'Submit indent for Central Armed Police Forces to ECI',
      startDate: '2026-03-25', endDate: '2026-04-05', status: 'in-progress',
      progress: 80, assignee: 'SP', priority: 'critical', dependencies: ['lo1'],
    },
    {
      id: 'lo3', teamId: 'team-law', name: 'Area Domination & Route March',
      description: 'Regular area domination exercises in sensitive areas',
      startDate: '2026-04-01', endDate: '2026-05-14', status: 'not-started',
      progress: 0, assignee: 'SP', priority: 'high', dependencies: ['lo2'],
    },
    {
      id: 'lo4', teamId: 'team-law', name: 'Flying Squads & Static Surveillance Teams',
      description: 'Deployment of FST and SST teams for MCC enforcement',
      startDate: '2026-03-28', endDate: '2026-05-15', status: 'not-started',
      progress: 0, assignee: 'DSP', priority: 'high', dependencies: ['lo1'],
    },
    // SVEEP
    {
      id: 'sv1', teamId: 'team-sveep', name: 'SVEEP Activity Calendar',
      description: 'Prepare district-level SVEEP calendar with event scheduling',
      startDate: '2026-03-05', endDate: '2026-03-15', status: 'completed',
      progress: 100, assignee: 'DEO SVEEP', priority: 'medium', dependencies: [],
    },
    {
      id: 'sv2', teamId: 'team-sveep', name: 'Voter Awareness Campaigns',
      description: 'Nukkad natak, street plays, college campaigns and social media drives',
      startDate: '2026-03-15', endDate: '2026-04-30', status: 'in-progress',
      progress: 45, assignee: 'SVEEP Cell', priority: 'medium', dependencies: ['sv1'],
    },
    {
      id: 'sv3', teamId: 'team-sveep', name: 'PwD / Senior Citizen Voter Facilitation',
      description: 'Wheelchair ramps, pickup facilitation and home voting arrangements',
      startDate: '2026-04-05', endDate: '2026-05-10', status: 'not-started',
      progress: 0, assignee: 'DEO SVEEP', priority: 'high', dependencies: ['s1'],
    },
    {
      id: 'sv4', teamId: 'team-sveep', name: 'Last-Mile Voter Outreach',
      description: 'Booth-level awareness and polling day reminder activities',
      startDate: '2026-05-10', endDate: '2026-05-14', status: 'not-started',
      progress: 0, assignee: 'SVEEP Cell', priority: 'medium', dependencies: ['sv2'],
    },
    // MCC
    {
      id: 'm1', teamId: 'team-mcc', name: 'MCC Enforcement Cell Setup',
      description: 'Constitute and brief MCC monitoring cell with nodal officers',
      startDate: '2026-03-20', endDate: '2026-03-25', status: 'completed',
      progress: 100, assignee: 'ADM MCC', priority: 'critical', dependencies: [],
    },
    {
      id: 'm2', teamId: 'team-mcc', name: 'Expenditure Monitoring (EDS / DE)',
      description: 'Deploy Expenditure Observers and District Expenditure Monitoring teams',
      startDate: '2026-03-25', endDate: '2026-05-15', status: 'in-progress',
      progress: 30, assignee: 'District Expenditure Team', priority: 'high', dependencies: ['m1'],
    },
    {
      id: 'm3', teamId: 'team-mcc', name: 'Cash / Liquor / Freebies Seizure Drive',
      description: 'Intensify checkpost checking and seizure operations',
      startDate: '2026-04-01', endDate: '2026-05-14', status: 'not-started',
      progress: 0, assignee: 'FST / SST / Income Tax', priority: 'high', dependencies: ['m1', 'lo4'],
    },
  ],
};
