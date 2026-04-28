import pdfParse from "pdf-parse";
import { readOdt } from "odf-kit/reader";

const cleanWhitespace = (value = "") => String(value).replace(/\s+/g, " ").trim();

const stripHtml = (html = "") =>
  cleanWhitespace(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );

const isPdfFile = (file = {}) =>
  file?.mimetype === "application/pdf" || file?.originalname?.toLowerCase().endsWith(".pdf");

const isOdtFile = (file = {}) =>
  file?.mimetype === "application/vnd.oasis.opendocument.text" ||
  file?.originalname?.toLowerCase().endsWith(".odt");

export const getDocumentKindLabel = (file = {}) => {
  if (isOdtFile(file)) {
    return "ODT document";
  }

  if (isPdfFile(file)) {
    return "PDF document";
  }

  return "document";
};

const extractTextFromPdf = async (buffer) => {
  const parsedPdf = await pdfParse(buffer);
  return cleanWhitespace(parsedPdf.text || "");
};

const extractTextFromOdt = (buffer) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const document = readOdt(bytes);
  return stripHtml(document.toHtml({ fragment: true }));
};

export const extractTextFromDocument = async (file) => {
  if (!file?.buffer) {
    const error = new Error("A document file is required");
    error.statusCode = 400;
    throw error;
  }

  if (isOdtFile(file)) {
    const text = extractTextFromOdt(file.buffer);

    if (!text) {
      const error = new Error("Could not extract readable text from the uploaded ODT document");
      error.statusCode = 400;
      throw error;
    }

    return {
      sourceLabel: file.originalname,
      sourceText: text,
      sourceKind: "odt",
    };
  }

  if (isPdfFile(file)) {
    const text = await extractTextFromPdf(file.buffer);

    if (!text) {
      const error = new Error("Could not extract readable text from the uploaded PDF document");
      error.statusCode = 400;
      throw error;
    }

    return {
      sourceLabel: file.originalname,
      sourceText: text,
      sourceKind: "pdf",
    };
  }

  const error = new Error("Only PDF or ODT files are allowed");
  error.statusCode = 400;
  throw error;
};
