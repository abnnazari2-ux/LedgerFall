// VictoryScene.js — Victory screen after completing a level

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' })
  }

  init(data) {
    this._score = data?.score ?? { finalXP: 100, coins: 5, stars: 1 }
    this._worldNumber = data?.worldNumber ?? 1
    this._levelNumber = data?.levelNumber ?? 1
    this._levelData = data?.levelData ?? {}
    this._fraudDetected = data?.fraudDetected ?? false
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this._drawBackground()
    this._showTaskClearedBanner()
    this._showStars()
    this._showXPPopup()
    this._showDetails()
    this._showButtons()

    // Fireworks if 3 stars
    if (this._score.stars >= 3) {
      this._launchFireworks()
    }

    // World complete check
    if (this._levelNumber >= 5) {
      this.time.delayedCall(2500, () => this._showWorldUnlocked())
    }
  }

  _drawBackground() {
    const bgKey = `bg_world${this._worldNumber}`
    if (hasAsset(bgKey)) {
      const bg = this.add.image(this._cx, this._H / 2, bgKey)
      bg.setDisplaySize(this._W, this._H)
      this.add.rectangle(this._cx, this._H / 2, this._W, this._H, 0x000000, 0.65)
    } else {
      this.cameras.main.setBackgroundColor('#0D0D2B')
    }
  }

  _showTaskClearedBanner() {
    if (hasAsset('task_cleared')) {
      const banner = this.add.image(this._cx, -60, 'task_cleared')
      banner.setDisplaySize(320, 80)
      banner.setDepth(10)
      this.tweens.add({
        targets: banner,
        y: 100,
        duration: 600,
        ease: 'Bounce.easeOut',
      })
    } else {
      const banner = this.add.text(this._cx, -40, 'TASK CLEARED!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(10)

      this.tweens.add({
        targets: banner,
        y: 100,
        duration: 600,
        ease: 'Bounce.easeOut',
      })
    }

    // Subtitle
    this.time.delayedCall(700, () => {
      this.add.text(this._cx, 145, `World ${this._worldNumber}  ·  Level ${this._levelNumber}  ·  ${this._levelData?.levelName || ''}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#AAAAAA',
        align: 'center',
      }).setOrigin(0.5).setDepth(10)
    })
  }

  _showStars() {
    const starPositions = [130, 195, 260]
    const starDelays  = [800, 1000, 1200]

    starPositions.forEach((sx, i) => {
      const earned = i < this._score.stars
      const starText = earned ? '⭐' : '☆'
      const star = this.add.text(sx, 200, starText, {
        fontSize: earned ? '38px' : '30px',
        color: earned ? '#FFD700' : '#444444',
      }).setOrigin(0.5).setScale(0).setDepth(10)

      this.time.delayedCall(starDelays[i], () => {
        this.tweens.add({
          targets: star,
          scaleX: 1, scaleY: 1,
          duration: 350,
          ease: 'Back.easeOut',
        })
      })
    })

    // Star labels
    const starLabels = ['Speed', 'Accuracy', 'Detective']
    starLabels.forEach((label, i) => {
      const earned = i < this._score.stars
      this.time.delayedCall(starDelays[i] + 200, () => {
        this.add.text(starPositions[i], 235, label, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '6px',
          color: earned ? '#FFD700' : '#444444',
        }).setOrigin(0.5).setDepth(10)
      })
    })
  }

  _showXPPopup() {
    this.time.delayedCall(1400, () => {
      if (hasAsset('xp_popup')) {
        const popup = this.add.image(this._cx, 300, 'xp_popup').setDisplaySize(200, 60).setDepth(10).setAlpha(0)
        this.tweens.add({ targets: popup, alpha: 1, duration: 400 })
      }

      const xpText = this.add.text(this._cx, 300, `+${this._score.finalXP} XP`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '26px',
        color: '#44FF88',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(11).setScale(0.5)

      this.tweens.add({
        targets: xpText,
        scaleX: 1, scaleY: 1,
        duration: 400,
        ease: 'Back.easeOut',
      })

      this.add.text(this._cx, 335, `+${this._score.coins} Coins`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(11)

      // Update localStorage
      const xp = parseInt(localStorage.getItem('lf_xp') || '0', 10) + this._score.finalXP
      const coins = parseInt(localStorage.getItem('lf_coins') || '0', 10) + this._score.coins
      localStorage.setItem('lf_xp', String(xp))
      localStorage.setItem('lf_coins', String(coins))
      this.game.events.emit('xpChanged', { xp })
      this.game.events.emit('coinsChanged', { coins })
    })
  }

  _showDetails() {
    this.time.delayedCall(1600, () => {
      const panel = this.add.container(this._cx, 480).setDepth(10)

      const bg = this.add.graphics()
      bg.fillStyle(0x0a0a22, 0.9)
      bg.fillRoundedRect(-170, -100, 340, 200, 8)
      bg.lineStyle(2, 0x555588, 1)
      bg.strokeRoundedRect(-170, -100, 340, 200, 8)
      panel.add(bg)

      const rows = []

      // Mission checklist label
      rows.push({ text: '✅ MISSION ACCOMPLISHED', color: '#44FF44', y: -80 })

      if (this._fraudDetected) {
        rows.push({ text: '🔴 FRAUD DETECTED! +200 XP', color: '#FF4444', y: -55 })
      }

      if (this._levelData?.isaReference) {
        rows.push({ text: this._levelData.isaReference, color: '#AAAAAA', y: this._fraudDetected ? -28 : -48 })
      }

      if (this._levelData?.caseStudy) {
        const brief = this._levelData.caseStudy.substring(0, 80) + '…'
        rows.push({ text: brief, color: '#888888', y: this._fraudDetected ? 10 : -10 })
      }

      // Multiplier
      if (this._score.streakMultiplier > 1) {
        rows.push({
          text: `🔥 ${this._score.streakMultiplier}× Streak Bonus!`,
          color: '#FF8844',
          y: 60,
        })
      }

      rows.forEach(({ text, color, y }) => {
        panel.add(this.add.text(0, y, text, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color,
          wordWrap: { width: 310 },
          align: 'center',
        }).setOrigin(0.5))
      })
    })
  }

  _showButtons() {
    this.time.delayedCall(1800, () => {
      // NEXT STOP button
      if (hasAsset('next_stop_btn')) {
        const btn = this.add.image(this._cx, 670, 'next_stop_btn').setDisplaySize(240, 56).setInteractive({ useHandCursor: true }).setDepth(10)
        btn.on('pointerdown', () => this._goNext())
      } else {
        this._makeButton(this._cx, 670, 240, 52, 'NEXT STOP ▶', 0x8b0000, 0xff4444, () => this._goNext())
      }

      // Challenge a Friend
      this._makeButton(this._cx, 740, 220, 40, '📲 CHALLENGE FRIEND', 0x1a3a1a, 0x44aa44, () => this._shareWhatsApp())
    })
  }

  _goNext() {
    const nextLevel = this._levelNumber + 1
    if (nextLevel > 5) {
      // World complete
      const nextWorld = this._worldNumber + 1
      if (nextWorld > 6) {
        this.scene.start('MainMenuScene')
      } else {
        // Unlock next world
        const unlocked = JSON.parse(localStorage.getItem('lf_unlocked_worlds') || '[1]')
        if (!unlocked.includes(nextWorld)) unlocked.push(nextWorld)
        localStorage.setItem('lf_unlocked_worlds', JSON.stringify(unlocked))
        this.scene.start('WorldMapScene')
      }
    } else {
      // Mark level complete
      const completedKey = `lf_completed_w${this._worldNumber}`
      const completed = JSON.parse(localStorage.getItem(completedKey) || '[]')
      if (!completed.includes(this._levelNumber)) completed.push(this._levelNumber)
      localStorage.setItem(completedKey, JSON.stringify(completed))

      // Save stars
      const starsKey = `lf_stars_w${this._worldNumber}`
      const stars = JSON.parse(localStorage.getItem(starsKey) || '{}')
      stars[this._levelNumber] = Math.max(stars[this._levelNumber] || 0, this._score.stars)
      localStorage.setItem(starsKey, JSON.stringify(stars))

      this.scene.start('LevelSelectScene', { worldNumber: this._worldNumber })
    }
  }

  _shareWhatsApp() {
    const msg = encodeURIComponent(
      `🎮 I just completed World ${this._worldNumber} Level ${this._levelNumber} on LEDGERFALL and earned ${this._score.finalXP} XP! Can you beat my score? 🏆 #LedgerFall #AuditGame`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  _showWorldUnlocked() {
    const panel = this.add.container(this._cx, this._H / 2).setDepth(500).setScale(0)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.9)
    bg.fillRect(-195, -422, 390, 844)

    if (hasAsset('world_unlocked')) {
      const banner = this.add.image(0, -80, 'world_unlocked').setDisplaySize(320, 100)
      panel.add([bg, banner])
    }

    const next = this._worldNumber + 1
    if (next <= 6) {
      panel.add(this.add.text(0, -140, 'WORLD COMPLETE!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '18px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5))

      panel.add(this.add.text(0, -80, `World ${next} Unlocked!`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#44FF88',
      }).setOrigin(0.5))
    } else {
      panel.add(this.add.text(0, -80, '🏆 ALL WORLDS COMPLETE!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#FFD700',
      }).setOrigin(0.5))
    }

    this.tweens.add({
      targets: panel,
      scaleX: 1, scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    })
  }

  _launchFireworks() {
    const colors = [0xffd700, 0xff4444, 0x44ff88, 0x4488ff, 0xff88ff, 0xff8844]
    const particles = []

    for (let b = 0; b < 8; b++) {
      const bx = Phaser.Math.Between(60, 330)
      const by = Phaser.Math.Between(100, 450)
      const delay = b * 250

      this.time.delayedCall(delay, () => {
        const burstGfx = this.add.graphics().setDepth(50)
        const color = Phaser.Math.RND.pick(colors)

        for (let p = 0; p < 16; p++) {
          const angle = (p / 16) * Math.PI * 2
          const speed = Phaser.Math.Between(40, 90)
          const px = { x: bx, y: by }
          const vx = Math.cos(angle) * speed
          const vy = Math.sin(angle) * speed

          particles.push({ gfx: burstGfx, x: px.x, y: px.y, vx, vy, life: 1, color })
        }
      })
    }

    const update = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        particles.forEach((p) => {
          p.x += p.vx * 0.05
          p.y += p.vy * 0.05
          p.vy += 1.5
          p.life -= 0.025
        })
        const activeGfx = new Set(particles.filter((p) => p.life > 0).map((p) => p.gfx))
        activeGfx.forEach((gfx) => gfx.clear())
        particles.filter((p) => p.life > 0).forEach((p) => {
          p.gfx.fillStyle(p.color, p.life)
          p.gfx.fillRect(p.x, p.y, 4, 4)
        })
      },
    })

    this.time.delayedCall(4000, () => {
      update.destroy()
      particles.forEach((p) => p.gfx?.destroy())
      particles.length = 0
    })
  }

  _makeButton(x, y, w, h, label, fillColor, borderColor, callback) {
    const container = this.add.container(x, y).setDepth(10)
    const bg = this.add.graphics()
    bg.fillStyle(fillColor, 0.92)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6)
    bg.lineStyle(2, borderColor, 1)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6)

    const text = this.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
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
}
