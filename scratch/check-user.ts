import { connectDB } from "./src/lib/mongodb";
import User from "./src/models/User";

async function check() {
  await connectDB();
  const user = await User.findOne({ email: "siamahmedgotthis@gmail.com" });
  console.log("User found:", !!user);
  if (user) {
    console.log("Email:", user.email);
  }
  process.exit(0);
}

check();
