import Joi from "joi";
import dotenv from "dotenv";
import {MongoClient} from "mongodb";



dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URI);

async function participantSchema(name){
    const schema = Joi.string().required().trim();
    const validation = schema.validate(name); 
    console.log(validation)
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
    
    const participantesNames =  participantes.map(participante => participante.name);
    console.log(participantesNames);
    const schema = Joi.object({
        from: Joi.string().valid(...participantesNames).required(),
        to: Joi.string().required(),
        text: Joi.string().required(),
        type: Joi.string().valid("message", "private_message").required()
    });
    
    const validation = schema.validate(message,{abortEarly: false})
    return validation;

}

export{messageSchema, participantSchema};