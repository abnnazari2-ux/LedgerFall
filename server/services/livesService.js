/**
 * Calculate current lives based on player progress.
 * Lives refill at 1 per 30 minutes after depletion.
 * Max lives = 3.
 *
 * @param {Object} playerProgress - contains lives and lives_last_depleted fields
 * @returns {Object} { lives, max_lives, seconds_to_next_refill, minutes_to_full }
 */
const calculateLives = (playerProgress) => {
  const MAX_LIVES = 3;
  const REFILL_MINUTES = 30;

  const { lives, lives_last_depleted } = playerProgress;

  // If already at max or no depletion timestamp, return 3
  if (lives >= MAX_LIVES || !lives_last_depleted) {
    return {
      lives: MAX_LIVES,
      max_lives: MAX_LIVES,
      seconds_to_next_refill: null,
      minutes_to_full: 0,
    };
  }

  const now = new Date();
  const depletedAt = new Date(lives_last_depleted);
  const elapsedMs = now - depletedAt;
  const elapsedMinutes = elapsedMs / (1000 * 60);

  // How many lives have been refilled since depletion
  const refilled = Math.min(MAX_LIVES - lives, Math.floor(elapsedMinutes / REFILL_MINUTES));
  const currentLives = Math.min(MAX_LIVES, lives + refilled);

  if (currentLives >= MAX_LIVES) {
    return {
      lives: MAX_LIVES,
      max_lives: MAX_LIVES,
      seconds_to_next_refill: null,
      minutes_to_full: 0,
    };
  }

  // Calculate seconds until the next life refills
  const minutesSinceLastRefill = elapsedMinutes % REFILL_MINUTES;
  const minutesUntilNextRefill = REFILL_MINUTES - minutesSinceLastRefill;
  const secondsToNextRefill = Math.ceil(minutesUntilNextRefill * 60);

  // How many lives still needed to reach max
  const livesNeeded = MAX_LIVES - currentLives;
  const minutesToFull = Math.ceil(minutesUntilNextRefill + (livesNeeded - 1) * REFILL_MINUTES);

  return {
    lives: currentLives,
    max_lives: MAX_LIVES,
    seconds_to_next_refill: secondsToNextRefill,
    minutes_to_full: minutesToFull,
  };
};

module.exports = { calculateLives };
