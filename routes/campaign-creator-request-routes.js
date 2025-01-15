const express = require('express');
const campaignCreatorRequestController = require('../controllers/campaign-creator-request-controller');

const router = express.Router();

// Route to get all pending campaign creator requests
router.get('/', campaignCreatorRequestController.getAllPendingCampaignCreatorRequest);

// Route to update the status of a campaign creator request
router.post('/update_status/:id', campaignCreatorRequestController.updateCampaignCreatorRequestStatus);

// Route to get a specific campaign creator request
router.get('/:id', campaignCreatorRequestController.getCampaignCreatorRequestById);

// Route to get pdf of campaign creator request
router.get("/:id/document", campaignCreatorRequestController.getIdentificationDocument);

// Route to delete a campaign creator request
router.delete('/:id', campaignCreatorRequestController.deleteCampaignCreatorRequest);



module.exports = router;