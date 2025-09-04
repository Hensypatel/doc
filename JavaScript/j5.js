// const express = require("express");
// const multer = require("multer");
// const mammoth = require("mammoth");
// const cors = require("cors");
// const fs = require("fs");
// const axios = require("axios");
// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// const app = express();
// app.use(cors());

// // 🔑 Configure Cloudinary
// cloudinary.config({
//   cloud_name: "dcpsnp9pa",
//   api_key: "484622966268613",
//   api_secret: "GE6NpQNRkt534fZYezrwk6H1fiE"
// });

// // 📂 Setup Multer storage with Cloudinary (only .doc/.docx)
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => {
//     // ✅ Validate file type
//     if (!file.originalname.match(/\.(doc|docx)$/i)) {
//       throw new Error("Only .doc and .docx files are allowed!");
//     }

//     return {
//       folder: "docx_uploads",       // Cloudinary folder
//       resource_type: "auto",        // auto-detects doc/docx
//       format: file.originalname.split('.').pop(), // keep extension
//       public_id: file.originalname.replace(/\.[^/.]+$/, ""), // keep name
//     };
//   },
// });

// const upload = multer({ storage: storage });

// // 📌 Upload docx & convert to text
// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const cloudinaryUrl = req.file.path; // ✅ Cloudinary URL

//     // 🔽 Download file temporarily
//     const tempFilePath = `temp_${Date.now()}.docx`;
//     const response = await axios({
//       url: cloudinaryUrl,
//       method: "GET",
//       responseType: "arraybuffer"
//     });
//     fs.writeFileSync(tempFilePath, response.data);

//     // 🔍 Extract text with mammoth
//     const result = await mammoth.extractRawText({ path: tempFilePath });
//     const plainText = result.value;

//     // 🧹 Clean temp file
//     fs.unlinkSync(tempFilePath);

//     // 📑 Extract metadata
//     const lines = plainText.split("\n").map(l => l.trim()).filter(l => l);

//     let bookName = "Unknown";
//     let authorName = "Unknown";
//     let chapters = [];

//     lines.forEach((line, i) => {
//       if (line.startsWith("📘 Book Title:")) {
//         bookName = line.replace(/📘 Book Title:\s*/i, "").trim();
//       } else if (line.toLowerCase().startsWith("#disclaimer")) {
//         const nextLine = lines[i + 1] || "";
//         if (nextLine.toLowerCase().startsWith("by ")) {
//           authorName = nextLine.replace(/by\s+/i, "").trim();
//         }
//       } else if (/^chapter\s+\d+/i.test(line)) {
//         chapters.push(line);
//       }
//     });

//     res.json({
//       fileUrl: cloudinaryUrl, // ✅ Stored on Cloudinary
//       bookName,
//       authorName,
//       chapters,
//       rawText: plainText
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(5000, () => {
//   console.log("🚀 Server running on http://localhost:5000");
// });


const express = require("express");
const mammoth = require("mammoth");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json()); // ✅ allow JSON body

// 📌 Extract text from DOCX/DOC file via URL
app.post("/extract-text", async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: "fileUrl is required" });
    }

    // 🔽 Download file temporarily
    const tempFilePath = `temp_${Date.now()}.docx`;
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "arraybuffer"
    });
    fs.writeFileSync(tempFilePath, response.data);

    // 🔍 Extract text with mammoth
    const result = await mammoth.extractRawText({ path: tempFilePath });
    const plainText = result.value;

    // 🧹 Remove temp file
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
      text: plainText,
      metadata: {
        bookName,
        authorName,
        chapters
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Start server
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
