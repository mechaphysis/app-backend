const { db } = require('../util/admin')
const { isEmpty } = require('../util/helpers')

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
        userImage: req.user.imgageUrl, 
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    db.collection('posts')
    .add(newPost)
    .then(docRef => {
        const resPost = newPost
        resPost.postId = docRef.id
        return resp.json(resPost)
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

exports.commentPost = (req, resp) => {
    if(isEmpty(req.body.body)) resp.status(500).json({error: 'Must not be empty'})
    
    let newComment = {
        body: req.body.body,
        createdAt: new Date().toIsoString(),
        postId: req.params.postId,
        userHandle: req.user.handle,
        userImage: req.user.imgageUrl
    }

    db.doc(`/posts/${req.params.postId}`).get()
        .then(doc => {
            if(!doc.exists) {
                return resp.status(404).json({ error: 'Post not found'})
            }

            return doc.ref.update({commentCound: doc.data().commentCount + 1})
        })
        .then(() => {
            return db.collection('comments').add(newComment)
        })
        .then(() => resp.json(newComment)) 
        .catch(error => {
            console.error(error)
            resp.status(500).json({error: error.code})
        })
}

exports.likePost = (req, resp) => {
    const likeDoc =  db.collection('likes').where('userHanlde', '==', req.user.handle)
        .where('postId', '==', req.params.postId).limit(1)

    const postDoc = db.collection(`/posts/${req.params.postId}`)

    let postData = {}

    postDoc.get()
        .then(doc => {
            if(doc.exists) {
                postData = doc.data()
                postData.postId = doc.id

                return likeDoc.get()
            } else {

                return resp.status(404).json({error: 'Post not found'})
            }
        })
        .then( data  => {
            //If the user has not liked the post yet
            if(data.empty){
                // eslint-disable-next-line promise/no-nesting
                return db.collection('likes').add({
                    postId: req.params.postId,
                    userHandle: req.user.handle
                })
                .then(() => {
                    postData.likeCount++
                    return postDoc.update({likeCount: postData.likeCount})
                })
                .then(()=>{
                    return resp.json(postData)
                })
            } else { //If the user already liked the post
                return resp.status(400).json({error: 'Post already liked'})
            }
        })
        .catch( error => {
            console.error(error)
            return resp.status(500).json({error: error.code})
        })
}

exports.unlikePost = (req, resp) => {

    const likeDoc =  db.collection('likes').where('userHanlde', '==', req.user.handle)
    .where('postId', '==', req.params.postId).limit(1)

const postDoc = db.collection(`/posts/${req.params.postId}`)

let postData = {}

postDoc.get()
    .then(doc => {
        if(doc.exists) {
            postData = doc.data()
            postData.postId = doc.id

            return likeDoc.get()
        } else {

            return resp.status(404).json({error: 'Post not found'})
        }
    })
    .then( data  => {
        //If the user has not liked the post yet
        if(data.empty){
            return resp.status(400).json({error: 'Post not liked'})
        } else { //If the user already liked the post
              // eslint-disable-next-line promise/no-nesting
            return db.doc(`likes/${data.docs[0].id}`).delete()
            .then(() => {
                postData.likeCount--
                return postDoc.update({likeCount: postData.likeCount})
            })
            .then(()=>{
                return resp.json(postData)
            })          
        }
    })
    .catch( error => {
        console.error(error)
        return resp.status(500).json({error: error.code})
    })

}


exports.deletePost = (req, resp) => {
    const doc = db.collection(`/posts/${req.params.postId}`)

    doc.get()
        .then(doc=> {
            if(!doc.exists){
                return resp.status(404).json({error: 'Not Found'})
            }

            if(doc.data().userHandle !==  req.user.handle) {
                return resp.status(403).json({error: 'Unauthorized'})
            } else {

                return doc.delete()
            }
        })
        .then(()=> {
            return resp.json({message: 'Post deleted succesfully'})
        })
        .catch(error => {
            console.error(error)
            resp.status(500).json({error: error.code})
        })
}
