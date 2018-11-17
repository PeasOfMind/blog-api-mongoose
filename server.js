const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require("./config");
const { Author, Comment, BlogPost } = require("./models");

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
    .then(post => {
        const fetchedPost = post.serialize();
        fetchedPost.comments = post.comments;
        res.status(200).json(fetchedPost);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({message: "Internal server error"});
    });
});

app.post("/posts", (req, res) => {
    const requiredFields = ["title", "content", "author_id"];
    let error = false;
    let message;
    requiredFields.forEach( field => {
        if ( !(field in req.body) ) {
            message = `Missing \`${field}\` in request body`;
            error = true;
        }
    });
    Author.findById(req.body.author_id)
    .then(author => {
        BlogPost.create({
            title: req.body.title,
            content: req.body.content,
            author: author._id,
        })
        .then(post => {
            const newPost = post.serialize();
            newPost.comments = post.comments;
            newPost.author = `${author.firstName} ${author.lastName}`;           
            res.status(201).json(newPost);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error"});
        });
    })
    .catch(err => {
        console.log(err);
        res.status(400).json({message: "Author not found"})
    });

    if (error) {
        console.error(message);
        return res.status(400).send(message);
    }
});

app.put("/posts/:id", (req, res) => {
    if ( !(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = `Request path id (${req.params.id}) and ` +
        `request body id (${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({message: message});
    }
    const toUpdate = {};
    const updatableFields = ["title", "content"];
    updatableFields.forEach(field => {
        if(field in req.body) {
            toUpdate[field] = req.body[field];
        }
    })
    const updateId = req.params.id;
    BlogPost
    .findByIdAndUpdate(updateId, {$set: toUpdate}, {new:true})
    .then(post => res.status(200).json(post.serialize()))
    .catch(err => res.status(500).json({message: "Internal Server Error"}));
});

app.delete("/posts/:id", (req, res) => {
    BlogPost.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: "Internal Server Error"}));
})

app.post("/authors", (req, res) => {
    const requiredFields = ["firstName", "lastName", "userName"];
    let error = false;
    let message;
    requiredFields.forEach( field => {
        if( !(field in req.body) ){
            message = `Missing \`${field}\` in request body`;
            error = true;
        }
    });

    // if ( !(error) ){
    //     console.log('searching for username');
    //     Author.findOne({ "userName": req.body.userName}, function(err, author) {
    //         console.log(author);
    //         if (! (err) ){
    //             console.log('found username')
    //             message = `Username: ${author.userName} is already taken`
    //             error = true;
    //         } 
    //     });
    // }
    
    // console.log('message is:', message)

    if (error) {
        console.log('in error if statement now')
        console.error(message);
        return res.status(400).send(message);
    }

    Author.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName
    })
    .then(author => res.status(201).json(author.serialize()))
    .catch(err => {
        console.error(err);
        res.status(400).json({message: "Username is already taken"});
    });
})

app.put("/authors/:id", (req, res) => {
    // let error = false;
    if ( !(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = `Request path id (${req.params.id}) and ` +
        `request body id (${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({message: message});
    }
    const toUpdate = {};
    const updatableFields = ["firstName", "lastName", "userName"];
    updatableFields.forEach(field => {
        if(field in req.body) {
            // if(field === "userName") {
            //     Author.findOne({userName: req.body.userName})
            //     .then(author => {
            //         console.log('error begins as:', error);
            //         const message = `Username: ${author.userName} is already taken`;
            //         console.log('error message is:', message);
            //         res.status(400).send(message);
            //         error = true;
            //     })
            //     .catch(err => {
            //         toUpdate[userName] = req.body.userName;
            //     })
            // } else {
            //     toUpdate[field] = req.body[field];
            // }
            toUpdate[field] = req.body[field];
        }
    })
    // if ( !(error) ){
    //     const updateId = req.params.id;
    //     Author.findByIdAndUpdate(updateId, {$set: toUpdate}, {new: true})
    //     .then(author => res.status(200).json(author.serialize()))
    //     .catch(err => res.status(500)).json({message: "Internal Server Error"});
    // }
    const updateId = req.params.id;
    Author.findByIdAndUpdate(updateId, {$set: toUpdate}, {new: true})
    .then(author => res.status(200).json(author.serialize()))
    .catch(err => res.status(400).json({message: "Username is already taken"}));
});

app.delete("/authors/:id", (req, res) => {
    Author.findByIdAndRemove(req.params.id)
    .then(() => {
        BlogPost.deleteMany({author: req.params.id})
        .then(() => res.status(204).end())
        .catch(err => res.status(500).json({message: "Internal Server Error"}));
    })
    .catch(err => res.status(400).json({message: "Author not found"}));
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
            }, { useNewUrlParser: true }
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