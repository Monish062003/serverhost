const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(express.urlencoded());
app.use(bodyParser.json());

app.post("/trypost" , (req,res)=>{
    let name= req.body.name;
    name = "You can post it " + name;
    res.send(name)
})

app.get("/tryget" , (req,res)=>{
    res.send("You can get it")
})

app.listen(80,()=>{
    console.log(`Listen to : http://localhost:80`)
})