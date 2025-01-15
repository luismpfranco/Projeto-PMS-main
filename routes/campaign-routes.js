const express = require('express');
const { uploadImage } = require('../utils/upload');
const campaignController = require('../controllers/campaign-controller');

const router = express.Router();

router.get("/(page/:page(\\d+))?", campaignController.renderCampaigns);

router.get("/owned", campaignController.renderCampaignsOfCreator);

router.get("/:id/delete", campaignController.deleteCampaign);

router.get("/:id(\\d+)", campaignController.renderCampaign);

router.get("/create", campaignController.renderCampaignForm);

router.post("/create", uploadImage.single("media"), campaignController.createCampaign);

module.exports = router;
