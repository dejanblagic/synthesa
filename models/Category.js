const categoriesCollection = require('../db').db().collection("categories")

let Category = function(data, userid) {
    this.data = data
    this.errors = []
    this.userid = userid
}

Category.prototype.cleanUp = function() {
    if(typeof(this.data.title) !="string") {this.data.title = ""}

    this.data = {
        title: this.data.title.trim(),
        color: this.data.color
    }
}

Category.prototype.validate = function() {
    if (this.data.title == "") {this.errors.push("You must provide a title")}
    if (this.data.color == "") {this.errors.push("You must provide a color")}

}

Category.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length) {
            categoriesCollection.insertOne(this.data).then(() => {
                resolve()
            }).catch(() => {
                this.errors.push("Please try again")
                reject(this.errors)
            })
        } else {
            reject(this.errors)
        }
    })
}

module.exports = Category