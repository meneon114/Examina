import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const match = env.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim().replace(/['"]/g, "") : null;

if (!apiKey) {
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testAI() {
    try {
        console.log("Testing with gemini-flash-latest...");
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: 'Hello, testing the API. Respond with OK.',
        });
        console.log("SUCCESS");
        console.log("Response text:", response.text);
    } catch (error: any) {
        console.error("FAILED");
        console.error("Error Message:", error.message);
    }
}

testAI();
