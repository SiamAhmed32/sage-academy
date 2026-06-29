import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Clock3, MapPin, Sparkles, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";

import { accessTypeLabels, deliveryModeLabels, offlineTypeLabels } from "@/constants/exam-hub";
import type { PublicExamProgram } from "@/lib/exam-hub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ExamProgramCard({ program, index = 0 }: { program: PublicExamProgram; index?: number }) {
  const isOnline = program.deliveryMode === "online";
  const isPaid = program.requiresPayment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
    >
      <Card
        className={cn(
          "group h-full overflow-hidden border-0 bg-white shadow-lg shadow-sage-primary/5 ring-1 ring-sage-border transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sage-primary/10",
          program.featured && "ring-2 ring-sage-gold/60"
        )}
      >
        <div
          className={cn(
            "relative h-2 w-full",
            isOnline ? "bg-gradient-to-r from-sage-primary to-sage-primary-hover" : "bg-gradient-to-r from-sage-gold to-amber-500"
          )}
        />
        {program.image ? (
          <div className="relative h-44 w-full overflow-hidden">
            <Image src={program.image} alt={program.title} fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          </div>
        ) : null}
        <CardHeader className="gap-3 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {program.featured ? (
              <Badge className="bg-sage-gold-soft text-sage-gold-muted border-sage-gold/30">
                <Sparkles className="size-3" />
                Featured
              </Badge>
            ) : null}
            <Badge variant="outline" className="border-sage-border text-sage-secondary">
              {deliveryModeLabels[program.deliveryMode as keyof typeof deliveryModeLabels]}
            </Badge>
            {isOnline ? (
              <Badge variant="secondary" className="bg-sage-card-sky text-sage-secondary">
                {accessTypeLabels[program.accessType as keyof typeof accessTypeLabels]}
              </Badge>
            ) : program.offlineType ? (
              <Badge variant="secondary" className="bg-sage-card-honey text-sage-secondary">
                {offlineTypeLabels[program.offlineType as keyof typeof offlineTypeLabels]}
              </Badge>
            ) : null}
            {program.isLive ? (
              <Badge className="bg-sage-success-soft text-emerald-700">Live</Badge>
            ) : (
              <Badge variant="outline">Upcoming / Ended</Badge>
            )}
          </div>
          <CardTitle className="bn-headline text-xl font-bold text-sage-secondary">{program.title}</CardTitle>
          {program.subtitle ? (
            <p className="bn-text text-sm text-sage-gray-500">{program.subtitle}</p>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="bn-text line-clamp-3 text-sm leading-7 text-sage-gray-700">
            {program.description || "বিস্তারিত তথ্য দেখতে পরীক্ষার পেজে যান।"}
          </p>
          <div className="grid gap-2 text-sm text-sage-gray-700">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-sage-primary" />
              <span>{program.dateLabel}</span>
            </div>
            {isOnline ? (
              <>
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-sage-primary" />
                  <span>{program.durationMinutes} min · {program.totalMarks} marks</span>
                </div>
                {program.showLeaderboard ? (
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-sage-primary" />
                    <span>Leaderboard enabled</span>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {program.examTime ? (
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-amber-700" />
                    <span>{program.examTime}</span>
                  </div>
                ) : null}
                {program.venue ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-sage-primary" />
                    <span className="line-clamp-1">{program.venue}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-sage-primary" />
                  <span>{program.classLabel}</span>
                </div>
              </>
            )}
          </div>
          {isPaid && isOnline ? (
            <div className="rounded-xl bg-sage-red-50 px-3 py-2 text-sm font-semibold text-sage-primary">
              Fee: ৳{program.feeAmount}
            </div>
          ) : isOnline ? (
            <div className="rounded-xl bg-sage-success-soft px-3 py-2 text-sm font-semibold text-emerald-700">
              Free registration
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              Center exam · info only
            </div>
          )}
        </CardContent>

        <CardFooter className={cn("border-t border-sage-border/70", isOnline ? "bg-sage-cream/40" : "bg-amber-50/50")}>
          <Button
            asChild
            className={cn(
              "h-11 w-full rounded-xl font-bold",
              isOnline ? "bg-sage-primary hover:bg-sage-secondary" : "bg-amber-700 hover:bg-amber-800"
            )}
          >
            <Link href={`/exams/${program.slug}`}>
              {isOnline ? "View exam" : "View schedule & details"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
