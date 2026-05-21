// FraudInvestigationTask.js — Type F: Evidence board with string connections
import TaskScene from '../scenes/TaskScene.js'
import { generateFraudEvidenceDataset } from '../data/datasetEngine.js'

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class FraudInvestigationTask extends TaskScene {
  constructor() {
    super({ key: 'FraudInvestigationTask' })
    this._evidenceItems = []
    this._connections = []   // { from: idx, to: idx }
    this._drawingFrom = null // index of source evidence item
    this._stringGfx = null
    this._selectedFraudType = null
    this._selectedControl = null
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 1, data?.levelNumber ?? 5, data)
    this._fraudType = data?.fraudType ?? 'ghost_vendor'
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    // Cork board background
    this._drawCorkBoard()
    this._drawTitle()
    this._buildEvidenceItems()
    this._drawEvidenceCards()
    this._drawStringLayer()
    this._drawControlPanel()
    this.setupHint()
    this.setupNoteHiding()
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 480)

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')
  }

  _drawCorkBoard() {
    // Cork board — brown pixel art background
    const bg = this.add.graphics()
    bg.fillStyle(0x8b6914, 1)
    bg.fillRect(0, 0, this._W, this._H)

    // Cork texture — small pixel variations
    for (let x = 0; x < this._W; x += 6) {
      for (let y = 0; y < this._H; y += 6) {
        const variation = Phaser.Math.Between(-10, 10)
        const base = 0x8b6914
        const r = Math.min(255, Math.max(0, (base >> 16) + variation))
        const g = Math.min(255, Math.max(0, ((base >> 8) & 0xff) + variation))
        const b = Math.min(255, Math.max(0, (base & 0xff) + variation))
        bg.fillStyle((r << 16) | (g << 8) | b, 0.6)
        bg.fillRect(x, y, 5, 5)
      }
    }

    // Border frame
    const border = this.add.graphics()
    border.lineStyle(8, 0x5c3d0a, 1)
    border.strokeRect(4, 4, this._W - 8, this._H - 8)
    border.lineStyle(4, 0xd4a030, 0.4)
    border.strokeRect(8, 8, this._W - 16, this._H - 16)
  }

  _drawTitle() {
    const titleBg = this.add.graphics()
    titleBg.fillStyle(0x000000, 0.7)
    titleBg.fillRect(20, 12, this._W - 40, 40)

    this.add.text(this._cx, 32, '🔴 FRAUD EVIDENCE BOARD', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
  }

  _buildEvidenceItems() {
    const seed = this.worldNumber * 100 + this.levelNumber
    const dataset = generateFraudEvidenceDataset(seed, this._fraudType)
    this._evidenceData = dataset.evidence
    this._correctConnections = dataset.correctConnections
    this._fraudTypeList = dataset.fraudTypes
  }

  _drawEvidenceCards() {
    // Scatter evidence items on the board
    const positions = [
      { x: 80,  y: 130 }, { x: 240, y: 150 }, { x: 80,  y: 300 },
      { x: 280, y: 280 }, { x: 160, y: 220 }, { x: 50,  y: 430 },
      { x: 300, y: 420 }, { x: 160, y: 390 },
    ]

    this._evidenceData.forEach((ev, i) => {
      const pos = positions[i % positions.length]
      // Add slight random offset
      const x = pos.x + Phaser.Math.Between(-15, 15)
      const y = pos.y + Phaser.Math.Between(-10, 10)
      const angle = Phaser.Math.Between(-8, 8)

      const card = this._makeEvidenceCard(ev, x, y, angle, i)
      this._evidenceItems.push({ data: ev, container: card, x, y, index: i, connected: false })
    })
  }

  _makeEvidenceCard(ev, x, y, angle, index) {
    const container = this.add.container(x, y).setAngle(angle)

    // Paper/card background
    const bg = this.add.graphics()
    bg.fillStyle(0xf5f0e0, 1)
    bg.fillRoundedRect(-55, -38, 110, 76, 3)
    bg.lineStyle(2, 0xccbb88, 1)
    bg.strokeRoundedRect(-55, -38, 110, 76, 3)

    // Push pin
    const pin = this.add.circle(0, -38, 6, ev.isSuspicious ? 0xff0000 : 0x4444cc)
    pin.setStrokeStyle(1, 0x000000, 0.5)

    // Title
    const titleText = this.add.text(0, -22, ev.type, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: ev.isSuspicious ? '#cc0000' : '#333333',
      align: 'center',
      wordWrap: { width: 100 },
    }).setOrigin(0.5)

    // Content
    const contentText = this.add.text(0, 8, ev.summary, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '5px',
      color: '#555555',
      wordWrap: { width: 98 },
      align: 'center',
    }).setOrigin(0.5)

    // Amount if present
    if (ev.amount) {
      const amt = this.add.text(0, 28, `£${ev.amount.toLocaleString('en-GB')}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#8b0000',
      }).setOrigin(0.5)
      container.add(amt)
    }

    container.add([bg, pin, titleText, contentText])
    container.setSize(110, 76)
    container.setInteractive({ useHandCursor: true })

    // Tap to view detail
    container.on('pointerdown', () => {
      if (this._drawingFrom === null) {
        this._viewEvidence(ev, index)
      } else if (this._drawingFrom !== index) {
        this._completeConnection(index)
      }
    })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 })
    })
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 })
    })

    return container
  }

  _drawStringLayer() {
    this._stringGfx = this.add.graphics().setDepth(50)

    // Instructions
    const instrBg = this.add.graphics().setDepth(60)
    instrBg.fillStyle(0x000000, 0.7)
    instrBg.fillRoundedRect(10, 58, this._W - 20, 30, 4)

    this.add.text(this._cx, 73, 'Tap evidence to READ it  ·  Hold to CONNECT with red string', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#FFAAAA',
    }).setOrigin(0.5).setDepth(61)

    // Enable long-press to start connection drawing
    this.input.on('pointerdown', (ptr) => {
      this._pointerDownTime = this.time.now
      this._pointerDownX = ptr.x
      this._pointerDownY = ptr.y
    })

    this.input.on('pointerup', (ptr) => {
      const holdTime = this.time.now - (this._pointerDownTime || 0)
      const moved = Phaser.Math.Distance.Between(ptr.x, ptr.y, this._pointerDownX || 0, this._pointerDownY || 0) > 20
      if (holdTime > 400 && !moved) {
        // Long press — find nearest evidence item
        const nearest = this._findNearestEvidence(ptr.x, ptr.y)
        if (nearest !== null && this._drawingFrom === null) {
          this._startConnection(nearest)
        }
      }
    })

    this.input.on('pointermove', (ptr) => {
      if (this._drawingFrom !== null) {
        this._redrawStrings(ptr.x, ptr.y)
      }
    })
  }

  _findNearestEvidence(px, py) {
    let nearest = null
    let minDist = 80
    this._evidenceItems.forEach((ev, i) => {
      const dist = Phaser.Math.Distance.Between(px, py, ev.x, ev.y)
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    })
    return nearest
  }

  _startConnection(fromIndex) {
    this._drawingFrom = fromIndex
    const ev = this._evidenceItems[fromIndex]
    // Highlight source
    this.tweens.add({
      targets: ev.container,
      scaleX: 1.1, scaleY: 1.1,
      duration: 200,
    })
    this._showToast('Now tap another evidence item to connect!', '#FF4444')
  }

  _completeConnection(toIndex) {
    const from = this._drawingFrom
    this._drawingFrom = null

    // Reset scale
    const fromEv = this._evidenceItems[from]
    this.tweens.add({ targets: fromEv.container, scaleX: 1, scaleY: 1, duration: 150 })

    // Avoid duplicate connections
    const exists = this._connections.some(
      (c) => (c.from === from && c.to === toIndex) || (c.from === toIndex && c.to === from)
    )
    if (exists) return

    this._connections.push({ from, to: toIndex })
    this._redrawStrings()

    // Check if enough correct connections made
    const correctConns = this._connections.filter((c) => this._isConnectionCorrect(c))
    if (correctConns.length >= 3) {
      this._showFraudConfirmedButton()
    }
  }

  _isConnectionCorrect(conn) {
    return this._correctConnections?.some(
      (cc) => (cc.from === conn.from && cc.to === conn.to) || (cc.from === conn.to && cc.to === conn.from)
    ) ?? false
  }

  _redrawStrings(cursorX, cursorY) {
    this._stringGfx.clear()

    // Draw all committed connections
    this._connections.forEach((conn) => {
      const fromEv = this._evidenceItems[conn.from]
      const toEv = this._evidenceItems[conn.to]
      const correct = this._isConnectionCorrect(conn)

      this._stringGfx.lineStyle(3, correct ? 0xff0000 : 0xff8844, 0.85)
      // Slight curve using quadratic bezier
      const mx = (fromEv.x + toEv.x) / 2 + Phaser.Math.Between(-20, 20)
      const my = (fromEv.y + toEv.y) / 2 + Phaser.Math.Between(-15, 15)
      this._stringGfx.strokeTriangle(fromEv.x, fromEv.y, mx, my, toEv.x, toEv.y)
      // Simple line fallback
      this._stringGfx.lineBetween(fromEv.x, fromEv.y, toEv.x, toEv.y)

      // Thumbtack at connection point
      this._stringGfx.fillStyle(0xffdd00, 1)
      this._stringGfx.fillCircle((fromEv.x + toEv.x) / 2, (fromEv.y + toEv.y) / 2, 5)
    })

    // Draw active (in-progress) string
    if (this._drawingFrom !== null && cursorX !== undefined) {
      const fromEv = this._evidenceItems[this._drawingFrom]
      this._stringGfx.lineStyle(3, 0xff0000, 0.6)
      this._stringGfx.lineBetween(fromEv.x, fromEv.y, cursorX, cursorY)
    }
  }

  _viewEvidence(ev, index) {
    const panel = this.add.container(this._cx, this._H / 2).setDepth(300)

    const bg = this.add.graphics()
    bg.fillStyle(0xf5f0e0, 0.98)
    bg.fillRoundedRect(-165, -180, 330, 360, 8)
    bg.lineStyle(3, 0x8b6914, 1)
    bg.strokeRoundedRect(-165, -180, 330, 360, 8)

    panel.add([bg,
      this.add.text(0, -160, `📄 ${ev.type}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: ev.isSuspicious ? '#cc0000' : '#333333',
      }).setOrigin(0.5),

      this.add.text(0, -120, ev.detail || ev.summary, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#333333',
        wordWrap: { width: 300 },
        align: 'center',
      }).setOrigin(0.5),
    ])

    if (ev.amount) {
      panel.add(this.add.text(0, -40, `Amount: £${ev.amount.toLocaleString('en-GB')}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#8b0000',
      }).setOrigin(0.5))
    }

    if (ev.date) {
      panel.add(this.add.text(0, -20, `Date: ${ev.date}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#555555',
      }).setOrigin(0.5))
    }

    if (ev.isSuspicious) {
      panel.add(this.add.text(0, 20, '⚠ SUSPICIOUS — Connect to\nother evidence!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ff4444',
        align: 'center',
      }).setOrigin(0.5))
    }

    const closeBtn = this._makeButton(0, 130, 160, 40, '[CLOSE]', 0x333333, 0x888888, () => panel.destroy())
    closeBtn.setDepth(301)
    panel.add(closeBtn)

    // Hold to start connection
    const connectBtn = this._makeButton(0, 150, 160, 36, 'CONNECT ▶', 0x8b0000, 0xff4444, () => {
      panel.destroy()
      this._startConnection(index)
    })
    connectBtn.setDepth(301)
    panel.add(connectBtn)
  }

  _showFraudConfirmedButton() {
    if (this._fraudConfirmBtn) return

    const panel = this.add.container(this._cx, 560).setDepth(200)

    const glow = this.add.graphics()
    glow.fillStyle(0xff0000, 0.2)
    glow.fillRoundedRect(-155, -30, 310, 60, 8)
    panel.add(glow)

    this.tweens.add({
      targets: panel,
      scaleX: 1.05, scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    const btn = this._makeButton(0, 0, 280, 52, '🔴 FRAUD CONFIRMED — STAMP', 0x8b0000, 0xff4444, () => {
      this._showFraudTypeSelection()
    })
    btn.setDepth(201)
    panel.add(btn)

    this._fraudConfirmBtn = panel
  }

  _showFraudTypeSelection() {
    const types = this._fraudTypeList || [
      'Ghost Vendor',
      'Duplicate Payment',
      'Fictitious Employee',
      'Embezzlement',
      'Financial Statement Fraud',
    ]

    const panel = this.add.container(this._cx, this._H / 2).setDepth(400)
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.97)
    bg.fillRoundedRect(-170, -200, 340, 400, 10)
    bg.lineStyle(3, 0xff4444, 1)
    bg.strokeRoundedRect(-170, -200, 340, 400, 10)

    panel.add([bg,
      this.add.text(0, -175, 'FRAUD TYPE', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: '#FF4444',
      }).setOrigin(0.5),
      this.add.text(0, -150, 'Select the most appropriate:', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#AAAAAA',
      }).setOrigin(0.5),
    ])

    types.forEach((t, i) => {
      const ty = -120 + i * 52
      const tbtn = this.add.text(0, ty, t, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#FFFFFF',
        backgroundColor: '#1a0000',
        padding: { x: 14, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      tbtn.on('pointerover', () => tbtn.setColor('#FF4444'))
      tbtn.on('pointerout',  () => tbtn.setColor('#FFFFFF'))
      tbtn.on('pointerdown', () => {
        this._selectedFraudType = t
        panel.destroy()
        this._showControlFailure()
      })
      panel.add(tbtn)
    })
  }

  _showControlFailure() {
    const controls = [
      'Lack of segregation of duties',
      'No supplier vetting process',
      'Override of authorization controls',
      'Absent management review',
      'Inadequate IT access controls',
    ]

    const panel = this.add.container(this._cx, this._H / 2).setDepth(400)
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.97)
    bg.fillRoundedRect(-170, -200, 340, 400, 10)
    bg.lineStyle(2, 0xffaa44, 1)
    bg.strokeRoundedRect(-170, -200, 340, 400, 10)

    panel.add([bg,
      this.add.text(0, -175, 'CONTROL FAILURE', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '11px',
        color: '#FFAA44',
      }).setOrigin(0.5),
      this.add.text(0, -148, 'Which control allowed this?', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#AAAAAA',
      }).setOrigin(0.5),
    ])

    controls.forEach((c, i) => {
      const cy = -115 + i * 52
      const cbtn = this.add.text(0, cy, c, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#FFFFFF',
        backgroundColor: '#1a1a00',
        padding: { x: 12, y: 8 },
        wordWrap: { width: 280 },
        align: 'center',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      cbtn.on('pointerover', () => cbtn.setColor('#FFAA44'))
      cbtn.on('pointerout',  () => cbtn.setColor('#FFFFFF'))
      cbtn.on('pointerdown', () => {
        this._selectedControl = c
        panel.destroy()
        this._fraudDetected = true

        // Transition to AuditFindingTask
        this.time.delayedCall(500, () => {
          this.scene.start('AuditFindingTask', {
            worldNumber: this.worldNumber,
            levelNumber: this.levelNumber,
            fraudType: this._selectedFraudType,
            controlFailure: this._selectedControl,
            scenario: `Fraud type: ${this._selectedFraudType}\nControl failure: ${this._selectedControl}\n${this.levelData?.description || ''}`,
          })
        })
      })
      panel.add(cbtn)
    })
  }

  _drawControlPanel() {
    // Bottom panel with instructions and tools
    const bg = this.add.graphics().setDepth(150)
    bg.fillStyle(0x000000, 0.7)
    bg.fillRect(0, this._H - 80, this._W, 80)

    this.add.text(this._cx, this._H - 62, 'Evidence Connected: 0/3 needed', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
    }).setOrigin(0.5).setDepth(151)

    this._connectionCountText = this.add.text(this._cx, this._H - 40, '● ○ ○  connections needed', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FF4444',
    }).setOrigin(0.5).setDepth(151)

    // Update connection count on timer
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        const correct = this._connections.filter((c) => this._isConnectionCorrect(c)).length
        const dots = ['○', '○', '○'].map((d, i) => i < correct ? '●' : '○').join(' ')
        this._connectionCountText.setText(`${dots}  correct connections`)
        this._connectionCountText.setColor(correct >= 3 ? '#44FF44' : '#FF4444')
      },
    })
  }
}
