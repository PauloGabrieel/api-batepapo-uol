import Joi from "joi";
import dotenv from "dotenv";
import {MongoClient} from "mongodb";


dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URI);

async function participantSchema(name){
    const schema = Joi.string().min(1).required();
    const validation = schema.validate(name); 
    return validation;
}

async function messageSchema(message){
    
    let participantes;
    try {
        mongoClient.connect();
        const dbBatepapo_uol = mongoClient.db("Batepapo_uol");
        participantes = await dbBatepapo_uol.collection("participantes").find({}).toArray();
        mongoClient.close()
    } catch (error) {
        console.log(error);
    }
    
    message.from =  participantes.some(participante => participante.name === message.from);
    
    const schema = Joi.object({
        from: Joi.boolean().valid(true).required(),
        to: Joi.string().required(),
        text: Joi.string().required(),
        type: Joi.string().valid("message", "private_message").required()
    });
    
    const validation = schema.validate(message,{abortEarly: false})
    return validation;

}

export{messageSchema, participantSchema};