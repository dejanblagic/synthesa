const Category = require('../models/Category')

exports.editor = function(req, res) {
    res.render('category-editor')
}

exports.create = function(req, res) {
    let category = new Category(req.body, req.session.user._id)
    category.create().then(function() {
        req.flash("success", "New category successfully created")
        req.session.save(() => res.redirect('/'))
    }).catch(function(errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("/category-editor"))
    })
}