const request = require("supertest");
const { readFileSync, readFile } = require("fs");
const app = require("../index");
const { CampaignCreatorRequest, User } = require("../utils/sequelize").models;

jest.mock("../utils/sequelize", () => ({
    models: {
        User: { findOne: jest.fn() },
		CampaignCreatorRequest: { 
            findAll: jest.fn(),
            findOne: jest.fn(), 
            findByPk: jest.fn(), 
            update: jest.fn() 
        },
    },
}));

const MOCK_CREATOR_REQ = {
    id: 1, 
    status: "Pending",
    identificationDocument: readFileSync("tests/test-document.pdf"),
    campaignCreator: { id: 1, username: "foo", role: "campaign_creator" },
    update: jest.fn(),
    destroy: jest.fn(),
};

describe("GET /campaign_creators", () => {
    beforeEach(() => {
        CampaignCreatorRequest.findAll.mockResolvedValue([ MOCK_CREATOR_REQ ]);
    });

    test("should redirect unauthorized users to the login page", async () => {
		const response = await request(app).get("/campaign_creators");
		expect(response.headers.location).toBe("/login");
	});

	test.each([
        { id: 1, username: "foo", password: "password", role: "campaign_creator" },
        { id: 2, username: "bar", password: "password", role: "donor" }
    ])("should not allow users with role '$role' to see pending campaign requests", async (user) => {
        if (user.role == "campaign_creator")
            CampaignCreatorRequest.findOne
                .mockResolvedValue({ id: 1, status: "Approved", campaignCreatorId: user.id });
        
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent.get("/campaign_creators");
        expect(response.headers.location).toBe("/login");
    });

    test.each([
        { id: 3, username: "jane", password: "password", role: "root_administrator" },
        { id: 4, username: "smith", password: "password", role: "administrator" }
    ])("should allow users with role '$role' to see pending campaign requests", async (user) => {
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent.get("/campaign_creators");
        expect(CampaignCreatorRequest.findAll).toBeCalled();
		expect(response.status).toBe(200);
    });

    // TODO: test with no requests
});

beforeEach(() => {
    CampaignCreatorRequest.findByPk.mockResolvedValue(MOCK_CREATOR_REQ);
});

afterEach(() => {
    CampaignCreatorRequest.findByPk.mockClear();
    MOCK_CREATOR_REQ.update.mockClear();
    MOCK_CREATOR_REQ.destroy.mockClear();
});

describe("GET /campaign_creators/:id", () => {
    test("should redirect unauthorized users to the login page", async () => {
		const response = await request(app).get(`/campaign_creators/${MOCK_CREATOR_REQ.id}`);
		expect(response.headers.location).toBe("/login");
	});

	test.each([
        { id: 1, username: "foo", password: "password", role: "campaign_creator" },
        { id: 2, username: "bar", password: "password", role: "donor" }
    ])("should not allow users with role '$role' to see the campaign request", async (user) => {
        if (user.role == "campaign_creator")
            CampaignCreatorRequest.findOne
                .mockResolvedValue({ id: 1, status: "Approved", campaignCreatorId: user.id });
        
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent.get(`/campaign_creators/${MOCK_CREATOR_REQ.id}`);
        expect(response.headers.location).toBe("/login");
    });

    test.each([
        { id: 3, username: "jane", password: "password", role: "root_administrator" },
        { id: 4, username: "smith", password: "password", role: "administrator" }
    ])("should allow users with role '$role' to see the campaign request", async (user) => {
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent.get(`/campaign_creators/${MOCK_CREATOR_REQ.id}`);
        expect(CampaignCreatorRequest.findByPk).toBeCalled();
		expect(response.status).toBe(200);
    });
    
    const agent = request.agent(app);

    beforeAll(async () => {
        const user = {
            id: 3, username: "jane",
            password: "password",
            role: "root_administrator"
        };
        User.findOne.mockResolvedValue(user);
        await agent.post("/login").send(user);
    });

    test("should return to '/campaign_creators' if the ':id' parameter does not correspond to a creator request", async () => {
        const response = await agent.get(`/campaign_creators/0`);
        expect(response.headers.location).toBe("/campaign_creators");
    });

    test("should return to '/campaign_creators' if the campaign request status is not 'Pending'", async () => {
        let approvedCreatorRequest = MOCK_CREATOR_REQ;
        approvedCreatorRequest.status = "Approved";
        CampaignCreatorRequest.findByPk.mockResolvedValue(approvedCreatorRequest);
        
       const response = await agent.get(`/campaign_creators/${approvedCreatorRequest.id}`);
        expect(response.headers.location).toBe("/campaign_creators");
    });
});

