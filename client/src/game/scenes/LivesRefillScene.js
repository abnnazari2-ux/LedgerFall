// LivesRefillScene.js — Shows live refill progress with cup fill animations

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class LivesRefillScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LivesRefillScene' })
    this._pollInterval = null
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195
    this._lives = parseInt(localStorage.getItem('lf_lives') || '0', 10)
    this._maxLives = 3
    this._refillSecs = 1800 // 30 minutes per life

    this.cameras.main.setBackgroundColor('#0D0D2B')
    this._drawBackground()
    this._drawTitle()
    this._drawCups()
    this._drawTimers()
    this._drawButtons()
    this._startPolling()
  }

  _drawBackground() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0d0d2b, 1)
    bg.fillRect(0, 0, this._W, this._H)
    // Warm steam lines
    for (let i = 0; i < 8; i++) {
      const sx = 60 + i * 40
      bg.lineStyle(2, 0xc8860a, 0.08)
      bg.lineBetween(sx, 0, sx + 10, this._H)
    }
  }

  _drawTitle() {
    this.add.text(this._cx, 80, '☕  COFFEE REFILL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(this._cx, 115, 'Your coffee is brewing…', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5)
  }

  _drawCups() {
    this._cupContainers = []

    for (let i = 0; i < this._maxLives; i++) {
      const cx = 75 + i * 120
      const cy = 260
      const container = this.add.container(cx, cy)
      const filled = i < this._lives

      // Cup body
      if (hasAsset('coffee_cup')) {
        const cup = this.add.image(0, 0, 'coffee_cup').setDisplaySize(80, 80)
        cup.setTint(filled ? 0xffffff : 0x444444)
        container.add(cup)
      } else {
        const g = this.add.graphics()
        // Cup body
        g.fillStyle(filled ? 0x8b4513 : 0x333333, 1)
        g.fillRoundedRect(-30, -30, 60, 55, 6)
        g.lineStyle(2, filled ? 0xc8860a : 0x555555, 1)
        g.strokeRoundedRect(-30, -30, 60, 55, 6)
        // Handle
        g.lineStyle(3, filled ? 0xc8860a : 0x444444, 1)
        g.strokeEllipse(38, 0, 20, 30)
        // Liquid fill animation bar
        if (!filled) {
          g.fillStyle(0x3a1a00, 0.4)
          g.fillRoundedRect(-28, 5, 56, 18, 4)
        }
        container.add(g)
      }

      // Label
      container.add(this.add.text(0, 52, filled ? 'READY!' : 'BREWING', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: filled ? '#44FF44' : '#888888',
      }).setOrigin(0.5))

      // Pixel fill animation for brewing cups
      if (!filled) {
        this._animateBrewingCup(container, cx, cy + 10)
      }

      this._cupContainers.push(container)
    }
  }

  _animateBrewingCup(container, cx, cy) {
    // Animated fill bar inside the cup
    const fill = this.add.graphics()
    container.add(fill)

    let fillProgress = 0
    this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        fillProgress = (fillProgress + 0.008) % 1
        fill.clear()
        fill.fillStyle(0x8b4513, 0.7)
        fill.fillRect(-22, 10 - fillProgress * 30, 44, fillProgress * 30)
      },
    })

    // Steam particles
    const steamGfx = this.add.graphics()
    container.add(steamGfx)
    let steamTick = 0
    this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        steamTick++
        steamGfx.clear()
        for (let s = 0; s < 3; s++) {
          const sx = Phaser.Math.Between(-15, 15)
          const sy = -40 - ((steamTick * 2 + s * 12) % 30)
          steamGfx.fillStyle(0xffffff, 0.1 + s * 0.05)
          steamGfx.fillCircle(sx, sy, 4)
        }
      },
    })
  }

  _drawTimers() {
    this._timerTexts = []
    this._timerSecs = []

    const token = localStorage.getItem('ledgerfall_token')
    const secondsToNext = parseInt(localStorage.getItem('lf_seconds_to_next_life') || '1800', 10)

    for (let i = 0; i < this._maxLives - this._lives; i++) {
      const cx = 75 + (this._lives + i) * 120
      const secsForThis = secondsToNext + i * this._refillSecs
      this._timerSecs.push(secsForThis)

      const t = this.add.text(cx, 340, this._formatTime(secsForThis), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '11px',
        color: '#C8860A',
      }).setOrigin(0.5)

      this._timerTexts.push(t)
    }

    // Countdown timer
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this._timerSecs = this._timerSecs.map((s) => Math.max(0, s - 1))
        this._timerTexts.forEach((t, i) => {
          t.setText(this._formatTime(this._timerSecs[i]))
          if (this._timerSecs[i] <= 0) {
            t.setText('READY!')
            t.setColor('#44FF44')
          }
        })
      },
    })
  }

  _startPolling() {
    // Poll the server every 60 seconds to get updated lives
    this._pollTimer = this.time.addEvent({
      delay: 60000,
      loop: true,
      callback: () => {
        const token = localStorage.getItem('ledgerfall_token')
        if (!token) return

        fetch('/api/game/lives', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => {
            const newLives = data.lives ?? this._lives
            if (newLives > this._lives) {
              this._lives = newLives
              localStorage.setItem('lf_lives', String(newLives))
              this.game.events.emit('livesChanged', { lives: newLives })
              this._onLivesRefilled()
            }
          })
          .catch((err) => console.warn('[LivesRefillScene] Poll error:', err))
      },
    })
  }

  _onLivesRefilled() {
    this.add.text(this._cx, 420, '☕ Coffee is ready!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#44FF44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.time.delayedCall(2000, () => {
      this.scene.start('WorldMapScene')
    })
  }

  _drawButtons() {
    this._makeButton(this._cx, 520, 280, 50, '📲 SHARE FOR EXTRA LIFE', 0x1a3a1a, 0x44aa44, () => {
      const msg = encodeURIComponent('Help me refill my coffee on LEDGERFALL! ☕ https://ledgerfall.app')
      window.open(`https://wa.me/?text=${msg}`, '_blank')
    })

    this._makeButton(this._cx, 590, 200, 44, 'MAIN MENU', 0x333333, 0x666666, () => {
      this.scene.start('MainMenuScene')
    })
  }

  _formatTime(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
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
      wordWrap: { width: w - 20 },
      align: 'center',
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 60, yoyo: true, onComplete: callback })
    })
    return container
  }

  shutdown() {
    if (this._timerEvent) this._timerEvent.destroy()
    if (this._pollTimer) this._pollTimer.destroy()
  }
}
