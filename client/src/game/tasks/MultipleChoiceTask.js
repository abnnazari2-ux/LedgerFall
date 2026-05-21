// MultipleChoiceTask.js — Type C: Multiple choice questions
import TaskScene from '../scenes/TaskScene.js'

export default class MultipleChoiceTask extends TaskScene {
  constructor() {
    super({ key: 'MultipleChoiceTask' })
    this._questionIndex = 0
    this._score = 0
    this._totalQuestions = 0
    this._answered = false
    this._halfLifeLost = false
  }

  init(data) {
    this.startLevel(data?.worldNumber ?? 1, data?.levelNumber ?? 2, data)
  }

  create() {
    this._W = 390
    this._H = 844
    this._cx = 195

    this.setupBackground(this.worldNumber)
    this._questions = this.levelData?.questions ?? this._getDefaultQuestions()
    this._totalQuestions = this._questions.length

    this._drawProgressBar()
    this._showQuestion(0)
    this.setupHint()
    this.setupNoteHiding()
    this.setupTimer(this.levelData?.timeLimitSeconds ?? 300)

    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene')
  }

  _getDefaultQuestions() {
    return [
      {
        question: 'Which ISA deals with the auditor\'s responsibility to consider fraud?',
        options: ['ISA 240', 'ISA 315', 'ISA 500', 'ISA 700'],
        correct: 0,
        explanation: 'ISA 240 deals with the auditor\'s responsibilities relating to fraud in an audit of financial statements.',
      },
      {
        question: 'What does "cut-off" mean in auditing?',
        options: [
          'Ending the audit early',
          'Transactions recorded in the correct period',
          'Cutting costs in the audit',
          'Dismissing the audit team',
        ],
        correct: 1,
        explanation: 'Cut-off ensures transactions are recorded in the correct accounting period, neither early nor late.',
      },
      {
        question: 'A ghost employee in payroll fraud means:',
        options: [
          'An employee who works night shifts',
          'A deceased employee still on payroll',
          'A fictitious employee added to payroll',
          'An employee who left but is still paid',
        ],
        correct: 2,
        explanation: 'Ghost employees are fictitious names added to the payroll to divert salary payments to the fraudster.',
      },
    ]
  }

