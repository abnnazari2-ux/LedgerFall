// datasetEngine.js — Procedural dataset generation for all task types

// ── Utility ───────────────────────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(year = 2024) {
  const month = randomInt(1, 12)
  const day = randomInt(1, 28)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

function randomAmount(min, max, decimals = 2) {
  const val = min + Math.random() * (max - min)
  return parseFloat(val.toFixed(decimals))
}

const SUPPLIERS = [
  'Alliance Supply Co.', 'Pacific Office Solutions', 'Metro Stationery Ltd',
  'Global Procurement Inc.', 'TechParts Direct', 'Summit Logistics',
  'Riverside Equipment', 'Pinnacle Services', 'Delta Resources Ltd',
  'Omega Consulting', 'ABC Services', 'XYZ Holdings', // Last two = fraud shells
]

const EMPLOYEES = [
  'James Mitchell', 'Sarah Chen', 'Omar Farooq', 'Priya Patel',
  'Michael Torres', 'Fatima Al-Hassan', 'David Kim', 'Rebecca Walsh',
  'Ahmed Nazari', 'Lisa Thompson', 'Chris Brennan', 'Amara Diallo',
]

const DEPARTMENTS = ['Finance', 'Operations', 'IT', 'HR', 'Procurement', 'Marketing', 'Logistics']

// ── Invoice Match Dataset ─────────────────────────────────────────────────────

export function generateInvoiceMatchDataset(worldNumber, levelNumber, seed = Date.now()) {
  const fraudPresent = levelNumber >= 2
  const itemCount = 3 + Math.min(levelNumber, 5)

  const invoices = []
  const grns = []
  let fraudInvoiceId = null

  for (let i = 0; i < itemCount; i++) {
    const supplier = randomChoice(SUPPLIERS)
    const poNumber = `PO-${2024}${String(randomInt(1000, 9999))}`
    const qty = randomInt(10, 200)
    const unitPrice = randomAmount(5, 500)
    const amount = parseFloat((qty * unitPrice).toFixed(2))
    const date = randomDate()

    const isFraud = fraudPresent && i === Math.floor(itemCount / 2)

    const invoiceQty = isFraud ? qty + randomInt(5, 30) : qty
    const invoiceAmt = parseFloat((invoiceQty * unitPrice).toFixed(2))

    const invoiceId = `INV-${String(i + 1).padStart(3, '0')}`
    const grnId = `GRN-${String(i + 1).padStart(3, '0')}`

    invoices.push({
      id: invoiceId,
      supplier: isFraud ? 'ABC Services' : supplier,
      poNumber,
      date,
      quantity: invoiceQty,
      unitPrice,
      amount: invoiceAmt,
      description: `Office supplies — ${randomChoice(['batch A', 'batch B', 'monthly order', 'urgent order'])}`,
      isFraud,
    })

    grns.push({
      id: grnId,
      supplier: isFraud ? 'ABC Services' : supplier,
      poNumber,
      date: randomDate(),
      quantity: qty,
      unitPrice,
      amount,
      receivedBy: randomChoice(EMPLOYEES),
    })

    if (isFraud) fraudInvoiceId = invoiceId
  }

  return {
    type: 'InvoiceMatch',
    worldNumber,
    levelNumber,
    invoices,
    grns,
    fraudInvoiceId,
    fraudType: fraudPresent ? 'quantity_inflation' : null,
    explanation: fraudPresent
      ? `Invoice ${fraudInvoiceId} claims more units than were actually received per the GRN.`
      : 'All invoices match the goods received notes.',
  }
}

// ── Find Duplicates Dataset ───────────────────────────────────────────────────

