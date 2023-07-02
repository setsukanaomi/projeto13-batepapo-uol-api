// Imports
import express from "express";
import dayjs from "dayjs";
import Joi from "joi";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

// Configurações
const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());
const currentTime = dayjs().format("HH:mm:ss");

// Conexão Banco de Dados
const mongoClient = new MongoClient(process.env.DATABASE_URL);
try {
  await mongoClient.connect();
  console.log("Banco de dados conectado! 127.0.0.1:27017!");
} catch (error) {
  (error) => console.log(error.message);
}
const db = mongoClient.db();

// Funções
app.post("/participants", async (req, res) => {
  const { name } = req.body;

  const schemaParticipant = Joi.object({
    name: Joi.string().required(),
  });
  const validation = schemaParticipant.validate(req.body, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    const participant = await db.collection("participants").findOne({ name: name });
    if (participant) return res.status(409).send("Esse nome já existe!");

    await db.collection("participants").insertOne({ name, lastStatus: Date.now() });
    await db
      .collection("messages")
      .insertOne({ from: name, to: "Todos", text: "entra na sala...", type: "status", time: currentTime });

    res.sendStatus(201);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/messages", async (req, res) => {
  const user = req.headers.user;

  const participant = await db.collection("participants").findOne({ name: user });
  if (!participant) return res.status(422).send("Esse usuário não existe ou foi desconectado!");

  const schemaMessage = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().valid("message", "private_message").required(),
  });

  const validation = schemaMessage.validate(req.body, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  const message = {
    from: user,
    ...req.body,
    time: currentTime,
  };

  try {
    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch (err) {
    res.sendStatus(422);
  }
});

app.get("/messages", async (req, res) => {});

app.post("/status", async (req, res) => {});

// Ligar a API
const PORT = 5000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}!`));
