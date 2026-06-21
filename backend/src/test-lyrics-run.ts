import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config();

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key loaded (first 5 chars):", apiKey ? apiKey.substring(0, 5) : "undefined");
    try {
        const genAI = new GoogleGenerativeAI(apiKey || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Say hello";
        const result = await model.generateContent(prompt);
        console.log("Gemini Success:", result.response.text());
    } catch (err: any) {
        console.error("Gemini Error:", err.message || err);
    }
}
run();
