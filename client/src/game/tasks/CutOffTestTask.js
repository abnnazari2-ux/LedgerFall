// CutOffTestTask.js — Cut-off testing task
import TaskScene from '../scenes/TaskScene.js'
import { generateInvoiceMatchDataset } from '../data/datasetEngine.js'

export default class CutOffTestTask extends TaskScene {
  constructor() {
    super({ key: 'CutOffTestTask' })
    this._decisions = {}
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 1, data?.levelNumber ?? 3, data)
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this.setupBackground(this.worldNumber)
    this._buildDataset()
    this._drawHeader()
    this._drawInvoiceList()
    this._drawSubmitButton()

    this.setupHint()
    this.setupNoteHiding()
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 300)

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')
  }

  _buildDataset() {
    const seed = this.worldNumber * 100 + this.levelNumber
    const base = generateInvoiceMatchDataset(seed, 10)
    this._yearEnd = '31/03/2024'

    // Annotate with GRN dates and cut-off classification
    this._items = base.invoices.map((inv, i) => {
      // Create dates around year-end
      const beforeYE = i % 3 !== 0
      const invDateOffset = beforeYE ? -(i + 1) * 3 : (i % 2 === 0 ? (i + 1) * 2 : -(i + 2))
      const grnDateOffset = beforeYE ? invDateOffset + Phaser.Math.Between(-5, 5) : invDateOffset + Phaser.Math.Between(-3, 8)

      const ye = new Date('2024-03-31')
      const invDate = new Date(ye)
      invDate.setDate(invDate.getDate() + invDateOffset)
      const grnDate = new Date(ye)
      grnDate.setDate(grnDate.getDate() + grnDateOffset)

      const formatDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })

      // Correct classification
      let correct
      if (invDate <= ye && grnDate <= ye) {
        correct = 'Period A'         // Both before YE — expense in Period A
      } else if (invDate <= ye && grnDate > ye) {
        correct = 'Accrue Period A'  // Invoice before YE, goods after — accrue
      } else {
        correct = 'Period B'         // Both after — Period B
      }

      return {
        ...inv,
        invoiceDate: formatDate(invDate),
        grnDate: formatDate(grnDate),
        correct,
      }
    })
  }

  _drawHeader() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.92)
    bg.fillRect(0, 0, this._W, 105)

    this.add.text(this._cx, 18, this.levelData?.levelName ?? 'Cut-Off Test', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.add.text(this._cx, 44, `Year End: ${this._yearEnd}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.add.text(this._cx, 68, 'Classify each invoice: Period A / Accrue / Period B', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#AAAAAA',
      align: 'center',
      wordWrap: { width: 360 },
    }).setOrigin(0.5)

    this.add.text(this._cx, 88, '─────────────────────────────────────', {
      fontSize: '6px',
      color: '#333366',
    }).setOrigin(0.5)
  }

  _drawInvoiceList() {
    this._itemRows = []
    this._items.forEach((item, i) => {
      const y = 118 + i * 70
      if (y > 740) return
      this._drawItemRow(item, y)
    })
  }

  _drawItemRow(item, y) {
    const container = this.add.container(0, y)

    // Row background
    const bg = this.add.graphics()
    bg.fillStyle(i => i % 2 === 0 ? 0x0d0d22 : 0x111133, 0.9)
    bg.fillRect(0, 0, this._W, 64)
    bg.fillStyle(0x0d0d22, 0.9)
    bg.fillRect(0, 0, this._W, 64)
    container.add(bg)

    // Invoice number and supplier
    container.add(this.add.text(8, 5, `${item.number}  ·  ${(item.supplier || '').substring(0, 12)}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#FFFFFF',
    }))

    // Amount
    container.add(this.add.text(8, 22, `£${(item.amount || 0).toLocaleString('en-GB')}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FFD700',
    }))

    // Dates
    container.add(this.add.text(8, 40, `Inv: ${item.invoiceDate}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#AAAAFF',
    }))

    container.add(this.add.text(150, 40, `GRN: ${item.grnDate}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#AAFFAA',
    }))

    // Classify button
    const current = this._decisions[item.id]
    const btn = this.add.text(this._W - 14, 32, current ? current : '[CLASSIFY]', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: current ? '#FFD700' : '#555577',
      backgroundColor: '#111133',
      padding: { x: 4, y: 4 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })

    btn.on('pointerdown', () => {
      this._showCutOffMenu(item, btn)
    })

    container.add(btn)
    container._item = item
    container._btn = btn
    this._itemRows.push(container)
  }

  _showCutOffMenu(item, btn) {
    if (this._cutMenu) this._cutMenu.destroy()

    const opts = [
      { label: 'Period A',      hint: 'Expense before YE',        color: 0x003366 },
      { label: 'Accrue Period A', hint: 'Invoice before / GRN after', color: 0x334400 },
      { label: 'Period B',      hint: 'Expense after YE',         color: 0x330044 },
    ]

    const menu = this.add.container(this._cx, 450).setDepth(400)
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.97)
    bg.fillRoundedRect(-165, -80, 330, 160, 8)
    bg.lineStyle(2, 0xc8860a, 1)
    bg.strokeRoundedRect(-165, -80, 330, 160, 8)
    menu.add(bg)

    opts.forEach((opt, i) => {
      const by = -55 + i * 54
      const obg = this.add.graphics()
      obg.fillStyle(opt.color, 0.9)
      obg.fillRoundedRect(-150, by - 18, 300, 36, 5)
      menu.add(obg)

      const labelT = this.add.text(-140, by - 5, opt.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#FFFFFF',
      })
      const hintT = this.add.text(-140, by + 9, opt.hint, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#AAAAAA',
      })
      menu.add([labelT, hintT])

      obg.setInteractive(new Phaser.Geom.Rectangle(-150, by - 18, 300, 36), Phaser.Geom.Rectangle.Contains)
      obg.on('pointerdown', () => {
        this._decisions[item.id] = opt.label
        btn.setText(opt.label.substring(0, 9))
        btn.setColor('#FFD700')
        menu.destroy()
        this._cutMenu = null
      })
    })

    this._cutMenu = menu
  }

  _drawSubmitButton() {
    this._makeButton(this._cx, 800, 280, 40, 'SUBMIT CUT-OFF TEST', 0x8b0000, 0xff4444, () => {
      this._submitCutOff()
    })
  }

  _submitCutOff() {
    const results = this._items.map((item) => {
      const chosen = this._decisions[item.id] ?? 'SKIP'
      const correct = chosen === item.correct
      if (!correct && chosen !== 'SKIP') this._falsePositives++
      return { id: item.id, chosen, correct, expected: item.correct }
    })

    const correctCount = results.filter((r) => r.correct).length
    this._showToast(`${correctCount}/${this._items.length} correct cut-off decisions`, correctCount >= this._items.length * 0.7 ? '#44FF88' : '#FFAA44')
    this.time.delayedCall(1200, () => this.submitTask({ results, correctCount, total: this._items.length }))
  }
}
