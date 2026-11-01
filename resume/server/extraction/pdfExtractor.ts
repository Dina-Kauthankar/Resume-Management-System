import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

// Configure the PDF.js worker for Node/server-side execution.
PDFParse.setWorker(getPath());

export async function extractTextFromPdf(
    fileBuffer: Buffer
): Promise<string> {
    let parser: PDFParse | null = null;

    try {
        console.log(
            "PDF buffer size:",
            fileBuffer.length
        );

        parser = new PDFParse({
            data: fileBuffer,
        });

        const result = await parser.getText();

        const text = result?.text || "";

        console.log(
            "Extracted PDF text length:",
            text.length
        );

        return text;

    } catch (error) {
        console.error(
            "PDF extraction ERROR:",
            error
        );

        throw new Error(
            error instanceof Error
                ? error.message
                : "Failed to extract text from PDF."
        );

    } finally {
        if (parser) {
            try {
                await parser.destroy();
            } catch (error) {
                console.warn(
                    "PDF parser cleanup warning:",
                    error
                );
            }
        }
    }
}
