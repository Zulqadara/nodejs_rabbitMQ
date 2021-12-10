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
    } catch(err) {
        console.log(err);
    }
}

app.get("/send", async (req, res) =>{
    const fakeData = {
        name: "Elon Musk",
        company : "SpaceX"
    }

    await channel.sendToQueue("rabbit", Buffer.from(JSON.stringify(fakeData)));
    // await channel.close();
    // await connection.close();
    return res.send("done")
})

app.listen(5001, () =>{
    console.log('Listening on 5001');
})