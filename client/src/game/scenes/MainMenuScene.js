// MainMenuScene.js — Full main menu with logo, buttons, auth check

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' })
  }

  create() {
    const W = 390
    const H = 844
    const cx = W / 2

    // ── Background ────────────────────────────────────────────────────────────
    if (hasAsset('bg_world7')) {
      const bg = this.add.image(cx, H / 2, 'bg_world7')
      bg.setDisplaySize(W, H)
    } else {
      this._drawFallbackBg()
    }

    // ── Logo ──────────────────────────────────────────────────────────────────
    if (hasAsset('main_logo')) {
      this._logo = this.add.image(cx, 180, 'main_logo').setOrigin(0.5)
      this._logo.setDisplaySize(300, 100)
    } else {
      this._logo = this.add
        .text(cx, 180, 'LEDGERFALL', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '28px',
          color: '#C8860A',
          stroke: '#000000',
          strokeThickness: 4,
          shadow: { blur: 8, color: '#C8860A', fill: true },
        })
        .setOrigin(0.5)
    }

    // Pixel pulse tween on logo
    this.tweens.add({
      targets: this._logo,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // ── Tagline ───────────────────────────────────────────────────────────────
    this.add
      .text(cx, 250, 'Rise Through the Audit', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#DDDDDD',
        alpha: 0.85,
      })
      .setOrigin(0.5)

    // ── Decorative separator ──────────────────────────────────────────────────
    const sep = this.add.graphics()
    sep.lineStyle(2, 0xc8860a, 0.5)
    sep.lineBetween(60, 275, 330, 275)

    // ── Buttons ───────────────────────────────────────────────────────────────
    const btnData = [
      { label: 'PLAY',          y: 340, color: 0x8b0000, border: 0xff4444, action: () => this._onPlay() },
      { label: 'LEADERBOARD',   y: 420, color: 0x1a1a4e, border: 0x5555cc, action: () => this._onLeaderboard() },
      { label: 'STUDY MODE',    y: 500, color: 0x1a3a1a, border: 0x44aa44, action: () => this._onStudyMode() },
    ]

    btnData.forEach(({ label, y, color, border, action }) => {
      this._makeButton(cx, y, 260, 52, label, color, border, action)
    })

    // ── Version & Credits ─────────────────────────────────────────────────────
    this.add
      .text(cx, H - 60, 'Developed by Abdul Basit Nazari, ACCA', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#888888',
      })
      .setOrigin(0.5)

    this.add
      .text(cx, H - 36, 'v1.0.0  ·  © 2024 LedgerFall', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#555555',
      })
      .setOrigin(0.5)

    // ── Ambient particles ─────────────────────────────────────────────────────
    this._spawnAmbientParticles()

    // ── Music hint (placeholder) ──────────────────────────────────────────────
    // Background music would be this.sound.add('menu_music').play({ loop: true })
  }

  // ── Button factory ─────────────────────────────────────────────────────────
  _makeButton(x, y, w, h, label, fillColor, borderColor, callback) {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(fillColor, 0.92)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6)
    bg.lineStyle(3, borderColor, 1)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6)

    const text = this.add
      .text(0, 0, label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '13px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    container.add([bg, text])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 80, ease: 'Power1' })
    })
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80, ease: 'Power1' })
    })
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 60, ease: 'Power1', yoyo: true, onComplete: callback })
    })

    return container
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  _onPlay() {
    const token = localStorage.getItem('ledgerfall_token')
    if (token) {
      this.scene.start('WorldMapScene')
    } else {
      // Signal to React that auth is needed
      this._emitToReact('showAuth', { redirect: 'WorldMapScene' })
    }
  }

  _onLeaderboard() {
    this._emitToReact('showLeaderboard', {})
  }

  _onStudyMode() {
    this._emitToReact('showStudyMode', {})
  }

  // ── React bridge ──────────────────────────────────────────────────────────
  _emitToReact(event, data) {
    // Dispatch a custom DOM event that React can listen to
    window.dispatchEvent(new CustomEvent('ledgerfall:game', { detail: { event, data } }))
  }

  // ── Fallback background ───────────────────────────────────────────────────
  _drawFallbackBg() {
    const bg = this.add.graphics()
    // Deep dark blue gradient simulation with layered rectangles
    const colors = [0x0d0d2b, 0x0f0f35, 0x12123f, 0x0d0d2b]
    const segH = 844 / colors.length
    colors.forEach((c, i) => {
      bg.fillStyle(c, 1)
      bg.fillRect(0, i * segH, 390, segH + 1)
    })
    // Star-like dots
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, 390)
      const sy = Phaser.Math.Between(0, 844)
      const sz = Phaser.Math.Between(1, 3)
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5))
      bg.fillRect(sx, sy, sz, sz)
    }
  }

  // ── Ambient floating coins/sparks ─────────────────────────────────────────
  _spawnAmbientParticles() {
    const gfx = this.add.graphics()

    const particles = []
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: Phaser.Math.Between(20, 370),
        y: Phaser.Math.Between(600, 850),
        speed: Phaser.Math.FloatBetween(0.3, 0.9),
        alpha: Phaser.Math.FloatBetween(0.3, 0.8),
        size: Phaser.Math.Between(2, 5),
        color: Phaser.Math.RND.pick([0xc8860a, 0xffd700, 0xffffff]),
      })
    }

    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        gfx.clear()
        particles.forEach((p) => {
          p.y -= p.speed
          if (p.y < -10) {
            p.y = 860
            p.x = Phaser.Math.Between(20, 370)
          }
          gfx.fillStyle(p.color, p.alpha)
          gfx.fillRect(p.x, p.y, p.size, p.size)
        })
      },
    })
  }
}
