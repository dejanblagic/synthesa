const Concept = require('../models/Concept')
const categoriesCollection = require('../db').db().collection("categories")

exports.editor = function(req, res) {
    categoriesCollection.find({}).toArray().then((data) => {
        if (data) {
            res.render('concept-editor', {categories: data})
        } else {
            res.send("Something went wrong.")
        }
    })
}

exports.create = function(req, res) {
    let concept = new Concept(req.body, req.session.user._id)
    concept.create().then(function(newId) {
        req.flash("success", "New concept successfully created")
        req.session.save(() => res.redirect(`/concept/${newId}`))
    }).catch(function(errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/concept-editor"))
    })
}

exports.viewConcept = async function(req, res) {
    try {
        let concept = await Concept.findConceptById(req.params.id, req.visitorId)
        res.render('concept-screen', {concept: concept})
    } catch {
        res.render("404")
    }
}

exports.viewEdit = async function(req, res) {
    try {
        let concept = await Concept.findConceptById(req.params.id, req.visitorId)
        if (concept.isOwner) {
            categoriesCollection.find({}).toArray().then(data => {
                res.render('edit-concept', {concept: concept, categories: data});
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
    let concept = new Concept(req.body, req.visitorId, req.params.id) // params pokazuje na URL tu si ti podaci
    concept.update().then((status) => {
        if (status == "success") {
            req.flash("success", "Concept successfully updated")
            req.session.save(function () {
                res.redirect(`/concept/${req.params.id}/edit`)
            })
        } else {
            concept.errors.forEach(function (error) {
                req.flash("errors", error)
            })
            req.session.save(function () {
                res.redirect(`/concept/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        req.flash("errors", "You don't have permission to perform that action")
        req.session.save(function () {
            res.redirect("/")
        })
    })
}

exports.delete = function(req, res) {
    Concept.delete(req.params.id, req.visitorId).then(() => {
        req.flash("success", "Concept deleted")
        req.session.save(() => res.redirect('/'))
    }).catch(() => {
        req.flash("errors", "You can't delete concept")
        req.session.save(() => res.redirect('/'))
    })
}