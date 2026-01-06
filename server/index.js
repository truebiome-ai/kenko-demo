import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const app = express();
app.use(cors());

// Multer in-memory (no disk storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/labs/summarize", upload.single("labFile"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded.");

    const { mimetype, originalname, buffer } = req.file;

    let extractedText = "";

    // ✅ Minimal extraction:
    // - PDF: parse text
    // - text/plain: read as string
    // Images: you'd add OCR later (tesseract) if needed
    if (mimetype === "application/pdf" || originalname.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text || "";
    } else if (mimetype === "text/plain" || originalname.toLowerCase().endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else if (
      mimetype.startsWith("image/") ||
      /\.(png|jpg|jpeg)$/i.test(originalname.toLowerCase())
    ) {
      return res
        .status(415)
        .send("Image OCR not enabled yet. Upload a PDF or TXT for now.");
    } else {
      return res.status(415).send("Unsupported file type. Use PDF or TXT.");
    }

    extractedText = extractedText.trim();
    if (!extractedText) return res.status(422).send("Could not extract text from file.");

    // Keep payload reasonable
    const clipped = extractedText.slice(0, 12000);

    const systemPrompt = `
You are the Kenko Practitioner AI. You summarize lab text for clinician decision-support.
Rules:
- Do NOT diagnose or claim treatment.
- Use cautious language: "may", "could be associated with", "consider discussing".
- Output MUST be concise and structured.

Return in this exact format:

1) Key flags (bullets)
2) Pattern summary (2-4 sentences)
3) Follow-up questions (3 bullets)
4) Labs to consider next (bullets)
5) Protocol categories to consider (bullets) — categories only, no dosages, no brand names
`;

    const userPrompt = `Here is the lab text (may include ranges/markers):\n\n${clipped}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const summary = completion.choices?.[0]?.message?.content || "No summary returned.";

    // No storage, no logs
    return res.json({ summary });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error summarizing labs.");
  }
});

const port = process.env.PORT || 5050;
app.listen(port, () => console.log(`Lab server running on :${port}`));
