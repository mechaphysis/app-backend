//Helper functions
const isEmpty = (string) => string.trim() === '' ? true : false
//Regexp check:
const isEmail = (string) =>  {
    const regExp =  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return string.match(regExp) ? true : false
}

//Validation functions:

/**
 * Server side validation (client side should have too in the future)
 */

const validateSignUp = (newUser) => {
    let errors = {}
    
    if (isEmpty(newUser.email)){
        errors.email = 'Cannot be empty'

    } else if (!isEmail(newUser.email)){
        errors.email = 'Must be a valid email address'
    }

    if (isEmpty(newUser.password)) errors.password = 'Cannot be empty'
    if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must be the same'

    if (isEmpty(newUser.handle)) errors.handle = 'Cannot be Empty'

    return  {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

const validateLogin = (user) => {
    let errors = {}
    if(isEmpty(user.email)) errors.email = 'Cannot be Empty'
    if (isEmpty(user.password)) errors.password = 'Cannot be empty'

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true: false
    }
}

//Img route url: 
const getImgUrl = (storageBucket, img) => {
    let storage_url = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${img}?alt=media`
    return storage_url
}

const reduceUserDetails = (data) => {
    let userDetails = {};

    //Refactor:
    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    
    if(!isEmpty(data.website.trim())) userDetails.website = data.website.startsWith('http') ? 
        data.website : 
         `http://${data.website}`
    
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails
}


module.exports = {validateSignUp, validateLogin, getImgUrl, reduceUserDetails}