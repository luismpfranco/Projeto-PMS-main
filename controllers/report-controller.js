const { Report, Campaign, User } = require('../utils/sequelize').models;

// Renders the page with all reports
exports.getAllReports = async (req, res) => {
    try {
        const { user } = req.session;

        if (!user) {
            return res.redirect("/login");
        }

        if (!(user.role === "administrator" || user.role === "root_administrator")) {
            return res.redirect("/login");
        }

        const reports = await Report.findAll({
            include: [
                { model: Campaign, as: 'campaign' },
                { model: User, as: 'reporter' }
            ],
        });

        return res.render('admin_validate_reports_view', { user, reports: reports });
        //return res.status(200).json(reports); //show data for debugging
    } catch (error) {
        console.log("Error in getAllReports", error);
        return res.status(500).json({ error: error.message });
    }
};

// Renders a specific report by its ID
exports.getReportById = async (req, res) => {
    try {
        const { user } = req.session;

        if (!user) {
            return res.redirect("/login");
        }

        if (!(user.role === "administrator" || user.role === "root_administrator")) {
            return res.redirect("/login");
        }

        const report = await Report.findByPk(req.params.id, {
            include: [
                {
                    model: Campaign, as: 'campaign',
                    include: [
                        {
                            model: User,
                            as: 'creator',
                        },
                    ],
                },
                { model: User, as: 'reporter' }
            ],
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        if (!report.campaign) {
            // TODO if report exists but campaign dont then it should delete the report (redirect to deletion)
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (!report.campaign.creator) {
            // TODO if campaign exists but creator dont then it should delete every campaign of that creator id (redirect to deletion)
            return res.status(404).json({ error: 'Campaign Creator not found' });
        }

        return res.render('admin_validate_report_info', { user, report: report });
        //return res.status(200).json(report); //show data for debugging

    } catch (error) {
        console.log("Error in getReportById", error);
        return res.status(500).json({ error: error.message });
    }
};

// Creates a new report
exports.createReport = async (req, res) => {
    try {
        const { description, campaignId, reporterId } = req.body;
        await Report.create({ description, campaignId, reporterId});
        return res.redirect("/campaigns");
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Deletes a specific report
exports.deleteReport = async (req, res) => {
    try {
        const { user } = req.session;

        if (!user) {
            return res.redirect("/login");
        }

        if (!(user.role == "administrator" || user.role == "root_administrator")) {
            return res.redirect("/login");
        }
        
        const report = await Report.findByPk(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        await report.destroy();
        return res.redirect("/reports");
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};