import "server-only";

import type { Model, PipelineStage, QueryFilter, SortOrder } from "mongoose";

// Loose filter type: grid filters are built dynamically from a whitelist.
type FilterQuery<T> = QueryFilter<T> | Record<string, unknown>;

// ───────────── Request / response contract (shared with the client grid) ─────────────

export type GridSort = { colId: string; sort: "asc" | "desc" };

export type GridFilterCondition = {
  filterType?: "text" | "number" | "date" | "set" | "boolean";
  type?: string;
  filter?: string | number | null;
  filterTo?: string | number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  values?: (string | number | boolean | null)[];
  operator?: "AND" | "OR";
  conditions?: GridFilterCondition[];
};

export type GridRequest = {
  startRow: number;
  endRow: number;
  sortModel?: GridSort[];
  filterModel?: Record<string, GridFilterCondition>;
  search?: string;
  /** Page-level preset from a tile or view switch (e.g. "archived", "with-dues"). */
  preset?: string;
  /** Extra page params (e.g. a parent id). */
  params?: Record<string, string>;
};

export type GridResponse<Row> = { rows: Row[]; total: number };

// ───────────── Field whitelist ─────────────

export type GridFieldType = "text" | "number" | "date" | "set" | "boolean";

export type GridField = {
  /** Mongo path, e.g. "studentName" or "snapshot.batchCode". */
  path: string;
  type: GridFieldType;
  sortable?: boolean; // default true
  filterable?: boolean; // default true
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function textCondition(path: string, condition: GridFilterCondition): FilterQuery<unknown> | null {
  const raw = String(condition.filter ?? "").trim();
  const safe = escapeRegex(raw);
  switch (condition.type) {
    case "blank":
      return { $or: [{ [path]: null }, { [path]: "" }, { [path]: { $exists: false } }] };
    case "notBlank":
      return { [path]: { $nin: [null, ""], $exists: true } };
    case "equals":
      return raw ? { [path]: new RegExp(`^${safe}$`, "i") } : null;
    case "notEqual":
      return raw ? { [path]: { $not: new RegExp(`^${safe}$`, "i") } } : null;
    case "startsWith":
      return raw ? { [path]: new RegExp(`^${safe}`, "i") } : null;
    case "endsWith":
      return raw ? { [path]: new RegExp(`${safe}$`, "i") } : null;
    case "notContains":
      return raw ? { [path]: { $not: new RegExp(safe, "i") } } : null;
    default:
      return raw ? { [path]: new RegExp(safe, "i") } : null;
  }
}

function rangeCondition(
  path: string,
  type: string | undefined,
  from: number | Date | null,
  to: number | Date | null,
  isDate: boolean
): FilterQuery<unknown> | null {
  if (type === "blank") return { $or: [{ [path]: null }, { [path]: { $exists: false } }] };
  if (type === "notBlank") return { [path]: { $ne: null, $exists: true } };
  if (from === null) return null;
  if (isDate && from instanceof Date && (type === "equals" || type === "notEqual")) {
    // A date filter compares whole days.
    const end = new Date(from.getTime() + 86_400_000);
    return type === "equals" ? { [path]: { $gte: from, $lt: end } } : { $or: [{ [path]: { $lt: from } }, { [path]: { $gte: end } }] };
  }
  switch (type) {
    case "notEqual":
      return { [path]: { $ne: from } };
    case "greaterThan":
      return { [path]: { $gt: from } };
    case "greaterThanOrEqual":
      return { [path]: { $gte: from } };
    case "lessThan":
      return { [path]: { $lt: from } };
    case "lessThanOrEqual":
      return { [path]: { $lte: from } };
    case "inRange":
      if (to === null) return null;
      return { [path]: { $gte: from, $lte: isDate && to instanceof Date ? new Date(to.getTime() + 86_399_999) : to } };
    default:
      return { [path]: from };
  }
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T").slice(0, 10) + "T00:00:00+06:00");
  return Number.isNaN(date.getTime()) ? null : date;
}

function conditionToQuery(field: GridField, condition: GridFilterCondition): FilterQuery<unknown> | null {
  if (condition.operator && condition.conditions?.length) {
    const parts = condition.conditions.map((part) => conditionToQuery(field, part)).filter(Boolean) as FilterQuery<unknown>[];
    if (parts.length === 0) return null;
    return condition.operator === "OR" ? { $or: parts } : { $and: parts };
  }
  if (condition.filterType === "set" || field.type === "set" || field.type === "boolean") {
    if (!Array.isArray(condition.values)) return null;
    if (condition.values.length === 0) return { _id: null }; // nothing ticked → no rows
    const values = condition.values.flatMap((value) => {
      if (field.type === "boolean") return [value === true || value === "true"];
      if (value === "") return [null, ""];
      // The grid sends strings; numeric fields (e.g. class level) are matched both ways.
      return typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value) ? [value, Number(value)] : [value];
    });
    return { [field.path]: { $in: values } };
  }
  if (field.type === "number") {
    return rangeCondition(field.path, condition.type, toNumber(condition.filter), toNumber(condition.filterTo), false);
  }
  if (field.type === "date") {
    return rangeCondition(field.path, condition.type, toDate(condition.dateFrom), toDate(condition.dateTo), true);
  }
  return textCondition(field.path, condition);
}

