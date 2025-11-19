import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY or GOOGLE_API_KEY is required.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const TEMPLATES_DIR = path.join(process.cwd(), "public/templates");
const OUTPUT_FILE = path.join(process.cwd(), "src/data/templates.json");

async function analyzeImage(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString("base64");
    const mimeType = "image/" + path.extname(filePath).slice(1);

    const prompt = `Analyze this ad template image. Return a JSON object with the following fields:
  - style: A short, descriptive name for the style (e.g., "Minimalist", "Bold", "Tech").
  - description: A brief description of the visual style and mood.
  - colorPalette: An array of hex color codes prominent in the image.
  - keyElements: An array of strings listing key visual elements (e.g., "Product Bottle", "Neon Light", "Text Overlay").
  - textPlacement: A string describing where text is generally placed (e.g., "Top Left", "Center", "Bottom").
  
  Return ONLY the JSON object, no markdown formatting.`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
        ]);

        const text = result.response.text();
        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error);
        return null;
    }
}

async function main() {
    if (!fs.existsSync(TEMPLATES_DIR)) {
        console.error(`Templates directory not found: ${TEMPLATES_DIR}`);
        return;
    }

    const files = fs.readdirSync(TEMPLATES_DIR).filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));
    const templates = [];

    console.log(`Found ${files.length} templates. Analyzing...`);

    for (const file of files) {
        console.log(`Analyzing ${file}...`);
        const filePath = path.join(TEMPLATES_DIR, file);
        const analysis = await analyzeImage(filePath);

        if (analysis) {
            templates.push({
                id: file,
                src: `/templates/${file}`,
                ...analysis,
            });
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(templates, null, 2));
    console.log(`Analysis complete. Saved to ${OUTPUT_FILE}`);
}

main();
