const functions = require('firebase-functions');
const app = require('express')();

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
    getUserDetails,
    markNotificationsAsRead
 } = require('./handlers/users')

const {
    createNotification,
    deleteNotification,
    triggerUpdateOfImageUrl,
    triggerDeleteOfAllPostRelatedData
} = require('./handlers/notifications')

//Middleware for protected routes
const  { FBAuth } = require('./util/middleware'
)


//Posts routes:
app.get('/posts', getAllPosts)
app.post('/post', FBAuth,addPost)
app.get('/post/:postId', getPost)
app.delete('/post/:postId', FBAuth, deletePost)
app.post('/post/:postId/like', FBAuth, likePost)
app.post('/post/:postId/unlike', FBAuth, unlikePost)
app.post('/post/:postId/comment', FBAuth, commentPost)


//Users routes:
app.post('/signup', handleSignup)
app.post('/login', handleLogin)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthUser)
app.get('/user/:handle', getUserDetails)
app.post('/notifications', markNotificationsAsRead)

// Specify here the region for deploying function routes. otherwise it defaults to us-central1 region
exports.api = functions.region('europe-west1').https.onRequest(app)

//Handle notifications using firebase database triggers: 
exports.createNotificationOnLike = createNotification('like')
exports.createNotificationOnComment = createNotification('comment')
exports.deleteNotificationOnUnlike = deleteNotification('like')

exports.onUserImageChange = triggerUpdateOfImageUrl()


exports.onPostDelete = triggerDeleteOfAllPostRelatedData()
