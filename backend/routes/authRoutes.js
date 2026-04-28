const express = require('express');
const router = express.Router();
const { loginUser, registerAdmin } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerAdmin);

module.exports = router;