export function buildGridFilter(
  fields: Record<string, GridField>,
  request: Pick<GridRequest, "filterModel" | "search">,
  searchPaths: string[]
): FilterQuery<unknown> {
  const and: FilterQuery<unknown>[] = [];
  for (const [colId, condition] of Object.entries(request.filterModel ?? {})) {
    const field = fields[colId];
    if (!field || field.filterable === false || !condition) continue;
    const query = conditionToQuery(field, condition);
    if (query) and.push(query);
  }
  const search = (request.search ?? "").trim().slice(0, 100);
  if (search && searchPaths.length) {
    const regex = new RegExp(escapeRegex(search), "i");
    and.push({ $or: searchPaths.map((path) => ({ [path]: regex })) });
  }
  return and.length ? { $and: and } : {};
}

export function buildGridSort(
  fields: Record<string, GridField>,
  sortModel: GridSort[] | undefined,
  fallback: Record<string, SortOrder>
): Record<string, SortOrder> {
  const sort: Record<string, SortOrder> = {};
  for (const item of sortModel ?? []) {
    const field = fields[item.colId];
    if (field && field.sortable !== false) sort[field.path] = item.sort === "desc" ? -1 : 1;
  }
  return Object.keys(sort).length ? { ...sort, _id: -1 } : fallback;
}

/** AND together the page scope and the grid's own filters, skipping empty ones. */
export function combineFilters(...parts: (FilterQuery<unknown> | undefined)[]): FilterQuery<unknown> {
  const present = parts.filter((part): part is FilterQuery<unknown> => Boolean(part && Object.keys(part).length));
  if (present.length === 0) return {};
  return present.length === 1 ? present[0] : { $and: present };
}

export function pageWindow(request: GridRequest) {
  const skip = Math.max(0, Math.floor(Number(request.startRow) || 0));
  const limit = Math.min(500, Math.max(1, Math.floor(Number(request.endRow) || skip + 25) - skip));
  return { skip, limit };
}

/**
 * One page of a collection: filter + search + sort + skip/limit, and the
 * total count for the pager. `base` is the page's own scope (e.g. not archived).
 */
export async function runGridFind<Doc, Row>(options: {
  model: Model<Doc>;
  request: GridRequest;
  fields: Record<string, GridField>;
  searchPaths: string[];
  base?: FilterQuery<Doc>;
  defaultSort: Record<string, SortOrder>;
  select?: string;
  populate?: Parameters<Model<Doc>["populate"]>[1];
  toRows: (docs: Doc[]) => Promise<Row[]> | Row[];
}): Promise<GridResponse<Row>> {
  const filter = combineFilters(options.base, buildGridFilter(options.fields, options.request, options.searchPaths)) as FilterQuery<Doc>;
  const { skip, limit } = pageWindow(options.request);
  let query = options.model
    .find(filter)
    .sort(buildGridSort(options.fields, options.request.sortModel, options.defaultSort))
    .skip(skip)
    .limit(limit);
  if (options.select) query = query.select(options.select);
  if (options.populate) query = query.populate(options.populate as never);
  const [docs, total] = await Promise.all([query.lean<Doc[]>(), options.model.countDocuments(filter)]);
  return { rows: await options.toRows(docs), total };
}

/** Same as runGridFind, but over an aggregation (for computed columns). */
export async function runGridAggregate<Row>(options: {
  model: Model<never> | Model<unknown>;
  request: GridRequest;
  fields: Record<string, GridField>;
  searchPaths: string[];
  /** Stages that build the row shape before filtering (lookups, computed fields). */
  prepare: PipelineStage[];
  defaultSort: Record<string, SortOrder>;
  toRows?: (docs: Record<string, unknown>[]) => Promise<Row[]> | Row[];
}): Promise<GridResponse<Row>> {
  const filter = buildGridFilter(options.fields, options.request, options.searchPaths);
  const sort = buildGridSort(options.fields, options.request.sortModel, options.defaultSort);
  const { skip, limit } = pageWindow(options.request);
  const [result] = await (options.model as Model<unknown>).aggregate<{ rows: Record<string, unknown>[]; total: { n: number }[] }>([
    ...options.prepare,
    { $match: filter },
    {
      $facet: {
        rows: [{ $sort: sort as Record<string, 1 | -1> }, { $skip: skip }, { $limit: limit }],
        total: [{ $count: "n" }],
      },
    },
  ]);
  const rows = result?.rows ?? [];
  return {
    rows: options.toRows ? await options.toRows(rows) : (rows as Row[]),
    total: result?.total?.[0]?.n ?? 0,
  };
}

