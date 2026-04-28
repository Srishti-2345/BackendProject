import multer from "multer";

const storage = multer.memoryStorage();

const documentFileFilter = (_req, file, cb) => {
  const lowerName = file.originalname.toLowerCase();
  const isPdf = file.mimetype === "application/pdf" || lowerName.endsWith(".pdf");
  const isOdt =
    file.mimetype === "application/vnd.oasis.opendocument.text" || lowerName.endsWith(".odt");

  if (!isPdf && !isOdt) {
    cb(new Error("Only PDF or ODT files are allowed"));
    return;
  }

  cb(null, true);
};

export const pdfUpload = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const resumeUpload = pdfUpload;
