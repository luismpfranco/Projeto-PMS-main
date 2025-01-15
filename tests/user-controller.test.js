"use strict";

const request = require("supertest");
const express = require("express");
const session = require("express-session");
const userRoutes = require("../routes/user-routes");
const { login } = require("../controllers/user-controller");
const { User, CampaignCreatorRequest } = require("../utils/sequelize").models;

jest.mock("../utils/sequelize", () => ({
    models: {
        User: { findOne: jest.fn(), create: jest.fn() },
        CampaignCreatorRequest: { findOne: jest.fn(), create: jest.fn() },
    },
}));

describe("User Routes Tests - NOT LOGGED USER", () => {
    let app;

    beforeEach(() => {
        // Variables
        const ONEDAY = 24 * 60 * 60 * 1000;
        const SECRET = "test_secret";
        
        app = express();

        // Config
        app.set("views", `${__dirname}/../views`);
        app.set("view engine", "ejs");
        app.use(express.urlencoded({ extended: true }));
        app.use(session({
            secret: SECRET,
            saveUninitialized: true,
            cookie: { maxAge: ONEDAY },
            resave: false
        }));
        // Routes
        app.use("/", userRoutes);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /login renders login page", async () => {
        const res = await request(app).get("/login");
        expect(res.status).toBe(200);
    });

    test("GET /register renders register page", async () => {
        const res = await request(app).get("/register");
        expect(res.status).toBe(200);
    });
    
    test("GET /profile redirects when user is not logged in", async () => {
        const res = await request(app).get("/profile");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });
    
    test("GET /register/admin redirects when user, admin, is not logged in", async () => {
        const res = await request(app).get("/register/admin");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    test("GET /register/admin redirect to /login if not logged in", async () => {
        const res = await request(app).get('/register/admin');

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login'); 
    });

    test("POST /login fails with invalid credentials", async () => {
        User.findOne.mockResolvedValue(null);
    
        const res = await request(app).post("/login").send({
            username: "invalid_user",
            password: "invalid_pass",
        });
    
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    test("POST /login succeeds with valid credentials", async () => {
        User.findOne.mockResolvedValue({ username: "valid_user", password: "valid_pass", role: "donor" });
    
        const res = await request(app).post("/login").send({
            username: "valid_user",
            password: "valid_pass",
        });
    
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/campaigns");
    });

    test("POST /register fails with missing fields", async () => {
        const res = await request(app).post("/register").send({ username: "new_user" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/register");
    });

    test("POST /register creator fails to insert file", async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ id: 1, username: "new_user" });
    
        const res = await request(app)
            .post("/register")
            .send({
            username: "new_user",
            password: "password123",
            password_confirmation: "password123",
            role: "campaign_creator",
        });
    
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/register");
    });
    
    test("POST /register succeeds with valid data as a DONOR", async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ id: 1, username: "new_user" });
    
        const res = await request(app)
            .post("/register")
            .field("username", "new_user")
            .field("password", "password123")
            .field("password_confirmation", "password123")
            .field("role", "donor")
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    test("POST /register succeeds with valid data as a ADMIN", async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ id: 1, username: "new_user" });
    
        const res = await request(app)
            .post("/register")
            .field("username", "new_user")
            .field("password", "password123")
            .field("password_confirmation", "password123")
            .field("role", "administrator")
        
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    test("POST /register succeeds with valid data and file upload for CREATOR", async () => {
        jest.mock("../utils/upload", () => ({
            uploadDocument: {
                single: jest.fn(() => (req, res, next) => {
                    req.file = {
                        buffer: Buffer.from("mock-file-buffer"),
                        originalname: "mock-file.pdf",
                        mimetype: "application/pdf",
                        size: 1024,
                    };
                    next();
                }),
            },
            multerErrorHandlerIdDocument: jest.fn((err, req, res, next) => next()),
        }));

        User.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 1, username: "new_creator" });
        User.create.mockResolvedValue({ id: 1, username: "new_creator"});
        CampaignCreatorRequest.create.mockResolvedValue({});

        const res = await request(app)
            .post("/register")
            .field("username", "new_creator")
            .field("password", "pass123")
            .field("password_confirmation", "pass123")
            .field("role", "campaign_creator")
            .attach("id_document", Buffer.from("mock-file-buffer"), "mock-file.pdf");

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });
});

