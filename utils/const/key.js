const {secret} = require('./secret')

const mysqlKey = {
    host: process.env.host || secret.host,
    user: process.env.user || secret.user,
    password: process.env.password || secret.password,
    database: process.env.database || secret.database,
    port: process.env.port || secret.port
}

const sessionOptions = {
    secret: process.env.secretKey || secret.secretKey

}

module.exports = {
    mysqlKey,
    sessionOptions
}