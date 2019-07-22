const functions = require('firebase-functions');
const app = require('express')()
const firebase = require('firebase') //client side lib
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

const firebaseConfig = require('./config.json')
// Initialize Firebase
firebase.initializeApp(firebaseConfig);


//Helper functions
const isEmpty = (string) => string.trim() === '' ? true : false
//Regexp check:
const isEmail = (string) =>  {
    const regExp =  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return string.match(regExp) ? true : false
}

app.get('/posts', (req, resp) => {
    db.collection('posts').get()
    .then(data => {
        let posts = []
        data.forEach(doc => posts.push({
            postId: doc.id,
            body: doc.data().body,
            userHandle: doc.data().userHandle,
            createdAt: doc.data().createdAt
        }))
        return resp.json(posts)
    })
    .catch(error => console.error('Something went wrong, check log: ', error))
})

//middleware for protected routes
const FBAuth = (req, resp, next) => {
    let idToken
    //Check first that token authorization exists
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1]
    } else {
        console.error('No token found')
        return resp.status(403).json({error: 'Unauthorized'})
    }

    //verify token:
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        })
        .then( data => {
            req.user.handle = data.docs[0].data().handle
            return next()
        })
        .catch(error => {
            console.error('Something went wrong: ', error)
            resp.status(403).json(error)
        })
}

app.post('/post', FBAuth,(req, resp) => {
    const newPost = {
        body: req.body.body,
        userHandle: req.user.handle ,
        createdAt: new Date().toISOString()
    };

    db.collection('posts')
    .add(newPost)
    .then(docRef => {
        return resp.json({message: `document ${docRef['id']} has been created succesfully`})
    })
    .catch(error => {
        console.error('Something went wrong, please check logs: ', error)
        resp.status(500).json({error: 'something went wrong'})
    })
})


//sign up:
app.post('/signup', (req, resp) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,

    }

    /**
     * Server side validation (client side should have too in the future)
     */

    let errors = {}
    
    if (isEmpty(newUser.email)){
        errors.email = 'Cannot be empty'

    } else if (!isEmail(newUser.email)){
        errors.email = 'Must be a valid email address'
    }

    if (isEmpty(newUser.password)) errors.password = 'Cannot be empty'
    if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must be the same'

    if (isEmpty(newUser.handle)) errors.handle = 'Cannot be Empty'

    if (Object.keys(errors).length > 0) resp.status(400).json({ errors })
    let token
    let userId //to retrieve later 
    // Check if the user handle already exists in database
    db.doc(`/users/${newUser.handle}`).get()
        .then(docSnapShot => {
            if(docSnapShot.exists) {
                return resp.status(400).json({handle: 'This user handle is already taken'})
             } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
             }
        })
        .then( data => {
            userId = data.user.uid
            return data.user.getIdToken()
        })
        .then( idToken => {
            token = idToken
            const userCreds = { 
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId: userId
            }
            return db.doc(`/users/${userCreds.handle}`).set(userCreds)
        })
        .then(()=> {
            return resp.status(201).json({ token })
        })
        .catch(error => {
            console.error('Something went wrong: ', error)
            resp.status(500).json({ error: error.message })
        })

})


app.post('/login', (req, resp)=> {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    //validate
    let errors = {}
    if(isEmpty(user.email)) errors.email = 'Cannot be Empty'
    if (isEmpty(user.password)) errors.password = 'Cannot be empty'

    if (Object.keys(errors).length > 0) resp.status(400).json({ errors })

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then( token => resp.json({ token }))
        .catch(error => {
            console.error('Something went wrong: ', error)
            if (error.code === '/auth/password') {
                return resp.status(403).json({general: 'Wrong credentials. Please try again'})
            } else {
                return resp.status(500).json({error: error})

            }
        })
})
// Specify here the region for deploying function routes. otherwise it defaults to us-central1 region
exports.api = functions.region('europe-west1').https.onRequest(app)