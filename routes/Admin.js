const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const { Item, sendMail } = require('../utils/AdminFunc');
const { Order } = require('../utils/OrderFunc')
const {mysqlKey} = require('../utils/const/key')

const db = mysql.createConnection(mysqlKey);

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