const User = require('../models/User')
const postsCollection = require('../db').db().collection("posts")
const conceptsCollection = require('../db').db().collection("concepts")
const categoriesCollection = require('../db').db().collection("categories")
const ObjectID = require('mongodb').ObjectId


exports.mustLogin = function(req, res, next) {
    if (req.session.user) {
        next()
    } else {
        req.flash("errors", "You must be logged in to perform that action.")
        req.session.save(function() {
            res.redirect('/')
        })
    }
}

exports.login = function(req, res) {
    let user = new User(req.body)
    user.login().then(function(result) {
        req.session.user = {username: user.data.username, _id: user.data._id}
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch(function(e) {
        req.flash('errors', e)
        req.session.save(function() {
            res.redirect('/login')
        })
    })
  }

exports.home = function(req, res) {
    Promise.all([
        conceptsCollection.find({}).toArray(),
        postsCollection.find({}).toArray(),
        categoriesCollection.find({}).toArray()
    ])
    .then(([concepts, posts, categories]) => {
        const postsWithConcepts = posts.map(post => {
            if (post.conceptFirst && ObjectID.isValid(post.conceptFirst) && post.conceptSecond && ObjectID.isValid(post.conceptSecond)) {
                post.conceptFirst = concepts.find(concept => concept._id.toString() === post.conceptFirst.toString());
                post.conceptSecond = concepts.find(concept => concept._id.toString() === post.conceptSecond.toString());
            }
            return post;
        });
        const conceptsWithCategories = concepts.map(concept => {
            if (concept.category && ObjectID.isValid(concept.category)) {
                concept.category = categories.find(category => category._id.toString() === concept.category.toString());
            }
            return concept;
        });
        if (postsWithConcepts && conceptsWithCategories) {
            res.render('synths', {posts: postsWithConcepts, concepts: conceptsWithCategories, categories: categories})
        } else {
            res.send("Something went wrong.")
        }        })
    .catch(err => {
        res.render('/', {errors: req.flash('errors')})
    });
}

exports.adminLogin = function(req, res) {
    if (req.session.user) {
        res.render('synths', {username: req.session.user.username})
    } else {
        res.render('login', {errors: req.flash('errors')})
    }
}

exports.logout = function(req, res) {
    req.session.destroy(function() {
        res.redirect('/')
    })
}

exports.concepts = function(req, res) {
    Promise.all([
        conceptsCollection.find({}).toArray(),
        categoriesCollection.find({}).toArray()
    ])
    .then(([conceptsCollection, categoriesCollection]) => {
        const conceptsWithCategories = conceptsCollection.map(concept => {
            if (concept.category && ObjectID.isValid(concept.category)) {
                concept.category = categoriesCollection.find(category => category._id.toString() === concept.category.toString());
            }
            return concept;
        });
        if (conceptsWithCategories) {
            res.render('concepts', {concepts: conceptsWithCategories, categories: categoriesCollection})
        } else {
            res.send("Something went wrong.")
        }        })
    .catch(err => {
        res.status(500).json({ message: err.message });
    });
}

exports.about = function(req, res) {
    res.render('about')
}
