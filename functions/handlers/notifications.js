const db = require('../util/admin')
const functions = require('firebase-functions');

const createNotification = (notificationType) => {
    return functions.region('europe-west1')
    .firestore.document(`/${notificationType}s/{id}`)
        .onCreate((snapshot) => {
            db.doc(`/posts/${snapshot.data().postId}`).get()
            .then(doc => {
                    // eslint-disable-next-line promise/always-return
                    if(doc.exists){
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
            .then(() => {
                return; //void return as its only a database trigger, not an api endpoint
            })
                .catch(error => {
                console.error(error)
                return;
            })
    })

}

const deleteNotification = (notificationType) => {
    return functions.region('europe-west1')
    .firestore.document(`/${notificationType}s/{id}`)
        .onDelete((snapshot) => {
            db.doc(`/notifications/${snapshot.id}`).delete()
            .then(() => {
                return; //void return as its only a database trigger, not an api endpoint
            })
                .catch(error => {
                console.error(error)
                return;
            })
    })

}

module.exports = {createNotification, deleteNotification}