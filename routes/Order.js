const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const session = require('express-session');
const passport = require('passport');

const { Order } = require('../utils/OrderFunc');
const { Item } = require('../utils/AdminFunc');
const { User } = require('../utils/AuthFunc');
const {mysqlKey} = require('../utils/const/key')

const db = mysql.createConnection(mysqlKey);

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
    });
    
router.post('/AddOrder', async (req, res) => {
    let user = req.user;
    if(!user){
        res.send('failure')
    }

    let { checked, items } = req.body;

    //1 = user accepted terms, 0 = user did not accept terms
    let agreement;
    (checked ? agreement = 1 : 0)

    //Creates timestamp for order
    const date = new Date();
    const pstDate = date.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles"
      })

    //Calculate total cost
    const keys = Object.keys(items)
    let totalCost = 0;

    //Ensures totalCost is calculated before continuing
    async function addCost(key){
        return new Promise(async (resolve, reject) => {
            let quantity = items[key]
            let price = await Item.getByName(key)
            price = price.item_price
            let cost = quantity * price;
            totalCost += cost;
            resolve();
        })
    }

    //runs code
    let promises = keys.map(addCost);
    let results = await Promise.all(promises);

    //Creates new order
    await Order.addOrder(user.customer_id, pstDate, totalCost, agreement)

    //Need to update Order Item Table
    let lastOrderId = await Order.getLastEntry();

    //Construct an object with { item_id: "", quantity: "", price: "" }
    function newItem(input1, input2, input3) {
        this.item_id = input1;
        this.quantity = input2;
        this.price = input3;
    }

    const orderItems = []

    async function constructItems(key){
        return new Promise(async (resolve, reject) => {
            let currentItem = await Item.getByName(key)
            console.log(currentItem);
            let orderItemEntry = new newItem(currentItem.item_id, items[key], currentItem.item_price)
            console.log(orderItemEntry);
            orderItems.push(orderItemEntry)
            console.log(orderItemEntry);
            resolve();
        })
    }

    let promises2 = keys.map(constructItems)
    let results2 = await Promise.all(promises2);

    console.log(orderItems + "this is the ordered items");

    console.log(lastOrderId)

    orderItems.map(async (item) => {
        await Order.addOrderItems(lastOrderId.order_id, item.item_id, item.quantity, item.price)
    })

    res.send({message: 'success', orderNumber: lastOrderId})
    //console.log(lastOrderId)
})   

router.post('/OrderItems/:origin', async (req, res) => {
    const origin = req.params.origin
    const { number } = req.body
    const orderNumber = number;
    const user = req.user

    //Retrieves Database information for current order
    let result = await Order.getOrderItemByOrderId(orderNumber)
    let nameResult = await Order.getItemNamesByOrderId(orderNumber)

    //Erase after test ---------------------------
    console.log(result) //An array with objects for columns of order_items
    console.log(nameResult) //An Array with object for item_name

    //Constructor for cart
    let itemReview = []

    function cartItem(order_item_id, order_id, name, quantity, price){
        this.order_item_id = order_item_id
        this.order_id = order_id
        this.name = name;
        this.quantity = quantity;
        this.price = price
    }

    if(result.length === nameResult.length){
        result.map((item, i) => {
            let itemEntry = new cartItem(item.order_item_id, item.order_id, nameResult[i].item_name, item.quantity, item.price)
            itemReview.push(itemEntry)
        })
    }

    if(origin === 'checkout'){
        Order.sendOrderMail(user, itemReview, orderNumber);
        console.log('Email Sent because request came from checkout')
    } else {
        console.log('No Email was sent')
    }

    res.send({item: itemReview, user: user})
})

router.get('/GetOrders', async (req, res) => {
    const user = req.user;
    if(user){
        const result = await Order.getOrdersById(user.customer_id)
        res.send(result)
    } else {
        res.send('failure')
    }
})

router.get('/GetOrderByOrderId/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const updatedStatus = await Order.getOrderByOrderId(orderId)
    res.send(updatedStatus);
})

router.post('/UpdateOrderStatus/:orderId', async (req, res) => {
    const {orderStatus} = req.body;
    const orderId = req.params.orderId;
    await Order.updateOrderStatus(orderStatus, orderId)
    res.send(true)
})

router.post('/UpdatePaymentStatus/:orderId', async (req, res) => {
    const {paymentStatus} = req.body;
    const orderId = req.params.orderId;
    await Order.updatePaymentStatus(paymentStatus, orderId)
    res.send(true)
})

router.post('/UpdateOrderItem/:orderId', async (req, res) => {
    console.log('api called')
    const {itemId, itemPrice, quantity} = req.body;
    const orderId = req.params.orderId;
    const newPrice = (itemPrice * quantity)
    Order.addSingleItem(orderId, itemId, quantity, itemPrice)
    Order.updateTotalPrice(orderId, newPrice)
    res.send(true)
})

router.post('/DeleteItem', (req, res) => {
    const {order_item_id, order_id, quantity, price} = req.body
    const newPrice = (quantity * price * -1)
    Order.deleteItem(order_item_id);
    Order.updateTotalPrice(order_id, newPrice)
    res.send(true)
})
module.exports = router;