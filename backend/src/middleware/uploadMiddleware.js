import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    cb(new Error("Only PDF resume uploads are allowed"));
    return;
  }

  cb(null, true);
};

export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
