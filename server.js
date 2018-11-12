const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const {PORT, Database_URL} = require("./config");
const { BlogPost } = require(".models");

const app = express();
app.use(express.json());

//get all blog posts
app.get("/posts", (req, res) => {
    BlogPost.find()
    .then(blogPosts => {
        res.json({
            blogPosts: blogPosts.map(post => post.serialize())
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal server error"});
    });
});

//get post by id
app.get("/posts/:id", (req, res) => {
    BlogPost
    .findById(req.params.id)
    .then(post => res.json(post.seralize()))
    .catch(err => {
        console.log(err);
        res.status(500).json({message: "Internal server error"});
    });
});

app.use("*", function (req, res) {
    res.status(404).json({ message: "Not Found"});
});

