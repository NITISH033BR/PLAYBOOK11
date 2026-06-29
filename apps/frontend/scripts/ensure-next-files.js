const fs = require("fs");
const path = require("path");

const files = [
  path.join(__dirname, "..", ".next", "package.json"),
  path.join(__dirname, "..", ".next", "types", "package.json"),
];

for (const pkg of files) {
  try {
    if (fs.existsSync(pkg)) {
      fs.unlinkSync(pkg);
      console.log(`[next-fix] Removed: ${path.relative(path.join(__dirname, ".."), pkg)}`);
    }
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`[next-fix] Warning: ${err.message}`);
    }
  }
}