export function generateDuplicateInvoiceDataset(worldNumber, levelNumber) {
  const fraudPresent = levelNumber >= 2
  const rowCount = 6 + Math.min(levelNumber * 2, 14)

  const rows = []
  const duplicateIndices = new Set()

  if (fraudPresent) {
    // Plant 1-3 duplicates
    const dupCount = Math.min(levelNumber, 3)
    for (let d = 0; d < dupCount; d++) {
      const baseIdx = randomInt(0, Math.floor(rowCount / 2) - 1)
      duplicateIndices.add(baseIdx)
      duplicateIndices.add(baseIdx + Math.floor(rowCount / 2))
    }
  }

  const baseInvoices = []
  for (let i = 0; i < Math.floor(rowCount / 2); i++) {
    baseInvoices.push({
      invoiceNum: `INV-${2024}-${String(randomInt(1000, 9999))}`,
      supplier: randomChoice(SUPPLIERS),
      date: randomDate(),
      amount: randomAmount(500, 50000),
      description: randomChoice(['Consulting Services', 'Equipment Hire', 'Software License', 'Maintenance', 'Professional Fees']),
    })
  }

  for (let i = 0; i < rowCount; i++) {
    const isSecondHalf = i >= Math.floor(rowCount / 2)
    const baseIdx = isSecondHalf ? i - Math.floor(rowCount / 2) : i
    const base = baseInvoices[baseIdx]
    const isDuplicate = duplicateIndices.has(i)

    rows.push({
      id: `row-${i}`,
      invoiceNum: isDuplicate && isSecondHalf ? base.invoiceNum : `INV-${2024}-${String(randomInt(1000, 9999))}`,
      supplier: isDuplicate && isSecondHalf ? base.supplier : (fraudPresent && i > rowCount - 3 ? 'ABC Services' : randomChoice(SUPPLIERS)),
      date: isDuplicate && isSecondHalf ? base.date : randomDate(),
      amount: isDuplicate && isSecondHalf ? base.amount : randomAmount(500, 50000),
      description: base.description,
      isDuplicate,
      isPaid: Math.random() > 0.3,
    })
  }

  return {
    type: 'FindDuplicates',
    worldNumber,
    levelNumber,
    rows,
    duplicateCount: duplicateIndices.size / 2,
    fraudPresent,
    explanation: fraudPresent
      ? `${duplicateIndices.size / 2} duplicate invoice(s) detected — the same invoice was submitted and paid more than once.`
      : 'No duplicate invoices in this dataset.',
  }
}

// ── Multiple Choice Dataset ───────────────────────────────────────────────────

const QUESTION_BANK = {
  ap: [
    {
      question: 'Which document confirms that goods were physically received at the warehouse?',
      options: ['Purchase Order', 'Supplier Invoice', 'Goods Received Note', 'Bank Statement'],
      correct: 2,
      explanation: 'A GRN (Goods Received Note) is the internal document confirming receipt of goods.',
      isaRef: 'ISA 500',
    },
    {
      question: 'A supplier invoices for 100 units but the GRN shows only 80 received. What action is correct?',
      options: ['Pay the full invoice amount', 'Pay only for 80 units and query the difference', 'Reject the invoice entirely', 'Approve the invoice for next period'],
      correct: 1,
      explanation: 'Payment should only be made for goods actually received. The discrepancy must be investigated.',
      isaRef: 'ISA 240',
    },
    {
      question: 'What control prevents a single employee from approving AND paying an invoice?',
      options: ['Dual authorisation', 'Segregation of duties', 'Internal audit', 'Purchase limit'],
      correct: 1,
      explanation: 'Segregation of duties ensures no single individual controls a complete transaction cycle.',
      isaRef: 'ISA 315',
    },
  ],
  ar: [
    {
      question: 'An auditor sends a letter directly to a customer confirming their outstanding balance. This is called:',
      options: ['Analytical procedure', 'External confirmation', 'Bank reconciliation', 'Inquiry'],
      correct: 1,
      explanation: 'External confirmations (ISA 505) involve the auditor directly contacting third parties to verify balances.',
      isaRef: 'ISA 505',
    },
    {
      question: 'Lapping fraud is most effectively prevented by:',
      options: ['Increasing debtor collection periods', 'Segregating cash receipt and ledger posting duties', 'Reducing the number of customers', 'Hiring more staff'],
      correct: 1,
      explanation: 'If the same person both collects cash and posts to the ledger, they can perpetrate lapping. Separation prevents it.',
      isaRef: 'ISA 240',
    },
  ],
  bank: [
    {
      question: 'A cheque issued in December but not clearing the bank until January is called:',
      options: ['Deposit in transit', 'Outstanding cheque', 'Bank error', 'NSF cheque'],
      correct: 1,
      explanation: 'An outstanding cheque has been issued and recorded but has not yet cleared the bank statement.',
      isaRef: 'ISA 500',
    },
    {
      question: 'Kiting fraud exploits:',
      options: ['Weak password controls', 'The float between bank accounts', 'Inventory miscounts', 'Payroll duplicate payments'],
      correct: 1,
      explanation: 'Kiting exploits the delay between when a cheque is deposited and when it clears, creating artificial balances.',
      isaRef: 'ISA 240',
    },
  ],
  payroll: [
    {
      question: 'A ghost employee is:',
      options: ['An employee who works from home', 'A fictitious employee on the payroll', 'A temporary contractor', 'A terminated employee'],
      correct: 1,
      explanation: 'A ghost employee is a fictitious person added to the payroll to divert wages to a fraudster.',
      isaRef: 'ISA 240',
    },
    {
      question: 'The best control to detect ghost employees is:',
      options: ['Reviewing payslips', 'Independent physical headcount', 'Increasing salaries', 'Automated timesheets'],
      correct: 1,
      explanation: 'A surprise headcount verifies that all people on the payroll are real, identifiable employees.',
      isaRef: 'ISA 315',
    },
  ],
  inventory: [
    {
      question: 'FIFO inventory valuation assumes:',
      options: ['The most expensive items are sold first', 'The newest items are sold first', 'The oldest items are sold first', 'Items are sold at average cost'],
      correct: 2,
      explanation: 'FIFO (First-In, First-Out) assumes the oldest stock is sold first.',
      isaRef: 'ISA 501',
    },
  ],
  controls: [
    {
      question: 'The three elements of the Fraud Triangle are:',
      options: ['Risk, Control, Opportunity', 'Pressure, Opportunity, Rationalisation', 'Threat, Vulnerability, Impact', 'Access, Motive, Intent'],
      correct: 1,
      explanation: 'Donald Cressey\'s Fraud Triangle identifies Pressure, Opportunity, and Rationalisation as the three components of occupational fraud.',
      isaRef: 'ISA 240',
    },
    {
      question: 'COSO\'s Internal Control framework has how many components?',
      options: ['3', '4', '5', '7'],
      correct: 2,
      explanation: 'COSO has 5 components: Control Environment, Risk Assessment, Control Activities, Information & Communication, and Monitoring.',
      isaRef: 'ISA 315',
    },
  ],
}

