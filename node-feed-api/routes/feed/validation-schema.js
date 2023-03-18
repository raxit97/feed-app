const { body } = require("express-validator");

const createPostValidation = [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 }),
];

module.exports = { createPostValidation };
