const multer = require('multer');

const memoryStorage = multer.memoryStorage();

const fileFilter = (allowedTypes) => {
    return (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            const error = new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
            error.status = 400;
            return cb(error, false);
        }
    };
};

const idDocument_maxFileSize = 5 * 1024 * 1024; // Máx. 5MB
const uploadDocument = multer({
    storage: memoryStorage,
    fileFilter: fileFilter(['application/pdf']), // Only PDFs
    limits: { fileSize: idDocument_maxFileSize }, 
});

const profileImage_maxFileSize = 5 * 1024 * 1024; // Máx. 2MB
const uploadImage = multer({
    storage: memoryStorage,
    fileFilter: fileFilter(['image/jpeg', 'image/png']), // Only JPEG e PNG
    limits: { fileSize: profileImage_maxFileSize }, 
});

function multerErrorHandlerIdDocument(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            req.session.error = `File is too large. Max allowed size is ${idDocument_maxFileSize / (1024 * 1024)} MB.`;
        } else {
            req.session.error = err.message || "An unexpected error occurred during file upload.";
        }
        return res.redirect("/register");
    }
    next(err);
}

module.exports = {
    uploadDocument,
    uploadImage,
    multerErrorHandlerIdDocument,
};