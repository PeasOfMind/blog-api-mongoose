const uuid = require('uuid');
const mongoose = require("mongoose");

const blogSchema = mongoose.Schema({
    title: {type: String, required: true },
    content: {type: String, required: true },
    author: {
        firstName: {type: String, required: true }, 
        lastName: {type: String, required: true}
    },
    created: {type: Date, default: Date.now()}
});

blogSchema.virtual("authorString").get(function () {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
})

blogSchema.methods.serialize = function() {
    return {
        title: this.title,
        content: this.content,
        author: this.authorString,
        created: Date.parse(this.created)
    }
}

const BlogPost = mongoose.model("BlogPost", blogSchema);

module.exports = {BlogPost};