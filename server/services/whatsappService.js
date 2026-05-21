/**
 * Generate the shareable challenge URL for a given share token.
 * @param {string} shareToken - unique token for the challenge
 * @param {string} gameUrl - base URL of the game (e.g. https://ledgerfall.com)
 * @returns {string} full challenge URL
 */
const generateChallengeUrl = (shareToken, gameUrl) => {
  const base = gameUrl || process.env.CLIENT_URL || 'https://ledgerfall.com';
  return `${base}/challenge/${shareToken}`;
};

/**
 * Generate a WhatsApp sharing URL with a pre-filled message.
 * @param {string} message - the text message to pre-fill
 * @returns {string} WhatsApp URL
 */
const generateWhatsAppUrl = (message) => {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/?text=${encoded}`;
};

/**
 * Generate a full WhatsApp challenge invite URL.
 * @param {Object} options
 * @param {string} options.shareToken - challenge share token
 * @param {string} options.challengerName - display name of the challenger
 * @param {number} options.worldNumber - world number of the challenge
 * @param {number} options.levelNumber - level number of the challenge
 * @param {number} options.challengerScore - score achieved by the challenger
 * @param {string} options.gameUrl - base URL of the game
 * @returns {string} WhatsApp sharing URL
 */
const generateChallengeInviteUrl = (options) => {
  const {
    shareToken,
    challengerName = 'A player',
    worldNumber,
    levelNumber,
    challengerScore,
    gameUrl,
  } = options;

  const challengeUrl = generateChallengeUrl(shareToken, gameUrl);

  const message = [
    `🎮 *LedgerFall Challenge!*`,
    ``,
    `${challengerName} has challenged you to beat their score!`,
    ``,
    `📊 World ${worldNumber}, Level ${levelNumber}`,
    challengerScore ? `🏆 Their score: ${challengerScore.toLocaleString()} pts` : '',
    ``,
    `Think you can do better? Accept the challenge:`,
    challengeUrl,
    ``,
    `#LedgerFall #AuditGame #ChallengeAccepted`,
  ].filter(Boolean).join('\n');

  return generateWhatsAppUrl(message);
};

module.exports = { generateChallengeUrl, generateWhatsAppUrl, generateChallengeInviteUrl };
