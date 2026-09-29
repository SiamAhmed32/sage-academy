/** Loading placeholders shaped like the real admin cards and tables. */

const CELL_WIDTHS = ["62%", "44%", "70%", "52%", "38%", "58%"];

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="skl-cards">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skl-card">
          <span className="sa-skel skl-icon" />
          <div>
            <span className="sa-skel skl-label" />
            <span className="sa-skel skl-value" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Rows only — used inside a grid that already shows its header. */
export function TableRowsSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="skl-row" style={{ opacity: 1 - row * 0.09 }}>
          <div className="skl-first">
            <span className="sa-skel skl-avatar" />
            <div>
              <span className="sa-skel skl-name" style={{ width: row % 2 ? "70%" : "85%" }} />
              <span className="sa-skel skl-sub" />
            </div>
          </div>
          {Array.from({ length: columns - 1 }, (_, col) => (
            <span key={col} className="sa-skel skl-cell" style={{ width: CELL_WIDTHS[(row + col) % CELL_WIDTHS.length] }} />
          ))}
        </div>
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="skl-table">
      <div className="skl-toolbar">
        <span className="sa-skel skl-search" />
        <span className="sa-skel skl-btn" />
        <span className="sa-skel skl-btn" />
      </div>
      <div className="skl-head">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="sa-skel" />
        ))}
      </div>
      <TableRowsSkeleton rows={rows} />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="sa-page-skeleton" aria-busy="true" aria-live="polite">
      <span className="skl-hidden">Loading…</span>
      <span className="sa-skel sa-skel-kicker" />
      <span className="sa-skel sa-skel-title" />
      <span className="sa-skel sa-skel-line" />
      <StatCardsSkeleton />
      <TableSkeleton />
    </div>
  );
}
