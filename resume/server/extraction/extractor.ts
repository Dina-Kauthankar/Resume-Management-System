import { extractTextFromPdf } from "./pdfExtractor";
import { extractTextFromDocx } from "./docxExtractor";
import { extractTextFromTex } from "./texExtractor";
import { cleanExtractedText } from "./cleaner";

export async function extractResumeText(
  fileBuffer: Buffer,
  extension: string
): Promise<string> {
  const ext = extension.toLowerCase();

  let rawText = "";

  // ----------------------------------------------------------
  // Extract raw text based on file type
  // ----------------------------------------------------------

  if (ext === ".pdf") {
    rawText = await extractTextFromPdf(
      fileBuffer
    );
  } else if (ext === ".docx") {
    rawText = await extractTextFromDocx(
      fileBuffer
    );
  } else if (ext === ".tex") {
    rawText = extractTextFromTex(
      fileBuffer
    );
  } else {
    throw new Error(
      `Unsupported extension ${extension}`
    );
  }

  // ----------------------------------------------------------
  // Clean extracted text
  // ----------------------------------------------------------

  const cleanedText =
    cleanExtractedText(rawText);

  // ----------------------------------------------------------
  // Minimum readable text validation
  // ----------------------------------------------------------

  if (cleanedText.trim().length < 15) {
    throw new Error(
      "The uploaded document contains no readable text. It may be a scanned image-based PDF or an empty document."
    );
  }

  return cleanedText;
}
