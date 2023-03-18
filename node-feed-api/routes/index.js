const express = require('express');
const router = express.Router();
const feedRoutes = require('./feed/feed');
const authRoutes = require('./auth/auth');

router.use('/feed', feedRoutes);
router.use('/auth', authRoutes);

module.exports = router;
