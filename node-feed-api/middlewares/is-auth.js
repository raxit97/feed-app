const jwt = require('jsonwebtoken');

const isAuth = (req, res, next) => {
    try {
        const authorizationHeader = req.get('Authorization');
        if (!authorizationHeader) {
            return Promise.reject(new Error('Token not sent.'));
        }
        const token = authorizationHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, 'somesupersecretkey');
        if (!decodedToken) {
            return Promise.reject(new Error('Not authenticated.'));
        }
        req.userId = decodedToken.userId;
        next();
    } catch (error) {
        error.statusCode = 401;
        return next(error);
    }
};

module.exports = isAuth;
