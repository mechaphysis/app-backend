const { db } = require('../util/admin')

exports.getAllPosts = (req, resp) => {
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
}

exports.addPost = (req, resp) => {
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
}

exports.getPost = (req, resp) => {
    let postData = {}
    db.collection(`/posts/${req.params.postId}`).get()
        .then( doc => {
            if(!doc.exists) resp.status(404).json({error: 'Post not found'})

            postData = doc.data()
            postData.postId = doc.id

            return collection('comments').where('postId', '==', req.param.postId).get()
        })
        .then( data => {
            postData.comments = []

            data.forEach( doc => {
                postData.comments.push(doc.data())})
            
            return resp.json(postData)
        })
        .catch(error => {
            console.error('Something went wrong: ', error)
            resp.status(500).json({error: error.code})
        })
}