const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const raceController = require('../controllers/raceController');

router.use(auth);

router.post('/room/create', raceController.createRoom);
router.post('/room/:code/join', raceController.joinRoom);
router.get('/room/:code', raceController.getRoom);

module.exports = router;
