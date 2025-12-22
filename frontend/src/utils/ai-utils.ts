import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import { LLMType } from "./ai/types";
import { LanguageModelV2 } from "@ai-sdk/provider";

export const getLLM = (
  type: LLMType
): ChatGoogleGenerativeAI | ChatOpenAI | ChatGroq => {
  switch (type) {
    case "Gemini-2.5-flash": {
      const apiKey: string = process.env.GOOGLE_API_KEY || "";
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set.");
      }
      return new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        model: "gemini-2.5-flash",
        temperature: 0.7,
        maxRetries: 0,
      });
    }
    case "Gemini-2.5-flash-lite": {
      const apiKey: string = process.env.GOOGLE_API_KEY || "";
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set.");
      }
      return new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        model: "gemini-2.5-flash-lite",
        temperature: 0.7,
        maxRetries: 0,
      });
    }
    case "ChatGPT": {
      const apiKey: string = process.env.OPENAI_API_KEY || "";
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set.");
      }
      return new ChatOpenAI({
        apiKey: apiKey,
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxRetries: 0,
      });
    }
    case "Groq": {
      const apiKey: string = process.env.GROQ_API_KEY || "";
      if (!apiKey) {
        throw new Error("GROQ_API_KEY environment variable is not set.");
      }
      return new ChatGroq({
        apiKey: apiKey,
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        maxRetries: 0,
      });
    }
  }
  throw new Error("Invalid LLM type.");
};

export const getAISDKLLM = (type: LLMType): LanguageModelV2 => {
  switch (type) {
    case "Gemini-2.5-flash":
      console.log("Using Gemini model");
      return google("gemini-2.5-flash");
    case "Gemini-2.5-flash-lite":
      console.log("Using Gemini Lite model");
      return google("gemini-2.5-flash-lite");
    case "ChatGPT":
      console.log("Using ChatGpt model");
      return openai("gpt-3.5-turbo");
    case "Groq":
      console.log("Using Groq model");
      return groq("llama-3.1-8b-instant");
    default:
      console.log("No model selected, defaulting to Gemini");
      return google("gemini-2.5-flash");
  }
};
