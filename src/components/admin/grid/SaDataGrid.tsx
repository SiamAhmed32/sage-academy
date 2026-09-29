"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type Column,
  type FilterModel,
  type GridApi,
  type GridReadyEvent,
  type IDatasource,
  type IGetRowsParams,
  type RowDoubleClickedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  AlertCircle,
  Columns3,
  Download,
  Filter,
  ListFilter,
  LoaderCircle,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { clearGridCache, gridCacheKey, loadGridPage, readGridCache } from "./grid-cache";
import { sageGridTheme } from "./grid-theme";
import { GridTiles, type GridTile } from "./GridTiles";
import { SetFilter, type SetFilterOption } from "./SetFilter";
import { TableRowsSkeleton } from "@/components/admin/sa/Skeletons";


ModuleRegistry.registerModules([AllCommunityModule]);

export type GridContext = { refresh: (purge?: boolean) => void };

export type SaDataGridHandle = { refresh: (purge?: boolean) => void; api: GridApi | null };

type Props<Row> = {
  /** Name of the server source, e.g. "academy-students". */
  source: string;
  /** Unique key for saved column layout. */
  gridId: string;
  columnDefs: ColDef<Row>[];
  getRowId: (row: Row) => string;
  tiles?: GridTile[];
  initialPreset?: string;
  params?: Record<string, string>;
  initialSearch?: string;
  searchPlaceholder?: string;
  toolbarActions?: ReactNode;
  rowHref?: (row: Row) => string | null;
  /** Single click on a row (clicks on buttons and links inside the row are ignored). */
  onRowClick?: (row: Row) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  exportName?: string;
  pageSize?: number;
  rowHeight?: number;
  /** Extra values for cell renderers (e.g. an edit callback), merged with refresh. */
  context?: Record<string, unknown>;
  /** Rendered between the tiles and the toolbar (e.g. class tabs). */
  beforeToolbar?: ReactNode;
  /** Fixed grid height in px (for grids inside a page section) instead of filling the screen. */
  height?: number;
  /** Change this value to reload the rows (e.g. after a server action refreshed the page). */
  refreshKey?: string | number;
  /** Fired when the first response includes summary cards. */
  onTiles?: (tiles: GridTile[]) => void;
  /** Fired when the first response includes extra data for the page (class levels, and so on). */
  onMeta?: (meta: Record<string, unknown>) => void;
};

type PanelId = "filters" | "columns" | null;

const PAGE_SIZES = [25, 50, 100];
const noopSubscribe = () => () => {};
const LAYOUT_PREFIX = "sage.grid.layout.v2.";