// ───────────── In-memory rows (small per-record lists, e.g. one student's bills) ─────────────

function valueAt(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (value == null ? value : (value as Record<string, unknown>)[key]), row);
}

function dayStart(value: string | null | undefined) {
  const date = toDate(value);
  return date ? date.getTime() : null;
}

function passesCondition(field: GridField, condition: GridFilterCondition, raw: unknown): boolean {
  if (condition.operator && condition.conditions?.length) {
    const results = condition.conditions.map((part) => passesCondition(field, part, raw));
    return condition.operator === "OR" ? results.some(Boolean) : results.every(Boolean);
  }
  const blank = raw === null || raw === undefined || raw === "";
  if (condition.type === "blank") return blank;
  if (condition.type === "notBlank") return !blank;
  if (condition.filterType === "set" || field.type === "set" || field.type === "boolean") {
    if (!Array.isArray(condition.values)) return true;
    return condition.values.map(String).includes(String(raw ?? ""));
  }
  if (field.type === "number" || field.type === "date") {
    const value = field.type === "date" ? (raw ? new Date(String(raw)).getTime() : null) : typeof raw === "number" ? raw : Number(raw);
    if (value === null || Number.isNaN(value)) return false;
    const from = field.type === "date" ? dayStart(condition.dateFrom) : toNumber(condition.filter);
    const toRaw = field.type === "date" ? dayStart(condition.dateTo) : toNumber(condition.filterTo);
    if (from === null) return true;
    const dayEnd = field.type === "date" ? from + 86_400_000 : from;
    switch (condition.type) {
      case "notEqual":
        return field.type === "date" ? value < from || value >= dayEnd : value !== from;
      case "greaterThan":
        return value > (field.type === "date" ? dayEnd - 1 : from);
      case "greaterThanOrEqual":
        return value >= from;
      case "lessThan":
        return value < from;
      case "lessThanOrEqual":
        return value <= (field.type === "date" ? dayEnd - 1 : from);
      case "inRange":
        return toRaw === null ? true : value >= from && value <= (field.type === "date" ? toRaw + 86_399_999 : toRaw);
      default:
        return field.type === "date" ? value >= from && value < dayEnd : value === from;
    }
  }
  const text = String(raw ?? "").toLowerCase();
  const needle = String(condition.filter ?? "").trim().toLowerCase();
  if (!needle) return true;
  switch (condition.type) {
    case "equals":
      return text === needle;
    case "notEqual":
      return text !== needle;
    case "startsWith":
      return text.startsWith(needle);
    case "endsWith":
      return text.endsWith(needle);
    case "notContains":
      return !text.includes(needle);
    default:
      return text.includes(needle);
  }
}

/** Same search / filter / sort / paging contract as runGridFind, over rows already in memory. */
export function runGridInMemory<Row extends Record<string, unknown>>(options: {
  rows: Row[];
  request: GridRequest;
  fields: Record<string, GridField>;
  searchPaths: string[];
  defaultSort?: { path: string; dir: 1 | -1 }[];
}): GridResponse<Row> {
  const { request, fields } = options;
  const search = (request.search ?? "").trim().toLowerCase().slice(0, 100);
  let rows = options.rows.filter((row) => {
    for (const [colId, condition] of Object.entries(request.filterModel ?? {})) {
      const field = fields[colId];
      if (!field || field.filterable === false || !condition) continue;
      if (!passesCondition(field, condition, valueAt(row, field.path))) return false;
    }
    if (search && !options.searchPaths.some((path) => String(valueAt(row, path) ?? "").toLowerCase().includes(search))) return false;
    return true;
  });
  const sorts = (request.sortModel ?? [])
    .map((item) => ({ field: fields[item.colId], dir: item.sort === "desc" ? -1 : 1 }))
    .filter((item) => item.field && item.field.sortable !== false)
    .map((item) => ({ path: item.field!.path, dir: item.dir as 1 | -1 }));
  const order = sorts.length ? sorts : options.defaultSort ?? [];
  if (order.length) {
    rows = [...rows].sort((a, b) => {
      for (const { path, dir } of order) {
        const x = valueAt(a, path);
        const y = valueAt(b, path);
        if (x === y) continue;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        if (cmp !== 0) return cmp * dir;
      }
      return 0;
    });
  }
  const { skip, limit } = pageWindow(request);
  return { rows: rows.slice(skip, skip + limit), total: rows.length };
}
