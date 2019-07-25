const functions = require('firebase-functions');
const app = require('express')()

//Handlers
const { getAllPosts, 
    addPost,     
    getPost, 
    deletePost, 
    likePost, 
    unlikePost,
    commentPost } = require('./handlers/posts')
const { 
    handleSignup, 
    handleLogin, 
    uploadImage, 
    addUserDetails, 
    getAuthUser,
 } = require('./handlers/users')

//Middleware for protected routes
const  { FBAuth } = require('./util/middleware'
)


//Posts routes:
app.get('/posts', getAllPosts)
app.post('/post', FBAuth,addPost)
app.post('/post/:postId', getPost)
app.delete('/post/:postId', FBAuth, deletePost)
app.post('/post/:postId', FBAuth, likePost)
app.post('/post/:postId', FBAuth, unlikePost)
app.post('/post/:postId/comment', commentPost)


//Users routes:
app.post('/signup', handleSignup)
app.post('/login', handleLogin)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.post('/user', FBAuth, getAuthUser)

// Specify here the region for deploying function routes. otherwise it defaults to us-central1 region
exports.api = functions.region('europe-west1').https.onRequest(app)