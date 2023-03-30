const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')
const csrf = require('csurf')
const app = express()

let sessionOptions = session({
    secret: "Complexity is cool science",
    store: MongoStore.create({client: require('./db')}), 
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOptions)
app.use(flash())

const router = require('./router')

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(function(req, res, next) {
    // make markdown available on ejs
    res.locals.filterUserHTML = function(content) {
        // return sanitizeHTML(markdown.parse(content), {allowedTags: ['p', 'br', 'strong', 'bold', 'em', 'h1', 'h2', 'a', 'ul', 'li'], allowedAttributes: {'a': [ 'href' ]}})
        return markdown.parse(content)

    }

    // make flash message available on all routes
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")

    // make current user id available on all routes
    if(req.session.user) {req.visitorId = req.session.user._id} else {req.visitorId = 0}

    // make sessions for all routes
    res.locals.user = req.session.user
    next()
}) 

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(csrf())

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', router)

app.use(function(err, req, res, next) {
    if (err) {
        if (err.code == "EBADCSRFTOKEN") {
            req.flash('errors', "Cross site request forgery detected.")
            req.session.save(() => res.redirect('/'))
        } else {
            res.render("404")
        }
    }
}) 

module.exports = app