// Dependencies
const express = require("express");
const session = require("express-session");

// Routes
const userRoutes = require("./routes/user-routes");
const campaignRoutes = require("./routes/campaign-routes");
const donationRoutes = require("./routes/donation-routes");
const campaignUpdateRoutes = require("./routes/campaign-update-routes.js");
const campaignRequestRoutes = require("./routes/campaign-requests-routes");
const reportRoutes = require("./routes/report-routes");
const campaignCreatorRequestRoutes = require("./routes/campaign-creator-request-routes");

// Variables
const PORT = 3000;
const ONEDAY = 24 * 60 * 60 * 1000;
const SECRET = "secret";
const app = express();

// Config
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: SECRET,
    saveUninitialized: true,
    cookie: { maxAge: ONEDAY },
    resave: false
}));

// Routes
app.use("/", userRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/donations", donationRoutes);
app.use("/campaigns/updates", campaignUpdateRoutes);
app.use("/requests/campaigns", campaignRequestRoutes);
app.use("/reports", reportRoutes);
app.use("/campaign_creators", campaignCreatorRequestRoutes);

// Entry point
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Listenning at port ${PORT}`)
    });
}

module.exports = app;
