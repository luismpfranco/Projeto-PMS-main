const express = require('express');
const donationController = require('../controllers/donation-controller');

const router = express.Router();

router.post("/", donationController.createDonation);

module.exports = router;
