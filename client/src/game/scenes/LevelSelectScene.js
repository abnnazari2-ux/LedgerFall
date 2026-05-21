// LevelSelectScene.js — Level selection for a chosen world
import { WORLDS_DATA } from '../data/worldsData.js'

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

const TASK_SCENE_MAP = {
  InvoiceMatchTask:      'InvoiceMatchTask',
  FindDuplicatesTask:    'FindDuplicatesTask',
  MultipleChoiceTask:    'MultipleChoiceTask',
  BankReconciliationTask:'BankReconciliationTask',
  AuditFindingTask:      'AuditFindingTask',
  CutOffTestTask:        'CutOffTestTask',
  FraudInvestigationTask:'FraudInvestigationTask',
  FullAuditTask:         'FullAuditTask',
  DragDropTask:          'DragDropTask',
}

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' })
  }

  init(data) {
    this._worldNumber = data?.worldNumber ?? 1
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this._worldData = WORLDS_DATA.find((w) => w.worldNumber === this._worldNumber)
    if (!this._worldData) {
      console.error('[LevelSelectScene] World not found:', this._worldNumber)
      this.scene.start('WorldMapScene')
      return
    }

    this._completedLevels = this._getCompletedLevels()
    this._levelStars = this._getLevelStars()

    this._drawBackground()
    this._drawHeader()
    this._drawLevelCards()
    this._drawBackButton()
  }

  _getCompletedLevels() {
    try {
      const key = `lf_completed_w${this._worldNumber}`
      return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
      return []
    }
  }

  _getLevelStars() {
    try {
      const key = `lf_stars_w${this._worldNumber}`
      return JSON.parse(localStorage.getItem(key) || '{}')
    } catch {
      return {}
    }
  }

  _drawBackground() {
    const bgKey = this._worldData.backgroundKey
    if (hasAsset(bgKey)) {
      const bg = this.add.image(this._cx, this._H / 2, bgKey)
      bg.setDisplaySize(this._W, this._H)
      // Overlay for readability
      this.add.rectangle(this._cx, this._H / 2, this._W, this._H, 0x000000, 0.55)
    } else {
      const bg = this.add.graphics()
      bg.fillStyle(0x0d0d2b, 1)
      bg.fillRect(0, 0, this._W, this._H)
    }
  }

  _drawHeader() {
    // World color banner
    const themeHex = parseInt(this._worldData.themeColor.replace('#', ''), 16)
    const banner = this.add.graphics()
    banner.fillStyle(0x000000, 0.7)
    banner.fillRect(0, 0, this._W, 110)
    banner.lineStyle(3, themeHex, 1)
    banner.lineBetween(0, 110, this._W, 110)

    this.add.text(this._cx, 30, `WORLD ${this._worldNumber}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: this._worldData.themeColor,
    }).setOrigin(0.5)

    this.add.text(this._cx, 60, this._worldData.worldName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(this._cx, 88, 'Select a Level', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
    }).setOrigin(0.5)
  }

  _drawLevelCards() {
    const levels = this._worldData.levels || []

    // Arc layout: 5 cards
    const arcPositions = [
      { x: 195, y: 200 },
      { x: 80,  y: 330 },
      { x: 195, y: 420 },
      { x: 310, y: 330 },
      { x: 195, y: 560 },
    ]

    // Draw connecting lines
    const pathGfx = this.add.graphics()
    for (let i = 0; i < arcPositions.length - 1; i++) {
      const a = arcPositions[i]
      const b = arcPositions[i + 1]
      const unlocked = i + 2 <= this._getMaxUnlockedLevel()
      pathGfx.lineStyle(3, unlocked ? 0xc8860a : 0x444444, 0.5)
      pathGfx.lineBetween(a.x, a.y, b.x, b.y)
    }

    levels.forEach((level, i) => {
      const pos = arcPositions[i] || { x: this._cx, y: 200 + i * 130 }
      const isBoss = level.levelNumber === 5
      const unlocked = this._isLevelUnlocked(level.levelNumber)
      const completed = this._completedLevels.includes(level.levelNumber)
      const stars = this._levelStars[level.levelNumber] || 0

      this._drawLevelCard(level, pos.x, pos.y, isBoss, unlocked, completed, stars)
    })
  }

  _getMaxUnlockedLevel() {
    if (this._completedLevels.length === 0) return 1
    return Math.min(5, Math.max(...this._completedLevels) + 1)
  }

  _isLevelUnlocked(levelNum) {
    if (levelNum === 1) return true
    return this._completedLevels.includes(levelNum - 1)
  }

  _drawLevelCard(level, x, y, isBoss, unlocked, completed, stars) {
    const container = this.add.container(x, y)
    const cardW = 160
    const cardH = 90

    // Boss glow
    if (isBoss && unlocked) {
      const bossGlow = this.add.graphics()
      bossGlow.fillStyle(0xff0000, 0.15)
      bossGlow.fillCircle(0, 0, 58)
      container.add(bossGlow)
      this.tweens.add({
        targets: bossGlow,
        scaleX: 1.3, scaleY: 1.3,
        alpha: 0,
        duration: 1000,
        repeat: -1,
        ease: 'Sine.easeOut',
      })
    }

    // Card background
    const bg = this.add.graphics()
    if (!unlocked) {
      bg.fillStyle(0x222222, 0.85)
      bg.lineStyle(2, 0x444444, 1)
    } else if (isBoss) {
      bg.fillStyle(0x3a0a0a, 0.95)
      bg.lineStyle(3, 0xff4444, 1)
    } else if (completed) {
      bg.fillStyle(0x0a2a0a, 0.95)
      bg.lineStyle(2, 0x44ff44, 0.8)
    } else {
      bg.fillStyle(0x1a1a3a, 0.95)
      bg.lineStyle(2, 0x8888cc, 0.8)
    }
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8)
    bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8)
    container.add(bg)

    // Level number
    const levelColor = !unlocked ? '#555555' : isBoss ? '#FF4444' : '#FFFFFF'
    container.add(this.add.text(0, -28, `LEVEL ${level.levelNumber}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: levelColor,
    }).setOrigin(0.5))

    // Level name
    container.add(this.add.text(0, -4, level.levelName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: unlocked ? '#DDDDDD' : '#555555',
      wordWrap: { width: 145 },
      align: 'center',
    }).setOrigin(0.5))

    // Stars
    for (let s = 0; s < 3; s++) {
      container.add(this.add.text(-22 + s * 22, 22, s < stars ? '⭐' : '☆', {
        fontSize: '11px',
        color: '#FFD700',
      }).setOrigin(0.5))
    }

    // Padlock or boss icon
    if (!unlocked) {
      container.add(this.add.text(60, -38, '🔒', { fontSize: '14px' }).setOrigin(0.5))
    } else if (isBoss) {
      container.add(this.add.text(60, -38, '👿', { fontSize: '14px' }).setOrigin(0.5))
    } else if (completed) {
      container.add(this.add.text(60, -38, '✅', { fontSize: '14px' }).setOrigin(0.5))
    }

    // Interaction
    if (unlocked) {
      container.setSize(cardW, cardH)
      container.setInteractive({ useHandCursor: true })

      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 100 })
        this._showLevelTooltip(level, x, y - cardH / 2 - 10)
      })
      container.on('pointerout', () => {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 })
        if (this._tooltip) { this._tooltip.destroy(); this._tooltip = null }
      })
      container.on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scaleX: 0.95, scaleY: 0.95,
          duration: 80, yoyo: true,
          onComplete: () => this._startLevel(level),
        })
      })
    }
  }

  _showLevelTooltip(level, x, y) {
    if (this._tooltip) this._tooltip.destroy()

    const tooltip = this.add.container(x, y).setDepth(300)
    const lines = [
      level.levelName,
      level.description?.substring(0, 50) + '…' || '',
      `Time: ${Math.floor((level.timeLimitSeconds || 240) / 60)}m  |  Base: ${level.baseXP} XP`,
    ]

    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.95)
    bg.fillRoundedRect(-155, -50, 310, lines.length * 20 + 20, 6)
    bg.lineStyle(1, 0x555588, 1)
    bg.strokeRoundedRect(-155, -50, 310, lines.length * 20 + 20, 6)
    tooltip.add(bg)

    lines.forEach((line, i) => {
      tooltip.add(this.add.text(0, -38 + i * 20, line, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: i === 0 ? '#FFFFFF' : '#AAAAAA',
        wordWrap: { width: 290 },
        align: 'center',
      }).setOrigin(0.5))
    })

    this._tooltip = tooltip
  }

  _startLevel(level) {
    const sceneKey = level.taskClass || 'TaskScene'

    // Pass world and level data
    this.scene.start(sceneKey, {
      worldNumber: this._worldNumber,
      levelNumber: level.levelNumber,
      fromWorldMap: true,
    })
  }

  _drawBackButton() {
    this._makeButton(50, 800, 80, 36, '◀ BACK', 0x1a1a4e, 0x5555cc, () => {
      this.scene.start('WorldMapScene')
    })
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
      fontSize: '9px',
      color: '#FFFFFF',
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })
    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container, scaleX: 0.96, scaleY: 0.96,
        duration: 60, yoyo: true, onComplete: callback,
      })
    })
    return container
  }
}
