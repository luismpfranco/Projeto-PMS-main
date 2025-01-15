const { CampaignUpdate } = require("../utils/sequelize.js").models;

/** 
 * Create an update for the campaign.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
async function createCampaignUpdate(req, res) {	
	try {
		let data = {};
		data.campaignId = req.body.campaignId;
		data.content = req.body.content;

		// Validate the request body
		if (!data.campaignId || !data.content) {
			return res.status(400).json({ error: "campaignId and content are required." });
		}

		if (req.file) data.media = req.file.buffer;

		await CampaignUpdate.create(data);

		res.redirect("/campaigns");
	} catch (error) {
		console.error("Error creating campaign update:", error);
		res.status(500).json({ error: "An error occurred while creating the campaign update." });
	}
}

module.exports = { createCampaignUpdate };