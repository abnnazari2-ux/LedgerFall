// InvoiceMatchTask.js — Type A: Drag-and-drop invoice-to-GRN matching
import TaskScene from '../scenes/TaskScene.js'
import { generateInvoiceMatchDataset } from '../data/datasetEngine.js'

function hasAsset(key) {
  return !window.__LF_MISSING_ASSETS?.has(key)
}

export default class InvoiceMatchTask extends TaskScene {
  constructor() {
    super({ key: 'InvoiceMatchTask' })
    this._invoices = []
    this._grns = []
    this._matches = []   // { invoiceId, grnId }
    this._dataset = null
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 1, data?.levelNumber ?? 1, data)
  }

  create() {
    this._W = 390
    this._H = 844

    this.setupBackground(this.worldNumber)
    this._buildDataset()
    this._drawUI()
    this._drawInvoices()
    this._drawGRNs()
    this.setupHint()
    this.setupNoteHiding()
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 240)

    // Launch HUD
    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')

    this._drawSubmitButton()
  }

  _buildDataset() {
    const seed = this.worldNumber * 100 + this.levelNumber
    const count = this.levelData?.itemCount ?? 8
    this._dataset = generateInvoiceMatchDataset(seed, count)
  }

  _drawUI() {
    // Panel headers
    this.add.text(98, 90, 'INVOICES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#AAAAFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.add.text(292, 90, 'GRNs', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#AAFFAA',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    // Center divider
    const div = this.add.graphics()
    div.lineStyle(2, 0x333366, 0.7)
    div.lineBetween(195, 100, 195, 750)

    // Task title
    this.add.text(195, 65, this.levelData?.levelName ?? 'Invoice Matching', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
  }

  _drawInvoices() {
    const invoices = this._dataset.invoices
    const startY = 120
    const spacing = 74
    const panelH = Math.min(620, invoices.length * spacing + 20)

    // Scroll container (simplified — no real scroll plugin needed for 8 items)
    invoices.forEach((inv, i) => {
      const y = startY + i * spacing
      if (y > 740) return // Skip if out of screen

      const card = this._makeDocCard(inv, 98, y, false)
      this._invoices.push({ data: inv, container: card, matched: false, x: 98, y })
    })
  }

  _drawGRNs() {
    const grns = this._dataset.grns
    const startY = 120
    const spacing = 74

    grns.forEach((grn, i) => {
      const y = startY + i * spacing
      if (y > 740) return

      const card = this._makeDocCard(grn, 292, y, true)
      this._grns.push({ data: grn, container: card, occupied: false, x: 292, y })
    })
  }

  _makeDocCard(doc, x, y, isGRN) {
    const container = this.add.container(x, y)
    const cardW = 178
    const cardH = 64

    const bgKey = isGRN ? 'grn_doc' : 'invoice_doc'
    if (hasAsset(bgKey)) {
      const img = this.add.image(0, 0, bgKey).setDisplaySize(cardW, cardH)
      container.add(img)
    } else {
      const bg = this.add.graphics()
      bg.fillStyle(isGRN ? 0x0a2a0a : 0x0a0a2a, 0.9)
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 4)
      bg.lineStyle(2, isGRN ? 0x44aa44 : 0x4444aa, 0.9)
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 4)
      container.add(bg)
    }

    // Text overlay
    const docNum = this.add.text(-80, -20, doc.number, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#FFFFFF',
    })
    const supplier = this.add.text(-80, -4, doc.supplier?.substring(0, 18) ?? '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#CCCCCC',
    })
    const amount = this.add.text(-80, 10, `£${doc.amount?.toLocaleString('en-GB') ?? '0'}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#FFD700',
    })
    const date = this.add.text(-80, 24, doc.date ?? '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#AAAAAA',
    })

    container.add([docNum, supplier, amount, date])
    container._doc = doc
    container._isGRN = isGRN

    // Make invoices draggable
    if (!isGRN) {
      container.setSize(cardW, cardH)
      container.setInteractive({ draggable: true, useHandCursor: true })
      this.input.setDraggable(container)

      container.on('drag', (_ptr, dx, dy) => {
        container.x = dx
        container.y = dy
      })

      container.on('dragend', () => {
        if (container._matched) return
        const dropped = this._tryDrop(container)
        if (!dropped) {
          // Snap back
          const inv = this._invoices.find((i) => i.container === container)
          if (inv) {
            this.tweens.add({
              targets: container,
              x: inv.x, y: inv.y,
              duration: 250,
              ease: 'Back.easeOut',
            })
          }
        }
      })
    }

    return container
  }

  _tryDrop(invContainer) {
    for (const grn of this._grns) {
      if (grn.occupied) continue
      const dist = Phaser.Math.Distance.Between(invContainer.x, invContainer.y, grn.x, grn.y)
      if (dist < 90) {
        const invData = invContainer._doc
        const grnData = grn.data
        const isMatch = invData.matchId === grnData.matchId

        if (isMatch) {
          // Correct match
          invContainer._matched = true
          grn.occupied = true
          grn.container._occupied = true

          // Snap invoice to GRN position
          this.tweens.add({
            targets: invContainer,
            x: grn.x, y: grn.y,
            duration: 200,
            ease: 'Power2',
          })

          // Green glow
          this._showCorrectFeedback(grn.container)

          // Lock both with grey tint
          this.time.delayedCall(300, () => {
            invContainer.alpha = 0.5
            grn.container.alpha = 0.5
          })

          this._matches.push({ invoiceId: invData.id, grnId: grnData.id, correct: true })
          this._checkAllDone()
          return true
        } else {
          // Wrong match — shake
          this._showIncorrectFeedback(invContainer)
          this._falsePositives++

          const inv = this._invoices.find((i) => i.container === invContainer)
          if (inv) {
            this.tweens.add({
              targets: invContainer,
              x: inv.x, y: inv.y,
              duration: 300,
              ease: 'Back.easeOut',
            })
          }
          return true
        }
      }
    }
    return false
  }

  _checkAllDone() {
    const allMatched = this._invoices.every((inv) => inv.container._matched)
    if (allMatched) {
      this._showToast('All invoices matched! Press SIGN OFF.', '#44FF88')
    }
  }

  _drawSubmitButton() {
    this._makeButton(195, 800, 280, 44, 'SIGN OFF WORKING PAPER', 0x8b0000, 0xff4444, () => {
      this._submitInvoiceTask()
    })
  }

  _submitInvoiceTask() {
    // Auto-flag unmatched invoices as EXCEPTION
    this._invoices.forEach((inv) => {
      if (!inv.container._matched) {
        this._matches.push({ invoiceId: inv.data.id, grnId: null, correct: false, autoFlagged: 'EXCEPTION' })
      }
    })

    // Check if fraud invoice was detected
    const fraudInv = this._dataset.invoices.find((i) => i.isFraud)
    if (fraudInv) {
      const fraudMatch = this._matches.find((m) => m.invoiceId === fraudInv.id && m.autoFlagged === 'EXCEPTION')
      if (fraudMatch) this._fraudDetected = true
    }

    this.submitTask({ matches: this._matches })
  }
}
