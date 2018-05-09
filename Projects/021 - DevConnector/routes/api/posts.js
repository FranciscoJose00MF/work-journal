const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const router = express.Router();

// Load Input Validation
const validatePostInput = require('../../validation/post');

// Load Post model
const Post = require('../../models/Post');
// Load Profile model
const Profile = require('../../models/Profile');

// @route:  GET api/posts/test
// @desc:   Tests posts route
// @access: Public
router.get('/test', (req, res) => res.json({ msg: 'Posts is working!' }));

// @route:  GET api/posts
// @desc:   Get posts sorted by date
// @access: Public
router.get('/', (req, res) => {
    Post.find()
        .sort({ date: -1 })
        .then(posts => res.json(posts))
        .catch(e => res.status(404).json(e));
});

// @route:  GET api/posts/:post_id
// @desc:   Get post by ID
// @access: Public
router.get('/:post_id', (req, res) => {
    const { post_id } = req.params;

    Post.findById(post_id)
        .then(post => res.json(post))
        .catch(e => res.status(404).json(e));
});

// @route:  POST api/posts
// @desc:   Create post
// @access: Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check validation
    if(!isValid) {
        return res.status(400).json(errors);
    }

    const { text, name, avatar } = req.body;
    const { id } = req.user;

    const newPost = { text, name, avatar, user: id };

    new Post(newPost).save().then(post => res.json(post));
});

// @route:  DELETE api/posts/:post_id
// @desc:   Delete post by ID
// @access: Private
router.delete('/:post_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { post_id } = req.params;
    const { id } = req.user;

    Profile.findOne({ user: id })
        .then(profile => {
            Post.findById(post_id)
                .then(post => {
                    // Check for post owner
                    if(post.user.toString() !== id) {
                        return res.status(401).json({ notauthorized: 'User not authorized!' });
                    }

                    // Delete post
                    post.remove().then(() => res.json({ success: true }));
                })
                .catch(e => res.status(404).json(e));
        });
});

module.exports = router;