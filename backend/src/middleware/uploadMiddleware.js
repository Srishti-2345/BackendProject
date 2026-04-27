import multer from "multer";

const storage = multer.memoryStorage();

const pdfFileFilter = (_req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    cb(new Error("Only PDF files are allowed"));
    return;
  }

  cb(null, true);
};

export const pdfUpload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const resumeUpload = pdfUpload;
