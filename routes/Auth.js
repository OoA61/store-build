const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const passport = require('passport');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const {mysqlKey} = require('../utils/const/key')

const db = mysql.createConnection(mysqlKey);

const { checkEmail, checkPhone, registerUser, User } = require('../utils/AuthFunc');

db.connect((err) => {
if (err) throw err;
console.log('Connected!');
});

router.get('/api/user', (req, res) => {
  if (req.user) { 
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
})

router.post('/EmailCheck', async (req, res) => {
    let {email} = req.body;
    console.log(req.body)
    //Checks if email already exists in the database
    let emailCheck = await checkEmail(email);

    //Sends true or false depending on existence of email
    //true = email exists
    //false = email does not exist
    res.send(emailCheck);
})

router.post('/PhoneCheck', async (req, res) => {
  let {phoneNumber} = req.body;
  console.log(req.body)
  //Checks if email already exists in the database
  let emailCheck = await checkPhone(phoneNumber);
  //Sends true or false depending on existence of email
  //true = email exists
  //false = email does not exist
  res.send(emailCheck);
})

router.post('/Register', async (req, res) => {
    let {firstName, lastName, email, phoneNumber, address, city, state, zip, password} = req.body;
    //hashes password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //Adds customer to users
    let values = [firstName, lastName, email, phoneNumber, hashedPassword, address, city, state, zip]
    await registerUser(values);

    //Creates a crypt and adds the crypt to the verification table with the customer_id
    const userInfo = await User.findByEmail(email)
    const crypt = await User.verificationCrypt(email)
    User.addVerificationCrypt(userInfo.customer_id, crypt.encryptedData)

    sendMail(email, crypt.encryptedData);

    //Responds with True
    res.send(true);
})

router.post('/EmailVal', async (req, res) => {
  const {email} = req.body;
  let result = await User.findByEmail(email)
  console.log(result)
})


router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      return res.status(500).json({ message: 'Internal server error.' });
    }
    if (!user) {
      return res.status(401).json(info);
    }

    req.logIn(user, function(err) {
      if (err) { 
        return res.status(500).json({ message: 'Internal server error.' });
      }
      return res.status(200).json({ message: 'Authentication successful', user: user });
    });
  })(req, res, next);
});

router.post('/UpdateData', (req, res) => {
  let {data, type} = req.body;
  let user = req.user;
  if (user){
    let user_id = req.user.customer_id;
    console.log(type)
    db.query(
      'UPDATE customers SET ?? = ? WHERE customer_id = ?',
      [type, data, user_id],
      function(err, result){
        if (err){
          res.status(500)
        } else {
          console.log(result)
          res.send('Success')
        }
      }
    )
  } else {
    console.log('something wrong')
  }
})

router.post('/Logout', (req, res, next) => {
  req.logout(function(err){
    if (err) { return next(err); }
    res.status(200).json({ message: 'Successfully logged out' });
  });
})

async function sendMail(email, crypt){
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
      from: '"Casa de Cleaners" <racegambit@gmail.com>', // sender address
      to: `${email}`, // list of receivers
      subject: "Verify your email", // Subject line
      text: "Email Verification", // plain text body
      html: `http://localhost:3001/Auth/VerifyEmail/${crypt}`
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return true;
}






module.exports = router;