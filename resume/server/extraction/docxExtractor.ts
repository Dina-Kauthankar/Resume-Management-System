import mammoth from "mammoth";

export async function extractTextFromDocx(
  fileBuffer: Buffer
): Promise<string> {
  const result = await mammoth.extractRawText({
    buffer: fileBuffer,
  });

  return result.value;
}
