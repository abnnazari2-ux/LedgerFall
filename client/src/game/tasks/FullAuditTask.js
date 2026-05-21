// FullAuditTask.js — Boss Level: Sequential mini-tasks across all 6 cycles
import TaskScene from '../scenes/TaskScene.js'

export default class FullAuditTask extends TaskScene {
  constructor() {
    super({ key: 'FullAuditTask' })
    this._cycleIndex = 0
    this._cycleResults = []
    this._currentSubTask = null
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 6, data?.levelNumber ?? 5, data)
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this._cycles = [
      { name: 'Payables',    scene: 'InvoiceMatchTask',     world: 1, level: 1 },
      { name: 'Receivables', scene: 'FindDuplicatesTask',   world: 2, level: 1 },
      { name: 'Bank',        scene: 'BankReconciliationTask',world: 3, level: 1 },
      { name: 'Payroll',     scene: 'FindDuplicatesTask',   world: 4, level: 1 },
      { name: 'Inventory',   scene: 'DragDropTask',         world: 5, level: 1 },
      { name: 'Fraud',       scene: 'FraudInvestigationTask',world: 6, level: 1 },
    ]

    this.setupBackground(this.worldNumber)
    this._drawHeader()
    this._drawCycleProgress()
    this._drawInstructions()

    // Timer for the full audit: 20 minutes
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 1200)

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')

    // Start the first cycle
    this.time.delayedCall(1500, () => this._startNextCycle())
  }

  _drawHeader() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.92)
    bg.fillRect(0, 0, this._W, 110)

    this.add.text(this._cx, 22, '👑 FULL AUDIT — BOSS LEVEL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(this._cx, 50, 'Complete all 6 audit cycles', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    this.add.text(this._cx, 72, 'Each cycle is a mini-task. Good luck!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#888888',
    }).setOrigin(0.5)

    const sep = this.add.graphics()
    sep.lineStyle(2, 0xffd700, 0.5)
    sep.lineBetween(20, 96, this._W - 20, 96)
  }

  _drawCycleProgress() {
    this._cycleNodes = []

    this._cycles.forEach((cycle, i) => {
      const x = 32 + i * 57
      const y = 135

      const container = this.add.container(x, y)

      const nodeGfx = this.add.graphics()
      nodeGfx.fillStyle(0x222233, 1)
      nodeGfx.fillCircle(0, 0, 22)
      nodeGfx.lineStyle(2, 0x444466, 1)
      nodeGfx.strokeCircle(0, 0, 22)

      const numText = this.add.text(0, -4, String(i + 1), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '11px',
        color: '#555577',
      }).setOrigin(0.5)

      const nameText = this.add.text(0, 28, cycle.name, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#444466',
        align: 'center',
      }).setOrigin(0.5)

      container.add([nodeGfx, numText, nameText])
      this._cycleNodes.push({ container, nodeGfx, numText, nameText, status: 'pending' })
    })

    // Connecting lines between nodes
    const lineGfx = this.add.graphics()
    for (let i = 0; i < this._cycles.length - 1; i++) {
      const x1 = 32 + i * 57 + 22
      const x2 = 32 + (i + 1) * 57 - 22
      lineGfx.lineStyle(2, 0x333355, 0.7)
      lineGfx.lineBetween(x1, 135, x2, 135)
    }
  }

  _drawInstructions() {
    this.add.text(this._cx, 185, 'Each cycle will launch as a\nquick mini-task. Complete all\n6 cycles to pass the boss level.', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#DDDDDD',
      align: 'center',
      wordWrap: { width: 340 },
    }).setOrigin(0.5)

    this.add.text(this._cx, 260, 'Starting in 1.5 seconds…', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#C8860A',
    }).setOrigin(0.5)
  }

  _startNextCycle() {
    if (this._cycleIndex >= this._cycles.length) {
      this._showFinalReport()
      return
    }

    const cycle = this._cycles[this._cycleIndex]

    // Update progress indicator
    const node = this._cycleNodes[this._cycleIndex]
    node.nodeGfx.clear()
    node.nodeGfx.fillStyle(0xc8860a, 1)
    node.nodeGfx.fillCircle(0, 0, 22)
    node.nodeGfx.lineStyle(3, 0xffd700, 1)
    node.nodeGfx.strokeCircle(0, 0, 22)
    node.numText.setColor('#FFD700')
    node.nameText.setColor('#C8860A')

    // Show transition panel
    this._showCycleTransition(cycle, () => {
      // Launch the sub-scene
      this.scene.launch(cycle.scene, {
        worldNumber: cycle.world,
        levelNumber: cycle.level,
        isSubTask: true,
        onComplete: (result) => this._onCycleComplete(result),
      })
      // Pause this scene while sub-task runs
      this.scene.pause('FullAuditTask')
    })
  }

  _showCycleTransition(cycle, callback) {
    const panel = this.add.container(this._cx, this._H / 2).setDepth(500).setScale(0)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.9)
    bg.fillRect(-195, -422, 390, 844)

    const inner = this.add.graphics()
    inner.fillStyle(0x0a0a22, 0.97)
    inner.fillRoundedRect(-160, -90, 320, 180, 10)
    inner.lineStyle(3, 0xc8860a, 1)
    inner.strokeRoundedRect(-160, -90, 320, 180, 10)

    const cycleNum = this.add.text(0, -65, `CYCLE ${this._cycleIndex + 1} / ${this._cycles.length}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5)

    const name = this.add.text(0, -30, cycle.name.toUpperCase(), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    const ready = this.add.text(0, 20, 'GET READY!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#FFFFFF',
    }).setOrigin(0.5)

    panel.add([bg, inner, cycleNum, name, ready])

    this.tweens.add({
      targets: panel,
      scaleX: 1, scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: panel,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              panel.destroy()
              callback()
            },
          })
        })
      },
    })
  }

  _onCycleComplete(result) {
    // Resume FullAuditTask
    this.scene.resume('FullAuditTask')

    const cycle = this._cycles[this._cycleIndex]
    const node = this._cycleNodes[this._cycleIndex]

    // Mark as complete
    node.nodeGfx.clear()
    node.nodeGfx.fillStyle(0x006600, 1)
    node.nodeGfx.fillCircle(0, 0, 22)
    node.nodeGfx.lineStyle(3, 0x44ff44, 1)
    node.nodeGfx.strokeCircle(0, 0, 22)
    node.numText.setText('✓')
    node.numText.setColor('#44FF44')
    node.nameText.setColor('#44FF44')

    this._cycleResults.push({
      cycle: cycle.name,
      index: this._cycleIndex,
      result,
      xp: result?.finalXP ?? 50,
    })

    this._cycleIndex++

    // Brief pause then start next cycle
    this.time.delayedCall(800, () => this._startNextCycle())
  }

  _showFinalReport() {
    this.pauseTimer()
    this.children.removeAll(true)
    this.setupBackground(this.worldNumber)

    this.add.text(this._cx, 60, '📋 FINAL AUDIT REPORT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(this._cx, 95, 'Cycle Results:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    let totalXP = 0
    this._cycleResults.forEach((r, i) => {
      const y = 130 + i * 68
      const bg = this.add.graphics()
      bg.fillStyle(0x111133, 0.9)
      bg.fillRoundedRect(15, y - 24, this._W - 30, 56, 5)

      this.add.text(25, y - 12, `${r.cycle}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#FFFFFF',
      })
      this.add.text(25, y + 8, '✓ Complete', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#44FF44',
      })
      this.add.text(this._W - 25, y - 2, `+${r.xp} XP`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#FFD700',
      }).setOrigin(1, 0.5)

      totalXP += r.xp
    })

    this.add.text(this._cx, 570, `TOTAL: +${totalXP} XP`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#44FF88',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(this._cx, 620, '🏆 FULL AUDIT COMPLETE!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#FFD700',
    }).setOrigin(0.5)

    // Build final report and submit to AI
    this._makeButton(this._cx, 700, 280, 52, 'WRITE FINAL REPORT', 0x8b0000, 0xff4444, () => {
      this.scene.start('AuditFindingTask', {
        worldNumber: this.worldNumber,
        levelNumber: this.levelNumber,
        scenario: 'Final Audit Report: Summarise all findings from the 6 audit cycles completed above.',
      })
    })

    this._makeButton(this._cx, 775, 220, 40, 'SKIP TO VICTORY', 0x1a3a1a, 0x44aa44, () => {
      this._fraudDetected = this._cycleResults.some((r) => r.result?.fraudDetected)
      this.submitTask({ cycles: this._cycleResults, totalXP })
    })
  }
}
