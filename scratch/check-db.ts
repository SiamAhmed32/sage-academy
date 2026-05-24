import * as fs from "fs";
import * as path from "path";
import { connectDB } from "../src/lib/mongodb";
import ModelTest from "../src/models/ModelTest";
import Exam from "../src/models/Exam";

// Load .env.local manually
try {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      const parts = line.split("=");
      if (parts[0] && parts[0].trim() === "MONGODB_URI") {
        process.env.MONGODB_URI = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }
} catch (e) {
  console.error("Failed to load .env.local:", e);
}

async function main() {
  await connectDB();
  console.log("Connected to DB");
  
  const tests = await ModelTest.find({}).lean();
  console.log("--- Model Tests ---");
  for (const t of tests) {
    console.log(`ID: ${t._id}, Title: "${t.title}", Slug: "${t.slug}", Status: "${t.status}", EndDate: ${t.endDate}`);
  }
  
  const exams = await Exam.find({}).lean();
  console.log("--- Exams ---");
  for (const e of exams) {
    console.log(`ID: ${e._id}, Title: "${e.title}", Slug: "${e.slug}", Status: "${e.status}", EndDate: ${e.endDate}`);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
