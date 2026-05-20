const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.google);
router.post('/logout', authController.logout);
router.get('/me', require('../middleware/auth'), authController.me);

module.exports = router;
