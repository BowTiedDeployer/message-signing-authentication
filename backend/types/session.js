class Session {
    constructor(username, expiresAt) {
        this.username = username
        this.expiresAt = expiresAt
    }

    isExpired() {
        return this.expiresAt < (new Date())
    }
}

module.exports = {
    Session,
}
