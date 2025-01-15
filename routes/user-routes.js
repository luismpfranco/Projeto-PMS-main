const express = require('express');
const { uploadDocument, multerErrorHandlerIdDocument, uploadImage } = require('../utils/upload');
const userController = require('../controllers/user-controller');

const router = express.Router();

router.get('/login', userController.renderLoginPage);

router.get('/register', userController.renderRegisterPage);

router.get('/register/admin', userController.renderAdminCreationForm);

router.get('/profile', userController.renderProfilePage);

router.post('/login', userController.login);

router.post('/register', uploadDocument.single('id_document'), multerErrorHandlerIdDocument, userController.register);

router.post('/profile', uploadImage.single('picture'), userController.updateProfile);

router.get('/logout', userController.logout)

module.exports = router;
