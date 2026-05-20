// worldsData.js — Master data for all 6 worlds and their levels

export const WORLDS_DATA = [
  {
    worldNumber: 1,
    worldName: 'The Warehouse',
    subtitle: 'Accounts Payable',
    description: 'Investigate supplier invoices, detect ghost vendors and three-way match failures.',
    backgroundKey: 'bg_world1',
    themeColor: '#C8860A',
    musicKey: 'music_world1',
    levels: [
      { levelNumber: 1, title: 'First Invoice', taskType: 'InvoiceMatchTask', timeLimitSeconds: 300, passingScore: 60, fraudPresent: false, difficulty: 1 },
      { levelNumber: 2, title: 'Quantity Mismatch', taskType: 'InvoiceMatchTask', timeLimitSeconds: 280, passingScore: 65, fraudPresent: true, difficulty: 1 },
      { levelNumber: 3, title: 'Ghost Vendor', taskType: 'FindDuplicatesTask', timeLimitSeconds: 260, passingScore: 70, fraudPresent: true, difficulty: 2 },
      { levelNumber: 4, title: 'Split Purchases', taskType: 'MultipleChoiceTask', timeLimitSeconds: 240, passingScore: 70, fraudPresent: true, difficulty: 2 },
      { levelNumber: 5, title: 'The Warehouse Boss', taskType: 'AuditFindingTask', timeLimitSeconds: 360, passingScore: 75, fraudPresent: true, difficulty: 3 },
    ],
  },
  {
    worldNumber: 2,
    worldName: 'The Office',
    subtitle: 'Accounts Receivable',
    description: 'Confirm debtor balances, detect lapping fraud, and review aging reports.',
    backgroundKey: 'bg_world2',
    themeColor: '#1A6BCC',
    musicKey: 'music_world2',
    levels: [
      { levelNumber: 1, title: 'Debtor Balances', taskType: 'MultipleChoiceTask', timeLimitSeconds: 300, passingScore: 60, fraudPresent: false, difficulty: 1 },
      { levelNumber: 2, title: 'Confirmation Mismatch', taskType: 'AuditFindingTask', timeLimitSeconds: 280, passingScore: 65, fraudPresent: true, difficulty: 2 },
      { levelNumber: 3, title: 'Lapping Detected', taskType: 'FindDuplicatesTask', timeLimitSeconds: 260, passingScore: 70, fraudPresent: true, difficulty: 2 },
      { levelNumber: 4, title: 'Aging Analysis', taskType: 'MultipleChoiceTask', timeLimitSeconds: 240, passingScore: 70, fraudPresent: true, difficulty: 3 },
      { levelNumber: 5, title: 'The Office Boss', taskType: 'AuditFindingTask', timeLimitSeconds: 360, passingScore: 75, fraudPresent: true, difficulty: 3 },
    ],
  },
  {
    worldNumber: 3,
    worldName: 'The Bank',
    subtitle: 'Bank & Cash',
    description: 'Reconcile bank accounts, identify kiting schemes, and verify cash balances.',
    backgroundKey: 'bg_world3',
    themeColor: '#2E7D32',
    musicKey: 'music_world3',
    levels: [
      { levelNumber: 1, title: 'Reconciliation 101', taskType: 'BankReconciliationTask', timeLimitSeconds: 300, passingScore: 60, fraudPresent: false, difficulty: 1 },
      { levelNumber: 2, title: 'Outstanding Cheques', taskType: 'BankReconciliationTask', timeLimitSeconds: 280, passingScore: 65, fraudPresent: false, difficulty: 2 },
      { levelNumber: 3, title: 'Kiting Alert', taskType: 'AuditFindingTask', timeLimitSeconds: 260, passingScore: 70, fraudPresent: true, difficulty: 2 },
      { levelNumber: 4, title: 'Missing Transactions', taskType: 'FindDuplicatesTask', timeLimitSeconds: 240, passingScore: 70, fraudPresent: true, difficulty: 3 },
      { levelNumber: 5, title: 'The Bank Boss', taskType: 'BankReconciliationTask', timeLimitSeconds: 360, passingScore: 75, fraudPresent: true, difficulty: 3 },
    ],
  },
  {
    worldNumber: 4,
    worldName: 'HR Department',
    subtitle: 'Payroll Fraud',
    description: 'Uncover ghost employees, timesheet fraud, and unauthorised pay increases.',
    backgroundKey: 'bg_world4',
    themeColor: '#7B1FA2',
    musicKey: 'music_world4',
    levels: [
      { levelNumber: 1, title: 'Headcount Check', taskType: 'MultipleChoiceTask', timeLimitSeconds: 300, passingScore: 60, fraudPresent: false, difficulty: 1 },
      { levelNumber: 2, title: 'Ghost Employee', taskType: 'FindDuplicatesTask', timeLimitSeconds: 280, passingScore: 65, fraudPresent: true, difficulty: 2 },
      { levelNumber: 3, title: 'Overtime Anomaly', taskType: 'AuditFindingTask', timeLimitSeconds: 260, passingScore: 70, fraudPresent: true, difficulty: 2 },
      { levelNumber: 4, title: 'Duplicate Payments', taskType: 'FindDuplicatesTask', timeLimitSeconds: 240, passingScore: 70, fraudPresent: true, difficulty: 3 },
      { levelNumber: 5, title: 'The HR Boss', taskType: 'AuditFindingTask', timeLimitSeconds: 360, passingScore: 75, fraudPresent: true, difficulty: 3 },
    ],
  },
  {
    worldNumber: 5,
    worldName: 'Night Warehouse',
    subtitle: 'Inventory',
    description: 'Count stock, identify shrinkage, and test inventory cut-off procedures.',
    backgroundKey: 'bg_world5',
    themeColor: '#E65100',
    musicKey: 'music_world5',
    levels: [
      { levelNumber: 1, title: 'Stock Count', taskType: 'MultipleChoiceTask', timeLimitSeconds: 300, passingScore: 60, fraudPresent: false, difficulty: 1 },
      { levelNumber: 2, title: 'Shrinkage Found', taskType: 'AuditFindingTask', timeLimitSeconds: 280, passingScore: 65, fraudPresent: true, difficulty: 2 },
      { levelNumber: 3, title: 'Cut-Off Test', taskType: 'CutOffTestTask', timeLimitSeconds: 260, passingScore: 70, fraudPresent: true, difficulty: 2 },
      { levelNumber: 4, title: 'Valuation Error', taskType: 'MultipleChoiceTask', timeLimitSeconds: 240, passingScore: 70, fraudPresent: true, difficulty: 3 },
      { levelNumber: 5, title: 'The Night Boss', taskType: 'AuditFindingTask', timeLimitSeconds: 360, passingScore: 75, fraudPresent: true, difficulty: 3 },
    ],
  },
  {
    worldNumber: 6,
    worldName: 'The Rooftop',
    subtitle: 'Internal Controls',
    description: 'Evaluate control frameworks, identify segregation of duties failures, and assess fraud risk.',
    backgroundKey: 'bg_world6',
    themeColor: '#8B0000',
    musicKey: 'music_world6',
    levels: [
      { levelNumber: 1, title: 'Control Environment', taskType: 'MultipleChoiceTask', timeLimitSeconds: 300, passingScore: 60, fraudPresent: false, difficulty: 2 },
      { levelNumber: 2, title: 'SoD Failure', taskType: 'AuditFindingTask', timeLimitSeconds: 280, passingScore: 65, fraudPresent: true, difficulty: 2 },
      { levelNumber: 3, title: 'The Fraud Triangle', taskType: 'MultipleChoiceTask', timeLimitSeconds: 260, passingScore: 70, fraudPresent: true, difficulty: 3 },
      { levelNumber: 4, title: 'COSO Review', taskType: 'AuditFindingTask', timeLimitSeconds: 240, passingScore: 70, fraudPresent: true, difficulty: 3 },
      { levelNumber: 5, title: 'The Final Audit', taskType: 'AuditFindingTask', timeLimitSeconds: 420, passingScore: 80, fraudPresent: true, difficulty: 4 },
    ],
  },
]

export function getWorldData(worldNumber) {
  return WORLDS_DATA.find((w) => w.worldNumber === worldNumber) || null
}

export function getLevelData(worldNumber, levelNumber) {
  const world = getWorldData(worldNumber)
  if (!world) return null
  return world.levels.find((l) => l.levelNumber === levelNumber) || null
}

export function getTotalLevels() {
  return WORLDS_DATA.reduce((sum, w) => sum + w.levels.length, 0)
}

export default WORLDS_DATA
