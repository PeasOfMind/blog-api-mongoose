const uuid = require('uuid');
const mongoose = require("mongoose");

const blogSchema = mongoose.Schema({
    title: {type: String, required: true },
    content: {type: String, required: true },
    author: {type: String, required: true },
    created: Date.now(),
    id: uuid.v4()
});

blogSchema.virtual("authorString").get(function () {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
})

blogSchema.methods.serialize = function() {
    return {
        title: this.title,
        content: this.content,
        author: this.authorString,
        created: this.created
    }
}

const BlogPost = mongoose.model("BlogPost", blogSchema);

module.exports = {BlogPost};