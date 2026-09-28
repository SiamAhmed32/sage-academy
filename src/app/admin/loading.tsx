export default function AdminLoading() {
  return (
    <div className="sa-page-skeleton" aria-busy="true" aria-live="polite">
      <span className="sa-skel sa-skel-kicker" />
      <span className="sa-skel sa-skel-title" />
      <span className="sa-skel sa-skel-line" />
      <div className="sa-skel-stats">
        <span className="sa-skel" />
        <span className="sa-skel" />
        <span className="sa-skel" />
        <span className="sa-skel" />
      </div>
      <div className="sa-skel-table">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} className="sa-skel" />
        ))}
      </div>
    </div>
  );
}