  _drawProgressBar() {
    const barBg = this.add.graphics()
    barBg.fillStyle(0x222233, 1)
    barBg.fillRect(20, 100, this._W - 40, 10)

    this._progressFill = this.add.graphics()
    this._progressLabel = this.add.text(this._cx, 85, `Question 1 / ${this._totalQuestions}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#888888',
    }).setOrigin(0.5)

    this._updateProgress()
  }

  _updateProgress() {
    this._progressFill.clear()
    const pct = this._questionIndex / this._totalQuestions
    this._progressFill.fillStyle(0xc8860a, 1)
    this._progressFill.fillRect(20, 100, (this._W - 40) * pct, 10)
    this._progressLabel.setText(`Question ${this._questionIndex + 1} / ${this._totalQuestions}`)
  }

  _showQuestion(index) {
    if (this._questionContainer) this._questionContainer.destroy()
    this._answered = false
    this._questionIndex = index
    this._updateProgress()

    const q = this._questions[index]
    if (!q) {
      this._finishMCQ()
      return
    }

    const container = this.add.container(0, 0)
    this._questionContainer = container

    // Question card
    const qBg = this.add.graphics()
    qBg.fillStyle(0x0d0d2b, 0.92)
    qBg.fillRoundedRect(15, 120, this._W - 30, 160, 8)
    qBg.lineStyle(2, 0xc8860a, 0.8)
    qBg.strokeRoundedRect(15, 120, this._W - 30, 160, 8)
    container.add(qBg)

    const qText = this.add.text(this._cx, 200, q.question, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#FFFFFF',
      wordWrap: { width: 340 },
      align: 'center',
    }).setOrigin(0.5)
    container.add(qText)

    // Answer buttons
    q.options.forEach((opt, i) => {
      const btnY = 320 + i * 90
      const btn = this._makeAnswerButton(opt, i, q.correct, btnY)
      container.add(btn)
    })
  }

  _makeAnswerButton(label, index, correctIndex, y) {
    const container = this.add.container(this._cx, y)
    const w = 340
    const h = 70

    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a4e, 0.9)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8)
    bg.lineStyle(2, 0x5555cc, 0.8)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8)

    const letter = ['A', 'B', 'C', 'D'][index]
    const letterBg = this.add.graphics()
    letterBg.fillStyle(0x333366, 1)
    letterBg.fillRoundedRect(-w / 2 + 6, -h / 2 + 6, 36, h - 12, 4)

    const letterText = this.add.text(-w / 2 + 24, 0, letter, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#AAAAFF',
    }).setOrigin(0.5)

    const optText = this.add.text(-w / 2 + 52, 0, label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#FFFFFF',
      wordWrap: { width: 260 },
    }).setOrigin(0, 0.5)

    container.add([bg, letterBg, letterText, optText])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      if (this._answered) return
      this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 80 })
    })
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 })
    })

    container.on('pointerdown', () => {
      if (this._answered) return
      this._answered = true
      this._onAnswer(index, correctIndex, container, bg)
    })

    return container
  }

  _onAnswer(selectedIndex, correctIndex, container, bg) {
    const isCorrect = selectedIndex === correctIndex
    const q = this._questions[this._questionIndex]

    if (isCorrect) {
      this._score++
      // Green pulse
      bg.clear()
      bg.fillStyle(0x006600, 0.9)
      bg.fillRoundedRect(-170, -35, 340, 70, 8)
      bg.lineStyle(3, 0x44ff44, 1)
      bg.strokeRoundedRect(-170, -35, 340, 70, 8)

      this.tweens.add({
        targets: container,
        scaleX: 1.05, scaleY: 1.05,
        duration: 200,
        yoyo: true,
      })

      this._showExplanation(q.explanation, true)
    } else {
      // Red shake — -0.5 life
      bg.clear()
      bg.fillStyle(0x660000, 0.9)
      bg.fillRoundedRect(-170, -35, 340, 70, 8)
      bg.lineStyle(3, 0xff2222, 1)
      bg.strokeRoundedRect(-170, -35, 340, 70, 8)

      const origX = container.x
      this.tweens.add({
        targets: container,
        x: origX + 8,
        duration: 50,
        yoyo: true,
        repeat: 3,
        onComplete: () => { container.x = origX },
      })

      // Half life penalty — apply once per wrong answer
      if (!this._halfLifeLost) {
        this._halfLifeLost = true
        const lives = parseFloat(localStorage.getItem('lf_lives') || '3')
        const newLives = Math.max(0, lives - 0.5)
        localStorage.setItem('lf_lives', String(Math.round(newLives)))
        this.game.events.emit('livesChanged', { lives: Math.round(newLives) })
        this._showToast('-0.5 Life!', '#FF4444')
      }

      this._falsePositives++
      this._showExplanation(q.explanation, false)
    }

    this._halfLifeLost = false

    // Next question after delay
    this.time.delayedCall(2800, () => {
      if (this._questionIndex + 1 < this._totalQuestions) {
        this._showQuestion(this._questionIndex + 1)
      } else {
        this._finishMCQ()
      }
    })
  }

  _showExplanation(text, correct) {
    const panel = this.add.container(this._cx, 790).setDepth(300)

    const bg = this.add.graphics()
    bg.fillStyle(correct ? 0x004400 : 0x440000, 0.97)
    bg.fillRoundedRect(-175, -36, 350, 72, 6)
    bg.lineStyle(2, correct ? 0x44ff44 : 0xff4444, 1)
    bg.strokeRoundedRect(-175, -36, 350, 72, 6)

    const icon = this.add.text(-155, 0, correct ? '✓' : '✗', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: correct ? '#44FF44' : '#FF4444',
    }).setOrigin(0.5)

    const txt = this.add.text(-130, 0, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#DDDDDD',
      wordWrap: { width: 290 },
    }).setOrigin(0, 0.5)

    panel.add([bg, icon, txt])

    this.tweens.add({
      targets: panel,
      y: 755,
      duration: 300,
      ease: 'Power2',
    })

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: panel,
        y: 820, alpha: 0,
        duration: 400,
        onComplete: () => panel.destroy(),
      })
    })
  }

  _finishMCQ() {
    const accuracy = this._score / this._totalQuestions
    if (accuracy >= 0.5) {
      this.submitTask({ score: this._score, total: this._totalQuestions, accuracy })
    } else {
      this._showRetryPanel('NOT ENOUGH CORRECT', `You got ${this._score}/${this._totalQuestions}. Need 50% to pass.`)
    }
  }
}
