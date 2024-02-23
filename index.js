const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {MongoClient} = require('mongodb');

app.use(express.urlencoded());
app.use(bodyParser.json());

app.post("/trypost" , (req,res)=>{
    let name= req.body.name;
    name = "You can post it " + name;
    res.send(name)
})

async function connectToDatabase() {
    try {
        client = await MongoClient.connect('mongodb+srv://Monish:mmonish875@cluster0.7pfxpj7.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db('Kanban');
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database', error);
    }
}

connectToDatabase().then(()=>{
    app.get("/tryget" , (req,res)=>{
        res.send("You can get it")
    })
    
    app.listen(80,()=>{
        console.log(`Listen to : http://localhost:80`)
    })
}).catch((error)=>{
    console.log("Oh yeahh")
})