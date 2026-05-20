/**
 * Career title thresholds (total XP required).
 */
const CAREER_TITLES = [
  { title: 'Big 4 Legend', min_xp: 35000 },
  { title: 'Partner', min_xp: 22000 },
  { title: 'Audit Director', min_xp: 13000 },
  { title: 'Audit Manager', min_xp: 7000 },
  { title: 'Audit Senior', min_xp: 3500 },
  { title: 'Semi-Senior Auditor', min_xp: 1500 },
  { title: 'Audit Junior', min_xp: 500 },
  { title: 'Graduate Trainee', min_xp: 0 },
];

/**
 * Get career title based on total XP.
 * @param {number} totalXp
 * @returns {string} career title
 */
const getCareerTitle = (totalXp) => {
  for (const tier of CAREER_TITLES) {
    if (totalXp >= tier.min_xp) {
      return tier.title;
    }
  }
  return 'Graduate Trainee';
};

/**
 * Calculate XP earned for completing a level.
 *
 * Formula:
 *   base = world_number * level_number * 20  (min 100, max 500)
 *   speedStar bonus:    +100
 *   accuracyStar bonus: +150
 *   detectiveStar bonus: +200
 *   streak multiplier: 1.0 / 1.5 / 2.0 / 3.0
 *   hint penalty: -25 per hint used
 *   false positive penalty: -30 per false positive
 *
 * @param {Object} params
 * @param {number} params.world_number
 * @param {number} params.level_number
 * @param {boolean} params.speedStar
 * @param {boolean} params.accuracyStar
 * @param {boolean} params.detectiveStar
 * @param {number} params.streak_days
 * @param {number} params.hints_used
 * @param {number} params.false_positives
 * @returns {number} XP earned (minimum 0)
 */
const calculateXP = (params) => {
  const {
    world_number = 1,
    level_number = 1,
    speedStar = false,
    accuracyStar = false,
    detectiveStar = false,
    streak_days = 0,
    hints_used = 0,
    false_positives = 0,
  } = params;

  // Base XP
  let base = world_number * level_number * 20;
  base = Math.min(500, Math.max(100, base));

  // Star bonuses
  let bonuses = 0;
  if (speedStar) bonuses += 100;
  if (accuracyStar) bonuses += 150;
  if (detectiveStar) bonuses += 200;

  // Streak multiplier
  let streakMultiplier = 1.0;
  if (streak_days >= 30) {
    streakMultiplier = 3.0;
  } else if (streak_days >= 14) {
    streakMultiplier = 2.0;
  } else if (streak_days >= 7) {
    streakMultiplier = 1.5;
  }

  // Penalties
  const hintPenalty = 25 * (hints_used || 0);
  const fpPenalty = 30 * (false_positives || 0);

  // Final XP calculation
  const xpBeforeMultiplier = base + bonuses - hintPenalty - fpPenalty;
  const finalXp = Math.floor(xpBeforeMultiplier * streakMultiplier);

  return Math.max(0, finalXp);
};

module.exports = { calculateXP, getCareerTitle, CAREER_TITLES };