describe("Login as a CREATOR", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: { username: "testuser", password: "testpassword" },
            session: { error: null, user: null },
        };

        res = {
            redirect: jest.fn(),
        };

        jest.clearAllMocks();
    });

    test("Campaign creator request is missing", async () => {
        User.findOne.mockResolvedValue({ id: 1, username: "testuser", role: "campaign_creator" });
        CampaignCreatorRequest.findOne.mockResolvedValue(null);

        await login(req, res);

        expect(req.session.error).toBe("User not have a Campaign Creator Request. Contact us to fix your problem.");
        expect(res.redirect).toHaveBeenCalledWith("/login");
    });

    test("Pending campaign creator request", async () => {
        User.findOne.mockResolvedValue({ id: 1, username: "testuser", role: "campaign_creator" });
        CampaignCreatorRequest.findOne.mockResolvedValue({ status: "Pending" });

        await login(req, res);

        expect(req.session.error).toBe("Your request to be a campaign creator wasnt validated. Please try again later.");
        expect(res.redirect).toHaveBeenCalledWith("/login");
    });

    test("Approved campaign creator request", async () => {
        User.findOne.mockResolvedValue({ id: 1, username: "testuser", role: "campaign_creator" });
        CampaignCreatorRequest.findOne.mockResolvedValue({ status: "Approved" });

        await login(req, res);

        expect(res.redirect).toHaveBeenCalledWith("/campaigns/create");
    });

    test("Delete Srejected campaign creator request", async () => {
        const mockUser = { id: 1, username: "testuser", role: "campaign_creator", destroy: jest.fn() };
        User.findOne.mockResolvedValue(mockUser);
        CampaignCreatorRequest.findOne.mockResolvedValue({ status: "Rejected" });

        await login(req, res);

        expect(mockUser.destroy).toHaveBeenCalled();
        expect(req.session.error).toBe(
            "Your request to be a campaign creator was rejected. Please register again with a valid information/document."
        );
        expect(res.redirect).toHaveBeenCalledWith("/login");
    });

    test("Invalid status in campaign creator request", async () => {
        User.findOne.mockResolvedValue({ id: 1, username: "testuser", role: "campaign_creator" });
        CampaignCreatorRequest.findOne.mockResolvedValue({ status: "InvalidStatus" });

        await login(req, res);

        expect(req.session.error).toBe(
            "User not have a valid status (InvalidStatus) in his Campaign Creator Request. Contact us to fix your problem."
        );
        expect(res.redirect).toHa
    });
});

describe("User Routes Tests - DONOR", () => {
    let app;
    let agent;
    let mockUser;

    beforeEach(async () => {
        // Variables
        const ONEDAY = 24 * 60 * 60 * 1000;
        const SECRET = "test_secret";
        
        app = express();

        // Config
        app.set("views", `${__dirname}/../views`);
        app.set("view engine", "ejs");
        app.use(express.urlencoded({ extended: true }));
        app.use(session({
            secret: SECRET,
            saveUninitialized: true,
            cookie: { maxAge: ONEDAY },
            resave: false
        }));
        // Routes
        app.use("/", userRoutes);
        // Set up a request agent to simulate an authenticated session
        agent = request.agent(app);

        mockUser = { id: 1, username: "donor", password: "valid_pass", role: "donor" };
        // Mock user login
        User.findOne.mockResolvedValue(mockUser);

        // Login as a DONOR
        await agent.post("/login").send({
            username: "donor",
            password: "valid_pass",
        });

    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /profile renders profile page", async () => {
        const res = await agent.get("/profile");
        expect(res.status).toBe(200);
    });

    test("POST /profile update profile successfully", async () => {
        const mockUpdate = jest.fn().mockResolvedValue(true);

        User.findOne
            .mockResolvedValueOnce(null) 
            .mockResolvedValueOnce({ id: 1, update: mockUpdate }); 

        const response = await agent
            .post("/profile")
            .field("newUsername", "user2")
            .field("newPassword", "newpass123")
            .field("newPasswordConfirmation", "newpass123")
            .attach('picture', 'tests/test-image.jpg'); 

        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/profile");
        expect(User.findOne).toHaveBeenCalledTimes(3);
        expect(User.findOne).toHaveBeenNthCalledWith(2, { where: { username: "user2" } }); 
        expect(User.findOne).toHaveBeenNthCalledWith(3, { where: { id: 1 } });
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            username: 'user2',
            password: 'newpass123',
            picture: expect.any(Buffer), // Ensure the picture is passed correctly as a buffer
        }));
    });

    test("GET /register/admin redirect to login", async () => {
        agent.session = { user: mockUser };

        const response = await agent.get('/register/admin');
        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/login");
    });

    test("GET /logout destroys session and redirects", async () => {
        // Perform the GET request to logout
        const response = await agent.get("/logout");

        // Verify redirection after logout
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/login");
    });
});


