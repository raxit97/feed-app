const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const router = require('./routes');

const app = express();
const server = http.createServer(app);

const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => callback(null, 'public/images'),
    filename: (req, file, callback) => {
        callback(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        callback(null, true);
    } else {
        callback(null, false);
    }
};

app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/images', express.static(path.join(__dirname, 'public/images')));
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use(bodyParser.json());
app.use(cors());
app.use(router);

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message;
    console.error(error);
    res.status(statusCode).json({
        message
    });
});

mongoose.connect(
    `mongodb+srv://raxitjain:Pwu0YVxueSozErp6@cluster0.z8bnvsw.mongodb.net/node-feed`
).then(() => {
    server.listen(8080, () => console.log('Listening to port 8080...'));
    const io = require('./socket').init(server);
    io.on('connection', (socket) => {
        console.log('Client Connected', socket.id);
    });
});