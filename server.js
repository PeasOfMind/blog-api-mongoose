const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require("./config");
const { BlogPost } = require("./models");

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
    .then(post => res.json(post.serialize()))
    .catch(err => {
        console.log(err);
        res.status(500).json({message: "Internal server error"});
    });
});

app.post("/posts", (req, res) => {
    const requiredFields = ["title", "content", "author"];
    let err = false;
    let message;
    requiredFields.forEach( field => {
        if ( !(field in req.body) ) {
            message = `Missing \`${field}\` in request body`;
            err = true;
        } else if ( !(req.body.author.firstName) || !(req.body.author.lastName) ) {
            message = `Missing full name in request body`;
            err = true;
        }
    })
    if (err) {
        console.error(message);
        return res.status(400).send(message);
    }
    BlogPost.create({
        title: req.body.title,
        content: req.body.content,
        author: {
            firstName: req.body.author.firstName,
            lastName: req.body.author.lastName,
        },
        created: Date.now()
    })
    .then(post => res.status(201).json(post.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({ message: "Internal server error"});
    });
});

app.put("/posts/:id", (req, res) => {
    if ( !(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = `Request path id (${req.params.id}) and ` +
        `request body id (${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({message: message});
    }
    const toUpdate = {};
    const updateableFields = ["title", "content", "author"];
    updateableFields.forEach(field => {
        if(field in req.body) {
            toUpdate[field] = req.body[field];
        }
    })
    const updateId = req.params.id;
    BlogPost
    .findByIdAndUpdate(updateId, {$set: toUpdate})
    .then(BlogPost.findById(updateId))
    .then(post => res.status(200).json(post.serialize()))
    .catch(err => res.status(500).json({message: "Internal Server Error"}));
});

app.delete("/posts/:id", (req, res) => {
    BlogPost.findByIdAndRemove(req.params.id)
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: "Internal Server Error"}));
})

app.use("*", function (req, res) {
    res.status(404).json({ message: "Not Found"});
});

let server;

function runServer(databaseUrl, port = PORT){
    return new Promise((resolve, reject) => {
        mongoose.connect(
            databaseUrl,
            err => {
                if (err) return reject(err);
                server = app.listen(port, () => {
                    console.log(`Your app is listening on port ${port}`);
                    resolve();
                })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
            }
        );
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log("Closing server");
            server.close(err => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
  }

module.exports = {app, runServer, closeServer};