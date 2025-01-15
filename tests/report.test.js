const request = require("supertest");
const express = require("express");
const session = require("express-session-mock");
const {
  getAllReports,
  getReportById,
  createReport,
  deleteReport,
} = require("../controllers/report-controller.js");
const models = require("../utils/sequelize").models;

// Mock Sequelize models
jest.mock("../utils/sequelize", () => ({
  models: {
    Report: {
      findAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    },
    Campaign: { findByPk: jest.fn() },
    User: { findByPk: jest.fn() },
  },
}));

describe("Report Controller if not authenticated", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
      session({
        secret: "test_secret",
        resave: false,
        saveUninitialized: true,
      })
    );

    // Define routes
    app.get("/reports", getAllReports);
    app.get("/reports/:id", getReportById);
    app.post("/reports", createReport);
    app.delete("/reports/:id", deleteReport);

    jest.clearAllMocks();
  });

  describe("GET /reports", () => {
    test("should redirect to login if user is not logged in", async () => {
      const response = await request(app).get("/reports");

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe("/login");
    });
  });
});

describe("Report Controller if authenticated", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
      session({
        secret: "test_secret",
        resave: false,
        saveUninitialized: true,
      })
    );

    app.use((req, res, next) => {
      req.session.user = { id: 7, role: "administrator" };
      next();
    });

    // Define routes
    app.get("/reports", getAllReports);
    app.get("/reports/:id", getReportById);
    app.post("/reports", createReport);
    app.delete("/reports/:id", deleteReport);

    jest.clearAllMocks();
  });

  describe("GET /reports", () => {
    test("should return all reports for administrators", async () => {
      models.Report.findAll.mockResolvedValueOnce([
        { id: 1, description: "Report 1" },
        { id: 2, description: "Report 2" },
      ]);

      const response = await request(app).get("/reports");

      expect(response.status).toBe(200);
      expect(models.Report.findAll).toHaveBeenCalled();
      expect(response.body).toEqual([
        { id: 1, description: "Report 1" },
        { id: 2, description: "Report 2" },
      ]);
    });
  });

  describe("GET /reports/:id", () => {
    test("should return a specific report if found", async () => {
      models.Report.findByPk.mockResolvedValueOnce({
        id: 1,
        description: "Report 1",
        campaign: { id: 1, name: "Campaign 1", creator: { id: 2, name: "Creator" } },
        reporter: { id: 3, name: "Reporter" },
      });

      const response = await request(app).get("/reports/1");

      expect(response.status).toBe(200);
      expect(models.Report.findByPk).toHaveBeenCalledWith("1", expect.anything());
      expect(response.body).toEqual({
        id: 1,
        description: "Report 1",
        campaign: { id: 1, name: "Campaign 1", creator: { id: 2, name: "Creator" } },
        reporter: { id: 3, name: "Reporter" },
      });
    });

    test("should return 404 if the report is not found", async () => {
      models.Report.findByPk.mockResolvedValueOnce(null);

      const response = await request(app).get("/reports/999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Report not found");
    });
  });

  describe("POST /reports", () => {
    test("should create a new report and redirect", async () => {
      models.Report.create.mockResolvedValueOnce({
        id: 1,
        description: "New Report",
        campaignId: 1,
        reporterId: 3,
      });

      const response = await request(app).post("/reports").send({
        description: "New Report",
        campaignId: 1,
        reporterId: 3,
      });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe("/campaigns");
      expect(models.Report.create).toHaveBeenCalledWith({
        description: "New Report",
        campaignId: 1,
        reporterId: 3,
      });
    });
  });

  describe("DELETE /reports/:id", () => {
    test("should delete a report and redirect", async () => {
      const mockDestroy = jest.fn();
      models.Report.findByPk.mockResolvedValueOnce({ destroy: mockDestroy });

      const response = await request(app).delete("/reports/1");

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe("/reports");
      expect(models.Report.findByPk).toHaveBeenCalledWith("1");
      expect(mockDestroy).toHaveBeenCalled();
    });

    test("should return 404 if the report is not found", async () => {
        models.Report.findByPk.mockResolvedValueOnce(null);

        const response = await request(app).delete("/reports/999");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Report not found");
    });
  });
});