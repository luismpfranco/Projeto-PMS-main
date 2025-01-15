const app = require("../index");
const request = require("supertest");
const { Campaign, User, Donation, CampaignUpdate, CampaignRequest, CampaignCreatorRequest } = require("../utils/sequelize").models;

jest.mock("../utils/sequelize", () => ({
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
    literal: jest.fn(),
  },
  models: {
    Campaign: { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), destroy: jest.fn() },
    User: { findOne: jest.fn() },
    Donation: { sum: jest.fn(), findAll: jest.fn() },
    CampaignUpdate: { findAll: jest.fn() },
    CampaignRequest: { create: jest.fn(), findByPk: jest.fn(), destroy: jest.fn() },
    CampaignCreatorRequest: { findOne: jest.fn() },
  },
}));

describe("POST /campaigns/create", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    undefined,
    { id: 1, username: 'invalid_role', password: "password", role: 'invalid_role' },
    { id: 2, username: 'root_administrator', password: "password", role: 'root_administrator' },
    { id: 3, username: 'administrator', password: "password", role: 'administrator' },
    { id: 4, username: 'donor', password: "password", role: 'donor' },
  ])("should redirect unauthorized users to login", async (user) => {
    User.findOne.mockResolvedValue(user);

    let agent = request.agent(app);
    if (user) {
      await agent
        .post("/login")
        .send(user);
    }

    CampaignRequest.create.mockResolvedValue({id: 1});

    const response = await agent
      .post("/campaigns/create")
      .send({});
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/login");
  });

  test.each([
    { id: 1, username: 'creator', password: "password", role: 'campaign_creator' },
  ])("should create a campaign for authorized users with role 'campaign_creator'", async (user) => {
    User.findOne.mockResolvedValue(user);
    CampaignCreatorRequest.findOne.mockResolvedValue({ id: 200, creatorId: user.id, status: "Approved" });

    let agent = request.agent(app);
    await agent
      .post("/login")
      .send(user);

    const response = await agent
      .post("/campaigns/create")
      .send({});

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/campaigns");
  });
});

describe("GET /campaigns/create", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    undefined,
    { id: 1, username: 'invalid_role', password: "password", role: 'invalid_role' },
    { id: 2, username: 'root_administrator', password: "password", role: 'root_administrator' },
    { id: 3, username: 'administrator', password: "password", role: 'administrator' },
    { id: 4, username: 'donor', password: "password", role: 'donor' },
  ])("should redirect unauthorized users to login", async (user) => {
    User.findOne.mockResolvedValue(user);

    let agent = request.agent(app);
    if (user) {
      await agent
        .post("/login")
        .send(user);
    }

    const response = await agent
      .get("/campaigns/create");
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/login");
  });

  test.each([
    { id: 1, username: 'creator', password: "password", role: 'campaign_creator' },
  ])("should render a campaign form page for authorized users with role 'campaign_creator'", async (user) => {
    User.findOne.mockResolvedValue(user);
    CampaignCreatorRequest.findOne.mockResolvedValue({ id: 200, creatorId: user.id, status: "Approved" });

    let agent = request.agent(app);
    await agent
      .post("/login")
      .send(user);

    const response = await agent
      .get("/campaigns/create")

    expect(response.status).toBe(200);
  });
});


describe("GET /campaigns/(page/:page(\\d+))?", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    undefined,
    { id: 1, username: 'creator', password: "password", role: 'campaign_creator' },
    { id: 2, username: 'invalid_role', password: "password", role: 'invalid_role' },
    { id: 3, username: 'root_administrator', password: "password", role: 'root_administrator' },
    { id: 4, username: 'administrator', password: "password", role: 'administrator' },
    { id: 5, username: 'donor', password: "password", role: 'donor' },
  ])("should render campaigns page", async (user) => {
    User.findOne.mockResolvedValue(user);
    let agent = request.agent(app);
    if (user) {
      CampaignCreatorRequest.findOne.mockResolvedValue({ id: 200, creatorId: user.id, status: "Approved" });
      await agent
        .post("/login")
        .send(user);
    }
    const campaignsMock = [
      {
        dataValues: {
          id: 1,
          title: "Test Campaign",
          description: "Test Description",
          goal: 1000,
          media: null,
        },
        creator: { dataValues: { id: 1, username: "creator" } },
      },
    ];

    Campaign.findAll.mockResolvedValue(campaignsMock);

    const response = await agent
      .get("/campaigns");

    expect(response.status).toBe(200);
  });
});

