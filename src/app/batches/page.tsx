import { BatchesExplorer } from "@/components/batches/BatchesExplorer";
import { Container } from "@/components/shared/Container";
import { connectDB } from "@/lib/mongodb";
import PromotionCard from "@/models/PromotionCard";
import AcademicBatch from "@/models/AcademicBatch";

async function getPromotionCards() {
  try {
    await connectDB();
    const cards = await PromotionCard.find({
      websiteVisible: true,
    })
      .populate({
        path: "linkedBatch",
        select:
          "status totalSeats availableSeats classLevel genderGroup version",
      })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return cards;
  } catch (error) {
    console.error("Public batches fetch failed:", error);
    return undefined;
  }
}

export default async function BatchesPage() {
  const cards = await getPromotionCards();

  return (
    <main className="bg-sage-white">
      <section className="relative overflow-hidden border-b border-sage-red-100 bg-gradient-to-b from-sage-red-50 to-sage-white py-20">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-sage-red-100/60 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-sage-red-50 blur-3xl" />

        <Container className="relative">
          <p className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
            একাডেমিক ব্যাচ ও ভর্তি তথ্য
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-sage-secondary sm:text-5xl lg:text-6xl">
            আপনার সুবিধামতো সময় অনুযায়ি ব্যাচ নির্বাচন করুন
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-sage-gray-700 sm:text-lg">
            শ্রেণি, সময় এবং ছেলে ও মেয়ে অনুযায়ী ব্যাচ সার্চ ও ফিল্টার করুন।
            প্রয়োজনে যেকোন তথ্য জানতে সরাসরি যোগাযোগ করুন 09617576776।
          </p>
        </Container>
      </section>

      <BatchesExplorer batches={cards} />
    </main>
  );
}
