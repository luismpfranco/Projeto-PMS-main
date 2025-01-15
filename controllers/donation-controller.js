const { Donation } = require("../utils/sequelize.js").models;

/** 
 * Create a donation.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
async function createDonation(req, res) {
  const { user } = req.session;

  if (!user || user.role !== "donor") {
    req.session.message = "Login as a donor to access this feature.";
    return res.redirect("login");
  }

  const { campaignId, amount } = req.body;

  // Validate required fields
  if (!campaignId || !amount) {
    return res.status(400).json({ error: "campaignId and amount are required." });
  }

  // Additional validations
  if (isNaN(campaignId) || campaignId <= 0) {
    return res.status(400).json({ error: "Invalid campaignId." });
  }
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number." });
  }

  try {
    await Donation.create({ donorId: user.id, campaignId: campaignId, value: amount });
    res.redirect(`/campaigns/${campaignId}`);
  } catch (error) {
    console.error("Error creating donation:", error);
    res.status(500).json({ error: "Failed to create donation." });
  }
}
module.exports = { createDonation };