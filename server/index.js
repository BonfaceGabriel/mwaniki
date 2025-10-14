const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { expressjwt } = require("express-jwt");
const { pool, initDb } = require("./db");

/* ───── Supabase client ─────────────────────────────────────────────── */
const { createClient } = require("@supabase/supabase-js");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);
const BUCKET = process.env.SUPABASE_BUCKET || "photos";
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret";

/* ─────── Cache Setup ──────────────────────────────────────────────── */
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const cache = {};

const clearCache = (key) => (req, res, next) => {
  if (key) {
    console.log(`Cache cleared for key: ${key}`);
    delete cache[key];
  }
  next();
};

/* ───────── Express setup ──────────────────────────────────────────────── */
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

/* ───── Auth Middleware ───────────────────��────────────────────────── */
const auth = expressjwt({
  secret: JWT_SECRET,
  algorithms: ["HS256"],
});

const adminOnly = (req, res, next) => {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

/* ───── Multer: keep files in memory so we can push to Supabase ───── */
const upload = multer({ storage: multer.memoryStorage() });

/* ───────────────── Auth Endpoints ─────────────────────────────────── */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Failed to log in." });
  }
});

/* ───────────────── Tributes Endpoints ────────────────────────────── */
app.get("/tributes", async (_req, res) => {
  const cacheKey = "tributes";
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION_MS) {
    console.log("Serving tributes from cache");
    return res.json(cache[cacheKey].data);
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM tributes ORDER BY timestamp DESC",
    );
    cache[cacheKey] = {
      timestamp: now,
      data: rows,
    };
    console.log("Serving tributes from DB and caching");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching tributes:", err);
    res.status(500).json({ error: "Failed to fetch tributes." });
  }
});

app.post(
  "/tributes",
  upload.single("photo"),
  clearCache("tributes"),
  async (req, res) => {
    const { name, relationship, message, type } = req.body;
    const sanitizedMessage = DOMPurify.sanitize(message);
    const id = uuidv4();
    let photoUrl = null;

    try {
      // Handle optional photo upload
      if (req.file) {
        const file = req.file;
        const filename = `tribute-${id}${path.extname(file.originalname)}`;

        // Upload to Supabase Storage
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(filename, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (uploadErr) throw uploadErr;

        // Get public URL
        const { data: pub } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(filename);

        photoUrl = pub.publicUrl;
      }

      // Insert tribute with optional photo_url
      const { rows } = await pool.query(
        "INSERT INTO tributes (id, name, relationship, message, type, photo_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
        [id, name, relationship, sanitizedMessage, type, photoUrl],
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("Error posting tribute:", err);
      res.status(500).json({ error: "Failed to post tribute." });
    }
  }
);

app.delete(
  "/tributes/:id",
  auth,
  adminOnly,
  clearCache("tributes"),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM tributes WHERE id = $1", [id]);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting tribute:", err);
      res.status(500).json({ error: "Failed to delete tribute." });
    }
  },
);

/* ───────────────── Site Settings Endpoints ────────────────────────── */
app.get("/site-settings", async (_req, res) => {
  const cacheKey = "site-settings";
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION_MS) {
    console.log("Serving site settings from cache");
    return res.json(cache[cacheKey].data);
  }

  try {
    const { rows } = await pool.query("SELECT setting_key, setting_value FROM site_settings");
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    cache[cacheKey] = {
      timestamp: now,
      data: settings,
    };
    console.log("Serving site settings from DB and caching");
    res.json(settings);
  } catch (err) {
    console.error("Error fetching site settings:", err);
    res.status(500).json({ error: "Failed to fetch site settings." });
  }
});

app.put(
  "/site-settings",
  auth,
  adminOnly,
  clearCache("site-settings"),
  async (req, res) => {
    const settings = req.body;
    try {
      for (const [key, value] of Object.entries(settings)) {
        await pool.query(
          "INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP",
          [key, value]
        );
      }
      res.status(200).json({ message: "Site settings updated successfully." });
    } catch (err) {
      console.error("Error updating site settings:", err);
      res.status(500).json({ error: "Failed to update site settings." });
    }
  }
);

app.post(
  "/site-settings/upload-photo",
  auth,
  adminOnly,
  upload.single("photo"),
  clearCache("site-settings"),
  async (req, res) => {
    const { photoType } = req.body; // 'profile' or 'background'
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    try {
      const id = uuidv4();
      const filename = `${photoType}-${id}${path.extname(file.originalname)}`;

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filename, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: pub } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filename);

      // Update site settings
      const settingKey = photoType === 'profile' ? 'profile_photo_url' : 'background_photo_url';
      await pool.query(
        "INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP",
        [settingKey, pub.publicUrl]
      );

      res.status(200).json({
        message: "Photo uploaded successfully.",
        url: pub.publicUrl
      });
    } catch (err) {
      console.error("Error uploading photo:", err);
      res.status(500).json({ error: "Failed to upload photo." });
    }
  }
);

/* ───────────────── Information Events Endpoints ────────────────────── */
app.get("/information-events", async (_req, res) => {
  const cacheKey = "information-events";
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION_MS) {
    console.log("Serving information events from cache");
    return res.json(cache[cacheKey].data);
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM information_events ORDER BY display_order DESC, created_at DESC"
    );
    cache[cacheKey] = {
      timestamp: now,
      data: rows,
    };
    console.log("Serving information events from DB and caching");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching information events:", err);
    res.status(500).json({ error: "Failed to fetch information events." });
  }
});

