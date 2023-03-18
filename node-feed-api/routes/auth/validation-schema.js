const { body } = require("express-validator");
const User = require("../../models/user");

const signupValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom(async (email, { req }) => {
            const user = await User.findOne({ email });
            if (user) {
                return Promise.reject('User already exists!!');
            }
        }),
    body('name')
        .trim()
        .isLength({ min: 5 }),
    body('password')
        .trim()
        .not()
        .isEmpty()
];

module.exports = { signupValidation };
