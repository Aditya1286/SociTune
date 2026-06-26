import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

async function run() {
  try {
    const result = await model.generateContent("Describe the artist Chaar Diwaari in 1 sentence.");
    console.log("Success!");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
