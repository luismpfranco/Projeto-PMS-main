const { User, CampaignCreatorRequest } = require("../utils/sequelize").models;

/** 
 * Render the register page.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
function renderRegisterPage(req, res) {
	const { user, error } = req.session;
	req.session.error = "";
	res.render("register", { user, error });
}

/** 
 * Render the login page.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
function renderLoginPage(req, res) {
	const { user, error } = req.session;
	req.session.error = "";
	res.render("login", { user, error });
}

/** 
 * Render the user profile.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
function renderProfilePage(req, res) {
	const { user, error } = req.session;
	req.session.error = "";

	if (!user) {
		req.session.error = "Log in to access the profile page.";
		res.redirect("/login");
		return;
	}

	res.render("profile", { user, error });
}

/** 
 * Render the form to add a new administrator. It must be only visible to the root_administrator role.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
async function renderAdminCreationForm(req, res) {
	const { user } = req.session;

	if (!user || user.role != "root_administrator") {
		req.session.error = "You must be root to access this feature."
		res.redirect("/login");
		return;
	}

	res.render("admin_create_new_admin", { user });
}

/** 
 * Register the user in the platform.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
async function register(req, res) {
	const { username, password, password_confirmation, role } = req.body;

	if (!password || !username || !password_confirmation || !role) {
		req.session.error = "Empty fields.";
		res.redirect("/register");
		return;
	}

	if (password != password_confirmation) {
		req.session.error = "Different passwords.";
		res.redirect("/register");
		return;
	}

	let user = await User.findOne({ where: { username } });

	if (user) {
		req.session.error = "Username already taken.";
		res.redirect("/register");
		return;
	}

	user = { username, password, role, profilePicture: null };

	const file = req.file;
	if (user.role == "campaign_creator") {
		if (!file) {
			req.session.error = "No file uploaded.";
			res.redirect("/register");
			return;
		}
	}

	await User.create(user);

	if (user.role == "campaign_creator") {
		user = await User.findOne({ where: { username } });

		await CampaignCreatorRequest.create({
			identificationDocument: file.buffer,
			campaignCreatorId: user.id,
		});
	}

	res.redirect("/login");
}

/** 
 * Login the user, saving data on a session variable.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
async function login(req, res) {
	const { username, password } = req.body;

	// TODO: exclude password field for security
	const user = await User.findOne({ where: { username, password } });

	if (!user) {
		req.session.error = "User not found.";
		return res.redirect("/login");
	}

	req.session.user = user;

	switch (user.role) {
		case "donor":
			res.redirect("/campaigns");
			break;
		case "campaign_creator":
			const ccRequest = await CampaignCreatorRequest.findOne({
				where: { campaignCreatorId: user.id },
			});

			if (!ccRequest) {
				req.session.error = "User not have a Campaign Creator Request. Contact us to fix your problem.";
				console.log("Campaign creator " + user.username + " with id " + user.id + "doesn't have a campaign creator request.");
				res.redirect("/login");
				break;
			}

			switch (ccRequest.status) {
				case "Pending":
					req.session.error = "Your request to be a campaign creator wasnt validated. Please try again later.";
					res.redirect("/login");
					break;
				case "Approved":
					res.redirect("/campaigns/create");
					break
				case "Rejected":
					await user.destroy();
					req.session.error = "Your request to be a campaign creator was rejected. Please register again with a valid information/document.";
					res.redirect("/login");
					break;
				default:
					req.session.error = "User not have a valid status (" + ccRequest.status + ") in his Campaign Creator Request. Contact us to fix your problem.";
					res.redirect("/login");
					break;
			}
			break;
		case "root_administrator":
		case "administrator":
			res.redirect("/requests/campaigns");
			break
		default:
			req.session.error = "User does not have a valid role (" + user.role + "). Contact us to fix your problem.";
			res.redirect("/login");
			break;
	}
}

/** 
 * Update the user information.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
async function updateProfile(req, res) {
	try {
		const { id } = req.session.user;
		const { newUsername, newPassword, newPasswordConfirmation } = req.body;

		if (newPassword != newPasswordConfirmation) 
			throw new Error("Passwords do not match");

		const userWithSameUsername = await User.findOne({ where: { username: newUsername }});

		if (!userWithSameUsername || userWithSameUsername.id == id) {
			let data = {};
			data.username = newUsername;
			data.password = newPassword;
			if (req.file) data.picture = req.file.buffer;

			const sessionUser = await User.findOne({ where: { id }});
			await sessionUser.update(data);

			req.session.user = sessionUser;
		} else throw new Error("Username already in use");
	} catch (error) {
		req.session.error = error.message;
	} finally {
		res.redirect("/profile");
	}
}

/** 
 * Logout the user.
 *
 * @param{import("express").Request} req - The express request object.
 * @param{import("express").Response} res - The express response object.
 *
 * @returns{void}
 */
function logout(req, res) {
	req.session.destroy();
	res.redirect("/login");
}

module.exports = {
	renderRegisterPage,
	renderLoginPage,
	renderProfilePage,
	renderAdminCreationForm,
	login,
	logout,
	register,
	updateProfile
};
