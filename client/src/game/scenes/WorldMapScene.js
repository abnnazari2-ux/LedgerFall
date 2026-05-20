// WorldMapScene.js — World map showing all 6 worlds
import { WORLDS_DATA } from '../data/worldsData.js'

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

const WORLD_POSITIONS = [
  { x: 70,  y: 700 },
  { x: 170, y: 580 },
  { x: 290, y: 640 },
  { x: 110, y: 460 },
  { x: 250, y: 380 },
  { x: 195, y: 240 },
]

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' })
  }

  init(data) {
    this._highlightWorld = data?.currentWorld ?? null
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    // Load progress
    this._currentWorld = parseInt(localStorage.getItem('lf_current_world') || '1', 10)
    this._unlockedWorlds = this._getUnlockedWorlds()
    this._worldStars = this._getWorldStars()

    this._drawBackground()
    this._drawPath()
    this._drawWorldNodes()
    this._drawHUD()
    this._launchHUDScene()

    // Back button
    this._makeButton(40, 810, 70, 36, '◀ BACK', 0x1a1a4e, 0x5555cc, () => {
      this.scene.start('MainMenuScene')
    })

    // Title
    this.add.text(this._cx, 40, 'WORLD MAP', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(this._cx, 65, 'Rise Through the Audit', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#888888',
    }).setOrigin(0.5)
  }

  _getUnlockedWorlds() {
    try {
      return JSON.parse(localStorage.getItem('lf_unlocked_worlds') || '[1]')
    } catch {
      return [1]
    }
  }

  _getWorldStars() {
    try {
      return JSON.parse(localStorage.getItem('lf_world_stars') || '{}')
    } catch {
      return {}
    }
  }

  _drawBackground() {
    if (hasAsset('world_map')) {
      const bg = this.add.image(this._cx, this._H / 2, 'world_map')
      bg.setDisplaySize(this._W, this._H)
    } else {
      // Pixel art map fallback
      const bg = this.add.graphics()
      bg.fillStyle(0x0d1a0d, 1)
      bg.fillRect(0, 0, this._W, this._H)

      // Land masses
      bg.fillStyle(0x1a3a1a, 0.6)
      bg.fillEllipse(100, 650, 180, 140)
      bg.fillEllipse(240, 590, 160, 120)
      bg.fillEllipse(150, 460, 200, 120)
      bg.fillEllipse(270, 380, 180, 100)
      bg.fillEllipse(200, 250, 160, 120)

      // Water areas
      bg.fillStyle(0x0a1a2a, 0.7)
      bg.fillEllipse(195, 770, 380, 80)

      // Grid lines
      bg.lineStyle(1, 0x224422, 0.3)
      for (let x = 0; x < this._W; x += 30) bg.lineBetween(x, 0, x, this._H)
      for (let y = 0; y < this._H; y += 30) bg.lineBetween(0, y, this._W, y)
    }
  }

  _drawPath() {
    // Dotted path connecting world nodes
    const gfx = this.add.graphics()
    for (let i = 0; i < WORLD_POSITIONS.length - 1; i++) {
      const a = WORLD_POSITIONS[i]
      const b = WORLD_POSITIONS[i + 1]
      const steps = 16
      for (let s = 0; s <= steps; s++) {
        if (s % 2 === 0) continue
        const t = s / steps
        const px = Phaser.Math.Linear(a.x, b.x, t)
        const py = Phaser.Math.Linear(a.y, b.y, t)
        const unlocked = this._unlockedWorlds.includes(i + 2)
        gfx.fillStyle(unlocked ? 0xc8860a : 0x444444, unlocked ? 0.8 : 0.4)
        gfx.fillCircle(px, py, 4)
      }
    }
  }

  _drawWorldNodes() {
    WORLDS_DATA.forEach((world, i) => {
      const pos = WORLD_POSITIONS[i]
      const unlocked = this._unlockedWorlds.includes(world.worldNumber)
      const isCurrent = world.worldNumber === this._currentWorld
      const stars = this._worldStars[world.worldNumber] || 0

      this._drawWorldNode(world, pos.x, pos.y, unlocked, isCurrent, stars)
    })
  }

  _drawWorldNode(world, x, y, unlocked, isCurrent, stars) {
    const container = this.add.container(x, y)

    // Outer glow for current world
    if (isCurrent) {
      const glow = this.add.graphics()
      glow.fillStyle(0xc8860a, 0.2)
      glow.fillCircle(0, 0, 46)
      container.add(glow)

      this.tweens.add({
        targets: glow,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0,
        duration: 1200,
        repeat: -1,
        ease: 'Sine.easeOut',
      })
    }

    // Node circle
    const node = this.add.graphics()
    if (unlocked) {
      node.fillStyle(parseInt(world.themeColor.replace('#', ''), 16), 1)
    } else {
      node.fillStyle(0x333333, 1)
    }
    node.fillCircle(0, 0, 34)
    node.lineStyle(3, unlocked ? 0xffffff : 0x555555, 1)
    node.strokeCircle(0, 0, 34)
    container.add(node)

    // World number
    const numText = this.add.text(0, -6, String(world.worldNumber), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: unlocked ? '#FFFFFF' : '#666666',
    }).setOrigin(0.5)
    container.add(numText)

    // World name below
    const nameText = this.add.text(0, 46, world.worldName.split(' ').slice(0, 2).join('\n'), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: unlocked ? '#DDDDDD' : '#666666',
      align: 'center',
    }).setOrigin(0.5, 0)
    container.add(nameText)

    // Padlock if locked
    if (!unlocked) {
      const lock = this.add.text(0, 12, '🔒', { fontSize: '14px' }).setOrigin(0.5)
      container.add(lock)
    }

    // Stars
    for (let s = 0; s < 3; s++) {
      const sx = (s - 1) * 16
      const star = this.add.text(sx, 28, s < Math.floor(stars / 5) ? '⭐' : '☆', {
        fontSize: '9px',
        color: '#FFD700',
      }).setOrigin(0.5)
      container.add(star)
    }

    // Interactivity
    if (unlocked) {
      container.setSize(80, 80)
      container.setInteractive({ useHandCursor: true })

      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.1, scaleY: 1.1, duration: 100 })
        this._showWorldTooltip(world, x, y - 80)
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
          onComplete: () => {
            this.scene.start('LevelSelectScene', { worldNumber: world.worldNumber })
          },
        })
      })
    }
  }

  _showWorldTooltip(world, x, y) {
    if (this._tooltip) this._tooltip.destroy()

    const tooltip = this.add.container(x, y).setDepth(300)
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.95)
    bg.fillRoundedRect(-80, -30, 160, 60, 6)
    bg.lineStyle(2, parseInt(world.themeColor.replace('#', ''), 16), 1)
    bg.strokeRoundedRect(-80, -30, 160, 60, 6)

    const name = this.add.text(0, -14, world.worldName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#FFFFFF',
      wordWrap: { width: 150 },
      align: 'center',
    }).setOrigin(0.5)

    const sub = this.add.text(0, 14, '5 Levels · Tap to Enter', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    tooltip.add([bg, name, sub])
    this._tooltip = tooltip
  }

  _drawHUD() {
    // Minimal top bar
    const bar = this.add.graphics()
    bar.fillStyle(0x0a0a22, 0.85)
    bar.fillRect(0, 0, this._W, 80)

    const xp = parseInt(localStorage.getItem('lf_xp') || '0', 10)
    const coins = parseInt(localStorage.getItem('lf_coins') || '0', 10)
    const lives = parseInt(localStorage.getItem('lf_lives') || '3', 10)

    this.add.text(20, 20, `☕×${lives}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#DDDDDD',
    })

    this.add.text(this._cx, 20, `⭐ ${xp} XP`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#FFD700',
    }).setOrigin(0.5, 0)

    this.add.text(this._W - 20, 20, `🪙 ${coins}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#FFD700',
    }).setOrigin(1, 0)
  }

  _launchHUDScene() {
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene')
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
