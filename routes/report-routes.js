const express = require('express');
const reportController = require('../controllers/report-controller');

const router = express.Router();

// Route to get all reports
router.get('/', reportController.getAllReports);

// Route to get a specific report by ID
router.get('/:id', reportController.getReportById);

// Route to create a new report
router.post('/', reportController.createReport);

// Route to delete a report by ID
router.post('/delete/:id', reportController.deleteReport);

module.exports = router;