import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { questionText, correctAnswer } = await req.json();

    if (!questionText || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server configuration error: Gemini API key missing." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Explain the following question and its correct answer. Provide ONLY the direct, clear explanation with absolutely no conversational filler, context setup, greetings, or personalized talk. If the explanation involves math, formulas, or scientific notation, use LaTeX formatting for EVERY mathematical element (e.g. use $E=mc^2$ or $$ ... $$). \n\nQuestion: "${questionText}"\nCorrect Answer: "${correctAnswer}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error("No explanation generated from AI.");
    }

    return NextResponse.json({ explanation: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation. Please try again later." },
      { status: 500 }
    );
  }
}