describe("User Routes Tests - CREATOR", () => {
    let app;
    let agent;
    let mockUser;

    beforeEach(async () => {
        // Variables
        const ONEDAY = 24 * 60 * 60 * 1000;
        const SECRET = "test_secret";
        
        app = express();

        // Config
        app.set("views", `${__dirname}/../views`);
        app.set("view engine", "ejs");
        app.use(express.urlencoded({ extended: true }));
        app.use(session({
            secret: SECRET,
            saveUninitialized: true,
            cookie: { maxAge: ONEDAY },
            resave: false
        }));
        // Routes
        app.use("/", userRoutes);
        // Set up a request agent to simulate an authenticated session
        agent = request.agent(app);

        mockUser = { id: 1, username: "creator", password: "valid_pass", role: "creator" };
        // Mock user login
        User.findOne.mockResolvedValue(mockUser);

        // Login as a CREATOR
        await agent.post("/login").send({
            username: "creator",
            password: "valid_pass",
        });

    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /profile renders profile page", async () => {
        const res = await agent.get("/profile");
        expect(res.status).toBe(200);
    });

    test("POST /profile update profile successfully", async () => {
        const mockUpdate = jest.fn().mockResolvedValue(true);

        User.findOne
            .mockResolvedValueOnce(null) 
            .mockResolvedValueOnce({ id: 1, update: mockUpdate }); 

        const response = await agent
            .post("/profile")
            .field("newUsername", "user2")
            .field("newPassword", "newpass123")
            .field("newPasswordConfirmation", "newpass123")
            .attach('picture', 'tests/test-image.jpg'); 

        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/profile");
        expect(User.findOne).toHaveBeenCalledTimes(3);
        expect(User.findOne).toHaveBeenNthCalledWith(2, { where: { username: "user2" } }); 
        expect(User.findOne).toHaveBeenNthCalledWith(3, { where: { id: 1 } });
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            username: 'user2',
            password: 'newpass123',
            picture: expect.any(Buffer), // Ensure the picture is passed correctly as a buffer
        }));
    });

    test("GET /register/admin redirect to login", async () => {
        agent.session = { user: mockUser };

        const response = await agent.get('/register/admin');
        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/login");
    });

    test("GET /logout destroys session and redirects", async () => {
        // Perform the GET request to logout
        const response = await agent.get("/logout");

        // Verify redirection after logout
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/login");
    });
});