describe("POST /campaign_creators/update_status/:id", () => {
	test("should redirect unauthorized users to the login page", async () => {
		const response = await request(app)
            .post(`/campaign_creators/update_status/${MOCK_CREATOR_REQ.id}`)
            .send({ status: "Approved" });

        expect(MOCK_CREATOR_REQ.update).not.toBeCalled();
		expect(response.headers.location).toBe("/login");
	});

	test.each([
        { id: 1, username: "foo", password: "password", role: "campaign_creator" },
        { id: 2, username: "bar", password: "password", role: "donor" }
    ])("should not allow users with role '$role' to update the status of a campaign creator request", async (user) => {
        if (user.role == "campaign_creator")
            CampaignCreatorRequest.findOne
                .mockResolvedValue({ id: 1, status: "Approved", campaignCreatorId: user.id });
        
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent
            .post(`/campaign_creators/update_status/${MOCK_CREATOR_REQ.id}`)
            .send({ status: "Approved" });

        expect(MOCK_CREATOR_REQ.update).not.toBeCalled();
        expect(response.headers.location).toBe("/login");
    });

    test.each([
        { id: 3, username: "jane", password: "password", role: "root_administrator" },
        { id: 4, username: "smith", password: "password", role: "administrator" }
    ])("should allow users with role '$role' to update the status of a campaign creator request", async (user) => {
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent
            .post(`/campaign_creators/update_status/${MOCK_CREATOR_REQ.id}`)
            .send({ status: "Approved" });

        expect(MOCK_CREATOR_REQ.update).toBeCalled();
        expect(response.headers.location).toBe("/campaign_creators");
    });

    const user = { id: 3, username: "jane", password: "password", role: "root_administrator" };
    User.findOne.mockResolvedValue(user);

    test.each([
        "Approved",
        "Rejected"
    ])("should accept a request body with status field as '%s'", async (status) => {
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent
            .post(`/campaign_creators/update_status/${MOCK_CREATOR_REQ.id}`)
            .send({ status });

        expect(MOCK_CREATOR_REQ.update).toBeCalled();
        expect(response.headers.location).toBe("/campaign_creators");
    });

    test("should not accept a request body with any other status field", async () => {
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent
            .post(`/campaign_creators/update_status/${MOCK_CREATOR_REQ.id}`)
            .send({ status: "" });

        expect(MOCK_CREATOR_REQ.update).not.toBeCalled();
        expect(response.headers.location).toBe("/campaign_creators");
    });

    test("should not accept an empty request body", async () => {
        const agent = request.agent(app);
        await agent.post("/login").send(user);
    
        const response = await agent
            .post(`/campaign_creators/update_status/${MOCK_CREATOR_REQ.id}`)
            .send({});

        expect(MOCK_CREATOR_REQ.update).not.toBeCalled();
        expect(response.headers.location).toBe("/campaign_creators");
    });
});

describe("GET /campaign_creators/:id/document", () => {
	test("should redirect unauthorized users to the login page", async () => {
		const response = await request(app)
            .get(`/campaign_creators/${MOCK_CREATOR_REQ.id}/document`);
		expect(response.headers.location).toBe("/login");
	});

	test.each([
        { id: 1, username: "foo", password: "password", role: "campaign_creator" },
        { id: 2, username: "bar", password: "password", role: "donor" }
    ])("should not allow users with role '$role' to see the identification document", async (user) => {
        if (user.role == "campaign_creator")
            CampaignCreatorRequest.findOne
                .mockResolvedValue({ id: 1, status: "Approved", campaignCreatorId: user.id });

        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent
            .get(`/campaign_creators/${MOCK_CREATOR_REQ.id}/document`);

		expect(response.headers.location).toBe("/login");
    });

    test.each([
        { id: 3, username: "jane", password: "password", role: "root_administrator" },
        { id: 4, username: "smith", password: "password", role: "administrator" }
    ])("should allow users with role '$role' to see the creator identification document", async (user) => {
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

        const response = await agent
            .get(`/campaign_creators/${MOCK_CREATOR_REQ.id}/document`);

        expect(response.headers['content-type']).toBe('application/pdf');
        expect(response.body.toString('utf8', 0, 4)).toBe('%PDF');
        expect(response.body.equals(MOCK_CREATOR_REQ.identificationDocument)).toBe(true);
    });
});

describe("DELETE /campaign_creators/:id", () => {
	test("should redirect unauthorized users to the login page", async () => {
		const response = await request(app)
            .del(`/campaign_creators/${MOCK_CREATOR_REQ.id}`);
        expect(MOCK_CREATOR_REQ.destroy).not.toBeCalled();
		expect(response.headers.location).toBe("/login");
	});

	test.each([
        { id: 1, username: "foo", password: "password", role: "campaign_creator" },
        { id: 2, username: "bar", password: "password", role: "donor" }
    ])("should not allow users with role '$role' to delete a campaign creator request", async (user) => {
        if (user.role == "campaign_creator")
            CampaignCreatorRequest.findOne
                .mockResolvedValue({ id: 1, status: "Approved", campaignCreatorId: user.id });
        
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

		const response = await request(app)
            .del(`/campaign_creators/${MOCK_CREATOR_REQ.id}`);

        expect(MOCK_CREATOR_REQ.destroy).not.toBeCalled();
        expect(response.headers.location).toBe("/login");
    });

    test.each([
        { id: 3, username: "jane", password: "password", role: "root_administrator" },
        { id: 4, username: "smith", password: "password", role: "administrator" }
    ])("should allow users with role '$role' to delete a campaign creator request", async (user) => {
        User.findOne.mockResolvedValue(user);
        const agent = request.agent(app);
        await agent.post("/login").send(user);

		const response = await request(app)
            .del(`/campaign_creators/${MOCK_CREATOR_REQ.id}`);

        expect(MOCK_CREATOR_REQ.destroy).toBeCalled();
        expect(response.headers.location).toBe("/campaign_creators");
    });
});
