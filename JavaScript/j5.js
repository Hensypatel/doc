const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();

app.use(express.json());

// ✅ Allow multiple origins (localhost + Wix)
const allowedOrigins = [
  "https://hensypatel4.wixstudio.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}));

// 🔑 Configure Cloudinary
cloudinary.config({
  cloud_name: "dcpsnp9pa",
  api_key: "484622966268613",
  api_secret: "GE6NpQNRkt534fZYezrwk6H1fiE"
});

// 📂 Setup Multer storage with Cloudinary (only .doc/.docx)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (!file.originalname.match(/\.(doc|docx)$/i)) {
      throw new Error("Only .doc and .docx files are allowed!");
    }

    return {
      folder: "docx_uploads",
      resource_type: "auto",
      format: file.originalname.split('.').pop(),
      public_id: file.originalname.replace(/\.[^/.]+$/, "")
    };
  },
});

const upload = multer({ storage: storage });

// 📌 Upload docx & convert to text
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const cloudinaryUrl = req.file.path;

    // 🔽 Download file temporarily
    const tempFilePath = `temp_${Date.now()}.docx`;
    const response = await axios({
      url: cloudinaryUrl,
      method: "GET",
      responseType: "arraybuffer"
    });
    fs.writeFileSync(tempFilePath, response.data);

    // 🔍 Extract text with mammoth
    const result = await mammoth.extractRawText({ path: tempFilePath });
    const plainText = result.value;

    // 🧹 Clean temp file
    fs.unlinkSync(tempFilePath);

    // 📑 Extract metadata + chapters
    const lines = plainText.split("\n").map(l => l.trim()).filter(l => l);

    let bookName = req.file.originalname.replace(/\.[^/.]+$/, "");
    let authorName = "Unknown";
    let chapters = [];

    let currentChapter = null;

    lines.forEach((line) => {
      // Detect chapters: "Chapter 1", "CHAPTER 2", etc.
      if (/^chapter\s*\d+/i.test(line)) {
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: line.trim(),  // keep "Chapter 1"
          content: ""
        };
      } else {
        // Add content to current chapter
        if (currentChapter) {
          currentChapter.content += line + "\n";
        }
      }
    });

    if (currentChapter) {
      chapters.push(currentChapter);
    }

    res.json({
      fileUrl: cloudinaryUrl,
      bookName,
      authorName,
      chapters, // ✅ [{ title: "Chapter 1", content: "..." }]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