app.post(
  "/information-events",
  auth,
  adminOnly,
  clearCache("information-events"),
  async (req, res) => {
    const { title, date, time, venue, content, type, display_order } = req.body;
    try {
      const { rows } = await pool.query(
        "INSERT INTO information_events (title, date, time, venue, content, type, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [title, date, time, venue, content, type, display_order || 0]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("Error creating information event:", err);
      res.status(500).json({ error: "Failed to create information event." });
    }
  }
);

app.put(
  "/information-events/:id",
  auth,
  adminOnly,
  clearCache("information-events"),
  async (req, res) => {
    const { id } = req.params;
    const { title, date, time, venue, content, type, display_order } = req.body;
    try {
      const { rows } = await pool.query(
        "UPDATE information_events SET title = $1, date = $2, time = $3, venue = $4, content = $5, type = $6, display_order = $7 WHERE id = $8 RETURNING *",
        [title, date, time, venue, content, type, display_order, id]
      );
      res.json(rows[0]);
    } catch (err) {
      console.error("Error updating information event:", err);
      res.status(500).json({ error: "Failed to update information event." });
    }
  }
);

app.delete(
  "/information-events/:id",
  auth,
  adminOnly,
  clearCache("information-events"),
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM information_events WHERE id = $1", [id]);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting information event:", err);
      res.status(500).json({ error: "Failed to delete information event." });
    }
  }
);

/* ───────────────── Eulogy Endpoints ──────────────────────────────── */
app.get("/eulogy", async (_req, res) => {
  const cacheKey = "eulogy";
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION_MS) {
    console.log("Serving eulogy from cache");
    return res.json(cache[cacheKey].data);
  }
  try {
    const { rows } = await pool.query(
      "SELECT content FROM eulogy_content LIMIT 1",
    );
    const data = { content: rows.length > 0 ? rows[0].content : "" };
    cache[cacheKey] = {
      timestamp: now,
      data,
    };
    console.log("Serving eulogy from DB and caching");
    res.json(data);
  } catch (err) {
    console.error("Error fetching eulogy content:", err);
    res.status(500).json({ error: "Failed to fetch eulogy content." });
  }
});

app.put(
  "/eulogy",
  auth,
  adminOnly,
  clearCache("eulogy"),
  async (req, res) => {
    const { content } = req.body;
    try {
      // Assuming there's only one row for eulogy content (id=1)
      await pool.query("UPDATE eulogy_content SET content = $1 WHERE id = 1", [
        content,
      ]);
      res.status(200).json({ message: "Eulogy content updated successfully." });
    } catch (err) {
      console.error("Error updating eulogy content:", err);
      res.status(500).json({ error: "Failed to update eulogy content." });
    }
  },
);

/* ───────────────── Photos Endpoints ───────────────────────────────── */
app.get("/photos", async (_req, res) => {
  const cacheKey = "photos";
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION_MS) {
    console.log("Serving photos from cache");
    return res.json(cache[cacheKey].data);
  }
  try {
    const { rows } = await pool.query(
      "SELECT * FROM photos ORDER BY timestamp DESC",
    );
    cache[cacheKey] = {
      timestamp: now,
      data: rows,
    };
    console.log("Serving photos from DB and caching");
    res.json(rows);
  } catch (err)
 {
    console.error("Error fetching photos:", err);
    res.status(500).json({ error: "Failed to fetch photos." });
  }
});

app.post(
  "/photos",
  upload.array("photos"),
  clearCache("photos"),
  async (req, res) => {
    const files = Array.isArray(req.files) ? req.files : [];
    const { caption, name, email } = req.body;

    if (name && email) {
      const userData = `Name: ${name}, Email: ${email}\n`;
      fs.appendFile(path.join(__dirname, "users.txt"), userData, (err) => {
        if (err) {
          console.error("Failed to write user data to file:", err);
        }
      });
    }

    if (!files.length) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    try {
      const newPhotos = [];

      for (const file of files) {
        const id = uuidv4();
        const filename = `${id}${path.extname(file.originalname)}`;

        /* upload to Supabase Storage */
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(filename, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });
        if (uploadErr) throw uploadErr;

        /* get public URL */
        const { data: pub } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(filename);

        /* save metadata in Postgres */
        const { rows } = await pool.query(
          "INSERT INTO photos (id, src, caption, name, email) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [id, pub.publicUrl, caption, name, email],
        );
        newPhotos.push(rows[0]);
      }

      res.status(201).json(newPhotos);
    } catch (err) {
      console.error("Error posting photos:", err);
      res.status(500).json({ error: "Failed to post photos." });
    }
  },
);

app.delete(
  "/photos/:id",
  auth,
  adminOnly,
  clearCache("photos"),
  async (req, res) => {
    const { id } = req.params;
    try {
      // First, get the photo src to delete from Supabase
      const { rows } = await pool.query(
        "SELECT src FROM photos WHERE id = $1",
        [id],
      );
      if (rows.length > 0) {
        const src = rows[0].src;
        const filename = path.basename(new URL(src).pathname);

        // Delete from Supabase
        await supabase.storage.from(BUCKET).remove([filename]);
      }

      // Delete from database
      await pool.query("DELETE FROM photos WHERE id = $1", [id]);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting photo:", err);
      res.status(500).json({ error: "Failed to delete photo." });
    }
  },
);

/* ───────────────��─ Initialize DB & start server ───────────────────── */
initDb()
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`)),
  )
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
