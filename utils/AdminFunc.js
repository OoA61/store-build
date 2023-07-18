const mysql = require('mysql')
const nodemailer = require("nodemailer");
const {mysqlKey} = require('./const/key')

const db = mysql.createConnection(mysqlKey);

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

const Item = {
    add: function(name, price, category) {
        db.query(
            'INSERT INTO items (item_name, item_price, item_category) VALUES (?, ?, ?);',
            [name, price, category], 
            function(err, result){
                if (err) throw err; 
                return result;
            }
        )
    },
    get: function(){
        return new Promise ((resolve, reject) => {
            db.query(
                'SELECT * FROM items',
                function(err, result){
                    if (err) reject(err);
                    resolve(result)
                }
                )
        })
    },
    getByName: function(name){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM items WHERE item_name = ?',
                [name],
                function(err, result){
                    if(err) reject(err);
                    resolve(result[0])
                }
            )
        })
    } 
}


async function sendMail(name, email, message){
    var transport = nodemailer.createTransport({
        host: `smtp.gmail.com`,
        port: 465,
        secure: true,
        auth: {
            user: process.env.email,
            pass: process.env.emailpass
        }
    });
  
    let info = await transport.sendMail({
        from: `Website Contact Form`, // sender address
        to: "jiheon.ham61@gmail.com", // list of receivers
        subject: `Website Contact Form from ${email}`, // Subject line
        text: "Email Verification", // plain text body
        html: `${message} ${name}`
      });
  
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      return true;
  }

module.exports = {
    Item,
    sendMail
}