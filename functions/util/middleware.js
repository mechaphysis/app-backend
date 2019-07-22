const  { db, admin } = require('../util/admin')

//middleware for protected routes
exports.FBAuth = (req, resp, next) => {
    let idToken
    //Check first that token authorization exists
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1]
    } else {
        console.error('No token found')
        return resp.status(403).json({error: 'Unauthorized'})
    }

    //verify token:
    return admin.auth().verifyIdToken(idToken)
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