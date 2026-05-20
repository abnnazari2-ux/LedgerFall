const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const adminController = require('../controllers/adminController');

router.use(auth);
router.use(adminOnly);

router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.get('/analytics', adminController.getAnalytics);
router.get('/sessions', adminController.getSessions);
router.post('/leaderboard/reset', adminController.resetLeaderboard);
router.post('/daily-challenge/set', adminController.setDailyChallenge);
router.get('/logs', adminController.getLogs);
router.post('/glossary', adminController.createGlossaryTerm);
router.put('/glossary/:id', adminController.updateGlossaryTerm);
router.delete('/glossary/:id', adminController.deleteGlossaryTerm);

module.exports = router;
