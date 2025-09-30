import express from "express";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT;

const app = express();

app.use(express.urlencoded({extended: true}));

app.get("/", (req, res)=>{
    res.send("Hello from Express Server");
});

app.use((req, res)=>{
});

app.listen(PORT, ()=>console.log("App is listening at port: " + PORT));