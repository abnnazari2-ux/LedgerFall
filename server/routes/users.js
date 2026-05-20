const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(auth);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/avatar', userController.updateAvatar);
router.get('/progress', userController.getProgress);
router.get('/badges', userController.getBadges);
router.get('/certificate', userController.getCertificate);

module.exports = router;