describe("GET /campaigns/:id(\\d+)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    undefined,
    { id: 1, username: 'creator', password: "password", role: 'campaign_creator' },
    { id: 2, username: 'invalid_role', password: "password", role: 'invalid_role' },
    { id: 3, username: 'root_administrator', password: "password", role: 'root_administrator' },
    { id: 4, username: 'administrator', password: "password", role: 'administrator' },
    { id: 5, username: 'donor', password: "password", role: 'donor' },
  ])("should render campaigns page", async (user) => {
    User.findOne.mockResolvedValue(user);
    

    let agent = request.agent(app);
    if (user) {
      CampaignCreatorRequest.findOne.mockResolvedValue({ id: 200, creatorId: user.id, status: "Approved" });
      await agent
        .post("/login")
        .send(user);
    }
    const campaignsMock = [
      {
        dataValues: {
          id: 1,
          title: "Test Campaign",
          description: "Test Description",
          goal: 1000,
          media: null,
        },
        creator: { dataValues: { id: 1, username: "creator" } },
      },
    ];

    Campaign.findAll.mockResolvedValue(campaignsMock);
    Donation.findAll.mockResolvedValue([]);

    const response = await agent
      .get("/campaigns/1");

    expect(response.status).toBe(200);
  });
});

describe("GET /campaigns/owned", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    { id: 1, username: 'creator', password: "password", role: 'campaign_creator' },
  ])("should render owned campaigns page", async (user) => {
    User.findOne.mockResolvedValue(user);
    CampaignCreatorRequest.findOne.mockResolvedValue({ id: 200, creatorId: user.id, status: "Approved" });
    let agent = request.agent(app);
    await agent
      .post("/login")
      .send(user);

    const campaignsMock = [
      {
        dataValues: {
          id: 1,
          title: "Test Campaign",
          description: "Test Description",
          goal: 1000,
          media: null,
        },
        campaignRequest:{
          status: "accepted",
        }
      },
    ];

    Campaign.findAll.mockResolvedValue(campaignsMock);

    const response = await agent
      .get("/campaigns/owned");

    expect(response.status).toBe(200);
  });

  test.each([
    undefined,
    { id: 1, username: 'invalid_role', password: "password", role: 'invalid_role' },
    { id: 2, username: 'root_administrator', password: "password", role: 'root_administrator' },
    { id: 3, username: 'administrator', password: "password", role: 'administrator' },
    { id: 4, username: 'donor', password: "password", role: 'donor' },
  ])("should redirect unauthorized users to login", async (user) => {
    User.findOne.mockResolvedValue(user);

    let agent = request.agent(app);
    if (user) {
      await agent
        .post("/login")
        .send(user);
    }

    const response = await agent
      .get("/campaigns/owned");
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/login");
  });
});

describe("GET /campaigns/:id/delete", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    undefined,
    { id: 1, username: 'invalid_role', password: "password", role: 'invalid_role' },
  ])("should redirect unauthorized users to login", async (user) => {
    User.findOne.mockResolvedValue(user);

    let agent = request.agent(app);
    if (user) {
      await agent
        .post("/login")
        .send(user);
    }
    const response =await agent.get("/campaigns/1/delete");
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/login");
  });

  test.each([
    { id: 1, username: 'donor', password: "password", role: 'donor' },
  ])("should not allow donors to delete a campaign", async (user) => {
    User.findOne.mockResolvedValue(user);

    let agent = request.agent(app);

    await agent
      .post("/login")
      .send(user);

    const response = await agent
      .get("/campaigns/1/delete")

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/campaigns");
  });

  test.each([
    { id: 1, username: 'creator', password: "password", role: 'campaign_creator' },
  ])("should delete a campaign for campaign creator, redirecting to campaigns owned", async (user) => {
    User.findOne.mockResolvedValue(user);
    CampaignCreatorRequest.findOne.mockResolvedValue({ id: 200, creatorId: user.id, status: "Approved" });
    let agent = request.agent(app);

    await agent
      .post("/login")
      .send(user);

    Campaign.findByPk.mockResolvedValue({ campaignRequestId: 1, destroy: jest.fn().mockResolvedValue()});
    CampaignRequest.findByPk.mockResolvedValue({ destroy: jest.fn().mockResolvedValue()});  

    const response = await agent
      .get("/campaigns/1/delete")

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/campaigns/owned");
  });

  test.each([
    { id: 2, username: 'root_administrator', password: "password", role: 'root_administrator' },
    { id: 3, username: 'administrator', password: "password", role: 'administrator' },
    ])("should delete a campaign for administrator and root administrator, redirecting to reports", async (user) => {
    User.findOne.mockResolvedValue(user);

    let agent = request.agent(app);

    await agent
      .post("/login")
      .send(user);

    Campaign.findByPk.mockResolvedValue({ campaignRequestId: 1, destroy: jest.fn().mockResolvedValue()});
    CampaignRequest.findByPk.mockResolvedValue({ destroy: jest.fn().mockResolvedValue()});

    const response = await agent
      .get("/campaigns/1/delete")

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/reports");
  });
});

