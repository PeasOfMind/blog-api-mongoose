const mongoose = require("mongoose");

const authorSchema = mongoose.Schema({
    firstName: "string",
    lastName: "string",
    userName: {type: String, unique: true}
});

const commentSchema = mongoose.Schema({ content: "string"});

const blogSchema = mongoose.Schema({
    title: {type: String, required: true },
    content: {type: String, required: true },
    author: {type: mongoose.Schema.Types.ObjectId, ref: "Author"},
    created: {type: Date, default: Date.now()},
    comments: [commentSchema]
});


// blogSchema.virtual("authorString").get(function () {
    //     return `${this.author.firstName} ${this.author.lastName}`.trim();
    // })
    
blogSchema.virtual("authorName").get(function(){
    return `${this.author.firstName} ${this.author.lastName}`.trim();
})

blogSchema.methods.serialize = function() {
    return {
        title: this.title,
        content: this.content,
        author: this.authorName,
        created: Date.parse(this.created),
    }
}

authorSchema.methods.serialize = function(){
    return {
        _id: this._id,
        name: `${this.firstName} ${this.lastName}`,
        userName: this.userName
    }
}

blogSchema.pre('find', function(next) {
    this.populate('author');
    next();
});

blogSchema.pre('findOne', function(next) {
    this.populate('author');
    next();
});

blogSchema.pre('findByIdAndUpdate', function(next) {
    this.populate('author');
    next();
});

const Author = mongoose.model("Author", authorSchema);
const Comment = mongoose.model("Comment", commentSchema);
const BlogPost = mongoose.model("BlogPost", blogSchema);

module.exports = {Author, Comment, BlogPost};