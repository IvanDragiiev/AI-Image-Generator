import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;
const API_KEY2 = process.env.API_KEY2;

const MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

app.post("/generate", async (req, res) => {
  try {
    const { prompt, width, height } = req.body;

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY2}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width,
          height,
          num_inference_steps: 4,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const arrayBuffer = await response.arrayBuffer();

    res.set("Content-Type", "image/png");
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
