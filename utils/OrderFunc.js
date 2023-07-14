const { resolveObjectURL } = require('buffer');
const mysql = require('mysql');
const { resolve } = require('path');
const nodemailer = require("nodemailer");
const ejs = require('ejs');
const path = require('path');
const {mysqlKey} = require('./const/key')

const db = mysql.createConnection(mysqlKey);

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

const Order = {
    addOrder: function(customer_id, date, cost, agreement){
        return new Promise((resolve, reject) => {
            let defaultPayStatus = 'unpaid'
            let defaultOrderStatus = 'Pending Pick Up'
            db.query(
                'INSERT INTO orders (customer_id, order_date, payment_status, order_status, total_cost, tos_agree) VALUES (?, ?, ?, ?, ?, ?);',
                [customer_id, date, defaultPayStatus, defaultOrderStatus, cost, agreement],
                function(err, result){
                    if(err) reject(err);
                    console.log('Successfully added order')
                    resolve();
                }
                )
            })
        },
    getLastEntry: function(){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT order_id FROM orders ORDER BY order_id DESC LIMIT 1',
                function(err, result){
                    if(err) reject(err)
                    resolve(result[0])
                }
            )
        })
    },
    addOrderItems: function(order_id, item_id, quantity, price){
        return new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?);',
                [order_id, item_id, quantity, price],
                function(err, result){
                    if(err) reject(err);
                    console.log('added item' + item_id)
                    resolve();
                }
            )
        })
    },
    getOrderItemByOrderId: function(value){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM order_items WHERE order_id = ?',
                [value],
                function(err, result){
                    if(err) reject(err);
                    resolve(result)
                }
            )
        })
    },
    getItemNamesByOrderId: function(value){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT items.item_name FROM items JOIN order_items ON items.item_id = order_items.item_id WHERE order_items.order_id = ?;',
                [value],
                function(err, result){
                    if(err) reject(err);
                    resolve(result)
                }
            )
        })
    },
    getOrdersById: function(customer_id){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM orders WHERE customer_id = ? ORDER BY order_id DESC',
                [customer_id],
                function(err, result){
                    if (err) reject(err)
                    resolve(result)
                }
            )
        })
    },
    get: function(){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM orders ORDER BY order_id DESC',
                function(err, result){
                    if(err) reject(err)
                    resolve(result);
                }
            )
        })
    },
    getCustomerInfo: function(){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM customers JOIN orders ON customers.customer_id = orders.customer_id ORDER BY orders.order_id DESC;',
                function(err, result){
                    if(err) reject(err)
                    resolve(result);
                }
            )
        })
    },
    getOrderByOrderId: function(orderId){
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM orders WHERE order_id = ?;',
                [orderId],
                function(err, result){
                    if (err) reject(err);
                    resolve(result[0]);
                }
            )
        })
    },
    updateOrderStatus: function(orderStatus, orderId){
        return new Promise ((resolve, reject) => {
            db.query(
                'UPDATE orders SET order_status = ? WHERE order_id = ?;',
                [orderStatus, orderId],
                function(err, result){
                    if(err) reject(err)
                    resolve();
                }
            )
        })
    },
    updatePaymentStatus: function(paymentStatus, orderId){
        return new Promise ((resolve, reject) => {
            db.query(
                'UPDATE orders SET payment_status = ? WHERE order_id = ?;',
                [paymentStatus, orderId],
                function(err, result){
                    if(err) reject(err)
                    resolve();
                }
            )
        })
    },
    addSingleItem: function(orderId, itemId, quantity, itemPrice){
        db.query(
            'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?);',
            [orderId, itemId, quantity, itemPrice],
            function(err, result){
                if(err) throw(err)
                console.log('successfully added new order item')
                return;
            }
        )
    },
    deleteItem: function(order_item_id){
        db.query(
            'DELETE FROM order_items WHERE order_item_id = ?',
            [order_item_id],
            function(err){
                if(err)throw(err)
                console.log('successfully removed item')
                return(true);
            }
        )
    },
    updateTotalPrice: function(orderId, newPrice){
        db.query(
            'UPDATE orders SET total_cost = total_cost + ? WHERE order_id = ?',
            [newPrice, orderId],
            function(err, result){
                if(err)throw(err)
                console.log('successfully updated total cost')
                return;
            }
        )
    },
    sendOrderMail: async function(customer, itemReview, orderNumber){
        console.log(itemReview)
        var transport = nodemailer.createTransport({
            host: `smtp.gmail.com`,
            port: 465,
            secure: true,
            auth: {
                user: process.env.email,
                pass: process.env.emailpass
            }
        });
        let order = {
            items: itemReview
        }
        ejs.renderFile(path.join(__dirname, '/views', '/orderConfirmation.ejs'), { customer: customer, orderNumber: orderNumber, itemReview: itemReview }, function (err, data) {
            if (err) {
              console.log(err);
            } else {
              let mainOptions = {
                from: '"Casa de Cleaners" <racegambit@gmail.com>',
                to: `${customer.email}`,
                subject: `Order Confirmation - ${orderNumber}`,
                html: data
              };
              console.log("html data ======================>", mainOptions.html);
              transport.sendMail(mainOptions, function (err, info) {
                if (err) {
                  console.log(err);
                } else {
                  console.log('Message sent: ' + info.response);
                  return true;
                }
              });
            }
          });
    }
}

module.exports = {
    Order
}