const conceptsCollection = require('../db').db().collection("concepts")
const ObjectID = require('mongodb').ObjectId
const sanitizeHTML = require('sanitize-html')

let Concept = function(data, userid, conceptid) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.conceptid = conceptid
}

Concept.prototype.cleanUp = function() {
    if(typeof(this.data.title) !="string") {this.data.title = ""}
    if(typeof(this.data.description) !="string") {this.data.description = ""}
    if(typeof(this.data.body) !="string") {this.data.body = ""}

    this.data = {
        title: this.data.title.trim(),
        description: this.data.description.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(),
        category: ObjectID(this.data.category),
        author: ObjectID(this.userid)
    }
}

Concept.prototype.validate = function() {
    if (this.data.title == "") {this.errors.push("You must provide a title")}
    if (this.data.description == "") {this.errors.push("You must provide a description")}
    if (this.data.body == "") {this.errors.push("You must provide concept content")}
}

Concept.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length) {
            conceptsCollection.insertOne(this.data).then((info) => {
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

Concept.findConceptById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        // checking id
        if (typeof(id) !="string" || !ObjectID.isValid(id)) {
            reject()
            return
        } 
        // finding
        let concepts = await conceptsCollection.aggregate([
            {$match: {_id: new ObjectID(id)}},
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$lookup: {from: "categories", localField: "category", foreignField: "_id", as: "categoryDocument"}},
            {$project: {
              title: 1,
              description: 1,
              body: 1,
              createdDate: 1,
              category: {$arrayElemAt: ["$categoryDocument", 0]},
              authorId: "$author",
              author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
          ], visitorId).toArray()

        // clean up author property in each concept object
        concepts = concepts.map(function(concept) {
            concept.isOwner = concept.authorId.equals(visitorId)
            concept.author = {
                username: concept.author.username
            }
            return concept
        })

        if (concepts.length) {
            // console.log(concepts[0])
            resolve(concepts[0])
        } else {
            reject()
        }
    })
}

Concept.prototype.update = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let concept = await Concept.findConceptById(this.conceptid, this.userid)
            if (concept.isOwner) {
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

Concept.prototype.actuallyUpdate = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            await conceptsCollection.findOneAndUpdate({_id: new ObjectID(this.conceptid)}, {$set: {
                title: this.data.title, 
                description: this.data.description,
                category: this.data.category,
                body: this.data.body}})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Concept.delete = function(conceptId, currentUser) {
    return new Promise(async (resolve, reject) => {
        try {
            let concept = await Concept.findConceptById(conceptId, currentUser)
            if (concept.isOwner) {
                await conceptsCollection.deleteOne({_id: new ObjectID(conceptId)})
                resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

module.exports = Concept