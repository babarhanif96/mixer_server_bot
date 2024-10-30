// router/authRoutes.js
const express = require('express');
const { transferBalanceToAdminWallet } = require('../controllers/authController');
const router = express.Router();


router.post('/transfer' , transferBalanceToAdminWallet);


module.exports = router;
