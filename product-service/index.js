const amqp  = require('amqplib');
const express = require('express')
const app = express();
const PORT = process.env.PORT_ONE || 7071;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const Product = require("./models/Product")
const isAuthenticated = require("../isAuthenticated")
app.use(express.json())
var channel, connection;
var order;

mongoose.connect("mongodb://localhost/product-service",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, () =>{
    console.log('Product-service DB connected');
})

connect();

async function connect(){
    try{
        const amqpServer = "amqp://localhost:5672";
        connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        await channel.assertQueue("PRODUCT");
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
    newProduct.save()
    return res.json({newProduct});
})

// Buy product 

app.post("/product/buy", isAuthenticated, async (req, res) =>{
    const { ids } = req.body;
    const products = await Product.find({_id: { $in: ids } })

    channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
                products,
                userEmail: req.user.email
            })
        )
    )
    channel.consume("PRODUCT", (data) =>{
        console.log("Comsuing PRODUCT queue");
        order = JSON.parse(data.content)
        channel.ack(data)
    })
    return res.json(order);
})

app.listen(PORT, () =>{
    console.log(`Product service on ${PORT}`);
})