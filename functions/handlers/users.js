//Helper functions
const {validateSignUp, validateLogin } = require('../util/helpers')

//db utilities:
const { db } = require('../util/admin')
//firebase client side:
const firebase = require('firebase')
const firebaseConfig = require('../util/config')
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

exports.handleSignup = (req, resp) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,

    }
    //Validate input: 
    const  { valid, errors } = validateSignUp(newUser)
    
    if(!valid) return resp.status(500).json({errors})

    let token
    let userId //to retrieve later 
    // Check if the user handle already exists in database
    return db.doc(`/users/${newUser.handle}`).get()
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
            return resp.status(500).json({ error: error.message })
        })

}

exports.handleLogin = (req, resp) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    //validate
    const  { valid, errors } = validateLogin(user)
    if(!valid) return resp.status(500).json({errors})

    return firebase.auth().signInWithEmailAndPassword(user.email, user.password)
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
}
