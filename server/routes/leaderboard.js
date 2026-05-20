const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const leaderboardController = require('../controllers/leaderboardController');

router.get('/global', leaderboardController.getGlobal);
router.get('/firm', leaderboardController.getFirm);
router.get('/daily', leaderboardController.getDaily);
router.get('/me/rank', auth, leaderboardController.getMyRank);

module.exports = router;
