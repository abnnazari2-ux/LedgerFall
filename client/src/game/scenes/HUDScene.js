// HUDScene.js — Persistent overlay rendered on top of all game scenes

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' })
  }

  create() {
    const W = 390
    this._state = {
      lives: 3,
      focus: 5,
      coins: 0,
      xp: 0,
      notes: 0,
      notesTotal: 30,
      timerSeconds: 0,
      careerTitle: 'Graduate Trainee',
    }

    // ── Top HUD bar ───────────────────────────────────────────────────────────
    if (hasAsset('hud_bar')) {
      this._hudBar = this.add.image(W / 2, 35, 'hud_bar').setDisplaySize(W, 70).setDepth(100)
    } else {
      const bar = this.add.graphics().setDepth(100)
      bar.fillStyle(0x0a0a22, 0.92)
      bar.fillRect(0, 0, W, 70)
      bar.lineStyle(2, 0x333366, 1)
      bar.lineBetween(0, 70, W, 70)
      this._hudBar = bar
    }

    // ── Portrait ──────────────────────────────────────────────────────────────
    if (hasAsset('portrait_frame')) {
      this.add.image(36, 35, 'portrait_frame').setDisplaySize(56, 56).setDepth(101)
    } else {
      const pf = this.add.graphics().setDepth(101)
      pf.lineStyle(3, 0xc8860a, 1)
      pf.strokeRect(8, 7, 56, 56)
      pf.fillStyle(0x1a1a3a, 1)
      pf.fillRect(9, 8, 54, 54)
    }

    if (hasAsset('portrait_face')) {
      this.add.image(36, 35, 'portrait_face').setDisplaySize(46, 46).setDepth(102)
    } else {
      const pface = this.add.graphics().setDepth(102)
      pface.fillStyle(0xf4a460, 1)
      pface.fillCircle(36, 32, 16)
      pface.fillStyle(0x333333, 1)
      pface.fillRect(28, 36, 16, 20)
    }

    // ── Career title (below portrait area) ───────────────────────────────────
    this._careerText = this.add
      .text(36, 63, 'Graduate Trainee', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#AAAAAA',
      })
      .setOrigin(0.5, 0)
      .setDepth(102)

    // ── Lives (coffee cups) ───────────────────────────────────────────────────
    this._cupSprites = []
    for (let i = 0; i < 3; i++) {
      const cx = 80 + i * 26
      const cy = 35
      if (hasAsset('coffee_cup')) {
        const cup = this.add.image(cx, cy, 'coffee_cup').setDisplaySize(20, 20).setDepth(102)
        this._cupSprites.push(cup)
      } else {
        const g = this.add.graphics().setDepth(102)
        g.fillStyle(0x8b4513, 1)
        g.fillRect(cx - 8, cy - 8, 16, 16)
        g.lineStyle(1, 0xc8860a, 1)
        g.strokeRect(cx - 8, cy - 8, 16, 16)
        this._cupSprites.push(g)
      }
    }

    // ── Focus bar ─────────────────────────────────────────────────────────────
    this._focusSegments = []
    for (let i = 0; i < 5; i++) {
      const fx = 162 + i * 14
      const fy = 35
      const seg = this.add.rectangle(fx, fy, 10, 22, 0x44aaff, 1).setDepth(102)
      this._focusSegments.push(seg)
    }

    // Focus label
    this.add
      .text(162, 16, 'FOCUS', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#44aaff',
      })
      .setDepth(102)

    // ── Coin counter ──────────────────────────────────────────────────────────
    if (hasAsset('coin_icon')) {
      this.add.image(248, 30, 'coin_icon').setDisplaySize(18, 18).setDepth(102)
    } else {
      const cg = this.add.graphics().setDepth(102)
      cg.fillStyle(0xffd700, 1)
      cg.fillCircle(248, 30, 9)
    }

    this._coinText = this.add
      .text(262, 30, '0', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#FFD700',
      })
      .setOrigin(0, 0.5)
      .setDepth(102)

    // ── XP / Star display ─────────────────────────────────────────────────────
    if (hasAsset('star_icon')) {
      this.add.image(248, 50, 'star_icon').setDisplaySize(14, 14).setDepth(102)
    } else {
      const sg = this.add.graphics().setDepth(102)
      sg.fillStyle(0xffdd00, 1)
      sg.fillTriangle(248, 44, 253, 57, 243, 57)
    }

    this._xpText = this.add
      .text(262, 50, '0 XP', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#FFD700',
      })
      .setOrigin(0, 0.5)
      .setDepth(102)

    // ── Timer ─────────────────────────────────────────────────────────────────
    this._timerText = this.add
      .text(315, 35, '4:00', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#00FF88',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(102)

    // ── Notes counter ─────────────────────────────────────────────────────────
    this._notesText = this.add
      .text(355, 35, '📝 0/30', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#DDDDDD',
      })
      .setOrigin(0.5)
      .setDepth(102)

    // ── Event listeners ───────────────────────────────────────────────────────
    this._bindEvents()
  }

  _bindEvents() {
    const evts = this.game.events

    evts.on('livesChanged', ({ lives }) => {
      this._state.lives = lives
      this._updateLives()
    }, this)

    evts.on('xpChanged', ({ xp, careerTitle }) => {
      this._state.xp = xp
      if (careerTitle) this._state.careerTitle = careerTitle
      this._updateXP()
    }, this)

    evts.on('coinsChanged', ({ coins }) => {
      this._state.coins = coins
      this._updateCoins()
    }, this)

    evts.on('focusChanged', ({ focus }) => {
      this._state.focus = focus
      this._updateFocus()
    }, this)

    evts.on('timerTick', ({ seconds }) => {
      this._state.timerSeconds = seconds
      this._updateTimer()
    }, this)

    evts.on('notesChanged', ({ notes }) => {
      this._state.notes = notes
      this._updateNotes()
    }, this)

    evts.on('worldChanged', ({ world }) => {
      // Could update world-specific styling here
      console.log('[HUDScene] World changed to', world)
    }, this)

    evts.on('timerHide', () => {
      if (this._timerText) this._timerText.setVisible(false)
    }, this)

    evts.on('timerShow', () => {
      if (this._timerText) this._timerText.setVisible(true)
    }, this)
  }

  _updateLives() {
    const lives = this._state.lives
    this._cupSprites.forEach((cup, i) => {
      if (cup.setTint) {
        cup.setTint(i < lives ? 0xffffff : 0x444444)
      }
      if (cup.setAlpha) {
        // graphics fallback
      }
    })
  }

  _updateXP() {
    this._xpText.setText(`${this._state.xp} XP`)
    this._careerText.setText(this._state.careerTitle || 'Graduate Trainee')
  }

  _updateCoins() {
    this._coinText.setText(String(this._state.coins))
  }

  _updateFocus() {
    const focus = this._state.focus
    this._focusSegments.forEach((seg, i) => {
      seg.setFillStyle(i < focus ? 0x44aaff : 0x222244, 1)
      seg.setAlpha(i < focus ? 1 : 0.3)
    })
  }

  _updateTimer() {
    const s = this._state.timerSeconds
    const mins = Math.floor(s / 60)
    const secs = s % 60
    const label = `${mins}:${String(secs).padStart(2, '0')}`
    this._timerText.setText(label)

    if (s <= 10) {
      this._timerText.setColor('#FF2222')
      if (!this._timerPulsing) {
        this._timerPulsing = true
        this.tweens.add({
          targets: this._timerText,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }
    } else if (s <= 30) {
      this._timerText.setColor('#FFA500')
      if (this._timerPulsing) {
        this.tweens.killTweensOf(this._timerText)
        this._timerText.setScale(1)
        this._timerPulsing = false
      }
    } else {
      this._timerText.setColor('#00FF88')
      if (this._timerPulsing) {
        this.tweens.killTweensOf(this._timerText)
        this._timerText.setScale(1)
        this._timerPulsing = false
      }
    }
  }

  _updateNotes() {
    this._notesText.setText(`📝 ${this._state.notes}/${this._state.notesTotal}`)
  }
}
