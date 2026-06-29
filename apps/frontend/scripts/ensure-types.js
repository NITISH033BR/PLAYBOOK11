const fs = require("fs");
const path = require("path");

const typesDir = path.join(__dirname, "..", ".next", "types");
const typesPkg = path.join(typesDir, "package.json");

try {
  const content = JSON.stringify({ types: "types.d.ts" }, null, 2);

  if (fs.existsSync(typesPkg)) {
    try {
      fs.readlinkSync(typesPkg);
      fs.unlinkSync(typesPkg);
      fs.writeFileSync(typesPkg, content, "utf8");
      console.log("[next-fix] Replaced symlink .next/types/package.json with regular file");
    } catch (readlinkErr) {
      if (readlinkErr.code !== "EINVAL" && readlinkErr.code !== "UNKNOWN") {
        throw readlinkErr;
      }
    }
  } else {
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }
    if (!fs.existsSync(typesPkg)) {
      fs.writeFileSync(typesPkg, content, "utf8");
    }
  }
} catch (err) {
  if (err.code !== "ENOENT") {
    console.error("[next-fix] Warning:", err.message);
  }
}
