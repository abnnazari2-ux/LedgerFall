// TaskScene.js — Base class for all task scenes
import { ScoringEngine } from '../systems/ScoringEngine.js'
import { WORLDS_DATA } from '../data/worldsData.js'

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class TaskScene extends Phaser.Scene {
  constructor(config) {
    super(config)
    // These are set by startLevel()
    this.worldNumber = 1
    this.levelNumber = 1
    this.levelData = null
    this._timerEvent = null
    this._timerSeconds = 0
    this._timerRunning = false
    this._hintsUsed = 0
    this._falsePositives = 0
    this._fraudDetected = false
    this._noteCollected = false
    this._noteSprite = null
    this._stampMenu = null
    this._focusSegments = 5
    this._hintActive = false
    this._noteHideTimer = null
  }

  // ── Entry point called by LevelSelectScene ────────────────────────────────
  startLevel(worldNum, levelNum, extraData = {}) {
    this.worldNumber = worldNum
    this.levelNumber = levelNum

    const world = WORLDS_DATA.find((w) => w.worldNumber === worldNum)
    if (!world) {
      console.error(`[TaskScene] World ${worldNum} not found`)
      return
    }
    this.levelData = world.levels.find((l) => l.levelNumber === levelNum)
    if (!this.levelData) {
      console.error(`[TaskScene] Level ${worldNum}-${levelNum} not found`)
      return
    }

    Object.assign(this, extraData)
  }

  // ── Background setup ──────────────────────────────────────────────────────
  setupBackground(worldNumber) {
    const key = `bg_world${worldNumber}`
    const W = 390
    const H = 844
    if (hasAsset(key)) {
      const bg = this.add.image(W / 2, H / 2, key)
      bg.setDisplaySize(W, H)
      // Dim slightly so documents are readable
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35)
    } else {
      const colors = [0x1a0a0a, 0x0a1a0a, 0x0a0a1a, 0x1a1a0a, 0x0a1a1a, 0x1a0a1a]
      const color = colors[(worldNumber - 1) % colors.length]
      const bg = this.add.graphics()
      bg.fillStyle(color, 1)
      bg.fillRect(0, 0, W, H)
      // Subtle grid pattern
      bg.lineStyle(1, 0xffffff, 0.04)
      for (let x = 0; x < W; x += 20) bg.lineBetween(x, 0, x, H)
      for (let y = 0; y < H; y += 20) bg.lineBetween(0, y, W, y)
    }
  }

  // ── Focus / hint system ───────────────────────────────────────────────────
  setupHint() {
    const focus = parseInt(localStorage.getItem('lf_focus') || '5', 10)
    this._focusSegments = focus

    // Hint button
    this._hintBtn = this._makeButton(350, 100, 70, 30, 'HINT', 0x1a1a4e, 0x5555cc, () => {
      this._useHint()
    })
  }

  _useHint() {
    if (this._focusSegments <= 0) {
      this._showToast('No focus left!', '#FF4444')
      return
    }
    if (this._hintActive) return

    this._focusSegments--
    this._hintsUsed++
    localStorage.setItem('lf_focus', String(this._focusSegments))
    this.game.events.emit('focusChanged', { focus: this._focusSegments })

    // Show hint text
    const hint = this.levelData?.hints?.[this._hintsUsed - 1] || 'Look more carefully at the documents.'
    this._hintActive = true
    this._showHintPanel(hint)
  }

  _showHintPanel(text) {
    const panel = this.add.container(195, 450).setDepth(300)
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.95)
    bg.fillRoundedRect(-160, -60, 320, 120, 8)
    bg.lineStyle(2, 0x5555cc, 1)
    bg.strokeRoundedRect(-160, -60, 320, 120, 8)

    const label = this.add
      .text(0, -40, '💡 HINT', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#FFDD00',
      })
      .setOrigin(0.5)

    const body = this.add
      .text(0, -5, text, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#DDDDDD',
        wordWrap: { width: 290 },
        align: 'center',
      })
      .setOrigin(0.5)

    const closeBtn = this.add
      .text(140, -52, '✕', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#FF4444',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => {
      panel.destroy()
      this._hintActive = false
    })

    panel.add([bg, label, body, closeBtn])

    this.time.delayedCall(8000, () => {
      if (panel.active) {
        panel.destroy()
        this._hintActive = false
      }
    })
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  setupTimer(seconds) {
    this._timerSeconds = seconds
    this._timerRunning = true
    this.game.events.emit('timerShow')
    this.game.events.emit('timerTick', { seconds: this._timerSeconds })

    this._timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this._timerRunning) return
        this._timerSeconds = Math.max(0, this._timerSeconds - 1)
        this.game.events.emit('timerTick', { seconds: this._timerSeconds })
        if (this._timerSeconds === 0) {
          this._timerRunning = false
          this.time.delayedCall(500, () => this.onTimerEnd())
        }
      },
    })
  }

  pauseTimer() {
    this._timerRunning = false
  }

  resumeTimer() {
    this._timerRunning = true
  }

  onTimerEnd() {
    // Lose 1 life
    const currentLives = parseInt(localStorage.getItem('lf_lives') || '3', 10)
    const newLives = Math.max(0, currentLives - 1)
    localStorage.setItem('lf_lives', String(newLives))
    this.game.events.emit('livesChanged', { lives: newLives })

    if (newLives <= 0) {
      this.scene.start('GameOverScene')
      return
    }

    // Show retry panel
    this._showRetryPanel('TIME EXPIRED', 'You ran out of time. -1 life')
  }

  _showRetryPanel(title, message) {
    const panel = this.add.container(195, 422).setDepth(500)
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.97)
    bg.fillRoundedRect(-170, -100, 340, 200, 10)
    bg.lineStyle(3, 0xff4444, 1)
    bg.strokeRoundedRect(-170, -100, 340, 200, 10)

    const titleText = this.add
      .text(0, -70, title, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#FF4444',
      })
      .setOrigin(0.5)

    const msgText = this.add
      .text(0, -30, message, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#DDDDDD',
        wordWrap: { width: 300 },
        align: 'center',
      })
      .setOrigin(0.5)

    const retryBtn = this._makeButton(0, 40, 200, 44, 'RETRY', 0x8b0000, 0xff4444, () => {
      panel.destroy()
      this.scene.restart()
    })

    const menuBtn = this._makeButton(0, 90, 200, 36, 'MAIN MENU', 0x1a1a4e, 0x5555cc, () => {
      this.scene.start('WorldMapScene')
    })

    panel.add([bg, titleText, msgText])
    // Container children must be display objects, not containers — add buttons separately
    retryBtn.setPosition(195, 422 + 40)
    menuBtn.setPosition(195, 422 + 90)
    retryBtn.setDepth(501)
    menuBtn.setDepth(501)
  }

  // ── Hidden collectible note ───────────────────────────────────────────────
  setupNoteHiding() {
    if (this._noteCollected) return

    const nx = Phaser.Math.Between(30, 360)
    const ny = Phaser.Math.Between(700, 800)

    this._noteSprite = this.add
      .text(nx, ny, '📝', { fontSize: '24px' })
      .setDepth(200)
      .setInteractive({ useHandCursor: true })

    this._noteSprite.setAlpha(0)

    // Fade in after 5 seconds
    this.time.delayedCall(5000, () => {
      if (this._noteSprite?.active) {
        this.tweens.add({ targets: this._noteSprite, alpha: 0.7, duration: 800 })
      }
    })

    this._noteSprite.on('pointerdown', () => {
      this._collectNote()
    })
  }

  _collectNote() {
    if (this._noteCollected) return
    this._noteCollected = true

    this.tweens.add({
      targets: this._noteSprite,
      y: this._noteSprite.y - 40,
      alpha: 0,
      duration: 600,
      onComplete: () => this._noteSprite?.destroy(),
    })

    const currentNotes = parseInt(localStorage.getItem('lf_notes') || '0', 10) + 1
    localStorage.setItem('lf_notes', String(currentNotes))
    this.game.events.emit('notesChanged', { notes: currentNotes })
    this._showToast('+1 Study Note Collected!', '#44FFAA')
  }

  // ── Stamp radial menu ─────────────────────────────────────────────────────
  showStampMenu(item, x, y) {
    if (this._stampMenu) {
      this._stampMenu.destroy()
      this._stampMenu = null
    }

    const stampTypes = [
      { label: 'AGREED',      color: 0x006600, textColor: '#44FF44', key: 'stamp_agreed' },
      { label: 'EXCEPTION',   color: 0x884400, textColor: '#FFAA44', key: 'stamp_exception' },
      { label: 'FRAUD RISK',  color: 0x880000, textColor: '#FF4444', key: 'stamp_fraud' },
      { label: 'SKIP',        color: 0x333333, textColor: '#AAAAAA', key: null },
    ]

    const menu = this.add.container(x, y).setDepth(400)

    // Background shield
    const shield = this.add.graphics()
    shield.fillStyle(0x000000, 0.85)
    shield.fillCircle(0, 0, 90)
    menu.add(shield)

    const angles = [-90, 0, 90, 180]
    stampTypes.forEach((stamp, i) => {
      const angle = Phaser.Math.DegToRad(angles[i])
      const dist = 68
      const bx = Math.cos(angle) * dist
      const by = Math.sin(angle) * dist

      const bg = this.add.graphics()
      bg.fillStyle(stamp.color, 0.9)
      bg.fillRoundedRect(bx - 42, by - 18, 84, 36, 6)
      bg.lineStyle(2, 0xffffff, 0.5)
      bg.strokeRoundedRect(bx - 42, by - 18, 84, 36, 6)

      const text = this.add
        .text(bx, by, stamp.label, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: stamp.textColor,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(bx - 42, by - 18, 84, 36), hitAreaCallback: Phaser.Geom.Rectangle.Contains })

      text.on('pointerdown', () => {
        menu.destroy()
        this._stampMenu = null
        if (stamp.label !== 'SKIP') {
          this.applyStamp(item, stamp.label, stamp.key)
        }
      })

      menu.add([bg, text])
    })

    // Close on background tap
    const closeZone = this.add.zone(195, 422, 390, 844).setDepth(399).setInteractive()
    closeZone.on('pointerdown', () => {
      menu.destroy()
      this._stampMenu = null
      closeZone.destroy()
    })

    this._stampMenu = menu

    // Pop-in animation
    menu.setScale(0.1)
    this.tweens.add({ targets: menu, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' })
  }

  // ── Apply stamp to item ───────────────────────────────────────────────────
  applyStamp(item, stampType, stampKey) {
    const target = item?.sprite || item?.container
    if (!target) return

    const sx = target.x ?? (item.x || 195)
    const sy = target.y ?? (item.y || 422)

    let stampSprite
    if (stampKey && hasAsset(stampKey)) {
      stampSprite = this.add.image(sx, sy, stampKey).setDepth(250).setAlpha(0)
      stampSprite.setDisplaySize(80, 80)
    } else {
      // Fallback text stamp
      const colors = {
        'AGREED': '#44FF44',
        'EXCEPTION': '#FFAA44',
        'FRAUD RISK': '#FF4444',
        'RECONCILED': '#44FFFF',
        'MISMATCH': '#FF44FF',
      }
      stampSprite = this.add
        .text(sx, sy, stampType, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '12px',
          color: colors[stampType] || '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 3,
          alpha: 0,
        })
        .setOrigin(0.5)
        .setDepth(250)
        .setAngle(-15)
    }

    // Stamp animation: drop and bounce
    this.tweens.add({
      targets: stampSprite,
      alpha: 0.9,
      scaleX: { from: 1.5, to: 1 },
      scaleY: { from: 1.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    })

    // Vibration shake of original item
    if (target.setPosition) {
      const origX = target.x
      this.tweens.add({
        targets: target,
        x: origX + 6,
        duration: 40,
        yoyo: true,
        repeat: 3,
      })
    }

    item._stampApplied = stampType
    item._stampSprite = stampSprite

    return stampSprite
  }

  // ── Task submission ───────────────────────────────────────────────────────
  submitTask(results) {
    this.pauseTimer()

    const timeUsed = (this.levelData?.timeLimitSeconds || 240) - this._timerSeconds
    const streak = parseInt(localStorage.getItem('lf_streak') || '0', 10)

    const score = ScoringEngine.calculate({
      worldNumber: this.worldNumber,
      levelNumber: this.levelNumber,
      timeUsed,
      timeLimitSeconds: this.levelData?.timeLimitSeconds || 240,
      hintsUsed: this._hintsUsed,
      falsePositives: this._falsePositives,
      fraudDetected: this._fraudDetected,
      streakDays: streak,
    })

    // Persist to server
    const token = localStorage.getItem('ledgerfall_token')
    if (token) {
      fetch('/api/game/session/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          worldNumber: this.worldNumber,
          levelNumber: this.levelNumber,
          xpEarned: score.finalXP,
          coinsEarned: score.coins,
          starsEarned: score.stars,
          fraudDetected: this._fraudDetected,
          hintsUsed: this._hintsUsed,
          timeUsed,
          results,
        }),
      }).catch((err) => console.warn('[TaskScene] Session save failed:', err))
    }

    // Transition to VictoryScene
    this.game.events.emit('timerHide')
    this.scene.start('VictoryScene', {
      score,
      worldNumber: this.worldNumber,
      levelNumber: this.levelNumber,
      levelData: this.levelData,
      fraudDetected: this._fraudDetected,
    })
  }

  // ── Shared button factory ─────────────────────────────────────────────────
  _makeButton(x, y, w, h, label, fillColor, borderColor, callback) {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(fillColor, 0.92)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6)
    bg.lineStyle(2, borderColor, 1)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6)

    const text = this.add
      .text(0, 0, label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: Math.min(12, Math.floor(h * 0.25)) + 'px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 80 })
    })
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 })
    })
    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 60,
        yoyo: true,
        onComplete: callback,
      })
    })

    return container
  }

  // ── Toast notification ────────────────────────────────────────────────────
  _showToast(message, color = '#FFFFFF') {
    const toast = this.add
      .text(195, 760, message, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color,
        backgroundColor: '#000000CC',
        padding: { x: 12, y: 8 },
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(600)
      .setAlpha(0)

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 740,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 720,
            duration: 400,
            onComplete: () => toast.destroy(),
          })
        })
      },
    })
  }

  // ── Correct/incorrect visual feedback ────────────────────────────────────
  _showCorrectFeedback(target) {
    // Green glow
    const glow = this.add.graphics().setDepth(target.depth - 1 || 50)
    const bounds = target.getBounds ? target.getBounds() : { x: target.x - 40, y: target.y - 30, width: 80, height: 60 }
    glow.lineStyle(4, 0x00ff88, 0.8)
    glow.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8)
    this.tweens.add({
      targets: glow,
      alpha: 0,
      duration: 1200,
      onComplete: () => glow.destroy(),
    })
  }

  _showIncorrectFeedback(target) {
    // Red shake
    if (!target.x) return
    const origX = target.x
    this.tweens.add({
      targets: target,
      x: origX + 8,
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        target.x = origX
      },
    })
    // Red flash
    const flash = this.add.graphics().setDepth(300).setAlpha(0.5)
    const bounds = target.getBounds ? target.getBounds() : { x: target.x - 40, y: target.y - 30, width: 80, height: 60 }
    flash.fillStyle(0xff0000, 0.5)
    flash.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    })
  }

  shutdown() {
    this.game.events.emit('timerHide')
    if (this._timerEvent) this._timerEvent.destroy()
  }
}
