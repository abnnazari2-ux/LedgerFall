// TutorialScene.js — Full interactive tutorial

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TutorialScene' })
    this._phase = 'cutscene' // cutscene | hudTour | stampPractice | dragPractice | hintDemo | miniFraud | victory
    this._panelIndex = 0
    this._stampsCorrect = 0
    this._dragsCorrect = 0
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this._drawBackground()
    this._launchCutscene()
  }

  // ── Phase: Cutscene ───────────────────────────────────────────────────────
  _launchCutscene() {
    this._phase = 'cutscene'
    this._panelIndex = 0
    this._showPanel(0)
  }

  _cutscenePanels = [
    {
      bg: 0x0a1a0a,
      charKey: 'male_idle',
      text: [
        'Day 1 at BDK & Associates.',
        'You are the new audit',
        'trainee. Your manager',
        'has a mission for you.',
      ],
    },
    {
      bg: 0x0a0a1a,
      charKey: 'auditor_working',
      text: [
        '"Welcome! Auditing means',
        'we check the numbers.',
        'Your job: find errors',
        'and fraud. Ready?"',
      ],
    },
    {
      bg: 0x1a0a0a,
      charKey: 'auditor_shocked',
      text: [
        '"We need evidence,',
        'professional scepticism,',
        'and a sharp eye.',
        'Let\'s begin!"',
      ],
    },
  ]

  _showPanel(index) {
    if (this._currentPanel) this._currentPanel.destroy()

    const panel = this._cutscenePanels[index]
    if (!panel) {
      this._launchHUDTour()
      return
    }

    const container = this.add.container(0, 0)
    this._currentPanel = container

    // Panel background
    const bg = this.add.graphics()
    bg.fillStyle(panel.bg, 1)
    bg.fillRect(0, 0, this._W, this._H)
    container.add(bg)

    // Panel border (comic style)
    const border = this.add.graphics()
    border.lineStyle(4, 0xc8860a, 1)
    border.strokeRect(10, 10, this._W - 20, this._H - 20)
    container.add(border)

    // Character
    if (hasAsset(panel.charKey)) {
      const char = this.add.image(this._cx, 380, panel.charKey).setDisplaySize(160, 220)
      container.add(char)
    } else {
      const char = this.add.graphics()
      char.fillStyle(0x446688, 1)
      char.fillRect(this._cx - 50, 280, 100, 180)
      char.fillStyle(0xf4a460, 1)
      char.fillCircle(this._cx, 270, 40)
      container.add(char)
    }

    // Speech bubble
    const bubbleBg = this.add.graphics()
    bubbleBg.fillStyle(0xffffff, 0.95)
    bubbleBg.fillRoundedRect(20, 560, this._W - 40, 180, 12)
    bubbleBg.lineStyle(3, 0x000000, 1)
    bubbleBg.strokeRoundedRect(20, 560, this._W - 40, 180, 12)
    // Bubble tail
    bubbleBg.fillTriangle(100, 620, 80, 560, 140, 560)
    container.add(bubbleBg)

    panel.text.forEach((line, i) => {
      const t = this.add.text(this._cx, 590 + i * 28, line, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#222222',
        align: 'center',
      }).setOrigin(0.5)
      container.add(t)
    })

    // Panel counter
    const counter = this.add.text(this._cx, 760, `${index + 1} / ${this._cutscenePanels.length}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5)
    container.add(counter)

    // Next button
    const nextLabel = index < this._cutscenePanels.length - 1 ? 'NEXT ▶' : 'START TUTORIAL'
    const nextBtn = this._makeButton(this._cx, 800, 200, 40, nextLabel, 0x8b0000, 0xff4444, () => {
      this._panelIndex++
      this._showPanel(this._panelIndex)
    })
    container.add(nextBtn)
  }

  // ── Phase: HUD Tour ───────────────────────────────────────────────────────
  _launchHUDTour() {
    this._phase = 'hudTour'
    if (this._currentPanel) { this._currentPanel.destroy(); this._currentPanel = null }

    this._drawBackground()

    this.add.text(this._cx, 100, 'HUD TOUR', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#C8860A',
    }).setOrigin(0.5)

    const elements = [
      { x: 36,  y: 35,  label: 'Your\nPortrait',  arrowDir: 'right'  },
      { x: 100, y: 35,  label: 'Lives\n(Coffee!)', arrowDir: 'down'   },
      { x: 165, y: 35,  label: 'Focus\nBar',       arrowDir: 'down'   },
      { x: 260, y: 30,  label: 'Coins',            arrowDir: 'down'   },
      { x: 315, y: 35,  label: 'Timer',            arrowDir: 'down'   },
    ]

    elements.forEach(({ x, y, label, arrowDir }, i) => {
      this.time.delayedCall(i * 600, () => {
        this._drawArrowAndLabel(x, y + 80, label, 0xffdd00)
      })
    })

    this.add.text(this._cx, 400, 'These are your tools.\nUse hints wisely — they cost Focus!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#DDDDDD',
      align: 'center',
      wordWrap: { width: 330 },
    }).setOrigin(0.5)

    this._makeButton(this._cx, 520, 240, 48, 'GOT IT! ▶', 0x006600, 0x44ff44, () => {
      this._launchStampPractice()
    })
  }

  _drawArrowAndLabel(x, y, label, color) {
    const arrow = this.add.graphics()
    arrow.fillStyle(color, 0.9)
    arrow.fillTriangle(x, y - 20, x - 10, y - 5, x + 10, y - 5)
    arrow.fillRect(x - 4, y - 5, 8, 20)

    this.tweens.add({
      targets: arrow,
      y: '+= 6',
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    this.add.text(x, y + 8, label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#' + color.toString(16).padStart(6, '0'),
      align: 'center',
    }).setOrigin(0.5)
  }

  // ── Phase: Stamp Practice ─────────────────────────────────────────────────
  _launchStampPractice() {
    this._phase = 'stampPractice'
    this._stampsCorrect = 0
    this.children.removeAll(true)
    this._drawBackground()

    this.add.text(this._cx, 90, 'STAMP PRACTICE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#C8860A',
    }).setOrigin(0.5)

    this.add.text(this._cx, 120, 'Tap each invoice and stamp it.\nNo timer. Take your time!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
      align: 'center',
    }).setOrigin(0.5)

    const pairs = [
      { inv: 'INV-001', grn: 'GRN-001', match: true,  correct: 'AGREED' },
      { inv: 'INV-002', grn: 'GRN-003', match: false, correct: 'EXCEPTION' },
      { inv: 'INV-003', grn: null,       match: false, correct: 'EXCEPTION' },
      { inv: 'INV-004', grn: 'GRN-004', match: true,  correct: 'AGREED' },
      { inv: 'INV-005', grn: 'GRN-999', match: false, correct: 'FRAUD RISK' },
    ]

    this._practiceItems = []
    pairs.forEach((pair, i) => {
      const y = 200 + i * 100
      this._drawPracticeCard(pair, i, 195, y)
    })
  }

  _drawPracticeCard(pair, index, x, y) {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a3a, 0.9)
    bg.fillRoundedRect(-160, -36, 320, 72, 6)
    bg.lineStyle(2, 0x555588, 1)
    bg.strokeRoundedRect(-160, -36, 320, 72, 6)

    const invText = this.add.text(-130, -12, `Invoice: ${pair.inv}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FFFFFF',
    })

    const grnText = this.add.text(-130, 8, `GRN: ${pair.grn || 'NOT FOUND'}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: pair.grn ? '#AAAAFF' : '#FF4444',
    })

    const stampBtn = this.add.text(100, 0, '[STAMP]', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FFDD00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    stampBtn.on('pointerdown', () => {
      if (container._stamped) return
      this._showTutorialStampMenu(pair, container, x, y)
    })

    container.add([bg, invText, grnText, stampBtn])
    container._pair = pair
    this._practiceItems.push(container)
  }

  _showTutorialStampMenu(pair, container, x, y) {
    const opts = ['AGREED', 'EXCEPTION', 'FRAUD RISK', 'SKIP']
    const colors = [0x006600, 0x884400, 0x880000, 0x333333]

    const menu = this.add.container(x, y - 40).setDepth(400)
    opts.forEach((opt, i) => {
      const bx = (i - 1.5) * 90
      const bg = this.add.graphics()
      bg.fillStyle(colors[i], 0.9)
      bg.fillRoundedRect(bx - 38, -18, 76, 36, 5)
      const t = this.add.text(bx, 0, opt, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#FFFFFF',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      t.on('pointerdown', () => {
        menu.destroy()
        container._stamped = true

        const correct = opt === pair.correct
        const feedColor = correct ? '#44FF44' : '#FF4444'
        const feedback = correct ? '✓ CORRECT!' : `✗ Should be: ${pair.correct}`

        this.add.text(x, y + 40, feedback, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: feedColor,
        }).setOrigin(0.5)

        if (correct) this._stampsCorrect++

        const allDone = this._practiceItems.every((c) => c._stamped)
        if (allDone) {
          this.time.delayedCall(1200, () => this._launchDragPractice())
        }
      })

      menu.add([bg, t])
    })
  }

  // ── Phase: Drag Practice ──────────────────────────────────────────────────
  _launchDragPractice() {
    this._phase = 'dragPractice'
    this._dragsCorrect = 0
    this.children.removeAll(true)
    this._drawBackground()

    this.add.text(this._cx, 90, 'DRAG & MATCH', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#C8860A',
    }).setOrigin(0.5)

    this.add.text(this._cx, 120, 'Drag each invoice to its matching GRN!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
      align: 'center',
    }).setOrigin(0.5)

    const matches = [
      { inv: 'INV-101 £500', grn: 'GRN-101', id: 1 },
      { inv: 'INV-102 £1,200', grn: 'GRN-102', id: 2 },
      { inv: 'INV-103 £750', grn: 'GRN-103', id: 3 },
    ]

    this._dragTargets = []
    this._dragSources = []

    // GRN targets on right
    matches.forEach((m, i) => {
      const y = 220 + i * 130
      const target = this._makeDragTarget(m.grn, 285, y, m.id)
      this._dragTargets.push(target)
    })

    // Invoice sources on left (shuffled order)
    const shuffled = [...matches].sort(() => Math.random() - 0.5)
    shuffled.forEach((m, i) => {
      const y = 220 + i * 130
      const src = this._makeDragSource(m.inv, 105, y, m.id)
      this._dragSources.push(src)
    })
  }

  _makeDragTarget(label, x, y, id) {
    const zone = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(0x003300, 0.7)
    bg.fillRoundedRect(-75, -35, 150, 70, 6)
    bg.lineStyle(2, 0x00ff88, 0.6)
    bg.strokeRoundedRect(-75, -35, 150, 70, 6)

    const t = this.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#44FF88',
    }).setOrigin(0.5)

    zone.add([bg, t])
    zone._id = id
    zone._occupied = false
    return zone
  }

  _makeDragSource(label, x, y, id) {
    const card = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a3a, 0.9)
    bg.fillRoundedRect(-70, -32, 140, 64, 6)
    bg.lineStyle(2, 0x8888cc, 1)
    bg.strokeRoundedRect(-70, -32, 140, 64, 6)

    const t = this.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FFFFFF',
      wordWrap: { width: 120 },
      align: 'center',
    }).setOrigin(0.5)

    card.add([bg, t])
    card.setSize(140, 64)
    card.setInteractive({ draggable: true, useHandCursor: true })
    card._id = id
    card._origX = x
    card._origY = y
    card._matched = false

    this.input.setDraggable(card)

    card.on('drag', (_ptr, dx, dy) => {
      card.x = dx
      card.y = dy
    })

    card.on('dragend', () => {
      if (card._matched) return
      // Check overlap with targets
      let dropped = false
      for (const target of this._dragTargets) {
        if (target._occupied) continue
        const dist = Phaser.Math.Distance.Between(card.x, card.y, target.x, target.y)
        if (dist < 80) {
          if (target._id === card._id) {
            // Correct match
            card._matched = true
            target._occupied = true
            card.setPosition(target.x, target.y)
            this._showTutorialFeedback(target.x, target.y, true)
            this._dragsCorrect++
            dropped = true
          } else {
            // Wrong match — shake back
            this._showTutorialFeedback(card.x, card.y, false)
            this.tweens.add({
              targets: card,
              x: card._origX,
              y: card._origY,
              duration: 300,
              ease: 'Back.easeOut',
            })
            dropped = true
          }
          break
        }
      }
      if (!dropped) {
        this.tweens.add({
          targets: card,
          x: card._origX,
          y: card._origY,
          duration: 300,
          ease: 'Back.easeOut',
        })
      }
      const allMatched = this._dragSources.every((s) => s._matched)
      if (allMatched) {
        this.time.delayedCall(1000, () => this._launchHintDemo())
      }
    })

    return card
  }

  _showTutorialFeedback(x, y, correct) {
    const text = this.add.text(x, y - 50, correct ? '✓ MATCH!' : '✗ WRONG!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: correct ? '#44FF44' : '#FF4444',
    }).setOrigin(0.5).setDepth(500)

    this.tweens.add({
      targets: text,
      y: y - 90,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy(),
    })
  }

  // ── Phase: Hint Demo ──────────────────────────────────────────────────────
  _launchHintDemo() {
    this._phase = 'hintDemo'
    this.children.removeAll(true)
    this._drawBackground()

    this.add.text(this._cx, 90, 'USING HINTS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#C8860A',
    }).setOrigin(0.5)

    // Focus bar visual
    this.add.text(this._cx, 150, 'Your Focus Bar:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    this._tutFocusSegments = []
    for (let i = 0; i < 5; i++) {
      const seg = this.add.rectangle(110 + i * 36, 185, 28, 30, 0x44aaff, 1)
      this.add.text(110 + i * 36, 185, String(i + 1), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#000000',
      }).setOrigin(0.5)
      this._tutFocusSegments.push(seg)
    }

    this.add.text(this._cx, 230, 'Each hint costs 1 Focus.\nYou start each level with 5 Focus.\nFocus refills between levels.', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#DDDDDD',
      align: 'center',
      wordWrap: { width: 330 },
    }).setOrigin(0.5)

    // Animated mentor character
    if (hasAsset('auditor_working')) {
      this.add.image(this._cx, 420, 'auditor_working').setDisplaySize(120, 160)
    }

    this.add.text(this._cx, 510, '"Use hints wisely —\nthey reduce your final score!"', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#FFDD00',
      align: 'center',
      backgroundColor: '#0000008A',
      padding: { x: 10, y: 8 },
    }).setOrigin(0.5)

    // Demo: use hint button
    let demoFocus = 5
    const useHintBtn = this._makeButton(this._cx, 620, 200, 44, 'USE A HINT', 0x1a1a4e, 0x5555cc, () => {
      if (demoFocus <= 0) return
      demoFocus--
      this._tutFocusSegments[demoFocus].setFillStyle(0x222244, 0.3)
    })

    this._makeButton(this._cx, 700, 200, 44, 'NEXT ▶', 0x006600, 0x44ff44, () => {
      this._launchMiniFraud()
    })
  }

  // ── Phase: Mini Fraud ─────────────────────────────────────────────────────
  _launchMiniFraud() {
    this._phase = 'miniFraud'
    this.children.removeAll(true)
    this._drawBackground()

    this.add.text(this._cx, 80, 'FRAUD DETECTION', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#FF4444',
    }).setOrigin(0.5)

    this.add.text(this._cx, 115, 'Something is WRONG with this invoice.\nFind it and stamp FRAUD RISK!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FFAAAA',
      align: 'center',
      wordWrap: { width: 340 },
    }).setOrigin(0.5)

    // Suspicious invoice card
    const inv = this.add.container(this._cx, 330)
    const bg = this.add.graphics()
    bg.fillStyle(0x2a1a1a, 0.95)
    bg.fillRoundedRect(-155, -110, 310, 220, 8)
    bg.lineStyle(3, 0x884444, 1)
    bg.strokeRoundedRect(-155, -110, 310, 220, 8)

    const lines = [
      { text: 'SUPPLIER: Sunshine Theme Parks Ltd', color: '#FFFFFF' },
      { text: 'INVOICE: INV-TUT-001', color: '#AAAAAA' },
      { text: 'DATE: 31/03/2024', color: '#AAAAAA' },
      { text: 'AMOUNT: £45,000.00', color: '#FFD700' },
      { text: 'DELIVERY: Alton Towers Resort', color: '#FF4444' },
      { text: 'DESCRIPTION: IT Consulting Services', color: '#AAAAAA' },
    ]

    lines.forEach((line, i) => {
      const t = this.add.text(-140, -85 + i * 28, line.text, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: line.color,
      })
      inv.add(t)
    })

    inv.add(bg)
    // Bring bg behind text — reorder (add bg first in list)
    inv.sendToBack(bg)

    inv.setSize(310, 220)
    inv.setInteractive({ useHandCursor: true })
    inv.on('pointerdown', () => {
      this._showTutFraudStampMenu(inv)
    })

    this.add.text(this._cx, 460, '⚠ Tap the invoice to stamp it', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FFDD00',
    }).setOrigin(0.5)

    this._fraudInv = inv
  }

  _showTutFraudStampMenu(inv) {
    const menu = this.add.container(this._cx, 580).setDepth(400)
    const options = [
      { label: 'AGREED',     color: 0x006600 },
      { label: 'EXCEPTION',  color: 0x884400 },
      { label: 'FRAUD RISK', color: 0x880000 },
    ]
    options.forEach((opt, i) => {
      const bx = (i - 1) * 120
      const bg = this.add.graphics()
      bg.fillStyle(opt.color, 0.9)
      bg.fillRoundedRect(bx - 50, -22, 100, 44, 6)
      const t = this.add.text(bx, 0, opt.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#FFFFFF',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      t.on('pointerdown', () => {
        menu.destroy()
        if (opt.label === 'FRAUD RISK') {
          this._onFraudCorrect()
        } else {
          this.add.text(this._cx, 660, '✗ Hint: The delivery address is a theme park!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#FF4444',
            align: 'center',
            wordWrap: { width: 340 },
          }).setOrigin(0.5)
        }
      })
      menu.add([bg, t])
    })
  }

  _onFraudCorrect() {
    this.add.text(this._cx, 490, '✓ CORRECT! Delivery to a theme park is suspicious!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#44FF44',
      align: 'center',
      wordWrap: { width: 340 },
    }).setOrigin(0.5)

    // Red fraud stamp overlay
    const stamp = this.add.text(this._cx, 330, 'FRAUD\nRISK', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#FF0000',
      stroke: '#880000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setAngle(-20).setAlpha(0)

    this.tweens.add({
      targets: stamp,
      alpha: 0.9,
      scaleX: { from: 2, to: 1 },
      scaleY: { from: 2, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
    })

    this.time.delayedCall(2000, () => this._launchVictory())
  }

  // ── Phase: Victory ────────────────────────────────────────────────────────
  _launchVictory() {
    this._phase = 'victory'
    this.children.removeAll(true)
    this._drawBackground()

    // Fireworks bg
    const gfx = this.add.graphics()
    for (let i = 0; i < 20; i++) {
      gfx.fillStyle(Phaser.Math.RND.pick([0xffd700, 0xff4444, 0x44ff88, 0x4488ff]), 0.7)
      gfx.fillRect(
        Phaser.Math.Between(0, 390),
        Phaser.Math.Between(0, 400),
        Phaser.Math.Between(3, 8),
        Phaser.Math.Between(3, 8)
      )
    }

    this.add.text(this._cx, 140, 'TUTORIAL COMPLETE!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(this._cx, 220, '+ 50 XP', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#44FF88',
    }).setOrigin(0.5)

    this.add.text(this._cx, 270, '+ 3 Coins', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#FFD700',
    }).setOrigin(0.5)

    // Badge
    if (hasAsset('badge_caffeine')) {
      this.add.image(this._cx, 380, 'badge_caffeine').setDisplaySize(80, 80)
    }

    this.add.text(this._cx, 440, '"First Day on the Job"', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    this.add.text(this._cx, 470, 'Badge Unlocked!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FFD700',
    }).setOrigin(0.5)

    // Update XP and coins in store
    const currentXP = parseInt(localStorage.getItem('lf_xp') || '0', 10) + 50
    const currentCoins = parseInt(localStorage.getItem('lf_coins') || '0', 10) + 3
    localStorage.setItem('lf_xp', String(currentXP))
    localStorage.setItem('lf_coins', String(currentCoins))
    this.game.events.emit('xpChanged', { xp: currentXP })
    this.game.events.emit('coinsChanged', { coins: currentCoins })

    this._makeButton(this._cx, 600, 260, 52, 'ENTER WORLD 1 ▶', 0x8b0000, 0xff4444, () => {
      this.scene.start('WorldMapScene')
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _drawBackground() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0d0d2b, 1)
    bg.fillRect(0, 0, this._W, this._H)
    // Subtle dot pattern
    for (let i = 0; i < 40; i++) {
      bg.fillStyle(0xffffff, 0.03)
      bg.fillRect(
        Phaser.Math.Between(0, this._W),
        Phaser.Math.Between(0, this._H),
        2, 2
      )
    }
  }

  _makeButton(x, y, w, h, label, fillColor, borderColor, callback) {
    const container = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(fillColor, 0.92)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6)
    bg.lineStyle(2, borderColor, 1)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })
    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.96, scaleY: 0.96,
        duration: 60, yoyo: true,
        onComplete: callback,
      })
    })
    return container
  }
}
