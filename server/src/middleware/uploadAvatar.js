import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const uploadDirectory = path.join(__dirname, "..", "uploads", "avatars");

/** Magic-byte signatures for allowed image types */
const IMAGE_SIGNATURES = {
  "image/jpeg": [
    [0xff, 0xd8, 0xff],
  ],
  "image/png": [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  ],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46], // RIFF header (need full WebP check)
  ],
};

/**
 * Validates the magic bytes of a file against the declared mimetype.
 * @param {string} filePath - absolute path to the file on disk
 * @param {string} mimetype - the declared Content-Type
 * @returns {{ valid: boolean, message?: string }}
 */
const validateAvatarMagicBytes = (filePath, mimetype) => {
  const sigs = IMAGE_SIGNATURES[mimetype];
  if (!sigs) {
    return { valid: false, message: "Unsupported image type for magic-byte validation." };
  }

  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const headerBuf = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, headerBuf, 0, 12, 0);
    if (bytesRead < 4) {
      return { valid: false, message: "Uploaded file is too small to be a valid image." };
    }

    for (const sig of sigs) {
      let match = true;
      for (let i = 0; i < sig.length; i++) {
        if (headerBuf[i] !== sig[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        // For WebP, also verify bytes 8-11 are 'WEBP'
        if (mimetype === "image/webp") {
          if (bytesRead < 12 || headerBuf[8] !== 0x57 || headerBuf[9] !== 0x45 ||
              headerBuf[10] !== 0x42 || headerBuf[11] !== 0x50) {
            return { valid: false, message: "File header does not match WebP format." };
          }
        }
        return { valid: true };
      }
    }

    return {
      valid: false,
      message: "File content does not match the declared image type. Upload rejected.",
    };
  } catch {
    return { valid: false, message: "Unable to read the uploaded file for validation." };
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd);
    }
  }
};

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const extMap = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const extension = extMap[file.mimetype] || path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `avatar-${req.user._id}${extension}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Only JPEG, PNG, or WebP images are allowed");
    err.code = "INVALID_FILE_TYPE";
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: AVATAR_MAX_SIZE },
});

export const uploadAvatarMiddleware = (req, res, next) => {
  upload.single("avatar")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "Image must be 5MB or smaller" });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error?.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error) {
      return res.status(500).json({ success: false, message: "Failed to upload image" });
    }

    // Validate magic bytes after multer writes the file to disk
    if (req.file) {
      const mimeCheck = validateAvatarMagicBytes(req.file.path, req.file.mimetype);
      if (!mimeCheck.valid) {
        // Delete the invalid file immediately
        try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
        return res.status(400).json({ success: false, message: mimeCheck.message });
      }
    }

    next();
  });
};
