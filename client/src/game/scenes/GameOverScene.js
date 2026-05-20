// GameOverScene.js — Out of lives (coffee)

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
    this._countdownInterval = null
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this.cameras.main.setBackgroundColor('#0a0a0a')

    this._drawBackground()
    this._drawEmptyCups()
    this._drawTitle()
    this._drawCountdown()
    this._drawButtons()
  }

  _drawBackground() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a0a, 1)
    bg.fillRect(0, 0, this._W, this._H)
    // Rain-like lines
    for (let i = 0; i < 30; i++) {
      bg.lineStyle(1, 0x222222, 0.4)
      const rx = Phaser.Math.Between(0, this._W)
      bg.lineBetween(rx, 0, rx - 20, this._H)
    }
  }

  _drawEmptyCups() {
    this.add.text(this._cx, 100, '☕ ☕ ☕', {
      fontSize: '42px',
      color: '#333333',
    }).setOrigin(0.5)

    // Three depleted cups
    for (let i = 0; i < 3; i++) {
      const cx = 105 + i * 90
      if (hasAsset('coffee_cup')) {
        const cup = this.add.image(cx, 160, 'coffee_cup').setDisplaySize(60, 60).setTint(0x222222)
        // X mark over each cup
        this.add.text(cx, 160, '✕', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '22px',
          color: '#FF2222',
        }).setOrigin(0.5)
      } else {
        const g = this.add.graphics()
        g.fillStyle(0x333333, 1)
        g.fillRect(cx - 24, 140, 48, 40)
        g.lineStyle(3, 0xff2222, 1)
        g.lineBetween(cx - 14, 150, cx + 14, 170)
        g.lineBetween(cx + 14, 150, cx - 14, 170)
      }
    }
  }

  _drawTitle() {
    this.add.text(this._cx, 240, 'OUT OF COFFEE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#8B0000',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(this._cx, 280, 'You\'ve run out of lives.\nCoffee refills every 30 minutes!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
      align: 'center',
      wordWrap: { width: 330 },
    }).setOrigin(0.5)
  }

  _drawCountdown() {
    this.add.text(this._cx, 340, 'NEXT COFFEE IN:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#C8860A',
    }).setOrigin(0.5)

    this._countdownText = this.add.text(this._cx, 375, '30:00', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    // Read from localStorage when next life is expected
    const secondsToNext = parseInt(localStorage.getItem('lf_seconds_to_next_life') || '1800', 10)
    this._countdownSecs = secondsToNext

    this._timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this._countdownSecs = Math.max(0, this._countdownSecs - 1)
        const m = Math.floor(this._countdownSecs / 60)
        const s = this._countdownSecs % 60
        this._countdownText.setText(`${m}:${String(s).padStart(2, '0')}`)

        if (this._countdownSecs <= 0) {
          this._timerEvent.destroy()
          this._countdownText.setText('READY!')
          this._countdownText.setColor('#44FF44')
          this.scene.start('LivesRefillScene')
        }
      },
    })

    // Coffee cup refill preview
    this.add.text(this._cx, 440, '◻ ◻ ◻  →  ☕ ◻ ◻  →  ☕ ☕ ◻  →  ☕ ☕ ☕', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#555555',
      align: 'center',
      wordWrap: { width: 350 },
    }).setOrigin(0.5)
  }

  _drawButtons() {
    // Share button
    this._makeButton(this._cx, 540, 280, 50, '📲 SHARE WITH A FRIEND', 0x1a3a1a, 0x44aa44, () => {
      const msg = encodeURIComponent('I\'m out of coffee on LEDGERFALL! 😱 Help me out: https://ledgerfall.app #AuditGame')
      window.open(`https://wa.me/?text=${msg}`, '_blank')
    })

    // Watch ad (placeholder)
    this._makeButton(this._cx, 605, 280, 50, '📺 WATCH AD FOR COFFEE', 0x1a1a4e, 0x5555cc, () => {
      this._showAdPlaceholder()
    })

    // Back to menu
    this._makeButton(this._cx, 680, 200, 40, 'MAIN MENU', 0x333333, 0x666666, () => {
      this.scene.start('MainMenuScene')
    })
  }

  _showAdPlaceholder() {
    const panel = this.add.container(this._cx, this._H / 2).setDepth(500)

    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.97)
    bg.fillRoundedRect(-155, -80, 310, 160, 10)
    bg.lineStyle(2, 0x5555cc, 1)
    bg.strokeRoundedRect(-155, -80, 310, 160, 10)

    const title = this.add.text(0, -55, 'ADS COMING SOON', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#FFDD00',
    }).setOrigin(0.5)

    const body = this.add.text(0, -10, 'Video ads will be available\nin a future update.\nThank you for your patience!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
      align: 'center',
      wordWrap: { width: 280 },
    }).setOrigin(0.5)

    const closeBtn = this.add.text(0, 55, '[CLOSE]', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FF4444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => panel.destroy())

    panel.add([bg, title, body, closeBtn])
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
    container.on('pointerover', () => this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 80 }))
    container.on('pointerout',  () => this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 }))
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 60, yoyo: true, onComplete: callback })
    })
    return container
  }

  shutdown() {
    if (this._timerEvent) this._timerEvent.destroy()
  }
}