function readLayout(gridId: string) {
  try {
    const raw = window.localStorage.getItem(LAYOUT_PREFIX + gridId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLayout(gridId: string, state: unknown) {
  try {
    window.localStorage.setItem(LAYOUT_PREFIX + gridId, JSON.stringify(state));
  } catch {
    // storage full or blocked — layout just isn't remembered
  }
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function filterKind(col: ColDef): "text" | "number" | "date" | "set" | null {
  if (col.filter === SetFilter) return "set";
  if (col.filter === "agNumberColumnFilter") return "number";
  if (col.filter === "agDateColumnFilter") return "date";
  if (col.filter === "agTextColumnFilter" || col.filter === true) return "text";
  return null;
}

function SaDataGridInner<Row>(props: Props<Row>, ref: React.ForwardedRef<SaDataGridHandle>) {
  const {
    source,
    gridId,
    columnDefs,
    getRowId,
    tiles,
    initialPreset = "",
    params,
    initialSearch = "",
    searchPlaceholder = "Search every record…",
    toolbarActions,
    rowHref,
    onRowClick,
    emptyTitle = "No records found",
    emptyDescription = "Clear the search or filters, or add a new record.",
    exportName,
    pageSize = 25,
    rowHeight,
    context: extraContext,
    beforeToolbar,
    height,
    refreshKey,
    onTiles,
    onMeta,
  } = props;
  const onTilesRef = useRef(onTiles);
  const onMetaRef = useRef(onMeta);
  const tilesRef = useRef(tiles);
  onTilesRef.current = onTiles;
  onMetaRef.current = onMeta;
  tilesRef.current = tiles;

  const router = useRouter();
  const apiRef = useRef<GridApi | null>(null);
  // AG Grid renders in the browser only; the server sends a placeholder.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [search, setSearch] = useState(initialSearch);
  const [preset, setPreset] = useState(initialPreset);
  const [liveTiles, setLiveTiles] = useState<GridTile[] | undefined>(tiles);
  // The page strips the archive count out of the cards. Follow that list once it arrives.
  // Compare by value: the page builds a new array on every render.
  useEffect(() => {
    if (!tiles?.length) return;
    setLiveTiles((current) => {
      if (
        current &&
        current.length === tiles.length &&
        current.every((tile, index) => tile.key === tiles[index]?.key && tile.value === tiles[index]?.value && tile.preset === tiles[index]?.preset)
      ) {
        return current;
      }
      return tiles;
    });
  }, [tiles]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<PanelId>(null);
  const [filterModel, setFilterModel] = useState<FilterModel>({});
  const [columns, setColumns] = useState<Column[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Latest query inputs, read by the datasource without rebuilding it.
  const query = useRef({ search: initialSearch, preset: initialPreset, params });
  useEffect(() => {
    query.current.params = params;
  }, [params]);
  const controllerRef = useRef<AbortController | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  // Fill the screen below the toolbar (like Goraya Doors), never shorter than 460px.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (height) {
      el.style.setProperty("--sa-grid-fit", `${height}px`);
      return;
    }
    const fit = () => {
      const scrolled = document.scrollingElement?.scrollTop ?? 0;
      const top = el.getBoundingClientRect().top + scrolled;
      el.style.setProperty("--sa-grid-fit", `${Math.max(460, Math.round(window.innerHeight - top - 28))}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [error, mounted, height]);

  const datasource = useMemo<IDatasource>(() => {
    function applyPage(page: { rows: unknown[]; total: number; tiles?: GridTile[]; meta?: Record<string, unknown> }) {
      setError("");
      setTotal(page.total);
      if (page.tiles) {
        setLiveTiles(page.tiles);
        onTilesRef.current?.(page.tiles);
      }
      if (page.meta) onMetaRef.current?.(page.meta);
      if (page.total === 0) apiRef.current?.showNoRowsOverlay();
      else apiRef.current?.hideOverlay();
    }

    return {
      getRows: async (request: IGetRowsParams) => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        const payload = {
          startRow: request.startRow,
          endRow: request.endRow,
          sortModel: request.sortModel ?? [],
          filterModel: request.filterModel ?? {},
          search: query.current.search,
          preset: query.current.preset,
          params: query.current.params,
          withTiles: request.startRow === 0 && !tilesRef.current?.length,
        };
        const cached = readGridCache(gridCacheKey(source, payload));
        if (cached) {
          applyPage(cached);
          request.successCallback(cached.rows as Row[], cached.total);
          return;
        }
        setLoading(true);
        setError("");
        try {
          const result = await loadGridPage(source, payload, controller.signal);
          if (controller.signal.aborted) return;
          applyPage(result);
          request.successCallback(result.rows as Row[], result.total);
        } catch (cause) {
          if ((cause as Error).name === "AbortError") return;
          setError((cause as Error).message);
          request.failCallback();
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
    };
  }, [source]);

  const refresh = useCallback((purge = true) => {
    clearGridCache(source);
    const api = apiRef.current;
    if (!api) return;
    if (purge) api.purgeInfiniteCache();
    else api.refreshInfiniteCache();
  }, [source]);

  useImperativeHandle(ref, () => ({ refresh, get api() { return apiRef.current; } }), [refresh]);

  // Reload when the page hands us a new data version (server action → router.refresh()).
  const seenRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (seenRefreshKey.current === refreshKey) return;
    seenRefreshKey.current = refreshKey;
    refresh(false);
  }, [refreshKey, refresh]);

  // Debounced database search.
  useEffect(() => {
    if (search === query.current.search) return;
    const timer = window.setTimeout(() => {
      query.current.search = search;
      refresh(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, refresh]);

  function choosePreset(next: string) {
    const value = next === preset ? initialPreset : next;
    setPreset(value);
    query.current.preset = value;
    refresh(true);
  }

  const context = useMemo<GridContext>(() => ({ ...extraContext, refresh }), [extraContext, refresh]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      minWidth: 100,
      suppressHeaderMenuButton: false,
      filterParams: { buttons: ["reset", "apply"], closeOnApply: true, maxNumConditions: 2, trimInput: true },
    }),
    []
  );

  const preparedColumns = useMemo(
    () =>
      columnDefs.map((col) => {
        if (col.colId === "actions") {
          return {
            sortable: false,
            filter: false,
            resizable: false,
            pinned: "right" as const,
            lockPinned: true,
            suppressHeaderMenuButton: true,
            suppressMovable: true,
            cellClass: "sa-grid-actions-cell",
            headerClass: "sa-grid-actions-header",
            ...col,
          };
        }
        const sized =
          col.width && !col.flex ? { ...col, flex: col.width / 100, minWidth: col.minWidth ?? Math.round(col.width * 0.8), width: undefined } : col;
        return filterKind(col) === "number" ? { cellClass: "sa-grid-num", ...sized } : sized;
      }),
    [columnDefs]
  );

  function onGridReady(event: GridReadyEvent) {
    apiRef.current = event.api;
    const saved = readLayout(gridId);
    if (saved) event.api.applyColumnState({ state: saved, applyOrder: true });
    setColumns(event.api.getColumns() ?? []);
  }

  const saveLayout = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    writeLayout(gridId, api.getColumnState());
    setColumns(api.getColumns() ?? []);
  }, [gridId]);

  const activeFilters = Object.keys(filterModel).length;

  async function exportCsv() {
    const api = apiRef.current;
    if (!api) return;
    setExporting(true);
    setMenuOpen(false);
    try {
      const all: Row[] = [];
      for (let start = 0; start < 5000; start += 500) {
        const result = await loadGridPage(source, {
          startRow: start,
          endRow: start + 500,
          sortModel: api.getColumnState().filter((c) => c.sort).map((c) => ({ colId: c.colId, sort: c.sort })),
          filterModel: api.getFilterModel(),
          search: query.current.search,
          preset: query.current.preset,
          params: query.current.params,
        });
        all.push(...(result.rows as Row[]));
        if (all.length >= result.total || result.rows.length === 0) break;
      }
      const cols = (api.getAllDisplayedColumns() ?? []).filter((col) => col.getColId() !== "actions");
      const header = cols.map((col) => csvCell(col.getColDef().headerName ?? col.getColId())).join(",");
      const lines = all.map((row) =>
        cols
          .map((col) => {
            const def = col.getColDef() as ColDef<Row> & { context?: { exportValue?: (row: Row) => unknown } };
            if (def.context?.exportValue) return csvCell(def.context.exportValue(row));
            const field = def.field as string | undefined;
            return csvCell(field ? (row as Record<string, unknown>)[field] : "");
          })
          .join(",")
      );
      const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exportName ?? gridId}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    apiRef.current?.setFilterModel(null);
    setMenuOpen(false);
  }

  function resetLayout() {
    const api = apiRef.current;
    if (!api) return;
    api.resetColumnState();
    writeLayout(gridId, api.getColumnState());
    setColumns(api.getColumns() ?? []);
    setMenuOpen(false);
  }

  return (
    <section className="sa-grid-shell">
      {liveTiles && liveTiles.length ? <GridTiles tiles={liveTiles} active={preset} onSelect={choosePreset} /> : null}
      {beforeToolbar}

      <div className="sa-grid-toolbar">
        <div className="sa-grid-search">
          <Search size={16} />
          <input
            value={search}
            placeholder={searchPlaceholder}
            aria-label="Search all records"
            onChange={(event) => setSearch(event.target.value)}
          />
          {search ? (
            <button type="button" className="sa-grid-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          ) : null}
        </div>
        {toolbarActions}
        <button type="button" className={`sa-grid-btn${panel === "filters" ? " active" : ""}`} onClick={() => setPanel(panel === "filters" ? null : "filters")}>
          <Filter size={15} />
          <span className="sa-grid-btn-label">Filters</span>
          {activeFilters > 0 ? <b className="sa-grid-count">{activeFilters}</b> : null}
        </button>
        <button type="button" className={`sa-grid-btn${panel === "columns" ? " active" : ""}`} onClick={() => setPanel(panel === "columns" ? null : "columns")}>
          <Columns3 size={15} />
          <span className="sa-grid-btn-label">Columns</span>
        </button>
        <button type="button" className="sa-grid-btn icon" onClick={() => refresh(false)} aria-label="Refresh" title="Refresh">
          <RefreshCw size={15} className={loading ? "sa-spin" : undefined} />
        </button>
        <div className="sa-grid-menu">
          <button type="button" className="sa-grid-btn icon" onClick={() => setMenuOpen((value) => !value)} aria-label="More" aria-expanded={menuOpen}>
            <MoreHorizontal size={15} />
          </button>
          {menuOpen ? (
            <div className="sa-grid-menu-pop" role="menu" onMouseLeave={() => setMenuOpen(false)}>
              <p>Export</p>
              <button type="button" onClick={exportCsv} disabled={exporting}>
                <Download size={14} /> {exporting ? "Exporting…" : "Export CSV (all matching)"}
              </button>
              <hr />
              {activeFilters > 0 ? (
                <button type="button" onClick={clearFilters}>
                  <X size={14} /> Clear all filters
                </button>
              ) : null}
              <button type="button" onClick={resetLayout}>
                <RotateCcw size={14} /> Reset column layout
              </button>
            </div>
          ) : null}
        </div>
        <span className="sa-grid-status">
          {loading ? (
            <>
              <LoaderCircle size={13} className="sa-spin" /> Loading
            </>
          ) : total !== null ? (
            `${total.toLocaleString("en-IN")} record${total === 1 ? "" : "s"}`
          ) : null}
        </span>
      </div>

      {error ? (
        <div className="sa-grid-error" role="alert">
          <span>
            <AlertCircle size={15} /> {error}
          </span>
          <button type="button" className="sa-grid-btn" onClick={() => refresh(false)}>
            Try again
          </button>
        </div>
      ) : null}

      <div className="sa-grid-body" ref={bodyRef}>
        {loading && total === null ? (
          <div className="sa-grid-skeleton" aria-hidden="true">
            <TableRowsSkeleton rows={8} columns={Math.min(6, Math.max(3, columnDefs.length - 1))} />
          </div>
        ) : null}
        <div className="sa-grid-main">
          {mounted ? (
            <AgGridReact<Row>
              theme={sageGridTheme}
              columnDefs={preparedColumns}
              defaultColDef={defaultColDef}
              context={context}
              rowModelType="infinite"
              datasource={datasource}
              cacheBlockSize={pageSize}
              maxBlocksInCache={10}
              maxConcurrentDatasourceRequests={2}
              blockLoadDebounceMillis={60}
              pagination
              paginationPageSize={pageSize}
              paginationPageSizeSelector={PAGE_SIZES}
              rowHeight={rowHeight}
              getRowId={(params) => getRowId(params.data)}
              suppressMultiSort
              animateRows={false}
              suppressCellFocus
              tooltipShowDelay={300}
              overlayNoRowsTemplate={`<div class="sa-grid-empty"><strong>${emptyTitle}</strong><span>${emptyDescription}</span></div>`}
              onGridReady={onGridReady}
              onFilterChanged={(event) => setFilterModel(event.api.getFilterModel())}
              onColumnMoved={saveLayout}
              onColumnResized={(event) => event.finished && saveLayout()}
              onColumnVisible={saveLayout}
              onColumnPinned={saveLayout}
              onSortChanged={saveLayout}
              onRowClicked={(event) => {
                const target = event.event?.target as HTMLElement | null;
                if (!onRowClick || !event.data || target?.closest("button, a, input, select, .sa-grid-actions")) return;
                onRowClick(event.data);
              }}
              onRowDoubleClicked={(event: RowDoubleClickedEvent<Row>) => {
                const href = event.data && rowHref ? rowHref(event.data) : null;
                if (href) router.push(href);
              }}
            />
          ) : (
            <div className="sa-grid-placeholder" />
          )}
        </div>

        {panel ? (
          <aside className="sa-grid-panel" aria-label={panel === "filters" ? "Filters" : "Columns"}>
            {panel === "filters" ? (
              <FiltersPanel
                key={JSON.stringify(filterModel)}
                columns={columnDefs}
                model={filterModel}
                onApplyAll={(model) => apiRef.current?.setFilterModel(model)}
                onClose={() => setPanel(null)}
              />
            ) : (
              <ColumnsPanel
                columns={columns}
                onToggle={(col, visible) => apiRef.current?.setColumnsVisible([col], visible)}
                onReset={resetLayout}
                onClose={() => setPanel(null)}
              />
            )}
          </aside>
        ) : null}

        <nav className="sa-grid-sidetabs" aria-label="Grid tools">
          <button type="button" className={panel === "filters" ? "active" : ""} onClick={() => setPanel(panel === "filters" ? null : "filters")}>
            <Filter size={14} />
            <span>Filters</span>
          </button>
          <button type="button" className={panel === "columns" ? "active" : ""} onClick={() => setPanel(panel === "columns" ? null : "columns")}>
            <Columns3 size={14} />
            <span>Columns</span>
          </button>
        </nav>
      </div>
    </section>
  );
}

export const SaDataGrid = forwardRef(SaDataGridInner) as <Row>(
  props: Props<Row> & { ref?: React.Ref<SaDataGridHandle> }
) => ReturnType<typeof SaDataGridInner>;

// ───────────── Filters panel (like AG Grid's "New Filters" tool panel) ─────────────

type AnyModel = Record<string, unknown> | null;

type FilterableColumn = { colId: string; label: string; kind: "text" | "number" | "date" | "set"; options: SetFilterOption[] };

/**
 * Goraya-style filter builder: "Add filter" picks a column, each chosen
 * filter gets its own card, and Reset / Apply at the bottom act on all of them.
 */
function FiltersPanel({
  columns,
  model,
  onApplyAll,
  onClose,
}: {
  columns: ColDef[];
  model: FilterModel;
  onApplyAll: (model: FilterModel | null) => void;
  onClose: () => void;
}) {
  const filterable = useMemo<FilterableColumn[]>(
    () =>
      columns
        .filter((col) => col.colId !== "actions" && filterKind(col))
        .map((col) => {
          const colId = (col.colId ?? col.field) as string;
          return {
            colId,
            label: col.headerName ?? colId,
            kind: filterKind(col)!,
            options: (col.filterParams as { options?: SetFilterOption[] } | undefined)?.options ?? [],
          };
        }),
    [columns]
  );
  const [draft, setDraft] = useState<Record<string, AnyModel>>(() => ({ ...(model as Record<string, AnyModel>) }));
  const [order, setOrder] = useState<string[]>(() => Object.keys(model));
  const [picking, setPicking] = useState(false);
  const unused = filterable.filter((col) => !order.includes(col.colId));
  const changed = JSON.stringify(clean(draft)) !== JSON.stringify(clean(model as Record<string, AnyModel>));

  function clean(value: Record<string, AnyModel>) {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry));
  }

  function add(colId: string) {
    setOrder((current) => [...current, colId]);
    setDraft((current) => ({ ...current, [colId]: null }));
    setPicking(false);
  }

  function remove(colId: string) {
    setOrder((current) => current.filter((id) => id !== colId));
    setDraft((current) => {
      const next = { ...current };
      delete next[colId];
      return next;
    });
  }

  function apply() {
    const next = clean(draft);
    onApplyAll(Object.keys(next).length ? (next as FilterModel) : null);
  }

  function reset() {
    setDraft({});
    setOrder([]);
    onApplyAll(null);
  }

  return (
    <div className="sa-grid-panel-inner">
      <div className="sa-grid-panel-head">
        <strong>Filters</strong>
        <PanelClose onClose={onClose} />
      </div>
      <div className="sa-grid-panel-scroll">
        <div className="sa-grid-addfilter-wrap">
          <button type="button" className="sa-grid-addfilter" onClick={() => setPicking((value) => !value)} disabled={unused.length === 0}>
            <ListFilter size={15} /> Add filter
          </button>
          {picking ? (
            <div className="sa-grid-pick" role="menu">
              {unused.map((col) => (
                <button key={col.colId} type="button" onClick={() => add(col.colId)}>
                  {col.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {order.length === 0 ? (
          <p className="sa-grid-panel-empty">No filters yet. Use “Add filter”, or the filter icon in any column header.</p>
        ) : null}

        {order.map((colId) => {
          const col = filterable.find((item) => item.colId === colId);
          if (!col) return null;
          return (
            <FilterCard
              key={colId}
              column={col}
              value={draft[colId] ?? null}
              onChange={(next) => setDraft((current) => ({ ...current, [colId]: next }))}
              onRemove={() => remove(colId)}
              onSubmit={apply}
            />
          );
        })}
      </div>
      <div className="sa-grid-panel-foot">
        <button type="button" className="sa-grid-btn" onClick={reset} disabled={order.length === 0 && !Object.keys(model).length}>
          Reset
        </button>
        <button type="button" className="sa-grid-btn primary" onClick={apply} disabled={!changed}>
          Apply
        </button>
      </div>
    </div>
  );
}

function FilterCard({
  column,
  value,
  onChange,
  onRemove,
  onSubmit,
}: {
  column: FilterableColumn;
  value: AnyModel;
  onChange: (model: AnyModel) => void;
  onRemove: () => void;
  onSubmit: () => void;
}) {
  const { kind, options, label } = column;
  const initial = value as { filter?: string | number; filterTo?: number; dateFrom?: string; dateTo?: string; type?: string; values?: string[] } | null;
  const [text, setText] = useState(String(kind === "text" ? initial?.filter ?? "" : ""));
  const [from, setFrom] = useState(
    kind === "number"
      ? String(initial?.type === "lessThanOrEqual" ? "" : initial?.filter ?? "")
      : kind === "date"
        ? String(initial?.type === "lessThanOrEqual" ? "" : initial?.dateFrom?.slice(0, 10) ?? "")
        : ""
  );
  const [to, setTo] = useState(
    kind === "number"
      ? String(initial?.type === "lessThanOrEqual" ? initial?.filter ?? "" : initial?.filterTo ?? "")
      : kind === "date"
        ? String(initial?.type === "lessThanOrEqual" ? initial?.dateFrom?.slice(0, 10) ?? "" : initial?.dateTo?.slice(0, 10) ?? "")
        : ""
  );
  const values = initial?.values;

  function range(nextFrom: string, nextTo: string) {
    if (!nextFrom && !nextTo) return onChange(null);
    if (kind === "number") {
      if (nextFrom && nextTo) return onChange({ filterType: "number", type: "inRange", filter: Number(nextFrom), filterTo: Number(nextTo) });
      return onChange(
        nextFrom
          ? { filterType: "number", type: "greaterThanOrEqual", filter: Number(nextFrom) }
          : { filterType: "number", type: "lessThanOrEqual", filter: Number(nextTo) }
      );
    }
    if (nextFrom && nextTo) return onChange({ filterType: "date", type: "inRange", dateFrom: `${nextFrom} 00:00:00`, dateTo: `${nextTo} 00:00:00` });
    return onChange(
      nextFrom
        ? { filterType: "date", type: "greaterThanOrEqual", dateFrom: `${nextFrom} 00:00:00` }
        : { filterType: "date", type: "lessThanOrEqual", dateFrom: `${nextTo} 00:00:00` }
    );
  }

  const submitOnEnter = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") onSubmit();
  };

  return (
    <div className={`sa-grid-filter-card${value ? " active" : ""}`}>
      <div className="sa-grid-filter-card-head">
        <span>{label}</span>
        <button type="button" onClick={onRemove} aria-label={`Remove ${label} filter`} title="Remove">
          <X size={14} />
        </button>
      </div>
      {kind === "set" ? (
        <div className="sa-setfilter-list">
          {options.map((option) => {
            const checked = values ? values.includes(option.value) : false;
            return (
              <label key={option.value} className="sa-setfilter-row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const current = new Set(values ?? []);
                    if (event.target.checked) current.add(option.value);
                    else current.delete(option.value);
                    onChange(current.size === 0 ? null : { filterType: "set", values: [...current] });
                  }}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : kind === "text" ? (
        <input
          className="input sm"
          placeholder="Contains…"
          value={text}
          autoFocus
          onChange={(event) => {
            setText(event.target.value);
            const trimmed = event.target.value.trim();
            onChange(trimmed ? { filterType: "text", type: "contains", filter: trimmed } : null);
          }}
          onKeyDown={submitOnEnter}
        />
      ) : (
        <div className="sa-grid-filter-range">
          <input
            className="input sm"
            type={kind === "date" ? "date" : "number"}
            value={from}
            placeholder="From"
            aria-label="From"
            onChange={(event) => {
              setFrom(event.target.value);
              range(event.target.value, to);
            }}
            onKeyDown={submitOnEnter}
          />
          <span>to</span>
          <input
            className="input sm"
            type={kind === "date" ? "date" : "number"}
            value={to}
            placeholder="To"
            aria-label="To"
            onChange={(event) => {
              setTo(event.target.value);
              range(from, event.target.value);
            }}
            onKeyDown={submitOnEnter}
          />
        </div>
      )}
    </div>
  );
}

function PanelClose({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="sa-grid-panel-close" onClick={onClose} aria-label="Close panel" title="Close">
      <X size={16} />
    </button>
  );
}

// ───────────── Columns panel ─────────────

function ColumnsPanel({
  columns,
  onToggle,
  onReset,
  onClose,
}: {
  columns: Column[];
  onToggle: (column: Column, visible: boolean) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const list = columns.filter(
    (column) =>
      column.getColId() !== "actions" &&
      (column.getColDef().headerName ?? column.getColId()).toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <div className="sa-grid-panel-inner">
      <div className="sa-grid-panel-head">
        <strong>Columns</strong>
        <span className="sa-grid-panel-head-actions">
          <button type="button" className="text-button" onClick={onReset}>
            Reset
          </button>
          <PanelClose onClose={onClose} />
        </span>
      </div>
      <div className="sa-grid-panel-scroll">
        <input className="input sm" placeholder="Search columns…" value={query} onChange={(event) => setQuery(event.target.value)} style={{ marginBottom: 8 }} />
        {list.map((column) => (
          <label key={column.getColId()} className="sa-setfilter-row">
            <input type="checkbox" checked={column.isVisible()} onChange={(event) => onToggle(column, event.target.checked)} />
            <span>{column.getColDef().headerName ?? column.getColId()}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
