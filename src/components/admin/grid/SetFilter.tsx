"use client";

import { useCallback, useMemo, useState } from "react";
import type { CustomFilterProps } from "ag-grid-react";
import { useGridFilter } from "ag-grid-react";

export type SetFilterOption = { value: string; label: string };
export type SetFilterModel = { filterType: "set"; values: string[] };

/**
 * A checkbox "Values" filter (like AG Grid Enterprise's Set filter) for the
 * Community edition. The server receives { filterType: "set", values }.
 * Pass options with `filterParams: { options: [...] }`.
 */
export function SetFilter(props: CustomFilterProps<unknown, unknown, SetFilterModel> & { options?: SetFilterOption[] }) {
  const { model, onModelChange } = props;
  const options = useMemo(() => props.options ?? [], [props.options]);
  const [query, setQuery] = useState("");

  // Server-side rows: filtering happens in the database, not in the browser.
  const doesFilterPass = useCallback(() => true, []);
  useGridFilter({ doesFilterPass });

  const selected = new Set(model?.values ?? options.map((option) => option.value));
  const visible = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  function commit(next: Set<string>) {
    onModelChange(next.size === options.length ? null : { filterType: "set", values: [...next] });
  }

  return (
    <div className="sa-setfilter">
      {options.length > 8 ? (
        <input
          className="sa-setfilter-search"
          placeholder="Search values…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      <label className="sa-setfilter-row sa-setfilter-all">
        <input
          type="checkbox"
          checked={selected.size === options.length}
          ref={(input) => {
            if (input) input.indeterminate = selected.size > 0 && selected.size < options.length;
          }}
          onChange={(event) => commit(event.target.checked ? new Set(options.map((option) => option.value)) : new Set())}
        />
        (Select all)
      </label>
      <div className="sa-setfilter-list">
        {visible.map((option) => (
          <label key={option.value} className="sa-setfilter-row">
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              onChange={(event) => {
                const next = new Set(selected);
                if (event.target.checked) next.add(option.value);
                else next.delete(option.value);
                commit(next);
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
        {visible.length === 0 ? <p className="sa-setfilter-empty">No values</p> : null}
      </div>
    </div>
  );
}
