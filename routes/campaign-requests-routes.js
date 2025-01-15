const express = require('express');
const campaignRequestController = require('../controllers/campaign-request-controller');

const router = express.Router();

router.get("/", campaignRequestController.renderCampaignRequests);

router.get("/:id", campaignRequestController.renderCampaignRequest);

router.post("/", campaignRequestController.updateCampaignRequestStatus);

module.exports = router;
