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

    // Fetch PDF as blob to ensure it works in all environments
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const blob = await response.blob();

    // Load the PDF document from blob
    const loadingTask = pdfjsLib.getDocument({
      data: blob,
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
      // Normalize whitespace
      .replace(/\s+/g, " ")
      // Fix common PDF extraction issues
      .replace(/\s*([.,;:!?])\s*/g, "$1 ")
      // Remove excessive line breaks
      .replace(/\n{3,}/g, "\n\n")
      // Trim lines
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
      .trim()
  );
}
