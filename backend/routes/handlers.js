const uuid = require('uuid');
const {Session} = require("../types/session");
const {verifyMessageSignatureRsv} = require("@stacks/encryption");
const {getAddressFromPublicKey, TransactionVersion} = require("@stacks/transactions");

const users = {
    "user1": "password1",
    "user2": "password2"
}

const sessions = {}

const signinHandler = (req, res) => {
    const {token, signature, publicKey} = req.body
    console.log(req.body);
    if (!verifyMessageSignatureRsv({message: token, publicKey, signature})) {
        // If the username isn't present, return an HTTP unauthorized code
        res.status(401).end()
        return
    }

    // get users credentials from the JSON body
    // const {username, password} = req.body
    // if (!username) {
    //     // If the username isn't present, return an HTTP unauthorized code
    //     res.status(401).end()
    //     return
    // }

    // validate the password against our data
    // if invalid, send an unauthorized code
    // const expectedPassword = users[username]
    // if (!expectedPassword || expectedPassword !== password) {
    //     res.status(401).end()
    //     return
    // }

    // generate a random UUID as the session token
    // const sessionToken = uuid.v4()

    // set the expiry time as 120s after the current time
    const now = new Date()
    const expiresAt = new Date(+now + 120 * 1000)
    const wallet = getAddressFromPublicKey(publicKey, TransactionVersion.Testnet);

    // create a session containing information about the user and expiry time
    const session = new Session(wallet, expiresAt)
    // add the session information to the sessions map
    sessions[token] = session;

    // In the response, set a cookie on the client with the name "session_cookie"
    // and the value as the UUID we generated. We also set the expiry time
    res.cookie("session_token", token, {expires: expiresAt})
    res.end()
}


const welcomeHandler = (req, res) => {
    // if this request doesn't have any cookies, that means it isn't
    // authenticated. Return an error code.
    if (!req.cookies) {
        res.status(401).end()
        return
    }

    // We can obtain the session token from the requests cookies, which come with every request
    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        // If the cookie is not set, return an unauthorized status
        res.status(401).end()
        return
    }

    // We then get the session of the user from our session map
    // that we set in the signinHandler
    userSession = sessions[sessionToken]
    if (!userSession) {
        // If the session token is not present in session map, return an unauthorized error
        res.status(401).end()
        return
    }
    // if the session has expired, return an unauthorized error, and delete the
    // session from our map
    if (userSession.isExpired()) {
        delete sessions[sessionToken]
        res.status(401).end()
        return
    }

    // If all checks have passed, we can consider the user authenticated and
    // send a welcome message
    res.send(`Welcome  ${userSession.username}!`).end()
}

const refreshHandler = (req, res) => {
    // (BEGIN) The code from this point is the same as the first part of the welcomeHandler
    if (!req.cookies) {
        res.status(401).end()
        return
    }

    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        res.status(401).end()
        return
    }

    userSession = sessions[sessionToken]
    if (!userSession) {
        res.status(401).end()
        return
    }
    if (userSession.isExpired()) {
        delete sessions[sessionToken]
        res.status(401).end()
        return
    }
    // (END) The code until this point is the same as the first part of the welcomeHandler

    // create a new session token
    const newSessionToken = uuid.v4()

    // renew the expiry time
    const now = new Date()
    const expiresAt = new Date(+now + 120 * 1000)
    const session = new Session(userSession.username, expiresAt)

    // add the new session to our map, and delete the old session
    sessions[newSessionToken] = session
    delete sessions[sessionToken]

    // set the session token to the new value we generated, with a
    // renewed expiration time
    res.cookie("session_token", newSessionToken, {expires: expiresAt})
    res.end()
}

const logoutHandler = (req, res) => {
    if (!req.cookies) {
        res.status(401).end()
        return
    }

    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        res.status(401).end()
        return
    }

    delete sessions[sessionToken]

    res.cookie("session_token", "", {expires: new Date()})
    res.end()
}

module.exports = {
    signinHandler,
    welcomeHandler,
    refreshHandler,
    logoutHandler
}