const WORLD_TOPIC_MAP = { 1: 'ap', 2: 'ar', 3: 'bank', 4: 'payroll', 5: 'inventory', 6: 'controls' }

export function generateMultipleChoiceDataset(worldNumber, levelNumber) {
  const topic = WORLD_TOPIC_MAP[worldNumber] || 'ap'
  const pool = QUESTION_BANK[topic] || QUESTION_BANK.ap
  const questionCount = Math.min(2 + levelNumber, pool.length, 5)

  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, questionCount)

  return {
    type: 'MultipleChoice',
    worldNumber,
    levelNumber,
    questions: shuffled,
    passingCorrect: Math.ceil(questionCount * 0.6),
  }
}

// ── Bank Reconciliation Dataset ───────────────────────────────────────────────

export function generateBankReconciliationDataset(worldNumber, levelNumber) {
  const outstandingChequeCount = randomInt(1, 3)
  const depositsInTransitCount = randomInt(1, 2)
  const fraudPresent = levelNumber >= 3

  const outstandingCheques = []
  let totalOutstanding = 0
  for (let i = 0; i < outstandingChequeCount; i++) {
    const amt = randomAmount(500, 10000)
    totalOutstanding += amt
    outstandingCheques.push({ id: `CHQ-${randomInt(1000, 9999)}`, amount: amt, payee: randomChoice(SUPPLIERS), date: randomDate() })
  }

  const depositsInTransit = []
  let totalDeposits = 0
  for (let i = 0; i < depositsInTransitCount; i++) {
    const amt = randomAmount(1000, 20000)
    totalDeposits += amt
    depositsInTransit.push({ id: `DEP-${randomInt(1000, 9999)}`, amount: amt, date: randomDate() })
  }

  const fraudAmount = fraudPresent ? randomAmount(2000, 15000) : 0
  const bankBalance = randomAmount(50000, 200000)
  const cashBookBalance = parseFloat((bankBalance - totalOutstanding + totalDeposits + fraudAmount).toFixed(2))

  return {
    type: 'BankReconciliation',
    worldNumber,
    levelNumber,
    bankStatementBalance: parseFloat(bankBalance.toFixed(2)),
    cashBookBalance,
    outstandingCheques,
    depositsInTransit,
    unexplainedDifference: fraudPresent ? parseFloat(fraudAmount.toFixed(2)) : 0,
    fraudPresent,
    explanation: fraudPresent
      ? `After accounting for outstanding cheques and deposits in transit, an unexplained difference of $${fraudAmount.toFixed(2)} remains — indicating potential misappropriation.`
      : 'All differences explained by timing items.',
  }
}

