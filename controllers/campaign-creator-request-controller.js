const { CampaignCreatorRequest, User } = require('../utils/sequelize').models;

exports.getAllPendingCampaignCreatorRequest = async (req, res) => {
    try {
        const { user } = req.session;

        if (!user || !(user.role == "administrator" || user.role == "root_administrator")) {
            req.session.message = "Login as an administrator to access this feature.";
            res.redirect("/login");
        }

        const requests = await CampaignCreatorRequest.findAll({
            where: {
                status: 'Pending'
            },
            include: [
                { model: User, as: 'campaignCreator' }
            ]
        });

        res.render('admin_validate_creator_view', { user, requests });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCampaignCreatorRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { user } = req.session;

        if (!user || !(user.role == "administrator" || user.role == "root_administrator")) {
            req.session.message = "Login as an administrator to access this feature.";
            return res.redirect("/login");
        }

        const request = await CampaignCreatorRequest.findByPk(id, {
            include: [
                { model: User, as: 'campaignCreator' }
            ]
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        await request.update({ status });
        res.redirect("/campaign_creators");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCampaignCreatorRequestById = async (req, res) => {
    try {
        const { user } = req.session;

        if (!user || !(user.role == "administrator" || user.role == "root_administrator")) {
            req.session.message = "Login as an administrator to access this feature.";
            res.redirect("/login");
        }

        const request = await CampaignCreatorRequest.findByPk(req.params.id, {
            include: [
                { model: User, as: 'campaignCreator' }
            ]
        });

        if (!request || request.status != "Pending") {
            // req.session.message = 'Request not found';
            return res.redirect("/campaign_creators");
        }

        res.render('admin_validate_creator_info', { user, request });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getIdentificationDocument = async (req, res) => {
    try {
        const { user } = req.session;
        const { id } = req.params;

        if (!user || !(user.role == "administrator" || user.role == "root_administrator")) {
            req.session.message = "Login as an administrator to access this feature.";
            return res.redirect("/login");
        }

        const request = await CampaignCreatorRequest.findByPk(id);

        if (!request || !request.identificationDocument) {
            // req.session.message = "Document not found";
            return res.redirect("/campaign_creators");
        }

        // Sets the header for the PDF content type
        res.setHeader('Content-Type', 'application/pdf');
        res.send(request.identificationDocument);
    
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCampaignCreatorRequest = async (req, res) => {
    try {
        const { user } = req.session;

        if (!user || !(user.role == "administrator" || user.role == "root_administrator")) {
            req.session.message = "Login as an administrator to access this feature.";
            res.redirect("/login");
        }

        const request = await CampaignCreatorRequest.findByPk(req.params.id);

        if (!request) {
            // req.session.message = "Request not found";
            return res.redirect("/campaign_creators");
        }

        await request.destroy();
        res.redirect("/campaign_creators");
    
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
