import express from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import Joi from "joi";
import cors from "cors";
import dayjs from "dayjs";




// const now = dayjs().format("HH:MM:ss");

// console.log(now);


dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URI);
const participantSchema = Joi.string().min(1);


const app = express();
app.use(cors());
app.use(express.json());

app.post("/participantes", async (req,res)=>{

    const {name} = req.body;
    const validation = participantSchema.validate(name);
    
    if(validation.error){
        return res.status(422).send(validation.error.details);
    }
    try {
        await mongoClient.connect();
        const dbBatepapo_uol = mongoClient.db("Batepapo_uol");
        
        const usernameAlreadyInUse = await dbBatepapo_uol.collection("participantes").findOne({name: name});
        console.log(usernameAlreadyInUse);
        if(usernameAlreadyInUse){
            res.status(409).send("Esse nome já esta sendo utilizado.");
            mongoClient.close();
        }else{
            await dbBatepapo_uol.collection("participantes").insertOne({
                name, 
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

app.listen(process.env.PORT,()=>{console.log(`Servidor rodando `)})

