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
    // ✅ Validate file type
    if (!file.originalname.match(/\.(doc|docx)$/i)) {
      throw new Error("Only .doc and .docx files are allowed!");
    }

    return {
      folder: "docx_uploads",       // Cloudinary folder
      resource_type: "auto",        // auto-detects doc/docx
      format: file.originalname.split('.').pop(), // keep extension
      public_id: file.originalname.replace(/\.[^/.]+$/, ""), // keep name
    };
  },
});

const upload = multer({ storage: storage });

// 📌 Upload docx & convert to text
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
      console.log("📥 Multer received file:", req.file);
    const cloudinaryUrl = req.file.path; // ✅ Cloudinary URL

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

    // 📑 Extract metadata
    const lines = plainText.split("\n").map(l => l.trim()).filter(l => l);

    let bookName = "Unknown";
    let authorName = "Unknown";
    let chapters = [];

    let currentChapter = null;

    lines.forEach((line, i) => {
      if (line.startsWith("📘 Book Title:")) {
        bookName = line.replace(/📘 Book Title:\s*/i, "").trim();
      } else if (line.toLowerCase().startsWith("#disclaimer")) {
        const nextLine = lines[i + 1] || "";
        if (nextLine.toLowerCase().startsWith("by ")) {
          authorName = nextLine.replace(/by\s+/i, "").trim();
        }
      } else if (/^chapter\s+\d+/i.test(line)) {
        // Start a new chapter
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: line,
          content: ""
        };
      } else {
        // Add content to current chapter
        if (currentChapter) {
          currentChapter.content += line + "\n";
        }
      }
    });

    // Push last chapter
    if (currentChapter) {
      chapters.push(currentChapter);
    }

    res.json({
      fileUrl: cloudinaryUrl, // ✅ Stored on Cloudinary
      bookName,
      authorName,
      chapters, // [{title, content}]
      rawText: plainText
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});

