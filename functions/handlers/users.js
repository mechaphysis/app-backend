//Helper functions
const {validateSignUp, validateLogin, getImgUrl, reduceUserDetails } = require('../util/helpers')

//db utilities:
const { db, admin } = require('../util/admin')
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

    const noImgUrl = getImgUrl(firebaseConfig.storageBucket, 'no-img.png')
    
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
                userId: userId,
                imageUrl: noImgUrl
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

exports.uploadImage = (req, resp) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const busboy = new BusBoy({ headers:  req.header})

    let imgFileName
    let imgToBeUploaded
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return resp.status(400).json({error: 'This type of file is not allowed'})
        }
        //For randomizing filename:
        const imgExtension = filename.split('.').slice(-1)[0] 
        imgFileName = `${Math.round(Math.random()*100000000)}.${imgExtension}`

        const filePath = path.join(os.tmpdir(), imgFileName)
        imgToBeUploaded = {filePath, mimetype}

        file.pipe(fs.createWriteStream(filePath))

    });
    busboy.on('finish', () => {
        admin.storage().bucket.upload(imgToBeUploaded.filePath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imgToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imgUrl = getImgUrl(firebaseConfig.storageBucket, imgFileName)

            return db.doc(`/users/${req.user.handle}`).update({ imageUrl: imgUrl})
        })
        .then(() => {
            return resp.json({message: 'Image uploaded succesfully'})
        })
        .catch(error => {
            console.log('Something went wrong: ', error)
            return resp.status(500).json({error: error.code})
        })
    })

    busboy.end(req.rawBody);
}

exports.addUserDetails = (req, resp) => {
    let userDetails = reduceUserDetails(req.body)

    db.doc(`/users/${req.user.handle}`).update(userDetails)
        .then(() => resp.json({message: 'User details added succesfully'}))
        .catch((error) => resp.status(500).json({ error: error.code}))
}