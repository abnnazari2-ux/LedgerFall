// BankReconciliationTask.js — Type D: Bank reconciliation with numeric input
import TaskScene from '../scenes/TaskScene.js'
import { generateBankReconciliationDataset as generateBankRecDataset } from '../data/datasetEngine.js'

export default class BankReconciliationTask extends TaskScene {
  constructor() {
    super({ key: 'BankReconciliationTask' })
    this._classifications = {}
    this._bankAdjInput = null
    this._ledgerAdjInput = null
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 3, data?.levelNumber ?? 1, data)
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this.setupBackground(this.worldNumber)

    const seed = this.worldNumber * 100 + this.levelNumber
    this._dataset = generateBankRecDataset(seed)

    this._drawTitle()
    this._drawBalances()
    this._drawReconItems()
    this._drawAdjustedBalanceInputs()
    this._drawSubmitButton()

    this.setupHint()
    this.setupNoteHiding()
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 360)

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')
  }

  _drawTitle() {
    const headerBg = this.add.graphics()
    headerBg.fillStyle(0x0a0a22, 0.9)
    headerBg.fillRect(0, 0, this._W, 100)

    this.add.text(this._cx, 22, this.levelData?.levelName ?? 'Bank Reconciliation', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.add.text(this._cx, 48, `Year End: ${this._dataset.yearEnd}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    this.add.text(this._cx, 68, 'Classify each reconciling item', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#888888',
    }).setOrigin(0.5)
  }

  _drawBalances() {
    const panel = this.add.graphics()
    panel.fillStyle(0x111133, 0.9)
    panel.fillRoundedRect(10, 108, this._W - 20, 70, 6)
    panel.lineStyle(2, 0x333366, 1)
    panel.strokeRoundedRect(10, 108, this._W - 20, 70, 6)

    this.add.text(30, 122, 'Bank Statement Balance:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAFF',
    })

    this.add.text(this._W - 30, 122, `£${this._dataset.bankBalance.toLocaleString('en-GB')}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FFD700',
    }).setOrigin(1, 0)

    this.add.text(30, 148, 'Cash Book (Ledger) Balance:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAFFAA',
    })

    this.add.text(this._W - 30, 148, `£${this._dataset.ledgerBalance.toLocaleString('en-GB')}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FFD700',
    }).setOrigin(1, 0)
  }

  _drawReconItems() {
    const types = [
      { value: 'outstanding_cheque',   label: 'Outstanding Cheque' },
      { value: 'deposit_in_transit',   label: 'Deposit in Transit' },
      { value: 'bank_charge',          label: 'Bank Charge' },
      { value: 'error',                label: 'Error' },
      { value: 'interest',             label: 'Interest Earned' },
      { value: 'nsf',                  label: 'NSF Cheque' },
    ]

    const items = this._dataset.reconItems
    this._itemClassifications = {}

    this.add.text(this._cx, 192, 'RECONCILING ITEMS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#C8860A',
    }).setOrigin(0.5)

    items.forEach((item, i) => {
      const y = 215 + i * 68
      this._drawReconItem(item, y, types)
    })
  }

  _drawReconItem(item, y, types) {
    const bg = this.add.graphics()
    bg.fillStyle(0x111133, 0.85)
    bg.fillRoundedRect(10, y, this._W - 20, 58, 5)
    bg.lineStyle(1, 0x333366, 0.6)
    bg.strokeRoundedRect(10, y, this._W - 20, 58, 5)

    this.add.text(20, y + 8, item.description, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#FFFFFF',
    })

    this.add.text(20, y + 26, `£${Math.abs(item.amount).toLocaleString('en-GB')}  ·  ${item.date}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#AAAAAA',
    })

    // Dropdown button (cycles through options)
    const classLabel = this._classifications[item.id] || 'Classify…'
    const dropdown = this.add.text(this._W - 20, y + 28, classLabel, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#FFDD00',
      backgroundColor: '#1a1a4e',
      padding: { x: 4, y: 3 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })

    dropdown.on('pointerdown', () => {
      this._showClassifyMenu(item, types, dropdown)
    })
  }

  _showClassifyMenu(item, types, dropdown) {
    // Close any existing menu
    if (this._classifyMenu) this._classifyMenu.destroy()

    const menu = this.add.container(this._cx, 450).setDepth(400)
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.97)
    bg.fillRoundedRect(-170, -types.length * 22 - 10, 340, types.length * 44 + 20, 8)
    bg.lineStyle(2, 0x5555cc, 1)
    bg.strokeRoundedRect(-170, -types.length * 22 - 10, 340, types.length * 44 + 20, 8)
    menu.add(bg)

    types.forEach((type, i) => {
      const by = -types.length * 22 + i * 44 + 14
      const btn = this.add.text(0, by, type.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#FFFFFF',
        backgroundColor: '#1a1a4e',
        padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#FFD700'))
      btn.on('pointerout',  () => btn.setColor('#FFFFFF'))
      btn.on('pointerdown', () => {
        this._classifications[item.id] = type.label
        dropdown.setText(type.label)
        dropdown.setColor('#44FF44')
        menu.destroy()
        this._classifyMenu = null
      })

      menu.add(btn)
    })

    this._classifyMenu = menu

    // Close on outside tap
    const shield = this.add.zone(this._cx, this._H / 2, this._W, this._H).setDepth(399).setInteractive()
    shield.on('pointerdown', () => {
      menu.destroy()
      shield.destroy()
      this._classifyMenu = null
    })
  }

  _drawAdjustedBalanceInputs() {
    const baseY = 215 + this._dataset.reconItems.length * 68 + 20

    this.add.text(this._cx, baseY, 'ADJUSTED BALANCES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#C8860A',
    }).setOrigin(0.5)

    // Bank adjusted balance
    this.add.text(20, baseY + 22, 'Adjusted Bank Balance: £', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAFF',
    })

    this._bankInput = this._makeDOMInput(baseY + 18)
    this._bankInput.placeholder = this._dataset.bankBalance.toFixed(2)

    // Ledger adjusted balance
    this.add.text(20, baseY + 58, 'Adjusted Cash Book: £', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAFFAA',
    })

    this._ledgerInput = this._makeDOMInput(baseY + 54)
    this._ledgerInput.placeholder = this._dataset.ledgerBalance.toFixed(2)
  }

  _makeDOMInput(y) {
    // Use Phaser DOM element for numeric input
    const input = this.add.dom(this._W - 80, y + 12, 'input', {
      width: '120px',
      height: '28px',
      background: '#1a1a3a',
      border: '2px solid #5555cc',
      color: '#FFFFFF',
      'font-family': '"Press Start 2P", monospace',
      'font-size': '10px',
      padding: '2px 6px',
      'text-align': 'right',
    })
    input.node.type = 'number'
    input.node.step = '0.01'
    return input.node
  }

  _drawSubmitButton() {
    this._makeButton(this._cx, 800, 280, 44, 'SUBMIT CALCULATION', 0x8b0000, 0xff4444, () => {
      this._submitRecon()
    })
  }

  _submitRecon() {
    const bankAdj = parseFloat(this._bankInput?.value || this._dataset.bankBalance)
    const ledgerAdj = parseFloat(this._ledgerInput?.value || this._dataset.ledgerBalance)

    // Tolerance: ±1
    const bankCorrect = Math.abs(bankAdj - this._dataset.adjustedBalance) <= 1
    const ledgerCorrect = Math.abs(ledgerAdj - this._dataset.adjustedBalance) <= 1

    // Count misclassifications as false positives
    this._dataset.reconItems.forEach((item) => {
      const chosen = this._classifications[item.id]
      if (chosen && chosen !== item.correctType) this._falsePositives++
    })

    const results = {
      bankAdjusted: bankAdj,
      ledgerAdjusted: ledgerAdj,
      expectedBalance: this._dataset.adjustedBalance,
      bankCorrect,
      ledgerCorrect,
      classifications: this._classifications,
    }

    if (!bankCorrect || !ledgerCorrect) {
      this._showToast(`Expected: £${this._dataset.adjustedBalance.toLocaleString('en-GB')}`, '#FF4444')
      this.time.delayedCall(2000, () => this.submitTask(results))
    } else {
      this._showToast('Balances agree! ✓', '#44FF88')
      this.time.delayedCall(1000, () => this.submitTask(results))
    }
  }
}
