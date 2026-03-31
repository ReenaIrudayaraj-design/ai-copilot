
import dotenv from "dotenv";
dotenv.config(); 
import express from "express";
import cors from "cors";
import { analyzeCode } from "./analyzeService.js";

//dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
  const { code, mode } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "Code is required" });
  }

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    await analyzeCode(code, mode, res);
  } catch (err) {
    console.error("Stream error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Analysis failed" });
    }
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));