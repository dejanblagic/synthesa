const usersCollection = require('../db').db().collection("users")
const validator = require("validator")
const bcrypt = require('bcryptjs')

let User = function(data) {
    this.data = data
    this.errors = []
}

User.prototype.cleanUp = function() {
    if (typeof(this.data.username) !="string") {this.data.username = ""}
    if (typeof(this.data.email) !="string") {this.data.email = ""}
    if (typeof(this.data.password) !="string") {this.data.password = ""}

    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if (this.data.username == "") {this.errors.push("You must provide an username")}
        if (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters")}
        if (this.data.username.length > 30) {this.errors.push("Username cannot exceed 100 characters")}
        if (this.data.username !="" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers")}
        if (this.data.password == "") {this.errors.push("You must provide a password")}
        if (this.data.password.length > 0 && this.data.password.length < 2) {this.errors.push("Password must be at least 7 characters")}
        if (this.data.password.length > 50) {this.errors.push("Password cannot exceed 50 characters")}
        
        // Only if username is valid then check to see if it's already taken
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if (usernameExists) {this.errors.push("That username is already taken.")}
        }

      // Only if email is valid then check to see if it's already taken
        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if (emailExists) {this.errors.push("That email is already being used.")}
        }
    
        resolve()
    })
  }
  

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({username: this.data.username}).then((user) => {
            if (user && bcrypt.compareSync(this.data.password, user.password)) {
                this.data = user
                resolve('Congrats')
            } else {
                reject("Credentials are not correct.")
            }
        }).catch(function() {
            reject("Please try again later.")
        })
    })
}

module.exports = User