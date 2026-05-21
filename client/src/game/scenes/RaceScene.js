// RaceScene.js — Race mode with lobby, countdown, real-time progress, podium

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class RaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RaceScene' })
    this._socket = null
    this._players = []
    this._myId = null
    this._raceActive = false
    this._myProgress = 0
  }

  init(data) {
    this._roomId = data?.roomId ?? null
    this._worldNumber = data?.worldNumber ?? 1
    this._levelNumber = data?.levelNumber ?? 1
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this._drawBackground()
    this._showLobby()
  }

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  _showLobby() {
    if (this._lobbyContainer) this._lobbyContainer.destroy()
    const container = this.add.container(0, 0)
    this._lobbyContainer = container

    const bg = this.add.graphics()
    bg.fillStyle(0x0d0d2b, 0.95)
    bg.fillRect(0, 0, this._W, this._H)
    container.add(bg)

    container.add(this.add.text(this._cx, 80, '⚡ RACE MODE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5))

    container.add(this.add.text(this._cx, 120, 'Waiting for players…', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#AAAAAA',
    }).setOrigin(0.5))

    // Player slots
    this._playerSlots = []
    for (let i = 0; i < 4; i++) {
      const slotY = 180 + i * 90
      const slot = this._drawPlayerSlot(this._cx, slotY, null)
      this._playerSlots.push({ container: slot, y: slotY })
      container.add(slot)
    }

    // Room ID display
    if (this._roomId) {
      container.add(this.add.text(this._cx, 580, `Room: ${this._roomId}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#888888',
      }).setOrigin(0.5))
    }

    // Start button (host only)
    const startBtn = this._makeButton(this._cx, 660, 220, 50, '▶ START RACE', 0x8b0000, 0xff4444, () => {
      this._onStartRace()
    })
    container.add(startBtn)

    // Back button
    const backBtn = this._makeButton(this._cx, 740, 160, 40, '◀ BACK', 0x1a1a4e, 0x5555cc, () => {
      this._disconnect()
      this.scene.start('WorldMapScene')
    })
    container.add(backBtn)

    // Connect socket
    this._connectSocket()
  }

  _drawPlayerSlot(x, y, player) {
    const slot = this.add.container(x, y)

    const bg = this.add.graphics()
    if (player) {
      bg.fillStyle(0x1a1a3a, 0.9)
      bg.lineStyle(2, 0x5555cc, 0.8)
    } else {
      bg.fillStyle(0x111122, 0.6)
      bg.lineStyle(2, 0x333355, 0.4)
    }
    bg.fillRoundedRect(-160, -30, 320, 60, 6)
    bg.strokeRoundedRect(-160, -30, 320, 60, 6)
    slot.add(bg)

    if (player) {
      slot.add(this.add.text(-140, 0, player.username || 'Player', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '11px',
        color: '#FFFFFF',
      }).setOrigin(0, 0.5))

      slot.add(this.add.text(120, 0, '🟢 Ready', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#44FF44',
      }).setOrigin(0.5))
    } else {
      slot.add(this.add.text(0, 0, '— waiting —', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#444466',
      }).setOrigin(0.5))
    }

    return slot
  }

  // ── COUNTDOWN ─────────────────────────────────────────────────────────────
  _showCountdown() {
    if (this._lobbyContainer) this._lobbyContainer.destroy()

    const countNums = ['3', '2', '1', 'GO!']
    const colors   = ['#FF4444', '#FFAA44', '#44FF44', '#FFD700']
    let idx = 0

    const countText = this.add.text(this._cx, this._H / 2, '3', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '80px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5)

    const doTick = () => {
      if (idx >= countNums.length) {
        countText.destroy()
        this._startRaceUI()
        return
      }
      countText.setText(countNums[idx])
      countText.setColor(colors[idx])
      countText.setScale(0.5)
      this.tweens.add({
        targets: countText,
        scaleX: 1.2, scaleY: 1.2,
        duration: 600,
        ease: 'Back.easeOut',
        onComplete: () => {
          idx++
          this.time.delayedCall(300, doTick)
        },
      })
    }
    doTick()
  }

  // ── RACE UI ───────────────────────────────────────────────────────────────
  _startRaceUI() {
    this._raceActive = true
    this._drawBackground()

    // Player progress bars
    this._progressBars = {}
    this._players.forEach((player, i) => {
      const barY = 80 + i * 50
      this._drawProgressBar(player, barY)
    })

    // My progress bar highlight
    this.add.text(this._cx, 20, `RACE  ·  World ${this._worldNumber}  Level ${this._levelNumber}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#C8860A',
    }).setOrigin(0.5)

    // Task area (simplified for race — tap document to score a point)
    this._drawRaceTask()
  }

  _drawProgressBar(player, y) {
    const container = this.add.container(0, y)

    const label = this.add.text(10, 0, player.username?.substring(0, 12) || 'Player', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: player.id === this._myId ? '#FFD700' : '#AAAAAA',
    }).setOrigin(0, 0.5)

    const barBg = this.add.graphics()
    barBg.fillStyle(0x222233, 1)
    barBg.fillRect(130, -12, 220, 24)

    const barFill = this.add.graphics()
    this._drawBarFill(barFill, 0, player.id === this._myId)

    const pct = this.add.text(360, 0, '0%', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#AAAAAA',
    }).setOrigin(0, 0.5)

    container.add([barBg, barFill, label, pct])
    this._progressBars[player.id] = { container, barFill, pct }
  }

  _drawBarFill(gfx, progress, isMe) {
    gfx.clear()
    const w = Math.floor(progress * 216)
    if (w <= 0) return
    gfx.fillStyle(isMe ? 0xffd700 : 0x5555cc, 1)
    gfx.fillRect(132, -10, w, 20)
  }

  _drawRaceTask() {
    // Simplified race task — tap invoices as they appear
    this.add.text(this._cx, 340, 'TAP MATCHED INVOICES!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#FFFFFF',
    }).setOrigin(0.5)

    this._spawnRaceInvoice()
  }

  _spawnRaceInvoice() {
    if (!this._raceActive) return

    const correct = Math.random() > 0.3
    const x = Phaser.Math.Between(60, 330)
    const y = Phaser.Math.Between(420, 680)

    const card = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(correct ? 0x1a2a1a : 0x2a1a1a, 0.95)
    bg.fillRoundedRect(-60, -30, 120, 60, 6)
    bg.lineStyle(2, correct ? 0x44aa44 : 0x884444, 1)
    bg.strokeRoundedRect(-60, -30, 120, 60, 6)

    const label = this.add.text(0, -8, correct ? 'MATCH ✓' : 'NO MATCH', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: correct ? '#44FF44' : '#FF4444',
    }).setOrigin(0.5)

    const inv = this.add.text(0, 10, `INV-${Phaser.Math.Between(100, 999)}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    card.add([bg, label, inv])
    card.setSize(120, 60)
    card.setInteractive({ useHandCursor: true })

    let tapped = false
    card.on('pointerdown', () => {
      if (tapped) return
      tapped = true

      if (correct) {
        this._myProgress = Math.min(1, this._myProgress + 0.1)
        this._emitProgress()
        this._showFeedback(x, y, true)
      } else {
        this._showFeedback(x, y, false)
      }

      this.tweens.add({
        targets: card,
        alpha: 0, scaleX: 0.5, scaleY: 0.5,
        duration: 300,
        onComplete: () => {
          card.destroy()
          this.time.delayedCall(300, () => this._spawnRaceInvoice())
        },
      })
    })

    // Auto expire
    this.time.delayedCall(3000, () => {
      if (!tapped && card.active) {
        tapped = true
        this.tweens.add({ targets: card, alpha: 0, duration: 400, onComplete: () => card.destroy() })
        this.time.delayedCall(400, () => this._spawnRaceInvoice())
      }
    })

    // Entrance animation
    card.setAlpha(0)
    this.tweens.add({ targets: card, alpha: 1, duration: 200 })
  }

  _showFeedback(x, y, correct) {
    const t = this.add.text(x, y - 40, correct ? '+10%' : '✗', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: correct ? '#44FF44' : '#FF4444',
    }).setOrigin(0.5).setDepth(400)

    this.tweens.add({
      targets: t,
      y: y - 80, alpha: 0,
      duration: 800,
      onComplete: () => t.destroy(),
    })
  }

  // ── PODIUM ────────────────────────────────────────────────────────────────
  _showPodium(results) {
    this._raceActive = false
    this.children.removeAll(true)
    this._drawBackground()

    this.add.text(this._cx, 60, '🏆 RACE RESULTS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    const medals = ['🥇', '🥈', '🥉', '4️⃣']
    const podiumColors = [0x8b6914, 0x888888, 0x8b4513, 0x333333]

    results.forEach((result, i) => {
      const y = 160 + i * 100
      const isMe = result.id === this._myId

      const row = this.add.container(this._cx, y)
      const bg = this.add.graphics()
      bg.fillStyle(podiumColors[i] ?? 0x222222, isMe ? 0.9 : 0.5)
      bg.fillRoundedRect(-170, -36, 340, 72, 6)
      bg.lineStyle(2, isMe ? 0xffd700 : 0x444444, 1)
      bg.strokeRoundedRect(-170, -36, 340, 72, 6)

      row.add([bg,
        this.add.text(-145, 0, medals[i] || `${i + 1}.`, { fontSize: '24px' }).setOrigin(0, 0.5),
        this.add.text(-100, -10, result.username || 'Player', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '10px',
          color: isMe ? '#FFD700' : '#FFFFFF',
        }).setOrigin(0, 0),
        this.add.text(-100, 12, `${Math.round(result.progress * 100)}% complete`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#AAAAAA',
        }).setOrigin(0, 0),
        this.add.text(130, 0, `+${result.xpBonus || 0} XP`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '10px',
          color: '#44FF88',
        }).setOrigin(0.5),
      ])
    })

    this._makeButton(this._cx, 680, 220, 50, 'PLAY AGAIN', 0x8b0000, 0xff4444, () => {
      this.scene.start('RaceScene', { worldNumber: this._worldNumber, levelNumber: this._levelNumber })
    })

    this._makeButton(this._cx, 750, 200, 40, 'MAIN MENU', 0x1a1a4e, 0x5555cc, () => {
      this.scene.start('WorldMapScene')
    })
  }

  // ── Socket ────────────────────────────────────────────────────────────────
  _connectSocket() {
    const token = localStorage.getItem('ledgerfall_token')
    if (!token) return

    try {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
      // Dynamic import to avoid hard dependency
      import('socket.io-client').then(({ io }) => {
        this._socket = io(socketUrl, {
          auth: { token },
          reconnection: false,
        })

        this._socket.on('connect', () => {
          this._myId = this._socket.id
          this._socket.emit('race:join', { roomId: this._roomId, worldNumber: this._worldNumber, levelNumber: this._levelNumber })
        })

        this._socket.on('race:playerJoined', ({ players }) => {
          this._players = players
          this._updateLobbySlots()
        })

        this._socket.on('race:countdown', () => {
          this._showCountdown()
        })

        this._socket.on('race:progress', ({ playerId, progress }) => {
          this._updateProgressBar(playerId, progress)
        })

        this._socket.on('race:finished', ({ results }) => {
          this._showPodium(results)
        })
      }).catch(() => {
        // Socket.io not available — solo mode fallback
        this._players = [{ id: 'local', username: localStorage.getItem('ledgerfall_user') ? JSON.parse(localStorage.getItem('ledgerfall_user')).username : 'You' }]
        this._myId = 'local'
        this._updateLobbySlots()
      })
    } catch (err) {
      console.warn('[RaceScene] Socket connection error:', err)
    }
  }

  _updateLobbySlots() {
    this._playerSlots.forEach((slot, i) => {
      const player = this._players[i] ?? null
      if (slot.container && slot.container.active) {
        slot.container.destroy()
      }
      const newSlot = this._drawPlayerSlot(this._cx, slot.y, player)
      if (this._lobbyContainer && this._lobbyContainer.active) {
        this._lobbyContainer.add(newSlot)
      }
      slot.container = newSlot
    })
  }

  _emitProgress() {
    if (this._socket?.connected) {
      this._socket.emit('race:progress', { progress: this._myProgress })
    }
    this._updateProgressBar(this._myId, this._myProgress)

    if (this._myProgress >= 1) {
      this._raceActive = false
      if (this._socket?.connected) {
        this._socket.emit('race:complete')
      } else {
        // Solo: show podium
        this._showPodium([
          { id: 'local', username: 'You', progress: 1, xpBonus: 200 },
        ])
      }
    }
  }

  _updateProgressBar(playerId, progress) {
    const bar = this._progressBars?.[playerId]
    if (!bar) return
    this._drawBarFill(bar.barFill, progress, playerId === this._myId)
    bar.pct.setText(`${Math.round(progress * 100)}%`)
  }

  _onStartRace() {
    if (this._socket?.connected) {
      this._socket.emit('race:startCountdown', { roomId: this._roomId })
    } else {
      // Solo fallback
      this._showCountdown()
    }
  }

  _disconnect() {
    if (this._socket) {
      this._socket.disconnect()
      this._socket = null
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _drawBackground() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0d0d2b, 1)
    bg.fillRect(0, 0, this._W, this._H)
    bg.lineStyle(1, 0x1a1a4e, 0.5)
    for (let y = 0; y < this._H; y += 40) bg.lineBetween(0, y, this._W, y)
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

  shutdown() {
    this._disconnect()
  }
}
