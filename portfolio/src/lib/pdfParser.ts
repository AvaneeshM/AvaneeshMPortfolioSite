/**
 * PDF text extraction for RAG corpus
 * Uses pdfjs-dist to parse PDF files
 */

export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source for browser environment
    if (typeof window !== "undefined") {
      // For pdfjs-dist v4+, use CDN worker or import from the package
      // CDN approach (simplest and most reliable)
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    // Fetch PDF as ArrayBuffer to ensure it works in all environments
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Load the PDF document from ArrayBuffer
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0, // Suppress warnings
    });
    const pdf = await loadingTask.promise;

    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => {
          // Handle both string and TextItem types
          if (typeof item === "string") {
            return item;
          }
          return item.str || "";
        })
        .join(" ");

      fullText += pageText + "\n";
    }

    // Clean up the text
    return cleanExtractedText(fullText);
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Clean extracted PDF text
 */
function cleanExtractedText(text: string): string {
  return (
    text
      // Remove special characters that cause display issues
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Zero-width characters
      .replace(/[\u0080-\u009F]/g, "") // Control characters
      // Fix common PDF extraction issues with email
      .replace(/\s+@\s+/g, "@")
      .replace(/@\s+/g, "@")
      // Fix phone numbers
      .replace(/(\d)\s+-\s+(\d)/g, "$1-$2")
      // Normalize whitespace within lines
      .replace(/[^\S\n]+/g, " ")
      // Fix punctuation spacing
      .replace(/\s*([.,;:!?])\s*/g, "$1 ")
      // Remove excessive line breaks
      .replace(/\n{3,}/g, "\n\n")
      // Split into lines and clean each
      .split("\n")
      .map((line) => {
        let cleaned = line.trim();
        // Remove lines that are just special characters or symbols
        if (/^[•§#\u2022\u25CF\u2022\s]+$/.test(cleaned)) {
          return "";
        }
        // Fix broken words (likely PDF extraction issues)
        cleaned = cleaned.replace(/\s+([a-z])\s+([a-z])/gi, " $1$2");
        return cleaned;
      })
      .filter((line) => line.length > 2) // Filter very short lines
      .join("\n")
      .trim()
  );
}
