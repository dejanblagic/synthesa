const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const conceptController = require('./controllers/conceptController')
const categoryController = require('./controllers/categoryController')


// user
router.get('/', userController.home)
router.get('/login', userController.adminLogin)
router.post('/synths', userController.login)
router.post('/logout', userController.logout)
router.get('/concepts', userController.concepts)
router.get('/about', userController.about)

// post
router.get('/editor', userController.mustLogin, postController.editor)
router.post('/editor', userController.mustLogin, postController.create)
router.get('/post/:id', postController.viewPost)
router.get('/post/:id/edit', userController.mustLogin, postController.viewEdit)
router.post('/post/:id/edit', userController.mustLogin, postController.edit)
router.post('/post/:id/delete', userController.mustLogin, postController.delete)

// concept
router.get('/concept-editor', userController.mustLogin, conceptController.editor)
router.post('/concept-editor', userController.mustLogin, conceptController.create)
router.get('/concept/:id', conceptController.viewConcept)
router.get('/concept/:id/edit', userController.mustLogin, conceptController.viewEdit)
router.post('/concept/:id/edit', userController.mustLogin, conceptController.edit)
router.post('/concept/:id/delete', userController.mustLogin, conceptController.delete)

// category
router.get('/category-editor', userController.mustLogin, categoryController.editor)
router.post('/category-editor', userController.mustLogin, categoryController.create)

module.exports = router