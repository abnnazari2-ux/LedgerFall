const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const gameController = require('../controllers/gameController');

router.use(auth);

router.get('/lives', gameController.getLives);
router.post('/session/start', gameController.startSession);
router.post('/session/complete', gameController.completeSession);
router.post('/hint/use', gameController.useHint);
router.get('/daily-challenge', gameController.getDailyChallenge);
router.post('/daily-challenge/submit', gameController.submitDailyChallenge);

module.exports = router;
