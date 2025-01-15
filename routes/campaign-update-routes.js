const express = require('express');
const { uploadImage } = require("../utils/upload");
const campaignUpdateController = require("../controllers/campaign-update-controller");

const router = express.Router();

router.post("/", uploadImage.single("media"), campaignUpdateController.createCampaignUpdate);

module.exports = router;
