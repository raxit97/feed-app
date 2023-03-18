const express = require('express');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { getIo } = require('../../socket');
const isAuth = require('../../middlewares/is-auth');
const Post = require('../../models/post');
const User = require('../../models/user');
const { createPostValidation } = require('./validation-schema');
const router = express.Router();

router.get('/posts', isAuth, async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const ITEMS_PER_PAGE = 2;
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
        res.status(200).json({ posts, totalItems });
    } catch (error) {
        next(error)
    }
});

router.post('/post', [isAuth, createPostValidation], async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const errors = validationResult(req)
        if (!errors.isEmpty() || !req.file) {
            const errorMessage = !req.file ? 'Attached file is not an image' : 'Validation failed. Entered data is invalid.';
            const error = new Error(errorMessage);
            error.statusCode = 422;
            return next(error);
        }
        const imageUrl = req.file.path;
        const newPost = new Post({
            title, imageUrl, content, creator: req.userId
        });
        const post = await newPost.save();
        const user = await User.findById(req.userId);
        user.posts.push(post._id);
        await user.save();
        getIo().emit('posts', {
            action: 'create',
            post: {
                ...post._doc,
                creator: { _id: req.userId, name: user.name }
            }
        });
        res.status(201).json({
            message: 'Post created successfully.',
            post,
            creator: { _id: user._id, name: user.name }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/post/:postId', isAuth, async (req, res, next) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 422;
            return next(error);
        }
        res.status(200).json({ message: 'Post fetched', post });
    } catch (error) {
        next(error);
    }
});

router.put('/post/:postId', [isAuth, createPostValidation], async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const { postId } = req.params;
        const imageUrl = req.file ? req.file.path : req.body.image;
        const errors = validationResult(req)
        if (!errors.isEmpty() || !imageUrl) {
            const errorMessage = !imageUrl ? 'No file picked.' : 'Validation failed. Entered data is invalid.';
            const error = new Error(errorMessage);
            error.statusCode = 422;
            return next(error);
        }
        const post = await Post.findById(postId).populate('creator', 'name');
        if (post.creator._id.toString() !== req.userId) {
            const error = new Error('Not authorized to update the post');
            error.statusCode = 403;
            return next(error);
        }
        if (post.imageUrl !== imageUrl) {
            clearImage(post.imageUrl)
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        const updateResult = await post.save();
        getIo().emit('posts', { action: 'update', post: updateResult });
        res.status(200).json({ message: 'Post updated', post: updateResult });
    } catch (error) {
        next(error);
    }
});

router.delete('/post/:postId', isAuth, async (req, res, next) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 422;
            return next(error);
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized to delete the post');
            error.statusCode = 403;
            return next(error);
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove({ _id: postId });
        const user = await User.findById(req.userId);
        // user.posts = user.posts.filter(post => post._id.toString() !== postId);
        user.posts.pull(postId);
        await user.save();
        getIo().emit('posts', { action: 'delete', postId });
        res.status(200).json({ message: 'Post deleted.' });
    } catch (error) {
        next(error);
    }
});

const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', '..', filePath)
    fs.unlink(filePath, err => console.error(err));
};

module.exports = router;
