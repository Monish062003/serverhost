const express = require('express');
const app = express();
const cors = require('cors')
const bodyParser = require('body-parser');
const {MongoClient} = require('mongodb');

app.use(express.urlencoded());
app.use(bodyParser.json());
app.use(cors())


let [db,client,collection] = '';
async function connectToDatabase() {
    try {
        client = await MongoClient.connect('mongodb+srv://Monish:mmonish875@cluster0.7pfxpj7.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db('Kanban');
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database', error);
    }
}

connectToDatabase().then(async() => {
    collection = db.collection('emails');
    
    app.post("/email",async(req,res)=>{
        let email = `${req.body.email}`.split('@')[0];
        let data = await collection.findOne({[email]:{ $exists : true }});
        if (data==null) {
            let acknowledgement = await collection.insertOne(
            {
                [email]:
                {
                    'workspaces':['Workspace 1'],
                    'cards':
                    {
                    'cards_name':['Card 1',0],
                    'cards_desc':['Card Description',0],
                    'cards_title':['Card Title',0],
                    },
                    'tasks':['Sip a Coffee',0]
                }
            })
            res.json({acknowledgement : acknowledgement.insertedId})
        }
        else{
            res.json(data[`${email}`])
        }
    })

    app.post("/workspace",async(req,res)=>{
        let [email,workspace,check] = [`${req.body.email}`.split('@')[0],req.body.workspacename,req.body.check];
        let data = email + ".workspaces";
        let data1 = email + ".cards.";
        let data2 = email + ".tasks";
        let [cname,ctitle,cdesc]=[data1+"cards_name",data1+"cards_title",data1+"cards_desc"]

        if (check==0) {
            console.log(`Add : ${workspace}`)
            await collection.updateOne(
                {[email]:{ $exists : true }},  
                { $push:{ 
                    [data]: workspace,
                    [cname]: 0,
                    [ctitle]: 0,
                    [cdesc]: 0,
                    [data2]: 0
                }  
            });
        }
        else if(check==1){
            let alldata = await collection.findOne(
                {[email]:{ $exists : true }}
            );
            let [cards_name,cards_desc,cards_title,tasks]=[alldata[`${email}`]['cards']['cards_name'],alldata[`${email}`]['cards']['cards_desc'],alldata[`${email}`]['cards']['cards_title'],alldata[`${email}`]['tasks']]
            let cardsdata = []
            let index = null;
            let count=-1;

            alldata[email]['workspaces'].forEach((nworkspace,index1) => {
                if (nworkspace==workspace) {
                    index=index1
                }
            });

            cards_name.forEach((element,index1) => {
                if (element==0) {
                    count++;
                    if (count==index || count-1==index) {
                        cardsdata.push(index1)
                    }
                }
            });

            count=cardsdata[1]?cardsdata[1]:cards_name.length
            cards_name.splice(cardsdata[0],count-cardsdata[0]);
            cards_title.splice(cardsdata[0],count-cardsdata[0]);
            cards_desc.splice(cardsdata[0],count-cardsdata[0]);

            count=-1;
            cardsdata=[];
            tasks.forEach((task,index1) => {
                if (task==0) {
                    count++;
                    if (count==index || count-1==index) {
                        cardsdata.push(index1);
                    }
                }    
            });

            count=cardsdata[1]?cardsdata[1]:tasks.length
            tasks.splice(cardsdata[0],count-cardsdata[0])

            await collection.updateOne(
                {[email]:{ $exists : true }},  
                { $set: {
                    [cname]: cards_name,
                    [ctitle]: cards_title,
                    [cdesc]: cards_desc
                },
            }  
            );

            await collection.updateOne(
                {[email]:{ $exists : true }},  
                { $pull: {
                    [data]: workspace,
                },
            }  
            );

            await collection.updateOne(
                {[email]:{ $exists : true }},  
                { $set: {
                    [data2]: tasks,
                },
            }  
            );
        }
        else if(check==2){
            let workspace_newname = req.body.workspace_new;
            console.log(`Email : ${email} \n Old : ${workspace} \n New: ${workspace_newname} \n Check: ${check}`)
            await collection.updateOne(
                { [data]: workspace },
                { "$set": { [data+".$"]: workspace_newname } }
            );
        }
        res.sendStatus(200)
    });

    app.post("/card",async(req,res)=>{
        let [email,card_name,check,active_workspace] = [`${req.body.email}`.split('@')[0],req.body.cardname,req.body.check,req.body.active_workspace];
        let data = `${email}.cards.`
        let [cname,ctitle,cdesc,data2]=[data+"cards_name",data+"cards_title",data+"cards_desc",email+".tasks"]

        if (check==0) {
            let [card_title,card_desc,pos]= [req.body.cardtitle,req.body.carddesc,req.body.position]
            let datas = await collection.findOne({[email]:{ $exists : true }});
            datas = datas[email];
            let count=0;

            datas['workspaces'].forEach((workspace,index) => {
                if (workspace==active_workspace) {
                    active_workspace=index
                }
            });

            for (let index = 0; index < datas['cards']['cards_name'].length; index++) {
                if (datas['cards']['cards_name'][index]==0) {
                    if (count==active_workspace) {
                        count=index;
                        break;
                    }
                    else{
                        count++;
                    }
                }
            }

            pos++;
            pos+=count;
            check=0;
            count=0;

            active_workspace++;
            for (let index = 0; index < datas['tasks'].length; index++) {
                if (datas['tasks'][index]==0) {
                    if (active_workspace-1==check) {
                        count=index+1;
                        break;
                    }
                    check++;
                }
            }

            await collection.updateMany(
                { [email]: { $exists: true } },
                {
                  $push: {
                    [cname]: {
                      $each: [card_name],
                      $position: pos
                    },
                    [ctitle]: {
                      $each: [card_title],
                      $position: pos
                    },
                    [cdesc]: {
                      $each: [card_desc],
                      $position: pos,
                    },
                      [data2]: {
                          $each: [0o1,"Task 1"],
                          $position:count,
                      }  
                  }
                }
            );
        }
        else if(check==1){
            let datas = await collection.findOne({[email]:{ $exists : true }});
            datas = datas[email];
            let [count,position,index1,cards_name,cards_title,cards_desc,tasks]=[0,[],-1,datas['cards']['cards_name'],datas['cards']['cards_title'],datas['cards']['cards_desc'],datas['tasks']];

            datas['workspaces'].forEach((workspace,index) => {
                if (workspace==active_workspace) {
                    active_workspace=index
                }
            });

            cards_name.forEach((element,index) => {
                if (element==0) {
                    index1++;
                }
                if (index1==active_workspace && element!=0) {
                    position.push(element)   
                }
                if (element == card_name) {
                    count=index;
                }
            });
            index1 = -1;
            
            cards_name.splice(count,1);
            cards_title.splice(count,1);
            cards_desc.splice(count,1);
            
            position.forEach((element,index) => {
                if (element == card_name) {
                    count = index;         
                }
            });

            position = [count];
            count=-1;
            tasks.forEach((task,index) => {
                if (task == 0) {
                    index1++;
                    if (index1 == active_workspace+1) {
                        if (position[2]==undefined) {
                            position.push(index);
                        }
                    }
                }
                if (index1 == active_workspace) {
                    if (task == 1) {
                        count++;
                        if (count == position[0] || count == position[0]+1) {
                            position.push(index)
                        }
                    }
                }
            });

            position.splice(0,1);
            count = position[1]?position[1]:tasks.length;
            tasks.splice(position[0],count-position[0])
            
            await collection.updateOne(
                { [email]: { $exists: true } },
                {
                  $set: {
                    [cname]: cards_name,
                    [ctitle]: cards_title,
                    [cdesc]: cards_desc,
                    [data2]: tasks
                  }
                }
              );
        }
        else{
            let [change,locate] = [req.body.change,req.body.locate];
            let data = await collection.findOne({[email]:{ $exists : true }});
            data = data[email];
            let [cards_name,cards_title,cards_desc]=[data['cards']['cards_name'],data['cards']['cards_title'],data['cards']['cards_desc']];

            cards_name.forEach(async(element,index) => {
                if (element == card_name) {
                    if (locate==1) {
                        cards_title[index]=change;
                        await collection.updateOne(
                            { [email]: { $exists: true } },
                            {
                              $set: {
                                [ctitle]: cards_title,
                              }
                            }
                        );
                    }
                    else{
                        cards_desc[index]=change;
                        await collection.updateOne(
                            { [email]: { $exists: true } },
                            {
                              $set: {
                                [cdesc]: cards_desc,
                              }
                            }
                        );
                    }
                }
            });
        }
        res.sendStatus(200);
    })

    app.post("/task",async(req,res)=>{
        const[email,task,card_name,check]=[`${req.body.email}`.split('@')[0],req.body.task,req.body.card_name,req.body.check];
        let taskstring = `${email}.tasks`
        let data = await collection.findOne({[email]:{ $exists : true }});
        data = data[email];

        if (check==0) {
            let [cards_names,workspaces,active_workspace,alltasks,count,indo,boolean]= [data['cards']['cards_name'],data['workspaces'],0,data['tasks'],-1,null,false];

            let [workspace,tasklength,lcount] = [req.body.workspace,parseInt(task.split(" ")[1]),-1];
            let inc=0

            cards_names.forEach((cardname,index) => {
                if (cardname==0) {
                    cards_names.splice(index,1);
                }
            });

            workspaces.forEach((work,index) => {
                if (work == workspace) {
                    active_workspace = index
                }
            });
            
            cards_names.forEach((cardname,index)=>{
                if (cardname==card_name) {
                    indo=index
                }
            })

            for (let index = 0; index < alltasks.length; index++) {
                const tasky = alltasks[index];
                if (tasky==0) {
                    count++;
                }
                else if (count==active_workspace) {
                    if (tasky==1) {
                        lcount++;
                        if (lcount==indo) {
                            break
                        }
                    }
                    else{
                        inc++;
                    }
                }   
            }
            
            count= -1;
            for (let index = 0; index < alltasks.length; index++) {
                if (alltasks[index]==1) {
                    count++
                }
                if (count==indo) {
                    boolean=true;
                    indo=index;
                    break;
                }
            }
            indo+=tasklength;

            indo=boolean?indo:alltasks.length
            await collection.updateOne({[email]:{ $exists : true }},{$push:{[`${taskstring}`]:{$each:[task],$position:indo}}}) 
            res.json(inc)
        }
        else if(check==1){
            let [count,active_workspace,position,index1,cards_name,tasks]=[-1,req.body.workspace,[],-1,data['cards']['cards_name'],data['tasks']];

            data['workspaces'].forEach((workspace,index) => {
                if (workspace==active_workspace) {
                    active_workspace=index
                }
            });

            cards_name.forEach(element => {
                if (element==0) {
                    index1++;
                }
                if (index1==active_workspace && element!=0) {
                    position.push(element)   
                }
            });
            position.forEach((element,index) => {
                if (element == card_name) {
                    position.splice(0,position.length)
                    position.push(index)
                }
            });
            index1 = -1;
            let splitx=[]
            tasks.forEach((element,index) => {
                if (element == 0) {
                    index1++;
                }
                if (index1 == active_workspace) {
                    if (element == 1) {
                        count++;
                    }
                    if (count == position[0]) {
                        if (element == task) {
                            tasks.splice(index,1);
                        }
                    }
                }
            });

            index1=-1;
            count=-1;
            tasks.forEach(element => {
                if (element == 0) {
                    index1++;
                }
                if (index1 == active_workspace) {
                    if (element == 1) {
                        count++;
                    }
                    else if (count == position[0]) {
                        splitx.push(element);
                    }
                }
            });
            await collection.updateOne(
                { [email]: { $exists: true } },
                {
                  $set: {
                    [taskstring]: tasks
                  }
                }
              );
            res.json(splitx)
        }
        else{
            let newvalue = req.body.newvalue;
            let [count,active_workspace,position,index1,cards_name,tasks]=[-1,req.body.workspace,[],-1,data['cards']['cards_name'],data['tasks']];

            data['workspaces'].forEach((workspace,index) => {
                if (workspace==active_workspace) {
                    active_workspace=index
                }
            });

            cards_name.forEach(element => {
                if (element==0) {
                    index1++;
                }
                if (index1==active_workspace && element!=0) {
                    position.push(element)   
                }
            });
            
            position.forEach((element,index) => {
                if (element == card_name) {
                    position.splice(0,position.length)
                    position.push(index)
                }
            });

            index1 = -1;
            tasks.forEach((element,index) => {
                if (element == 0) {
                    index1++;
                }
                if (index1 == active_workspace) {
                    if (element == 1) {
                        count++;
                    }
                    if (count == position[0]) {
                        if (element == task) {
                            tasks[index]=newvalue;
                        }
                    }
                }
            });

            await collection.updateOne(
                { [email]: { $exists: true } },
                {
                  $set: {
                    [taskstring]: tasks
                  }
                }
            );
            res.sendStatus(200)
        }
    })

    app.post("/readdata",async(req,res)=>{
        let email = `${req.body.email}`.split('@')[0];
        let data = await collection.findOne({[email]:{ $exists : true }});
        res.json(data[`${email}`][`cards`])
    })

    app.post("/readworkspace",async(req,res)=>{
        let [email,workspace] = [`${req.body.email}`.split('@')[0],req.body.workspace];
        let data = await collection.findOne({[email]:{ $exists : true }});
        let [cards_name,cards_desc,cards_title,tasks]=[data[`${email}`]['cards']['cards_name'],data[`${email}`]['cards']['cards_desc'],data[`${email}`]['cards']['cards_title'],data[`${email}`]['tasks']];
        let [index,count,alldata,newdata,newtask,array]=[null,-1,[cards_name,cards_title,cards_desc],[],[],[]];

        data[`${email}`]['workspaces'].forEach((worksp,num) => {
            if (worksp==workspace) {
                index=num; 
            }
        });
        
        alldata.forEach(elem => {
            elem.forEach(element => {
                if (count==index) {
                    if (element!=0) {
                        newdata.push(element)
                    }
                }
                if (element==0) {
                    count++;
                }
            });
            count=-1;
        });
        
        tasks.forEach(task => {
            if (count==index) {
                if (task!=0) {
                    if (task!=1) {
                        array.push(task);
                    }
                    else{
                        newtask.push(array);
                        array=[]
                    }
                }
            }
            if (task==0) {
                count++;
            }
        });
        if (tasks[tasks.length-1]!=0 || tasks[tasks.length-1]!=1) {
            newtask.splice(0,1);
            newtask.push(array);
            array=[]
        }
        let concatenatedArray=newtask[0][0]!=undefined?newdata.concat(newtask):newdata;
        res.json(concatenatedArray)
    })

    app.get("/loveit",(req,res)=>{
        res.send("Say hi");
    })

    app.listen(80, () => {
        console.log("Listen to: http://localhost:80");
    });
})