const db = require('../util/admin')
const functions = require('firebase-functions');

const createNotification = (notificationType) => {
    return functions.region('europe-west1')
    .firestore.document(`${notificationType}s/{id}`)
        .onCreate((snapshot) => {
            return db.doc(`/posts/${snapshot.data().postId}`).get()
                .then(doc => {
                        // eslint-disable-next-line promise/always-return
                        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                        return db.doc(`/notifications/${snapshot.id}`).set({
                            createdAt: new Date().toISOString,
                            recipient: doc.data().userHandle,
                            sender: snapshot.data().userHandle,
                            type: notificationType,
                            read: false,
                            postId: doc.id
                        })
                    }
                })
                .catch(error => {
                console.error(error)
                })
    })

}

const deleteNotification = (notificationType) => {
    return functions.region('europe-west1')
    .firestore.document(`/${notificationType}s/{id}`)
        .onDelete((snapshot) => {
            return db.doc(`/notifications/${snapshot.id}`).delete()
                .catch(error => {
                console.error(error)
                return;
                })
    })

}

const triggerUpdateOfImageUrl = () => {

    return functions.region('europe-west1')
        .firestore.document('users/{userId}')
        .onUpdate((change) => {
            if(change.before.data().imageUrl !== change.after.data().imageUrl) {
                const batch = db.batch();

                return db.collection('posts').where('userHandle', '==', change.before.data().handle).get()
                    .then( data => {
                        data.forEach(doc => {
                            const post = db.doc(`/posts/${doc.id}`)
                            batch.update(post, {userImage: change.after.data().imageUrl})
                        })
                        return batch.commit()
                    })
            }
        })

}

const triggerDeleteOfAllPostRelatedData = () => {
    return functions.region('europe-west1')
        .firestore.document('posts/{postId}')
        .onDelete((snapshot, context) => {
            const postId = context.params.postId

            const batch = db.batch()

            return db.collection('comments').where('postId', '==', postId).get()
                .then( data => {
                    data.forEach( doc => {
                        batch.delete(db.doc(`/comments/${doc.id}`))
                    })

                    return db.collection('likes').where('postId', '==', postId).get()
                })
                .then( data => {
                    data.forEach( doc => {
                        batch.delete(db.doc(`/likes/${doc.id}`))
                    })

                    return db.collection('notifications').where('postId', '==', postId).get()
                })
                .then( data => {
                    data.forEach( doc => {
                        batch.delete(db.doc(`/notifications/${doc.id}`))
                    })

                    return batch.commit()
                })
                .catch( error => {
                    console.error(error)
                })
        })
}

module.exports = {createNotification, deleteNotification, triggerUpdateOfImageUrl, triggerDeleteOfAllPostRelatedData}