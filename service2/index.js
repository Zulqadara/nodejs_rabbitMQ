const amqp  = require('amqplib');
const express = require('express')
const app = express();
var channel, connection;

connect();

async function connect(){
    try{
        const amqpServer = "amqp://localhost:5672";
        connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        await channel.assertQueue("rabbit"); //can be any name

        channel.consume("rabbit", data =>{
            console.log(`Received ${Buffer.from(data.content)}`);
            channel.ack(data)
        })
    } catch(err) {
        console.log(err);
    }
}

app.listen(5002, () =>{
    console.log('Listening on 5002');
})