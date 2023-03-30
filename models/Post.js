const postsCollection = require('../db').db().collection("posts")
const ObjectID = require('mongodb').ObjectId
const sanitizeHTML = require('sanitize-html')

let Post = function(data, userid, postid) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.postid = postid
}

Post.prototype.cleanUp = function() {
    if(typeof(this.data.description) !="string") {this.data.description = ""}
    if(typeof(this.data.body) !="string") {this.data.body = ""}

    this.data = {
        conceptFirst: ObjectID(this.data.conceptFirst),
        conceptSecond: ObjectID(this.data.conceptSecond),
        description: sanitizeHTML(this.data.description.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
        createdDate: new Date(),
        author: ObjectID(this.userid)
    }
}

Post.prototype.validate = function() {
    if (this.data.description == "") {this.errors.push("You must provide a description")}
    if (this.data.body == "") {this.errors.push("You must provide post content")}
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length) {
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.insertedId)
            }).catch(() => {
                this.errors.push("Please try again")
                reject(this.errors)
            })
        } else {
            reject(this.errors)
        }
    })
}

Post.findPostById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        // checking id
        if (typeof(id) !="string" || !ObjectID.isValid(id)) {
            reject()
            return
        } 
        // finding
        let posts = await postsCollection.aggregate([
            {$match: {_id: new ObjectID(id)}},
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$lookup: {from: "concepts", localField: "conceptFirst", foreignField: "_id", as: "conceptFirstDocument"}},
            {$lookup: {from: "concepts", localField: "conceptSecond", foreignField: "_id", as: "conceptSecondDocument"}},
            {$lookup: {from: "categories", localField: "conceptFirstDocument.category", foreignField: "_id", as: "conceptFirstCategory"}},
            {$lookup: {from: "categories", localField: "conceptSecondDocument.category", foreignField: "_id", as: "conceptSecondCategory"}},
            {$project: {
              conceptFirst: {$arrayElemAt: ["$conceptFirstDocument", 0]},
              conceptSecond: {$arrayElemAt: ["$conceptSecondDocument", 0]},
              categoryFirst: {$arrayElemAt: ["$conceptFirstCategory", 0]},
              categorySecond: {$arrayElemAt: ["$conceptSecondCategory", 0]},
              description: 1,
              body: 1,
              createdDate: 1,
              authorId: "$author",
              author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
          ], visitorId).toArray()

        // clean up author property in each post object
        posts = posts.map(function(post) {
            post.isOwner = post.authorId.equals(visitorId)
            post.author = {
                username: post.author.username
            }
            return post
        })

        if (posts.length) {
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.prototype.update = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findPostById(this.postid, this.userid)
            if (post.isOwner) {
                let status = await this.actuallyUpdate()
                resolve(status)
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.postid)}, {$set: {
                conceptFirst: this.data.conceptFirst, 
                conceptSecond: this.data.conceptSecond, 
                description: this.data.description, 
                body: this.data.body
            }})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Post.delete = function(postId, currentUser) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findPostById(postId, currentUser)
            if (post.isOwner) {
                await postsCollection.deleteOne({_id: new ObjectID(postId)})
                resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

module.exports = Post