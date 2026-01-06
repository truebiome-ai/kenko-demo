// api/labs/summarize.js
import formidable from "formidable";
import pdf from "pdf-parse";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // required for formidable
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // set in Vercel env vars
});

function parseForm(req) {
  const form = formidable({
    multiples: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    keepExtensions: true,
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
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { files } = await parseForm(req);
    const file = files?.labFile;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded (labFile)" });
    }

    const filePath = file.filepath || file.path; // formidable v2/v3 compatibility
    const mime = file.mimetype || file.type || "";
    const name = file.originalFilename || file.name || "upload";

    let extractedText = "";

    // --- Extract text ---
    if (mime.includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
      const buffer = fs.readFileSync(filePath);
      const parsed = await pdf(buffer);
      extractedText = parsed?.text || "";
    } else {
      // Treat as plain text
      extractedText = fs.readFileSync(filePath, "utf8");
    }

    if (!extractedText || extractedText.trim().length < 40) {
      return res.status(422).json({
        error:
          "Could not extract readable text. If this PDF is a scanned image, it needs OCR (not enabled). Use a text-based PDF or paste values as text.",
      });
    }

    // --- Summarize with OpenAI ---
    const prompt = `
You are a clinician-facing decision-support assistant.
Summarize the lab report text below into:
1) Key abnormalities (with value + reference if present)
2) Patterns / possible contributors (non-diagnostic language)
3) Follow-up lab categories to consider
4) First-week practical focus (diet/lifestyle/monitoring)

Rules:
- No diagnosis. No treatment claims.
- Use cautious language (may/could/consider).
- Keep it concise.

LAB TEXT:
${extractedText.slice(0, 18000)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: "You provide decision-support only, not medical advice." },
        { role: "user", content: prompt },
      ],
    });

    const summary = completion.choices?.[0]?.message?.content || "No summary returned.";

    return res.status(200).json({ summary });
  } catch (err) {
    console.error("summarize error:", err);
    return res.status(500).json({
      error: "Server error",
      detail: err?.message || String(err),
    });
  }
}
