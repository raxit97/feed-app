const express = require('express');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const { signupValidation } = require('./validation-schema');

const router = express.Router();

router.put('/signup', signupValidation, async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed.');
            error.statusCode = 422;
            return next(error);
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ email, password: hashedPassword, name, posts: [] });
        const user = await newUser.save();
        res.status(201).json({
            message: 'User created!',
            userId: user._id.toString()
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('A user with this email cannot be found.');
            error.statusCode = 401;
            return next(error);
        }
        const doesPasswordMatch = await bcrypt.compare(password, user.password);
        if (!doesPasswordMatch) {
            const error = new Error('Password does not match.');
            error.statusCode = 401;
            return next(error);
        }
        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString()
            },
            'somesupersecretkey',
            { expiresIn: '1h' }
        );
        res.status(201).json({ token, userId: user._id.toString() });
    } catch (error) {
        next(error);
    }
})

module.exports = router;
