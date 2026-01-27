const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Adjust path based on your project structure

router.get("/api/auth/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("❌ Database Query Error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

module.exports = router;
