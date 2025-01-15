const request = require('supertest');
const express = require('express');
const session = require("express-session-mock");
const multer = require('multer');
const { createCampaignUpdate } = require('../controllers/campaign-update-controller.js');

// Mock Sequelize model
jest.mock('../utils/sequelize.js', () => ({
  models: {
    CampaignUpdate: {
      create: jest.fn(),
    },
  },
}));

const { models } = require('../utils/sequelize.js');

// Express app setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "test-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Upload with multer middleware
const upload = multer();
app.post('/campaign/update', upload.single('media'), createCampaignUpdate);

describe('POST /campaign/update', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a campaign update and redirect', async () => {
    const mockData = {
      campaignId: 1,
      content: 'This is a test update.',
    };

    models.CampaignUpdate.create.mockResolvedValueOnce(mockData);

    const response = await request(app)
      .post('/campaign/update')
      .field('campaignId', '1')
      .field('content', 'This is a test update.');

    expect(models.CampaignUpdate.create).toHaveBeenCalledWith({
      campaignId: '1',
      content: 'This is a test update.',
    });

    expect(response.status).toBe(302); // Reddirection status
    expect(response.headers.location).toBe('/campaigns');
  });

  it('should handle file uploads', async () => {
    const mockFile = Buffer.from('Test File Content');
    const mockData = {
      campaignId: 1,
      content: 'This is a test update with file.',
      media: mockFile,
    };

    models.CampaignUpdate.create.mockResolvedValueOnce(mockData);

    const response = await request(app)
      .post('/campaign/update')
      .field('campaignId', '1')
      .field('content', 'This is a test update with file.')
      .attach('media', mockFile, 'test-file.txt');

    expect(models.CampaignUpdate.create).toHaveBeenCalledWith({
      campaignId: '1',
      content: 'This is a test update with file.',
      media: expect.any(Buffer),
    });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/campaigns');
  });

  it('should return an error if required fields are missing', async () => {
  const response = await request(app).post('/campaign/update').send({});

  expect(response.status).toBe(400); // Update status to 400
  expect(response.body).toEqual({ error: "campaignId and content are required." });
  expect(models.CampaignUpdate.create).not.toHaveBeenCalled();
});
});