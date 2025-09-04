// const express = require("express");
// const multer = require("multer");
// const mammoth = require("mammoth");
// const cors = require("cors");
// const fs = require("fs");

// const app = express();
// app.use(cors());
// const upload = multer({ dest: "uploads/" });

// // 📌 Upload docx & convert to text
// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const filePath = req.file.path;

//     // Extract text from docx
//     const result = await mammoth.extractRawText({ path: filePath });
//     const plainText = result.value;

//     // Example: Extract metadata
//     const lines = plainText.split("\n").map(l => l.trim()).filter(l => l);

//     let bookName = "Unknown";
//     let authorName = "Unknown";
//     let chapters = [];

//     lines.forEach((line,i) => {
//       if (line.startsWith("📘 Book Title:")) {
//         bookName = line.replace(/book name:\s+/i, "").trim();
//       } 
//       else if (line.toLowerCase().startsWith("#disclaimer")) {
//     const nextLine = lines[i + 1] || "";
//     if (nextLine.toLowerCase().startsWith("by ")) {
//       authorName = nextLine.replace(/by\s+/i, "").trim();
//     }
//   }
//        else if (/^chapter\s+\d+/i.test(line)) {
//         chapters.push(line);
//       }
//     });

//     // Delete uploaded file (optional)
//     fs.unlinkSync(filePath);

//     res.json({
//       bookName,
//       authorName,
//       chapters,
//       rawText: plainText
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(5000, () => {
//   console.log("Server running on http://localhost:5000");
// });


const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
app.use(cors());

// 🔑 Configure Cloudinary
cloudinary.config({
  cloud_name: "dcpsnp9pa",
  api_key: "484622966268613",
  api_secret: "GE6NpQNRkt534fZYezrwk6H1fiE"
});

// 📂 Setup Multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "docx_uploads", 
    resource_type: "raw"   // for .docx, pdf, etc.
  },
});

const upload = multer({ storage: storage });

// 📌 Upload docx & convert to text
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
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

    lines.forEach((line, i) => {
      if (line.startsWith("📘 Book Title:")) {
        bookName = line.replace(/📘 Book Title:\s*/i, "").trim();
      } else if (line.toLowerCase().startsWith("#disclaimer")) {
        const nextLine = lines[i + 1] || "";
        if (nextLine.toLowerCase().startsWith("by ")) {
          authorName = nextLine.replace(/by\s+/i, "").trim();
        }
      } else if (/^chapter\s+\d+/i.test(line)) {
        chapters.push(line);
      }
    });

    res.json({
      fileUrl: cloudinaryUrl, // ✅ Stored on Cloudinary
      bookName,
      authorName,
      chapters,
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
