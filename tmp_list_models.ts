import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const match = env.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim().replace(/['"]/g, "") : null;

if (!apiKey) {
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        const response = await ai.models.list() as any;
        response.pageInternal.forEach((m: any) => console.log(m.name));
    } catch (error: any) {
        process.exit(1);
    }
}

listModels();
