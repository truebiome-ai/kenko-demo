export const config = {
  api: {
    bodyParser: false, // IMPORTANT for file uploads
  },
};

import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseForm(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 8 * 1024 * 1024, // 8MB
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const { files } = await parseForm(req);
    const file = files.labFile;

    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    }

    const filePath = file.filepath || file.path;
    const originalName = file.originalFilename || file.name || "";
    const mime = file.mimetype || "";

    let extractedText = "";

    // PDF only for now (fast + reliable)
    if (mime === "application/pdf" || originalName.toLowerCase().endsWith(".pdf")) {
      const buffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(buffer);
      extractedText = (parsed.text || "").trim();
    } else if (mime === "text/plain" || originalName.toLowerCase().endsWith(".txt")) {
      extractedText = fs.readFileSync(filePath, "utf8").trim();
    } else {
      res.status(415).send("Unsupported file type. Upload a PDF or TXT.");
      return;
    }

    if (!extractedText) {
      res.status(422).send("Could not extract text from file.");
      return;
    }

    // Clip to avoid massive token payloads
    const clipped = extractedText.slice(0, 12000);

    const systemPrompt = `
You are the Kenko Practitioner AI. Summarize lab text for clinician decision-support.
Rules:
- Do NOT diagnose.
- Use cautious language.
- Output concise + structured.

Return in this exact format:

1) Key flags (bullets)
2) Pattern summary (2-4 sentences)
3) Follow-up questions (3 bullets)
4) Labs to consider next (bullets)
5) Protocol categories to consider (bullets) — categories only, no dosages, no brand names
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Lab text:\n\n${clipped}` },
      ],
    });

    const summary = completion.choices?.[0]?.message?.content || "No summary returned.";
    res.status(200).json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error summarizing labs.");
  }
}