// ── Cut-Off Test Dataset ──────────────────────────────────────────────────────

export function generateCutOffDataset(worldNumber, levelNumber) {
  const transactions = []
  const yearEnd = '31/12/2024'
  const fraudPresent = levelNumber >= 2

  for (let i = 0; i < 6 + levelNumber; i++) {
    const isAroundYearEnd = i < 4
    const day = isAroundYearEnd ? randomInt(28, 31) : randomInt(1, 5)
    const month = isAroundYearEnd ? 12 : 1
    const year = isAroundYearEnd ? 2024 : 2025
    const grnDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    const invoiceDate = isAroundYearEnd && fraudPresent && i === 1
      ? `02/01/2025` // Cut-off error — goods received Dec 31 but invoice posted Jan 2
      : grnDate

    transactions.push({
      id: `TXN-${String(i + 1).padStart(3, '0')}`,
      supplier: randomChoice(SUPPLIERS),
      grnDate,
      invoiceDate,
      amount: randomAmount(1000, 30000),
      description: 'Inventory purchase',
      hasCutOffError: isAroundYearEnd && fraudPresent && i === 1,
    })
  }

  return {
    type: 'CutOff',
    worldNumber,
    levelNumber,
    transactions,
    yearEnd,
    fraudPresent,
    explanation: fraudPresent
      ? 'At least one transaction has a cut-off error: goods received before year-end but the invoice recorded after, misstating closing inventory and payables.'
      : 'All transactions are recorded in the correct period.',
  }
}

// ── Audit Finding Dataset ─────────────────────────────────────────────────────

const AUDIT_SCENARIOS = [
  {
    title: 'Vendor Analysis Report',
    findings: [
      { id: 1, text: 'Supplier "ABC Services" has no physical address or VAT number on file', isFraud: true, stampType: 'fraud_risk' },
      { id: 2, text: 'Invoice INV-2024-0441: $12,500 — matches PO and GRN exactly', isFraud: false, stampType: 'agreed' },
      { id: 3, text: 'Invoice INV-2024-0442: quantity 120 vs GRN quantity 100', isFraud: true, stampType: 'exception' },
      { id: 4, text: 'Payment to "ABC Services" routes to personal bank account of employee', isFraud: true, stampType: 'fraud_risk' },
      { id: 5, text: 'Invoice INV-2024-0443: $3,200 — approved within delegated authority', isFraud: false, stampType: 'agreed' },
    ],
  },
  {
    title: 'Payroll Exception Report',
    findings: [
      { id: 1, text: 'Employee "J. Roberts" — no HR record, no access card, no photo ID', isFraud: true, stampType: 'fraud_risk' },
      { id: 2, text: 'Overtime for Dept A: +180% vs prior period, output unchanged', isFraud: true, stampType: 'exception' },
      { id: 3, text: 'Salary for M. Chen: within approved grade band', isFraud: false, stampType: 'agreed' },
      { id: 4, text: 'Duplicate payment to account ending 4471 on 28 Feb and 1 Mar', isFraud: true, stampType: 'exception' },
      { id: 5, text: 'P. Patel: termination date 15 Jan, final payroll 31 Jan — correct', isFraud: false, stampType: 'agreed' },
    ],
  },
]

export function generateAuditFindingDataset(worldNumber, levelNumber) {
  const scenario = randomChoice(AUDIT_SCENARIOS)
  return {
    type: 'AuditFinding',
    worldNumber,
    levelNumber,
    title: scenario.title,
    findings: scenario.findings.sort(() => Math.random() - 0.5),
    fraudCount: scenario.findings.filter((f) => f.isFraud).length,
  }
}

export default {
  generateInvoiceMatchDataset,
  generateDuplicateInvoiceDataset,
  generateMultipleChoiceDataset,
  generateBankReconciliationDataset,
  generateCutOffDataset,
  generateAuditFindingDataset,
}
