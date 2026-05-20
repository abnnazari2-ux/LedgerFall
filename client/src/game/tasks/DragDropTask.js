// DragDropTask.js — Generic drag-drop base task (flowchart ordering, document sorting)
import TaskScene from '../scenes/TaskScene.js'

export default class DragDropTask extends TaskScene {
  constructor() {
    super({ key: 'DragDropTask' })
    this._items = []
    this._dropZones = []
    this._placements = {}
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 6, data?.levelNumber ?? 2, data)
    this._mode = data?.mode ?? 'ordering'  // 'ordering' | 'sorting'
    this._customItems = data?.items ?? null
    this._customZones = data?.zones ?? null
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this.setupBackground(this.worldNumber)
    this._buildLayout()
    this._drawTitle()
    this._drawDropZones()
    this._drawDraggableItems()
    this._drawSubmitButton()
    this.setupHint()
    this.setupNoteHiding()
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 300)

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')
  }

  _buildLayout() {
    if (this._customItems) {
      this._itemData = this._customItems
      this._zoneData = this._customZones
      return
    }

    if (this._mode === 'ordering') {
      this._buildFlowchartData()
    } else {
      this._buildSortingData()
    }
  }

  _buildFlowchartData() {
    // Audit process ordering task
    this._itemData = [
      { id: 1, label: 'Plan the audit\n& assess risk',    correctZone: 1 },
      { id: 2, label: 'Understand\ninternal controls',    correctZone: 2 },
      { id: 3, label: 'Design audit\nprocedures',         correctZone: 3 },
      { id: 4, label: 'Perform\nsubstantive tests',       correctZone: 4 },
      { id: 5, label: 'Evaluate results\n& form opinion', correctZone: 5 },
      { id: 6, label: 'Issue the\naudit report',          correctZone: 6 },
    ]

    this._zoneData = [
      { id: 1, label: 'Step 1', x: this._cx, y: 170 },
      { id: 2, label: 'Step 2', x: this._cx, y: 280 },
      { id: 3, label: 'Step 3', x: this._cx, y: 390 },
      { id: 4, label: 'Step 4', x: this._cx, y: 500 },
      { id: 5, label: 'Step 5', x: this._cx, y: 610 },
      { id: 6, label: 'Step 6', x: this._cx, y: 720 },
    ]
  }

  _buildSortingData() {
    this._itemData = [
      { id: 1, label: 'Invoice £12,000\nSupplier: ABC Ltd',  correctZone: 'payables' },
      { id: 2, label: 'Payment received\nCustomer: XYZ Co', correctZone: 'receivables' },
      { id: 3, label: 'Bank charge £25',                     correctZone: 'bank' },
      { id: 4, label: 'Payroll £45,000',                     correctZone: 'payroll' },
      { id: 5, label: 'Stock count\nVariance £800',          correctZone: 'inventory' },
    ]

    this._zoneData = [
      { id: 'payables',    label: 'Payables',     x: 85,  y: 250 },
      { id: 'receivables', label: 'Receivables',  x: 305, y: 250 },
      { id: 'bank',        label: 'Bank',         x: 85,  y: 450 },
      { id: 'payroll',     label: 'Payroll',      x: 305, y: 450 },
      { id: 'inventory',   label: 'Inventory',    x: this._cx, y: 620 },
    ]
  }

  _drawTitle() {
    const headerBg = this.add.graphics()
    headerBg.fillStyle(0x0a0a22, 0.9)
    headerBg.fillRect(0, 0, this._W, 110)

    this.add.text(this._cx, 28, this.levelData?.levelName ?? (this._mode === 'ordering' ? 'Audit Process Order' : 'Document Sorting'), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.add.text(this._cx, 55, this._mode === 'ordering'
      ? 'Drag steps into the correct order'
      : 'Sort each document into the correct cycle', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
      wordWrap: { width: 340 },
      align: 'center',
    }).setOrigin(0.5)

    // Instructions
    this.add.text(this._cx, 80, '▼ Drag items to the slots below', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#555577',
    }).setOrigin(0.5)
  }

  _drawDropZones() {
    this._zoneData.forEach((zd) => {
      const zone = this.add.container(zd.x, zd.y)

      const bg = this.add.graphics()
      bg.fillStyle(0x111133, 0.6)
      bg.fillRoundedRect(-90, -36, 180, 72, 6)
      bg.lineStyle(2, 0x333366, 0.8)
      bg.strokeRoundedRect(-90, -36, 180, 72, 6)

      const label = this.add.text(0, 0, zd.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#555577',
      }).setOrigin(0.5)

      zone.add([bg, label])
      zone._zoneId = zd.id
      zone._filled = false
      zone._labelText = label
      zone._bg = bg

      this._dropZones.push(zone)
    })
  }

  _drawDraggableItems() {
    // Shuffle items before display
    const shuffled = [...this._itemData].sort(() => Math.random() - 0.5)

    shuffled.forEach((item, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const startX = col === 0 ? 90 : 300
      const startY = 130 + row * 80

      const card = this._makeDraggableCard(item, startX, startY)
      this._items.push({ data: item, container: card, startX, startY, placed: false })
    })
  }

  _makeDraggableCard(item, x, y) {
    const container = this.add.container(x, y)
    const cardW = 160
    const cardH = 64

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a4e, 0.95)
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6)
    bg.lineStyle(2, 0x8888cc, 0.9)
    bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6)

    const text = this.add.text(0, 0, item.label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#FFFFFF',
      wordWrap: { width: 145 },
      align: 'center',
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(cardW, cardH)
    container.setInteractive({ draggable: true, useHandCursor: true })
    this.input.setDraggable(container)

    container._item = item
    container._bg = bg
    container._origX = x
    container._origY = y

    container.on('drag', (_ptr, dx, dy) => {
      container.x = dx
      container.y = dy
      container.setDepth(200)
    })

    container.on('dragend', () => {
      container.setDepth(0)
      const dropped = this._tryDropOnZone(container, item)
      if (!dropped) {
        this.tweens.add({
          targets: container,
          x: container._origX, y: container._origY,
          duration: 250, ease: 'Back.easeOut',
        })
      }
    })

    return container
  }

  _tryDropOnZone(container, item) {
    for (const zone of this._dropZones) {
      const dist = Phaser.Math.Distance.Between(container.x, container.y, zone.x, zone.y)
      if (dist < 85) {
        if (zone._filled) {
          // Return item that was placed there
          const prev = this._items.find((it) => this._placements[it.data.id] === zone._zoneId)
          if (prev) {
            prev.placed = false
            delete this._placements[prev.data.id]
            this.tweens.add({ targets: prev.container, x: prev.startX, y: prev.startY, duration: 250 })
          }
        }

        // Place item
        container.x = zone.x
        container.y = zone.y
        zone._filled = true
        this._placements[item.id] = zone._zoneId

        // Check correct/incorrect
        const correct = String(item.correctZone) === String(zone._zoneId)
        zone._bg.clear()
        zone._bg.fillStyle(correct ? 0x003300 : 0x330000, 0.8)
        zone._bg.fillRoundedRect(-90, -36, 180, 72, 6)
        zone._bg.lineStyle(3, correct ? 0x44ff44 : 0xff4444, 1)
        zone._bg.strokeRoundedRect(-90, -36, 180, 72, 6)

        if (correct) {
          this._showCorrectFeedback(zone)
        } else {
          this._falsePositives++
          this._showIncorrectFeedback(container)
        }

        container._origX = zone.x
        container._origY = zone.y

        this._checkAllPlaced()
        return true
      }
    }
    return false
  }

  _checkAllPlaced() {
    const allPlaced = this._items.every((it) => this._placements[it.data.id] !== undefined)
    if (allPlaced) {
      this._showToast('All items placed! Press SUBMIT.', '#44FF88')
    }
  }

  _drawSubmitButton() {
    this._makeButton(this._cx, 800, 260, 44, 'SUBMIT ORDER', 0x8b0000, 0xff4444, () => {
      this._submitDragDrop()
    })
  }

  _submitDragDrop() {
    const results = this._items.map((it) => ({
      id: it.data.id,
      placed: this._placements[it.data.id] ?? null,
      correct: String(it.data.correctZone) === String(this._placements[it.data.id] ?? ''),
    }))

    const correctCount = results.filter((r) => r.correct).length
    const total = this._items.length

    this._showToast(`${correctCount}/${total} correct`, correctCount === total ? '#44FF88' : '#FFAA44')
    this.time.delayedCall(1000, () => this.submitTask({ placements: results, correctCount, total }))
  }
}
