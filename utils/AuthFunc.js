const mysql = require('mysql')
const crypto = require('crypto')

const db = mysql.createConnection({
    host: 'database-1.cbrwxevd9t8e.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'Blue4524.',
    database: 'store',
    port: '3306'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

const User = {
    findOne: function(email, callback) {
        db.query(
            'SELECT * FROM customers WHERE email = ?',
            email,
            function(err, result){
                if(err){
                    callback(err, null)
                } else {
                    console.log("This is the result of lookup: ")
                    console.log(result)
                    callback(null, result.length ? result[0] : null);
                }
            }
        )
    },
    findByEmail: function(email){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM customers WHERE email = ?',
                email,
                function(err, result){
                    if (err) reject(err)
                    resolve(result[0])
                }
            )
        })
    },
    findByPhone: function(phone){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM customers WHERE phone_number = ?',
                phone,
                function(err, result){
                    if (err) reject(err)
                    resolve(result[0])
                }
            )
        })
    },
    findById: function(id, callback){
        db.query(
            'SELECT * FROM customers WHERE customer_id = ?',
            id,
            function(err, result){
                if (err){
                    callback(err, null)
                } else {
                    console.log(result)
                    callback(null, result.length ? result[0] : null)
                }
            }
        )
    },
    verificationCrypt: function(emailString){
        return new Promise((resolve, reject) => {
            const key = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);
            const algorithm = 'aes-256-cbc';
            // Creating Cipheriv with its parameter
            let cipher = crypto.createCipheriv(
                'aes-256-cbc', Buffer.from(key), iv);
                // Updating text
                let encrypted = cipher.update(emailString);
                // Using concatenation
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                // Returning iv and encrypted data
                resolve({ iv: iv.toString('hex'),
                    encryptedData: encrypted.toString('hex') });

            })
    },
    addVerificationCrypt: function(id, crypt){
        return new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO verification (customer_id, verification_hash) VALUES (?, ?)",
                [id, crypt],
                function(err, result){
                    if(err) reject(err)
                    resolve();
                }
            )
        })
    },
    getIdByCrypt: function(crypt){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM verification WHERE verification_hash = ?',
                [crypt],
                function(err, result){
                    if(err) reject(err)
                    resolve(result[0]);
                }
            )
        })
    },
    deleteVerificationCrypt: function(id){
        db.query(
            'DELETE FROM verification WHERE customer_id = ?',
            [id],
            function(err, result){
                if (err) throw err
                console.log("Deleted verification for user_id = " + id)
                return;
            }
        )
    },
    updateCustomerVerification: function(id){
        db.query(
            'UPDATE customers SET verification = 1 WHERE customer_id = ?',
            [id],
            function(err, result){
                if (err) throw err
                console.log('Updated verification for customer_id = ' + id)
                return;
            }
        )
    }
}

async function checkEmail(email){
    console.log(email)
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT * FROM customers WHERE email = ?',
            email,
            function(err, result){
                if(err){
                    reject(err)
                } else {
                    if (result.length > 0){
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                }
            }
        )
    })
}

async function checkPhone(phone){
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT * FROM customers WHERE phone_number = ?',
            phone,
            function(err, result){
                if(err){
                    reject(err)
                } else {
                    if (result.length > 0){
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                }
            }
        )
    })
}

async function registerUser(values){
    return new Promise((resolve, reject) => {
        db.query(
            'INSERT INTO customers (first_name, last_name, email, phone_number, password, address, city, state, zip) VALUES (?);',
            [values],
            function(err, result){
                if (err){
                    reject(err);
                } else {
                    console.log("User Successfully Added")
                    resolve(true);
                }
            }
            )
        })
}
module.exports = {
    checkEmail,
    checkPhone,
    registerUser,
    User
}