describe("User Routes Tests - ADMIN", () => {
    let app;
    let agent;
    let mockUser;

    beforeEach(async () => {
        // Variables
        const ONEDAY = 24 * 60 * 60 * 1000;
        const SECRET = "test_secret";
        
        app = express();

        // Config
        app.set("views", `${__dirname}/../views`);
        app.set("view engine", "ejs");
        app.use(express.urlencoded({ extended: true }));
        app.use(session({
            secret: SECRET,
            saveUninitialized: true,
            cookie: { maxAge: ONEDAY },
            resave: false
        }));
        // Routes
        app.use("/", userRoutes);
        // Set up a request agent to simulate an authenticated session
        agent = request.agent(app);

        mockUser = { id: 1, username: "admin", password: "valid_pass", role: "administrator" };
        // Mock user login
        User.findOne.mockResolvedValue(mockUser);

        // Login as a ADMIN
        await agent.post("/login").send({
            username: "admin",
            password: "valid_pass",
        });

    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /profile renders profile page", async () => {
        const res = await agent.get("/profile");
        expect(res.status).toBe(200);
    });

    test("POST /profile update profile successfully", async () => {
        const mockUpdate = jest.fn().mockResolvedValue(true);

        User.findOne
            .mockResolvedValueOnce(null) 
            .mockResolvedValueOnce({ id: 1, update: mockUpdate }); 

        const response = await agent
            .post("/profile")
            .field("newUsername", "user2")
            .field("newPassword", "newpass123")
            .field("newPasswordConfirmation", "newpass123")
            .attach('picture', 'tests/test-image.jpg'); 

        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/profile");
        expect(User.findOne).toHaveBeenCalledTimes(3);
        expect(User.findOne).toHaveBeenNthCalledWith(2, { where: { username: "user2" } }); 
        expect(User.findOne).toHaveBeenNthCalledWith(3, { where: { id: 1 } });
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            username: 'user2',
            password: 'newpass123',
            picture: expect.any(Buffer), // Ensure the picture is passed correctly as a buffer
        }));
    });

    test("GET /register/admin redirect to login", async () => {
        agent.session = { user: mockUser };

        const response = await agent.get('/register/admin');
        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/login");
    });

    test("GET /logout destroys session and redirects", async () => {
        // Perform the GET request to logout
        const response = await agent.get("/logout");

        // Verify redirection after logout
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/login");
    });
});


describe("User Routes Tests - ROOT ADMIN", () => {
    let app;
    let agent;
    let mockUser;

    beforeEach(async () => {
        // Variables
        const ONEDAY = 24 * 60 * 60 * 1000;
        const SECRET = "test_secret";
        
        app = express();

        // Config
        app.set("views", `${__dirname}/../views`);
        app.set("view engine", "ejs");
        app.use(express.urlencoded({ extended: true }));
        app.use(session({
            secret: SECRET,
            saveUninitialized: true,
            cookie: { maxAge: ONEDAY },
            resave: false
        }));
        // Routes
        app.use("/", userRoutes);
        // Set up a request agent to simulate an authenticated session
        agent = request.agent(app);

        mockUser = { id: 1, username: "root", password: "valid_pass", role: "root_administrator" };
        // Mock user login
        User.findOne.mockResolvedValue(mockUser);

        // Login as a ROOT ADMIN
        await agent.post("/login").send({
            username: "root",
            password: "valid_pass",
        });

    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /profile renders profile page", async () => {
        const res = await agent.get("/profile");
        expect(res.status).toBe(200);
    });

    test("POST /profile update profile successfully", async () => {
        const mockUpdate = jest.fn().mockResolvedValue(true);

        User.findOne
            .mockResolvedValueOnce(null) 
            .mockResolvedValueOnce({ id: 1, update: mockUpdate }); 

        const response = await agent
            .post("/profile")
            .field("newUsername", "user2")
            .field("newPassword", "newpass123")
            .field("newPasswordConfirmation", "newpass123")
            .attach('picture', 'tests/test-image.jpg'); 

        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/profile");
        expect(User.findOne).toHaveBeenCalledTimes(3);
        expect(User.findOne).toHaveBeenNthCalledWith(2, { where: { username: "user2" } }); 
        expect(User.findOne).toHaveBeenNthCalledWith(3, { where: { id: 1 } });
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            username: 'user2',
            password: 'newpass123',
            picture: expect.any(Buffer), 
        }));
    });

    test("GET /register/admin render register admin page", async () => {
        agent.session = { user: mockUser };

        const response = await agent.get('/register/admin');
        expect(response.status).toBe(200); 
    });

    test("GET /logout destroys session and redirects", async () => {
        const response = await agent.get("/logout");

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/login");
    });
});