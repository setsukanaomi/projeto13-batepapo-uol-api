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
  await mongoClient.connect(); // top level await
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
      .insertOne({ name, to: "Todos", text: "entra na sala...", type: "status", time: currentTime });

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

app.post("/messages", async (req, res) => {});

app.get("/messages", async (req, res) => {});

app.post("/status", async (req, res) => {});

// Ligar a API
const PORT = 5000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}!`));
