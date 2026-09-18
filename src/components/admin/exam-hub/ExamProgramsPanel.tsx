"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import type { AdminExamProgram } from "@/components/admin/exam-hub/ExamHubManager";
import { ExamProgramForm } from "@/components/admin/exam-hub/ExamProgramForm";
import { ExamProgramViewModal } from "@/components/admin/exam-hub/ExamProgramViewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type ProgramVariant = "online" | "offline";

type Filters = {
  query: string;
  status: "all" | AdminExamProgram["status"];
  accessType: "all" | "public" | "private";
  offlineType: "all" | "weekly" | "monthly";
};

const defaultFilters: Filters = {
  query: "",
  status: "all",
  accessType: "all",
  offlineType: "all",
};

type Props = {
  onProgramUpsert: (program: AdminExamProgram) => void;
  onProgramDelete: (programId: string) => void;
};

export function ExamProgramsPanel({ onProgramUpsert, onProgramDelete }: Props) {
  const [variant, setVariant] = useState<ProgramVariant>("online");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [programs, setPrograms] = useState<AdminExamProgram[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const deferredQuery = useDeferredValue(filters.query.trim());

  const [sheetOpen, setSheetOpen] = useState(false);
  const [createMode, setCreateMode] = useState<ProgramVariant>("online");
  const [editing, setEditing] = useState<AdminExamProgram | null>(null);
  const [savingProgram, setSavingProgram] = useState(false);

  const [viewTarget, setViewTarget] = useState<AdminExamProgram | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminExamProgram | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const loadPrograms = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams({
        deliveryMode: variant,
        sort: "order:asc",
        page: String(page),
        limit: String(pageSize),
      });
      if (deferredQuery) params.set("q", deferredQuery);
      if (filters.status !== "all") params.set("status", filters.status);
      if (variant === "online" && filters.accessType !== "all") {
        params.set("accessType", filters.accessType);
      }
      if (variant === "offline" && filters.offlineType !== "all") {
        params.set("offlineType", filters.offlineType);
      }

      try {
        const res = await fetch(`/api/admin/exam-hub/programs?${params.toString()}`, { signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!signal?.aborted) {
            toast.error(typeof data?.message === "string" ? data.message : "Could not load the exam programs");
          }
          return;
        }
        const nextTotalPages = data.data?.totalPages || 0;
        if (page > Math.max(1, nextTotalPages)) {
          setPage(Math.max(1, nextTotalPages));
          return;
        }
        setPrograms(data.data?.items || []);
        setTotal(data.data?.total || 0);
        setTotalPages(nextTotalPages);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [
      deferredQuery,
      filters.accessType,
      filters.offlineType,
      filters.status,
      page,
      pageSize,
      variant,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadPrograms(controller.signal);
    return () => controller.abort();
  }, [loadPrograms]);

  function openCreate(mode: ProgramVariant) {
    setEditing(null);
    setCreateMode(mode);
    setSheetOpen(true);
  }

  function openEdit(program: AdminExamProgram) {
    setEditing(program);
    setCreateMode(program.deliveryMode);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditing(null);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setLoading(true);
    try {
      await loadPrograms();
    } finally {
      setRefreshing(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/exam-hub/programs/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Could not delete the exam program");
        return;
      }
      onProgramDelete(deleteTarget._id);
      toast.success("Exam program deleted successfully");
      setDeleteTarget(null);
      if (programs.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadPrograms();
    } finally {
      setDeleting(false);
    }
  }

  const isOnline = variant === "online";

  function updateFilters(update: Partial<Filters>) {
    setLoading(true);
    setPage(1);
    setFilters((current) => ({ ...current, ...update }));
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="overflow-hidden border-sage-border/80 bg-white py-0 shadow-sm ring-sage-border/60">
          <Tabs
            value={variant}
            onValueChange={(value) => {
              setLoading(true);
              setPage(1);
              setVariant(value as ProgramVariant);
            }}
          >
            <div className="flex flex-col gap-4 border-b border-sage-border/80 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-bold text-sage-secondary">Exam programs</h3>
                <p className="mt-1 text-sm text-sage-gray-500">
                  Manage online MCQ exams and offline center exams in one place.
                </p>
              </div>
              <TabsList className="h-11 w-full rounded-2xl bg-sage-cream/80 p-1 sm:w-auto">
                <TabsTrigger value="online" className="rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Online
                  {variant === "online" ? (
                    <Badge variant="secondary" className="ml-2 bg-sage-red-50 text-sage-primary">{total}</Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="offline" className="rounded-xl px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Offline
                  {variant === "offline" ? (
                    <Badge variant="secondary" className="ml-2 bg-amber-50 text-amber-800">{total}</Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="space-y-5 px-4 pb-5 sm:px-6 sm:pb-6">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sage-gray-400" />
                    <Input
                      value={filters.query}
                      onChange={(event) => updateFilters({ query: event.target.value })}
                      placeholder="Search title or slug..."
                      className="h-10 rounded-xl border-sage-border pl-9"
                    />
                  </div>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => updateFilters({ status: value as Filters["status"] })}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-sage-border">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {isOnline ? (
                    <Select
                      value={filters.accessType}
                      onValueChange={(value) => updateFilters({ accessType: value as Filters["accessType"] })}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-sage-border">
                        <SelectValue placeholder="Access" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All access</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={filters.offlineType}
                      onValueChange={(value) => updateFilters({ offlineType: value as Filters["offlineType"] })}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-sage-border">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => updateFilters(defaultFilters)}
                  >
                    <RotateCcw className="size-4" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={refreshing}
                    onClick={handleRefresh}
                  >
                    {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    className={cn(
                      "rounded-xl font-semibold",
                      isOnline ? "bg-sage-primary hover:bg-sage-secondary" : "bg-amber-700 hover:bg-amber-800"
                    )}
                    onClick={() => openCreate(variant)}
                  >
                    <Plus className="size-4" />
                    New {isOnline ? "online" : "offline"}
                  </Button>
                </div>
              </div>

              <TabsContent value="online" className="mt-0">
                <ProgramList
                  variant="online"
                  programs={programs}
                  empty={!loading && total === 0}
                  loading={loading}
                  onView={setViewTarget}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              </TabsContent>
              <TabsContent value="offline" className="mt-0">
                <ProgramList
                  variant="offline"
                  programs={programs}
                  empty={!loading && total === 0}
                  loading={loading}
                  onView={setViewTarget}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              </TabsContent>

              <PaginationBar
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                total={total}
                page={page}
                totalPages={Math.max(1, totalPages)}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setLoading(true);
                  setPage(1);
                  setPageSize(size);
                }}
                onPrev={() => {
                  setLoading(true);
                  setPage((current) => Math.max(1, current - 1));
                }}
                onNext={() => {
                  setLoading(true);
                  setPage((current) => Math.min(totalPages, current + 1));
                }}
              />
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <Dialog open={sheetOpen} onOpenChange={(open) => !open && !savingProgram && closeSheet()}>
        <DialogContent
          size="xl"
          showCloseButton={!savingProgram}
          className={cn(
            "top-[max(1rem,3dvh)] flex h-[min(94dvh,880px)] w-[calc(100vw-1.5rem)] max-w-none translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-sage-border/80 p-0 shadow-2xl",
            "sm:w-[min(calc(100vw-3rem),56rem)] lg:w-[min(calc(100vw-4rem),64rem)]",
            "data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4"
          )}
        >
          <DialogHeader className="shrink-0 space-y-3 border-b border-sage-border/70 bg-gradient-to-r from-white to-sage-cream/30 px-5 py-5 text-left sm:px-6">
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <Badge
                className={cn(
                  "rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                  createMode === "online"
                    ? "bg-sage-red-50 text-sage-primary ring-1 ring-sage-primary/20"
                    : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                )}
              >
                {createMode === "online" ? "Online MCQ" : "Offline center"}
              </Badge>
              {editing ? (
                <Badge variant="outline" className="rounded-lg capitalize">
                  {editing.status}
                </Badge>
              ) : null}
            </div>
            <DialogTitle className="text-xl font-bold text-sage-secondary">
              {editing ? "Edit exam program" : createMode === "online" ? "New online MCQ exam" : "New offline center exam"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-sage-gray-600">
              {createMode === "online"
                ? "Configure MCQ settings, payment, and publishing. Fields are validated before save."
                : "Add venue, exam time, syllabus, and schedule details for the center exam page."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-sage-cream/15 px-4 py-4 sm:px-6 sm:py-5">
            <ExamProgramForm
              formId="exam-program-form"
              hideActions
              initial={editing}
              defaultDeliveryMode={editing?.deliveryMode || createMode}
              onSavingChange={setSavingProgram}
              onSaved={(program) => {
                onProgramUpsert(program);
                void loadPrograms();
                closeSheet();
                toast.success(editing ? "Exam program updated successfully" : "Exam program created successfully");
              }}
              onCancel={closeSheet}
            />
          </div>

          <DialogFooter className="-mx-0 -mb-0 shrink-0 gap-2 rounded-none border-t border-sage-border/70 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={savingProgram}
              onClick={closeSheet}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="exam-program-form"
              disabled={savingProgram}
              className={cn(
                "rounded-xl font-semibold",
                createMode === "online" ? "bg-sage-primary hover:bg-sage-secondary" : "bg-amber-700 hover:bg-amber-800"
              )}
            >
              {savingProgram ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save program"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExamProgramViewModal
        program={viewTarget}
        open={Boolean(viewTarget)}
        onOpenChange={(open) => !open && setViewTarget(null)}
        onEdit={(program) => {
          setViewTarget(null);
          openEdit(program);
        }}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle>Delete exam program?</DialogTitle>
            <DialogDescription className="text-left leading-relaxed">
              <strong>{deleteTarget?.title}</strong> and all related data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProgramList({
  variant,
  programs,
  empty,
  loading,
  onView,
  onEdit,
  onDelete,
}: {
  variant: ProgramVariant;
  programs: AdminExamProgram[];
  empty: boolean;
  loading: boolean;
  onView: (p: AdminExamProgram) => void;
  onEdit: (p: AdminExamProgram) => void;
  onDelete: (p: AdminExamProgram) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-sage-border bg-sage-cream/20 px-6 py-16 text-sm text-sage-gray-500">
        <Loader2 className="size-4 animate-spin" />
        Loading exam programs...
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-sage-border bg-sage-cream/20 px-6 py-16 text-center">
        <p className="font-semibold text-sage-secondary">No programs found</p>
        <p className="mt-2 text-sm text-sage-gray-500">Try changing filters or create a new exam program.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-sage-border/80 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-sage-cream/30 hover:bg-sage-cream/30">
              <TableHead>Program</TableHead>
              {variant === "online" ? (
                <>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questions / enrollments</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Type</TableHead>
                  <TableHead>Exam time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                </>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {programs.map((program, index) => (
                <TableRow
                  key={program._id}
                  className="border-sage-border/60 hover:bg-sage-cream/20"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell className="py-4">
                    <p className="font-semibold text-sage-secondary">{program.title}</p>
                    <p className="text-xs text-sage-gray-500">/{program.slug}</p>
                  </TableCell>
                  {variant === "online" ? (
                    <>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {program.accessType ? <Badge variant="secondary">{program.accessType}</Badge> : null}
                          {program.isPaid ? <Badge className="bg-sage-red-50 text-sage-primary">paid</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={program.status} />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <FileQuestion className="size-3.5 text-sage-primary" />
                          {program.questionCount || 0}
                          <span className="text-sage-gray-400">/</span>
                          <Users className="size-3.5 text-sage-primary" />
                          {program.enrollmentCount || 0}
                        </span>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {program.offlineType || "offline"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">{program.examTime || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{program.venue || "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={program.status} />
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    <RowActions program={program} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {programs.map((program, index) => (
          <motion.div
            key={program._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl border border-sage-border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sage-secondary">{program.title}</p>
                <p className="text-xs text-sage-gray-500">/{program.slug}</p>
              </div>
              <StatusBadge status={program.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-sage-gray-600">
              {variant === "online" ? (
                <>
                  {program.accessType ? <Badge variant="outline">{program.accessType}</Badge> : null}
                  <Badge variant="outline">{program.questionCount || 0} questions</Badge>
                  <Badge variant="outline">{program.enrollmentCount || 0} enrollments</Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="capitalize">
                    {program.offlineType || "offline"}
                  </Badge>
                  {program.examTime ? <Badge variant="outline">{program.examTime}</Badge> : null}
                </>
              )}
            </div>
            <div className="mt-4">
              <RowActions program={program} onView={onView} onEdit={onEdit} onDelete={onDelete} compact />
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function RowActions({
  program,
  onView,
  onEdit,
  onDelete,
  compact = false,
}: {
  program: AdminExamProgram;
  onView: (p: AdminExamProgram) => void;
  onEdit: (p: AdminExamProgram) => void;
  onDelete: (p: AdminExamProgram) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex gap-2", compact ? "flex-wrap" : "justify-end")}>
      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => onView(program)}>
        View
      </Button>
      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => onEdit(program)}>
        Edit
      </Button>
      <Button variant="destructive" size="sm" className="rounded-lg" onClick={() => onDelete(program)}>
        Delete
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminExamProgram["status"] }) {
  const styles = {
    published: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    draft: "bg-sage-cream text-sage-gray-700 ring-sage-border",
    hidden: "bg-amber-50 text-amber-800 ring-amber-100",
    archived: "bg-slate-100 text-slate-600 ring-slate-200",
  }[status];

  return (
    <Badge variant="outline" className={cn("capitalize ring-1", styles)}>
      {status}
    </Badge>
  );
}

function PaginationBar({
  rangeStart,
  rangeEnd,
  total,
  page,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrev,
  onNext,
}: {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-sage-border/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-sage-gray-600">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-sage-gray-600">Rows</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-9 w-[5.5rem] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-lg" disabled={page <= 1} onClick={onPrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[5.5rem] text-center text-sm font-semibold text-sage-secondary">
            {page} / {totalPages}
          </span>
          <Button type="button" variant="outline" size="sm" className="rounded-lg" disabled={page >= totalPages} onClick={onNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
