const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const session = require('express-session');
const { route } = require('./Auth');

const { Item, sendMail } = require('../utils/AdminFunc');
const { Order } = require('../utils/OrderFunc')

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

router.post('/AddItem', async (req, res, next) => {
    const { itemName, itemPrice, itemCategory } = req.body;
    Item.add(itemName, itemPrice, itemCategory);
    res.send('success')
})

router.get('/GetItems', async (req, res) => {
    try{
        let results = await Item.get();
        res.json({results: results});
    } 
    catch (err) {
        console.error('There was an error!', err);
    }
})

router.get('/GetOrders', async (req, res) => {
    let orderResults = await Order.get();
    let customerResults = await Order.getCustomerInfo();
    res.json({orderResults: orderResults, customerResults : customerResults})
})

router.post('/SendContactEmail', async (req, res) => {
    const {name, email, message} = req.body;

    message.replace('\n/g', "<br>")
    console.log(message)
    let result = await sendMail(name, email, message)


    if(result){
        res.send(true)
    } else {
        res.send(false)
    }
})



module.exports = router;