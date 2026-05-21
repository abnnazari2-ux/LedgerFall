// AuditFindingTask.js — Type E: Written audit finding with AI grading
import TaskScene from '../scenes/TaskScene.js'

export default class AuditFindingTask extends TaskScene {
  constructor() {
    super({ key: 'AuditFindingTask' })
    this._fields = {}
    this._domInputs = {}
    this._submitting = false
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 1, data?.levelNumber ?? 5, data)
    this._scenario = data?.scenario ?? null
    this._rubric = data?.rubric ?? null
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this.setupBackground(this.worldNumber)
    this._drawTitle()
    this._drawScenario()
    this._drawFindingForm()
    this._drawSubmitButton()

    this.setupHint()
    this.setupNoteHiding()
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 600)

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')
  }

  _drawTitle() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.92)
    bg.fillRect(0, 0, this._W, 90)

    this.add.text(this._cx, 20, this.levelData?.levelName ?? 'Written Audit Finding', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#C8860A',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.add.text(this._cx, 48, 'Write a formal audit finding below', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#AAAAAA',
    }).setOrigin(0.5)

    this.add.text(this._cx, 68, 'Min 20 words per field | AI Graded', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#888888',
    }).setOrigin(0.5)
  }

  _drawScenario() {
    const scenarioText = this._scenario
      || this.levelData?.description
      || 'During the audit of accounts payable, you identified that supplier invoices are being approved by the same employee who raises the purchase orders — a breach of segregation of duties. Three payments totalling £120,000 were made to a supplier whose details could not be verified.'

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a0a, 0.9)
    bg.fillRoundedRect(10, 98, this._W - 20, 120, 6)
    bg.lineStyle(2, 0x884400, 0.8)
    bg.strokeRoundedRect(10, 98, this._W - 20, 120, 6)

    this.add.text(20, 108, '⚠ SCENARIO', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FF8844',
    })

    this.add.text(20, 125, scenarioText, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#DDDDDD',
      wordWrap: { width: 350 },
    })
  }

  _drawFindingForm() {
    const fieldDefs = [
      {
        key: 'condition',
        label: 'CONDITION',
        hint: 'What is the current situation?',
        y: 232,
      },
      {
        key: 'criteria',
        label: 'CRITERIA',
        hint: 'What should the situation be?',
        y: 350,
      },
      {
        key: 'cause',
        label: 'CAUSE',
        hint: 'Why does this condition exist?',
        y: 468,
      },
      {
        key: 'effect',
        label: 'EFFECT',
        hint: 'What is the impact or risk?',
        y: 586,
      },
      {
        key: 'recommendation',
        label: 'RECOMMENDATION',
        hint: 'What should management do?',
        y: 704,
      },
    ]

    fieldDefs.forEach((field) => {
      this._drawFormField(field)
    })
  }

  _drawFormField({ key, label, hint, y }) {
    // Label
    this.add.text(16, y - 2, label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#C8860A',
    })

    // Hint text
    this.add.text(16, y + 16, hint, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#666666',
    })

    // DOM textarea
    const ta = this.add.dom(this._cx, y + 62, 'textarea', {
      width: '350px',
      height: '70px',
      background: '#0d0d2a',
      border: '2px solid #333366',
      color: '#FFFFFF',
      'font-family': 'monospace',
      'font-size': '11px',
      padding: '6px 8px',
      resize: 'none',
      outline: 'none',
      'line-height': '1.4',
    })
    ta.node.placeholder = `Enter ${label.toLowerCase()} here… (min 20 words)`

    // Word count display
    const wc = this.add.text(this._W - 16, y + 100, '0 words', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#666666',
    }).setOrigin(1, 0)

    ta.node.addEventListener('input', () => {
      const words = ta.node.value.trim().split(/\s+/).filter((w) => w.length > 0).length
      wc.setText(`${words} words`)
      wc.setColor(words >= 20 ? '#44FF44' : '#FF4444')
      this._fields[key] = ta.node.value
    })

    this._domInputs[key] = ta.node
  }

  _drawSubmitButton() {
    this._submitBtn = this._makeButton(this._cx, 800, 280, 44, 'SUBMIT FINDING', 0x8b0000, 0xff4444, () => {
      this._submitFinding()
    })
  }

  _submitFinding() {
    if (this._submitting) return

    // Validate minimum word counts
    const required = ['condition', 'criteria', 'cause', 'effect', 'recommendation']
    const insufficients = required.filter((key) => {
      const val = this._domInputs[key]?.value?.trim() ?? ''
      const words = val.split(/\s+/).filter((w) => w.length > 0).length
      return words < 20
    })

    if (insufficients.length > 0) {
      this._showToast(`Need 20+ words in: ${insufficients.join(', ')}`, '#FF4444')
      return
    }

    this._submitting = true
    this._showLoadingSpinner()

    const finding = {
      condition: this._domInputs.condition?.value ?? '',
      criteria: this._domInputs.criteria?.value ?? '',
      cause: this._domInputs.cause?.value ?? '',
      effect: this._domInputs.effect?.value ?? '',
      recommendation: this._domInputs.recommendation?.value ?? '',
    }

    const token = localStorage.getItem('ledgerfall_token')
    const rubric = this._rubric || this.levelData?.aiGradingRubric || {}

    fetch('/api/game/session/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        worldNumber: this.worldNumber,
        levelNumber: this.levelNumber,
        type: 'written_finding',
        finding,
        rubric,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        this._hideLoadingSpinner()
        this._showAIFeedback(data)
      })
      .catch((err) => {
        console.warn('[AuditFindingTask] Submit error:', err)
        this._hideLoadingSpinner()
        // Fallback: pass with base score
        this._showToast('Submitted (offline mode)', '#FFAA44')
        this.time.delayedCall(1500, () => this.submitTask({ finding, aiScore: 70, aiFeedback: 'Submission recorded.' }))
      })
  }

  _showLoadingSpinner() {
    this._spinner = this.add.container(this._cx, this._H / 2).setDepth(500)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.fillRect(-195, -422, 390, 844)

    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a22, 0.97)
    panel.fillRoundedRect(-130, -70, 260, 140, 10)
    panel.lineStyle(2, 0x5555cc, 1)
    panel.strokeRoundedRect(-130, -70, 260, 140, 10)

    const title = this.add.text(0, -45, '🤖 AI GRADING…', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FFDD00',
    }).setOrigin(0.5)

    const sub = this.add.text(0, -15, 'Analysing your audit finding\nagainst professional rubric', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#AAAAAA',
      align: 'center',
    }).setOrigin(0.5)

    // Spinning dots
    this._spinnerDots = []
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(-20 + i * 20, 40, 6, 0x5555cc)
      this._spinnerDots.push(dot)
      this.tweens.add({
        targets: dot,
        scaleX: 1.5, scaleY: 1.5,
        duration: 400,
        delay: i * 150,
        yoyo: true,
        repeat: -1,
      })
    }

    this._spinner.add([bg, panel, title, sub, ...this._spinnerDots])
  }

  _hideLoadingSpinner() {
    if (this._spinner) {
      this._spinner.destroy()
      this._spinner = null
    }
  }

  _showAIFeedback(data) {
    const score = data.aiScore ?? data.score ?? 70
    const feedback = data.aiFeedback ?? data.feedback ?? 'Good effort! Keep practising.'

    const panel = this.add.container(this._cx, this._H / 2).setDepth(500)

    const shade = this.add.graphics()
    shade.fillStyle(0x000000, 0.85)
    shade.fillRect(-195, -422, 390, 844)

    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a22, 0.97)
    bg.fillRoundedRect(-170, -200, 340, 400, 10)
    bg.lineStyle(3, score >= 70 ? 0x44ff44 : score >= 50 ? 0xffaa44 : 0xff4444, 1)
    bg.strokeRoundedRect(-170, -200, 340, 400, 10)

    const scoreColor = score >= 70 ? '#44FF44' : score >= 50 ? '#FFAA44' : '#FF4444'
    const grade = score >= 80 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'ADEQUATE' : 'NEEDS WORK'

    panel.add([shade, bg,
      this.add.text(0, -175, '📊 AI GRADING RESULT', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#FFDD00',
      }).setOrigin(0.5),

      this.add.text(0, -130, `${score}/100`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '34px',
        color: scoreColor,
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5),

      this.add.text(0, -80, grade, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: scoreColor,
      }).setOrigin(0.5),

      this.add.text(0, -40, feedback, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#DDDDDD',
        wordWrap: { width: 310 },
        align: 'center',
      }).setOrigin(0.5),
    ])

    // ISA reference
    if (this.levelData?.isaReference) {
      panel.add(this.add.text(0, 80, this.levelData.isaReference, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#888888',
        wordWrap: { width: 310 },
        align: 'center',
      }).setOrigin(0.5))
    }

    const continueBtn = this._makeButton(0, 155, 220, 44, 'CONTINUE ▶', 0x8b0000, 0xff4444, () => {
      panel.destroy()
      this.submitTask({ aiScore: score, aiFeedback: feedback, finding: Object.fromEntries(Object.entries(this._domInputs).map(([k, v]) => [k, v.value])) })
    })
    continueBtn.setDepth(502)
    panel.add(continueBtn)
  }
}
