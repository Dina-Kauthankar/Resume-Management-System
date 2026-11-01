export function extractTextFromTex(
  fileBuffer: Buffer
): string {
  return fileBuffer.toString("utf8");
}
