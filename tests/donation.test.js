const request = require("supertest");
const express = require("express");
const session = require("express-session-mock");
const { createDonation } = require("../controllers/donation-controller");
const { Donation } = require("../utils/sequelize").models;

// Mock Sequelize model
jest.mock("../utils/sequelize", () => ({
  models: {
    Donation: { create: jest.fn() },
  },
}));

describe("POST /donations", () => {
  let app;

  beforeEach(() => {
    const ONEDAY = 24 * 60 * 60 * 1000;
    const SECRET = "secret";

    app = express();

    // Initialize the app and session
    app.set("views", `${__dirname}/views`);
    app.set("view engine", "ejs");
    app.use(express.urlencoded({ extended: true }));
    app.use(
      session({
        secret: SECRET,
        saveUninitialized: true,
        cookie: { maxAge: ONEDAY },
        resave: false,
      }));
    // Add route to test
    app.post("/donations", createDonation);

    jest.clearAllMocks();
  });

  test("should redirect to login if user is not logged in or not a donor", async () => {
    app.use((req, res, next) => {
      req.session = null; // No user in session
      next();
    });

    const response = await request(app).post("/donations").send({
      campaignId: 1,
      amount: 100,
    });

    expect(response.status).toBe(302); // Redirect to login
    expect(response.headers.location).toBe("login");
    expect(Donation.create).not.toHaveBeenCalled();
  });
});

describe("POST /donations", () => {
  beforeEach(() => {
    // Initialize the app and session
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

    // Middleware to mock session
    app.use((req, res, next) => {
      req.session.user = { id: 3, role: "donor" }; // Mock logged-in donor
      next();
    });

    // Add route to test
    app.post("/donations", createDonation);

    jest.clearAllMocks();
  });

  test("should create a donation and redirect to the campaign page", async () => {
    Donation.create.mockResolvedValueOnce({
      donorId: 3,
      campaignId: 1,
      value: 100,
    });

    const response = await request(app).post("/donations").send({
      campaignId: 1,
      amount: 100,
    });

    expect(Donation.create).toHaveBeenCalledWith({
      donorId: 3,
      campaignId: 1,
      value: 100,
    });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/campaigns/1");
  });

  test("should return an error if required fields are missing", async () => {
    const response = await request(app).post("/donations").send({
      campaignId: null,
      amount: null,
    });

    expect(response.status).toBe(400); // Bad Request
    expect(response.body).toEqual({ error: "campaignId and amount are required." });
    expect(Donation.create).not.toHaveBeenCalled();
  });
});