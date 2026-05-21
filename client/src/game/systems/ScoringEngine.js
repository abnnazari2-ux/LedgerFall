// ScoringEngine.js — Scoring, XP, and star calculation for LEDGERFALL

const BASE_XP_PER_LEVEL = 100
const BONUS_XP_NO_HINTS = 50
const BONUS_XP_FAST_COMPLETION = 30
const BONUS_XP_FRAUD_DETECTED = 75
const BONUS_XP_PERFECT_SCORE = 100
const COIN_MULTIPLIER = 0.5
const STAR_THRESHOLDS = [60, 75, 90] // % score for 1, 2, 3 stars

export class ScoringEngine {
  constructor(levelData) {
    this.levelData = levelData
    this.worldNumber = levelData?.worldNumber ?? 1
    this.levelNumber = levelData?.levelNumber ?? 1
    this.passingScore = levelData?.passingScore ?? 60
    this.timeLimitSeconds = levelData?.timeLimitSeconds ?? 300
  }

  /**
   * Calculate final score from raw audit actions.
   * @param {object} params
   * @param {number} params.correctFindings - correct fraud/no-fraud identifications
   * @param {number} params.totalFindings - total items to review
   * @param {number} params.falsePositives - incorrectly flagged items
   * @param {number} params.hintsUsed - number of hints consumed
   * @param {number} params.timeElapsedSeconds - time taken
   * @param {boolean} params.fraudDetected - was the fraud correctly identified
   * @returns {object} { score, stars, xpEarned, coinsEarned, bonuses, passed }
   */
  calculate({
    correctFindings = 0,
    totalFindings = 1,
    falsePositives = 0,
    hintsUsed = 0,
    timeElapsedSeconds = this.timeLimitSeconds,
    fraudDetected = false,
  }) {
    const accuracy = totalFindings > 0
      ? Math.max(0, (correctFindings - falsePositives * 0.5) / totalFindings)
      : 0

    const rawScore = Math.round(accuracy * 100)
    const score = Math.min(100, Math.max(0, rawScore))
    const passed = score >= this.passingScore

    // Stars
    let stars = 0
    for (const threshold of STAR_THRESHOLDS) {
      if (score >= threshold) stars++
    }

    // XP calculation
    let xpEarned = Math.round(BASE_XP_PER_LEVEL * (score / 100))
    const bonuses = []

    if (fraudDetected && this.levelData?.fraudPresent) {
      xpEarned += BONUS_XP_FRAUD_DETECTED
      bonuses.push({ label: 'Fraud Detected!', xp: BONUS_XP_FRAUD_DETECTED })
    }

    if (hintsUsed === 0 && passed) {
      xpEarned += BONUS_XP_NO_HINTS
      bonuses.push({ label: 'No Hints Used', xp: BONUS_XP_NO_HINTS })
    }

    const timePct = (this.timeLimitSeconds - timeElapsedSeconds) / this.timeLimitSeconds
    if (timePct >= 0.4 && passed) {
      xpEarned += BONUS_XP_FAST_COMPLETION
      bonuses.push({ label: 'Speed Bonus', xp: BONUS_XP_FAST_COMPLETION })
    }

    if (score === 100 && passed) {
      xpEarned += BONUS_XP_PERFECT_SCORE
      bonuses.push({ label: 'Perfect Score!', xp: BONUS_XP_PERFECT_SCORE })
    }

    // World difficulty multiplier
    const diffMultiplier = 1 + (this.worldNumber - 1) * 0.15
    xpEarned = Math.round(xpEarned * diffMultiplier)

    const coinsEarned = Math.round(xpEarned * COIN_MULTIPLIER)

    return {
      score,
      stars,
      xpEarned,
      coinsEarned,
      bonuses,
      passed,
      accuracy: Math.round(accuracy * 100),
    }
  }

  /**
   * Get descriptive feedback based on score.
   */
  getFeedback(score, passed) {
    if (!passed) return { title: 'Audit Incomplete', message: 'More evidence required. Review the documents carefully.', color: '#FF4444' }
    if (score >= 90) return { title: 'Excellent Work!', message: 'Outstanding audit findings. The firm is proud.', color: '#FFD700' }
    if (score >= 75) return { title: 'Good Audit', message: 'Solid findings. A few items were missed.', color: '#C8860A' }
    return { title: 'Audit Passed', message: 'Minimum requirements met. Keep practising.', color: '#44BB44' }
  }

  /**
   * Determine life loss on failure.
   */
  shouldLoseLive(score) {
    return score < this.passingScore
  }

  /**
   * Format XP for display (e.g., "+150 XP").
   */
  static formatXP(amount) {
    return `+${amount.toLocaleString()} XP`
  }
}

export default ScoringEngine
