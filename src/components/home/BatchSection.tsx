import Link from "next/link";
import { BatchCard } from "@/components/home/BatchCard";
import { Container } from "@/components/shared/Container";
import { connectDB } from "@/lib/mongodb";
import PromotionCard from "@/models/PromotionCard";
import "@/models/AcademicBatch";

async function getHomePromotionCards() {
  try {
    await connectDB();
    // Optimized: Fetch marketing cards with linked operational status
    const cards = await PromotionCard.find({
      websiteVisible: true,
      featured: true,
    })
      .populate({
        path: "linkedBatch",
        select: "status totalSeats availableSeats classLevel",
      })
      .sort({ order: 1, createdAt: -1 })
      .limit(6)
      .lean();

    return cards;
  } catch (error) {
    console.error("Home promotion cards fetch failed:", error);
    return [];
  }
}

export async function BatchSection() {
  const cards = await getHomePromotionCards();

  if (!cards || cards.length === 0) return null;

  return (
    <section className="bg-sage-white py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-sage-red-50 px-4 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
              শ্রেণিভিত্তিক ব্যাচ
            </p>
            <h2 className="mt-4 text-3xl font-bold text-sage-secondary sm:text-4xl">
              প্রতিটি শ্রেণির জন্য সাজানো একাডেমিক ব্যাচ
            </h2>
            <p className="mt-4 text-base leading-8 text-sage-gray-700">
              নিয়মিত ক্লাস, সাপ্তাহিক মূল্যায়ন এবং অভিজ্ঞ শিক্ষকদের তত্ত্বাবধানে
              ক্লাস ৫ থেকে ১২ পর্যন্ত পরিকল্পিত ব্যাচ।
            </p>
          </div>

          <Link
            href="/batches"
            className="inline-flex items-center rounded-full border border-sage-primary px-5 py-3 text-sm font-semibold text-sage-primary transition hover:bg-sage-primary hover:text-sage-white"
          >
            সব ব্যাচ দেখুন
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <BatchCard 
              key={card._id.toString()} 
              card={card} 
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
