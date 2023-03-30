const Post = require('../models/Post')
const conceptsCollection = require('../db').db().collection("concepts")

exports.editor = function(req, res) {
    conceptsCollection.find({}).toArray().then((data) => {
        if (data) {
            res.render('editor', {concepts: data})
        } else {
            res.send("Something went wrong.")
        }
    })
}

exports.create = function(req, res) {
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function(newId) {
        req.flash("success", "New post successfully created")
        req.session.save(() => res.redirect(`/post/${newId}`))
    }).catch(function(errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/editor"))
    })
}

exports.viewPost = async function(req, res) {
    try {
        let post = await Post.findPostById(req.params.id, req.visitorId)
        res.render('post-screen', {post: post})
    } catch {
        res.render("404")
    }
}

exports.viewEdit = async function(req, res) {
    try {
        let post = await Post.findPostById(req.params.id, req.visitorId)
        if (post.isOwner) {
            conceptsCollection.find({}).toArray().then(data => {
                res.render('edit-post', {post: post, concepts: data});
            })
        } else {
            req.flash("errors", "You don't have permission to perform that action")
            req.session.save(() => res.redirect('/'))
        }
    } catch {
        res.render("404")
    }
}


exports.edit = function(req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id) // params pokazuje na URL tu si ti podaci
    post.update().then((status) => {
        // post updated in db
        // validation errors
        if (status == "success") {
            // post updated in db
            req.flash("success", "Post successfully updated")
            req.session.save(function () {
                res.redirect(`/post/${req.params.id}`)
            })
        } else {
            post.errors.forEach(function (error) {
                req.flash("errors", error)
            })
            req.session.save(function () {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        // post doesn't exist
        // visitor not owner
        req.flash("errors", "You don't have permission to perform that action")
        req.session.save(function () {
            res.redirect("/")
        })
    })
}

exports.delete = function(req, res) {
    Post.delete(req.params.id, req.visitorId).then(() => {
        req.flash("success", "Post deleted")
        req.session.save(() => res.redirect('/'))
    }).catch(() => {
        req.flash("errors", "You can't delete post")
        req.session.save(() => res.redirect('/'))
    })
}