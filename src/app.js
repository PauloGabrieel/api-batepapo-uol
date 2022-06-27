import express from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dayjs from "dayjs";
import {messageSchema, participantSchema} from "./validationSchema.js";





dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URI);



const app = express();
app.use(cors());
app.use(express.json());


// ================== Rota participantes ==================================

app.post("/participantes", async (req,res)=>{
    const {name} = req.body;
    const validation = await participantSchema(name);
    
    if(validation.error){
        return res.status(422).send(validation.error.details);
    }
    try {
        await mongoClient.connect();
        const dbBatepapo_uol = mongoClient.db("Batepapo_uol");
        
        const usernameAlreadyInUse = await dbBatepapo_uol.collection("participantes").findOne({name});
    
        if(usernameAlreadyInUse){
            res.status(409).send("Esse nome já esta sendo utilizado.");
            mongoClient.close();
        }else{
            await dbBatepapo_uol.collection("participantes").insertOne({
                name: name.trim(), 
                lastStatus: Date.now()});
            
            await dbBatepapo_uol.collection("messages").insertOne({
                from: name,
                to: "Todos",
                text: "Entra na sala...",
                time: dayjs().format("HH:mm:ss")
            })        
            
            res.status(201).send("Usuário logado.");
            mongoClient.close();
        };
        
    } catch (error) {
        res.status(500).send(error);
        mongoClient.close();
    };
});

app.get("/participantes", async (req, res)=>{
    
    try {
        await mongoClient.connect();
        const dbBatepapo_uol = mongoClient.db("Batepapo_uol");
        const participantes = await dbBatepapo_uol.collection("participantes").find({}).toArray();
        res.status(200).send(participantes);
    } catch (error) {
        res.sendStatus(500);
    };
});

// ================== Rota messages ==================================


app.post("/messages", async (req, res)=>{
    const body = req.body;
    const from = req.headers.user;
    
    const message ={from, ...body};
    
    const validation = await messageSchema(message);
    
    if(validation.error){
        return res.status(422).send(validation.error.details);
    }else{
        try {
            await mongoClient.connect();
            const dbBatepapo_uol = mongoClient.db("Batepapo_uol");
            await dbBatepapo_uol.collection("messages").insertOne({...message, time: dayjs().format("HH:mm:ss")})
            res.sendStatus(201);
        } catch (error) {
            res.sendStatus(500);
        };
    };
    
});

app.get("/messages", async (req, res)=> {
    const {limit} = req.query;
    const {user} = req.headers;
    
    try {
        await mongoClient.connect();
        const dbBatepapo_uol = mongoClient.db("Batepapo_uol");
        if(limit){
            const messages = await dbBatepapo_uol.collection("messages")
            .find({$or:[{to:"Todos"} ,{from: user}, {to: user}]})
            .limit(parseInt(limit)).toArray();
            mongoClient.close();
            return res.status(200).send(messages);
        }else{
            const messages = await dbBatepapo_uol.collection("messages")
            .find({$or:[{to:"Todos"} ,{from: user}, {to: user}]}).toArray();
            mongoClient.close();
            return res.status(200).send(messages)
        }
        
    } catch (error) {
        res.sendStatus(500);
        console.log(error)
    };
});

// ================== Rota Status ==================================


app.post("/status", async (req, res)=>{
    const {user} = req.headers;
    
    
try {
    await mongoClient.connect();
    const dbBatepapo_uol = mongoClient.db("Batepapo_uol");
    const participante = await dbBatepapo_uol.collection("participantes").find({name: user}).toArray();
    console.log(participante.length);
    if(participante.length == 0){
        res.sendStatus(404);
    }else{
        await dbBatepapo_uol.collection("participantes").updateOne({
            name: user
        },
        {
            $set: {lastStatus: Date.now()}
        })
        res.send(participante);
    }
    
} catch (error) {
    res.sendStatus(500);
}
    
    
})
app.listen(process.env.PORT,()=>{console.log(`Servidor rodando `)})

