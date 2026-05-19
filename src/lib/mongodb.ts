import dbConnect from "@/lib/db";

export async function connectDB() {
  return dbConnect();
}
