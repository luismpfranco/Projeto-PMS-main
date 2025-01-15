const app = require("../index");
const request = require("supertest");
const { Campaign, User, CampaignRequest, CampaignCreatorRequest } = require("../utils/sequelize").models;

jest.mock("../utils/sequelize", () => ({
    models: {
		Campaign: { findAll: jest.fn(), update: jest.fn() },
		CampaignRequest: { update: jest.fn() },
		User: { findOne: jest.fn() },
		CampaignCreatorRequest: { findOne: jest.fn() },	
    },
}));

afterEach(() => {
	CampaignRequest.update.mockClear();
});

describe("GET /request/campaigns", () => {
	test("should redirect unauthorized users to the login page", async () => {
		const response = await request(app).get("/requests/campaigns");
		expect(response.headers.location).toBe("/login");
	});

	test.each([
		{ id: 1, username: 'creator', password: "password", role: 'campaign_creator' },
		{ id: 2, username: 'donor', password: "password", role: 'donor' },
	])("should redirect to the login page to all users with role '$role'", async (user) => {
		User.findOne.mockResolvedValue(user);

		if (user.role == "campaign_creator")
			CampaignCreatorRequest.findOne
				.mockResolvedValue({ id: 1, status: "Approved" });
		
		let agent = request.agent(app);
		await agent
			.post("/login")
			.send(user);
		
		const response = await agent.get("/requests/campaigns");
		expect(response.headers.location).toBe("/login");
	});

	test.each([
		{ id: 3, username: 'admin', password: "password", role: 'administrator' },
		{ id: 4, username: 'root', password: "password", role: 'root_administrator' },
	])("should show the campaign requests page to all users with role '$role'", async (user) => {
		User.findOne.mockResolvedValue(user);
		
		let agent = request.agent(app);
		await agent
			.post("/login")
			.send(user);

		const campaigns = [{ 
			id: 100, 
			title: "title",
			description: "description",
			campaignRequest: { status: "Approved" },
			creator: { username: "creator" },
		}];
		Campaign.findAll.mockResolvedValue(campaigns);
		
		const response = await agent.get("/requests/campaigns");
		expect(response.status).toBe(200);
	});
});

describe('POST /requests/campaigns', () => {
	test('should not allow unauthorized users to validate the campaigns', async () => {
        const response = await request(app)
            .post('/requests/campaigns')
            .send({ campaignRequestId: 123, status: 'Approved' });

		expect(CampaignRequest.update).not.toBeCalled();
		expect(response.status).not.toBe(200);
    });

    test.each([
		{ id: 1, username: 'creator', password: "password", role: 'campaign_creator' },
		{ id: 2, username: 'donor', password: "password", role: 'donor' },
	])("should not allow users with role '$role' to validate the campaigns", async (user) => {
        User.findOne.mockResolvedValue(user);

		if (user.role == "campaign_creator")
			CampaignCreatorRequest.findOne
				.mockResolvedValue({ id: 1, status: "Approved" });
		
		let agent = request.agent(app);
		await agent
			.post("/login")
			.send(user);

		const response = agent
			.post("/requests/campaigns")
			.send({ campaignRequestId: 123, status: "Approved" });

		expect(CampaignRequest.update).not.toBeCalled();
		expect(response.status).not.toBe(200);
    });
	
	test.each([
		{ id: 3, username: 'admin', password: "password", role: 'administrator' },
		{ id: 4, username: 'root', password: "password", role: 'root_administrator' },
	])("should allow users with role '$role' to validate the campaigns and redirect them to the campaign requests page", async (user) => {
		User.findOne.mockResolvedValue(user);

		let agent = request.agent(app);
		await agent
			.post("/login")
			.send(user);

		// TODO: test against different status strings ('Pending', 'Rejected' or other)
		const response = await agent
			.post("/requests/campaigns")
			.send({ campaignRequestId: 123, status: "Approved" });
		
        expect(Campaign.update).toHaveBeenLastCalledWith(
            { validatorId: user.id },
            { where: { campaignRequestId: 123 } }
        );
		expect(CampaignRequest.update).toHaveBeenLastCalledWith(
			{ status: 'Approved' },
			{ where: { id: 123 } }
		);
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/requests/campaigns');
    });
});