const amqp  = require('amqplib');
const express = require('express')
const app = express();
const PORT = process.env.PORT_ONE || 7072;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const Order = require("./models/Order")
const isAuthenticated = require("../isAuthenticated")
app.use(express.json())
var channel, connection;

mongoose.connect("mongodb://localhost/order-service",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, () =>{
    console.log('Order-service DB connected');
})

function createOrder(products, userEmail){
    let total = 0;
    for (let t=0; t<products.length; ++t){
        total += products[t].price;
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total
    })

    newOrder.save()
    return newOrder
}

connect().then(() =>{
    channel.consume("ORDER", data =>{
        console.log("Consuming ORDER queue");
        const { products, userEmail } = JSON.parse(data.content)
        const newOrder = createOrder(products, userEmail)
        channel.ack(data)
        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({
            newOrder
        })))
    })
});

async function connect(){
    try{
        const amqpServer = "amqp://localhost:5672";
        connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        await channel.assertQueue("ORDER");
    } catch(err) {
        console.log(err);
    }
}

// New Product

app.post("/product/create", isAuthenticated, async (req, res) =>{
    const { name, description, price} = req.body;
    const newProduct = new Product({
        name, 
        description, 
        price
    });
    return res.json({newProduct});
})

// Buy product 

app.post("/product/buy", isAuthenticated, async (req, res) =>{
    const { ids } = req.body;
    const products = await Product.find({_id: { $in: ids } })
})

app.listen(PORT, () =>{
    console.log(`Order service on ${PORT}`);
})