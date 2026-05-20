// FindDuplicatesTask.js — Type B: Tap to stamp duplicate invoice detection
import TaskScene from '../scenes/TaskScene.js'
import { generateDuplicateInvoiceDataset } from '../data/datasetEngine.js'

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class FindDuplicatesTask extends TaskScene {
  constructor() {
    super({ key: 'FindDuplicatesTask' })
    this._rows = []
    this._stamped = {}   // invoiceId -> stamp type
    this._scrollY = 0
    this._maxScrollY = 0
    this._isDraggingScroll = false
    this._lastScrollY = 0
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 2, data?.levelNumber ?? 1, data)
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this.setupBackground(this.worldNumber)
    this._buildDataset()
    this._drawHeader()
    this._drawScrollableList()
    this._drawSubmitButton()
    this.setupHint()
    this.setupNoteHiding()
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 300)

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')
  }

  _buildDataset() {
    const seed = this.worldNumber * 100 + this.levelNumber
    this._dataset = generateDuplicateInvoiceDataset(seed, 20)
    this._rows = this._dataset.invoices
    this._maxScrollY = Math.max(0, this._rows.length * 72 - 580)
  }

  _drawHeader() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.92)
    bg.fillRect(0, 0, this._W, 100)

    this.add.text(this._cx, 18, this.levelData?.levelName ?? 'Find the Duplicates', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.add.text(this._cx, 42, 'Tap any invoice to stamp it', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    // Column headers
    const cols = ['INV #', 'SUPPLIER', 'AMOUNT', 'DATE', 'STAMP']
    const xs   = [30, 110, 220, 300, 360]
    cols.forEach((col, i) => {
      this.add.text(xs[i], 75, col, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#888888',
      }).setOrigin(0, 0.5)
    })

    // Separator
    const sep = this.add.graphics()
    sep.lineStyle(1, 0x333366, 0.8)
    sep.lineBetween(10, 90, this._W - 10, 90)
  }

  _drawScrollableList() {
    // Mask for scroll area
    const maskGraphics = this.add.graphics()
    maskGraphics.fillRect(0, 100, this._W, 680)
    const mask = maskGraphics.createGeometryMask()

    this._listContainer = this.add.container(0, 100)
    this._listContainer.setMask(mask)

    this._rows.forEach((inv, i) => {
      const rowY = i * 72
      this._drawRow(inv, i, rowY)
    })

    // Touch scroll
    this.input.on('pointerdown', (ptr) => {
      if (ptr.y < 100 || ptr.y > 780) return
      this._isDraggingScroll = true
      this._lastScrollY = ptr.y
    })

    this.input.on('pointermove', (ptr) => {
      if (!this._isDraggingScroll) return
      const delta = ptr.y - this._lastScrollY
      this._lastScrollY = ptr.y
      this._scrollY = Phaser.Math.Clamp(this._scrollY - delta, 0, this._maxScrollY)
      this._listContainer.y = 100 - this._scrollY
    })

    this.input.on('pointerup', () => { this._isDraggingScroll = false })
  }

  _drawRow(inv, index, y) {
    const container = this.add.container(0, y)
    this._listContainer.add(container)

    const evenRow = index % 2 === 0
    const bg = this.add.graphics()
    bg.fillStyle(evenRow ? 0x0d0d22 : 0x111133, 0.9)
    bg.fillRect(0, 0, this._W, 68)
    container.add(bg)

    // Invoice fields
    const fields = [
      { x: 8,   text: inv.number,                       color: '#FFFFFF', size: '7px' },
      { x: 88,  text: (inv.supplier || '').substring(0, 14), color: '#DDDDDD', size: '6px' },
      { x: 196, text: `£${(inv.amount || 0).toLocaleString('en-GB')}`, color: '#FFD700', size: '7px' },
      { x: 278, text: inv.date || '',                   color: '#AAAAAA', size: '6px' },
    ]

    fields.forEach(({ x, text, color, size }) => {
      container.add(this.add.text(x, 22, text, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: size,
        color,
      }))
    })

    // Fraud signals — highlight suspicious fields
    if (inv.isDuplicate) {
      const dup = this.add.text(8, 42, 'Similar to: ' + (inv.duplicateOf || '?'), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#FF4444',
        alpha: 0.5, // Subtly visible if player looks closely
      })
      container.add(dup)
    }

    // Stamp area / button
    const stampBtn = this.add.text(348, 34, this._stamped[inv.id] ? '✓' : '[TAP]', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: this._stamped[inv.id] ? '#44FF44' : '#FFDD00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    container.add(stampBtn)
    container._inv = inv
    container._stampBtn = stampBtn

    // Tap row to open stamp menu
    container.setSize(this._W, 68)
    container.setInteractive({ useHandCursor: true })
    container.on('pointerdown', (ptr) => {
      if (this._isDraggingScroll) return
      const worldY = ptr.y
      const approxScreenY = Phaser.Math.Clamp(worldY, 200, 650)
      this.showStampMenu(
        { sprite: container, id: inv.id, onStamp: (type) => this._onRowStamped(inv, container, stampBtn, type) },
        this._cx,
        approxScreenY
      )
    })

    // Override stamp callback
    const origApply = this.applyStamp.bind(this)
    container._applyStamp = (type) => {
      this._onRowStamped(inv, container, stampBtn, type)
    }
  }

  _onRowStamped(inv, container, stampBtn, stampType) {
    this._stamped[inv.id] = stampType
    stampBtn.setText(stampType.substring(0, 3))
    stampBtn.setColor(stampType === 'FRAUD RISK' ? '#FF4444' : stampType === 'AGREED' ? '#44FF44' : '#FFAA44')

    // Visual highlight on row
    const hl = this.add.graphics()
    hl.lineStyle(2, stampType === 'FRAUD RISK' ? 0xff0000 : stampType === 'AGREED' ? 0x00ff88 : 0xffaa44, 0.6)
    hl.strokeRect(0, container.y + this._listContainer.y - 100 - 2, this._W, 72)
    this.time.delayedCall(600, () => hl.destroy())
  }

  _drawSubmitButton() {
    this._makeButton(this._cx, 800, 280, 40, 'SUBMIT FINDINGS', 0x8b0000, 0xff4444, () => {
      this._submitDuplicateTask()
    })
  }

  _submitDuplicateTask() {
    const results = []
    let fraudFound = false

    this._rows.forEach((inv) => {
      const stamp = this._stamped[inv.id] || 'SKIP'
      const correct = (inv.isDuplicate && stamp === 'EXCEPTION') || (!inv.isDuplicate && stamp === 'AGREED') || (inv.isFraud && stamp === 'FRAUD RISK')
      const fp = (!inv.isDuplicate && stamp === 'EXCEPTION') || (!inv.isFraud && stamp === 'FRAUD RISK')

      if (fp) this._falsePositives++
      if (inv.isFraud && stamp === 'FRAUD RISK') fraudFound = true

      results.push({ id: inv.id, stamp, correct })
    })

    this._fraudDetected = fraudFound
    this.submitTask({ stamps: results })
  }
}
