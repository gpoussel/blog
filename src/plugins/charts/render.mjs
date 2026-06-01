// Deterministic, build-time SVG chart renderer for the `:::chart` directive.
//
// Like TopoBackground, this is intentionally free of Math.random / Date.now so
// builds are reproducible. Every visual choice (colour, font, axis, grid) is
// expressed through the design-system CSS custom properties defined in
// global.css, so a chart re-themes with the rest of the page (light/dark) for
// free and stays on-brand. Text and structural styling live in global.css
// under `.chart`; only the per-series colour is set inline (var(--chart-N)).
//
// Supported `type`s: bar (grouped), stacked-bar, line, area, donut; bars also
// take orientation: horizontal. The schema is forgiving; renderChart throws a
// ChartError with a human message that the remark plugin turns into a visible
// build-time note.

export class ChartError extends Error {}

// A category is coloured by var(--chart-N); we cycle through the six tokens.
const SERIES_COUNT = 6;
const seriesVar = (i) => `var(--chart-${(i % SERIES_COUNT) + 1})`;

// --- small helpers -------------------------------------------------------

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Round to 2 decimals and drop trailing zeros, keeping SVG output compact and
// deterministic across platforms.
const r2 = (n) => {
  const v = Math.round(n * 100) / 100;
  return Object.is(v, -0) ? "0" : String(v);
};

// Format a data value for a label: plain, locale-independent, trims zeros.
const fmtValue = (n, unit = "") => {
  const v = Math.round(n * 1000) / 1000;
  const s = Number.isInteger(v) ? String(v) : String(v);
  return unit ? `${s}${unit}` : s;
};

// A "nice" axis maximum at or above `max`, plus a sensible tick step.
function niceScale(max, ticks = 4) {
  if (max <= 0) return { max: 1, step: 0.25 };
  const rawStep = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = niceNorm * mag;
  return { max: Math.ceil(max / step) * step, step };
}

function asSeries(spec) {
  if (!Array.isArray(spec.series) || spec.series.length === 0) {
    throw new ChartError("a chart needs a non-empty `series` list");
  }
  return spec.series.map((s, i) => {
    if (!Array.isArray(s.data)) {
      throw new ChartError(
        `series ${i + 1} ("${s.name ?? "?"}") has no \`data\``,
      );
    }
    return { name: s.name ?? `Series ${i + 1}`, data: s.data.map(Number) };
  });
}

function legendHtml(items) {
  const lis = items
    .map(
      (it) =>
        `<li class="chart__legend-item"><span class="chart__swatch" style="background:${it.color}"></span>${esc(it.label)}</li>`,
    )
    .join("");
  return `<ul class="chart__legend">${lis}</ul>`;
}

// --- shared cartesian frame (bar / line / area) --------------------------

const W = 720;
const H = 400;
const PAD = { top: 18, right: 18, bottom: 38, left: 50 };
const PLOT = {
  x: PAD.left,
  y: PAD.top,
  w: W - PAD.left - PAD.right,
  h: H - PAD.top - PAD.bottom,
};

function yAxis(niceMax, step, unit) {
  let grid = "";
  for (let v = 0; v <= niceMax + 1e-9; v += step) {
    const y = r2(PLOT.y + PLOT.h * (1 - v / niceMax));
    grid +=
      `<line class="chart__grid" x1="${PLOT.x}" y1="${y}" x2="${r2(PLOT.x + PLOT.w)}" y2="${y}"/>` +
      `<text class="chart__tick" x="${PLOT.x - 8}" y="${y}" text-anchor="end" dominant-baseline="middle">${esc(fmtValue(v, unit))}</text>`;
  }
  return grid;
}

function xLabels(labels, centers) {
  return labels
    .map(
      (l, i) =>
        `<text class="chart__tick" x="${r2(centers[i])}" y="${H - PAD.bottom + 18}" text-anchor="middle">${esc(l)}</text>`,
    )
    .join("");
}

function roundedTopRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return (
    `M${r2(x)} ${r2(y + h)} L${r2(x)} ${r2(y + rr)} ` +
    `Q${r2(x)} ${r2(y)} ${r2(x + rr)} ${r2(y)} ` +
    `L${r2(x + w - rr)} ${r2(y)} Q${r2(x + w)} ${r2(y)} ${r2(x + w)} ${r2(y + rr)} ` +
    `L${r2(x + w)} ${r2(y + h)} Z`
  );
}

// A rect with only its right edge rounded (last segment of a horizontal bar).
function roundedRightRect(x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w);
  return (
    `M${r2(x)} ${r2(y)} L${r2(x + w - rr)} ${r2(y)} ` +
    `Q${r2(x + w)} ${r2(y)} ${r2(x + w)} ${r2(y + rr)} ` +
    `L${r2(x + w)} ${r2(y + h - rr)} Q${r2(x + w)} ${r2(y + h)} ${r2(x + w - rr)} ${r2(y + h)} ` +
    `L${r2(x)} ${r2(y + h)} Z`
  );
}

// --- renderers -----------------------------------------------------------

function renderStackedBar(spec) {
  if (String(spec.orientation ?? "").trim() === "horizontal") {
    return renderHorizontalBar(spec);
  }
  const labels = (spec.x ?? []).map(String);
  if (labels.length === 0)
    throw new ChartError("a bar chart needs an `x` list of categories");
  const series = asSeries(spec);
  const unit = spec.unit ?? "";

  const totals = labels.map((_, i) =>
    series.reduce((sum, s) => sum + (s.data[i] || 0), 0),
  );
  const dataMax = spec.yMax ?? Math.max(...totals, 0);
  const { max: niceMax, step } = niceScale(dataMax);

  const band = PLOT.w / labels.length;
  const barW = Math.min(band * 0.6, 92);
  const centers = labels.map((_, i) => PLOT.x + band * (i + 0.5));

  let bars = "";
  labels.forEach((_, i) => {
    const cx = centers[i];
    let cursor = 0; // running total from the bottom
    series.forEach((s, si) => {
      const v = s.data[i] || 0;
      if (v <= 0) return;
      const y0 = PLOT.y + PLOT.h * (1 - cursor / niceMax);
      const y1 = PLOT.y + PLOT.h * (1 - (cursor + v) / niceMax);
      cursor += v;
      const top = cursor >= totals[i] - 1e-9; // topmost visible segment rounds
      const x = cx - barW / 2;
      const h = y0 - y1;
      const fill = seriesVar(si);
      bars += top
        ? `<path class="chart__bar" d="${roundedTopRect(x, y1, barW, h, 4)}" style="fill:${fill}"><title>${esc(s.name)}: ${esc(fmtValue(v, unit))}</title></path>`
        : `<rect class="chart__bar" x="${r2(x)}" y="${r2(y1)}" width="${r2(barW)}" height="${r2(h)}" style="fill:${fill}"><title>${esc(s.name)}: ${esc(fmtValue(v, unit))}</title></rect>`;
    });
  });

  const svg = frame(
    yAxis(niceMax, step, unit) +
      `<line class="chart__axis" x1="${PLOT.x}" y1="${r2(PLOT.y + PLOT.h)}" x2="${r2(PLOT.x + PLOT.w)}" y2="${r2(PLOT.y + PLOT.h)}"/>` +
      bars +
      xLabels(labels, centers),
    spec,
  );

  const legend =
    series.length > 1
      ? legendHtml(
          series.map((s, i) => ({ label: s.name, color: seriesVar(i) })),
        )
      : "";
  return { svg, legend };
}

// Horizontal stacked bars: categories down the side, values along the bottom.
// Height grows with the number of categories so each row keeps an even weight.
function renderHorizontalBar(spec) {
  const labels = (spec.x ?? []).map(String);
  if (labels.length === 0)
    throw new ChartError("a bar chart needs an `x` list of categories");
  const series = asSeries(spec);
  const unit = spec.unit ?? "";

  const totals = labels.map((_, i) =>
    series.reduce((sum, s) => sum + (s.data[i] || 0), 0),
  );
  const dataMax = spec.xMax ?? spec.yMax ?? Math.max(...totals, 0);
  const { max: niceMax, step } = niceScale(dataMax);

  const pad = { top: 16, right: 20, bottom: 38, left: 108 };
  const bandH = 52;
  const plotW = W - pad.left - pad.right;
  const plotH = labels.length * bandH;
  const height = pad.top + plotH + pad.bottom;
  const barThk = Math.min(bandH * 0.56, 38);

  const xAt = (v) => pad.left + plotW * (v / niceMax);
  const centerY = (i) => pad.top + bandH * (i + 0.5);

  // Vertical gridlines + value ticks along the bottom.
  let grid = "";
  for (let v = 0; v <= niceMax + 1e-9; v += step) {
    const x = r2(xAt(v));
    grid +=
      `<line class="chart__grid" x1="${x}" y1="${pad.top}" x2="${x}" y2="${r2(pad.top + plotH)}"/>` +
      `<text class="chart__tick" x="${x}" y="${pad.top + plotH + 18}" text-anchor="middle">${esc(fmtValue(v, unit))}</text>`;
  }

  let bars = "";
  let catLabels = "";
  labels.forEach((label, i) => {
    const y = centerY(i) - barThk / 2;
    let cursor = 0;
    series.forEach((s, si) => {
      const v = s.data[i] || 0;
      if (v <= 0) return;
      const x0 = xAt(cursor);
      const x1 = xAt(cursor + v);
      cursor += v;
      const isLast = cursor >= totals[i] - 1e-9;
      const w = x1 - x0;
      const fill = seriesVar(si);
      bars += isLast
        ? `<path class="chart__bar" d="${roundedRightRect(x0, y, w, barThk, 4)}" style="fill:${fill}"><title>${esc(s.name)}: ${esc(fmtValue(v, unit))}</title></path>`
        : `<rect class="chart__bar" x="${r2(x0)}" y="${r2(y)}" width="${r2(w)}" height="${r2(barThk)}" style="fill:${fill}"><title>${esc(s.name)}: ${esc(fmtValue(v, unit))}</title></rect>`;
    });
    catLabels += `<text class="chart__tick" x="${pad.left - 12}" y="${r2(centerY(i))}" text-anchor="end" dominant-baseline="middle">${esc(label)}</text>`;
  });

  const svg =
    `<svg class="chart__svg" viewBox="0 0 ${W} ${r2(height)}" role="img"` +
    `${ariaLabel(spec)} preserveAspectRatio="xMidYMid meet">` +
    grid +
    `<line class="chart__axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${r2(pad.top + plotH)}"/>` +
    bars +
    catLabels +
    `</svg>`;

  const legend =
    series.length > 1
      ? legendHtml(
          series.map((s, i) => ({ label: s.name, color: seriesVar(i) })),
        )
      : "";
  return { svg, legend };
}

// Grouped (clustered) bars: within each category the series sit side by side,
// touching, so categories compare value-by-value rather than as a sum. Unlike
// the stacked bar, the axis is scaled to the largest single value, not totals.
function renderGroupedBar(spec) {
  if (String(spec.orientation ?? "").trim() === "horizontal") {
    return renderGroupedBarH(spec);
  }
  const labels = (spec.x ?? []).map(String);
  if (labels.length === 0)
    throw new ChartError("a bar chart needs an `x` list of categories");
  const series = asSeries(spec);
  const unit = spec.unit ?? "";
  const n = series.length;

  const dataMax =
    spec.yMax ??
    Math.max(0, ...series.flatMap((s) => s.data.map((v) => v || 0)));
  const { max: niceMax, step } = niceScale(dataMax);

  const band = PLOT.w / labels.length;
  const groupW = Math.min(band * 0.72, 110 * n);
  const barW = groupW / n; // bars within a group are flush (collées)
  const centers = labels.map((_, i) => PLOT.x + band * (i + 0.5));
  const yAt = (v) => PLOT.y + PLOT.h * (1 - v / niceMax);

  let bars = "";
  labels.forEach((_, i) => {
    const groupStart = centers[i] - groupW / 2;
    series.forEach((s, si) => {
      const v = s.data[i] || 0;
      if (v <= 0) return;
      const x = groupStart + si * barW;
      const y1 = yAt(v);
      const h = PLOT.y + PLOT.h - y1;
      bars += `<path class="chart__bar" d="${roundedTopRect(x, y1, barW, h, Math.min(3, barW / 4))}" style="fill:${seriesVar(si)}"><title>${esc(s.name)}: ${esc(fmtValue(v, unit))}</title></path>`;
    });
  });

  const svg = frame(
    yAxis(niceMax, step, unit) +
      `<line class="chart__axis" x1="${PLOT.x}" y1="${r2(PLOT.y + PLOT.h)}" x2="${r2(PLOT.x + PLOT.w)}" y2="${r2(PLOT.y + PLOT.h)}"/>` +
      bars +
      xLabels(labels, centers),
    spec,
  );

  const legend =
    n > 1
      ? legendHtml(
          series.map((s, i) => ({ label: s.name, color: seriesVar(i) })),
        )
      : "";
  return { svg, legend };
}

// Horizontal grouped bars. Row height grows with the series count so the
// flush bars in each category stay legible.
function renderGroupedBarH(spec) {
  const labels = (spec.x ?? []).map(String);
  if (labels.length === 0)
    throw new ChartError("a bar chart needs an `x` list of categories");
  const series = asSeries(spec);
  const unit = spec.unit ?? "";
  const n = series.length;

  const dataMax =
    spec.xMax ??
    spec.yMax ??
    Math.max(0, ...series.flatMap((s) => s.data.map((v) => v || 0)));
  const { max: niceMax, step } = niceScale(dataMax);

  const pad = { top: 16, right: 20, bottom: 38, left: 108 };
  const bandH = Math.max(52, n * 16 + 22);
  const groupH = bandH * 0.74;
  const barThk = groupH / n;
  const plotW = W - pad.left - pad.right;
  const plotH = labels.length * bandH;
  const height = pad.top + plotH + pad.bottom;

  const xAt = (v) => pad.left + plotW * (v / niceMax);
  const centerY = (i) => pad.top + bandH * (i + 0.5);

  let grid = "";
  for (let v = 0; v <= niceMax + 1e-9; v += step) {
    const x = r2(xAt(v));
    grid +=
      `<line class="chart__grid" x1="${x}" y1="${pad.top}" x2="${x}" y2="${r2(pad.top + plotH)}"/>` +
      `<text class="chart__tick" x="${x}" y="${pad.top + plotH + 18}" text-anchor="middle">${esc(fmtValue(v, unit))}</text>`;
  }

  let bars = "";
  let catLabels = "";
  labels.forEach((label, i) => {
    const groupTop = centerY(i) - groupH / 2;
    series.forEach((s, si) => {
      const v = s.data[i] || 0;
      if (v <= 0) return;
      const y = groupTop + si * barThk;
      const w = xAt(v) - pad.left;
      bars += `<path class="chart__bar" d="${roundedRightRect(pad.left, y, w, barThk, Math.min(3, barThk / 4))}" style="fill:${seriesVar(si)}"><title>${esc(s.name)}: ${esc(fmtValue(v, unit))}</title></path>`;
    });
    catLabels += `<text class="chart__tick" x="${pad.left - 12}" y="${r2(centerY(i))}" text-anchor="end" dominant-baseline="middle">${esc(label)}</text>`;
  });

  const svg =
    `<svg class="chart__svg" viewBox="0 0 ${W} ${r2(height)}" role="img"` +
    `${ariaLabel(spec)} preserveAspectRatio="xMidYMid meet">` +
    grid +
    `<line class="chart__axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${r2(pad.top + plotH)}"/>` +
    bars +
    catLabels +
    `</svg>`;

  const legend =
    n > 1
      ? legendHtml(
          series.map((s, i) => ({ label: s.name, color: seriesVar(i) })),
        )
      : "";
  return { svg, legend };
}

function renderLine(spec, { area }) {
  const labels = (spec.x ?? []).map(String);
  if (labels.length === 0)
    throw new ChartError("a line chart needs an `x` list");
  const series = asSeries(spec);
  const unit = spec.unit ?? "";

  const allValues = series.flatMap((s) => s.data);
  const dataMax = spec.yMax ?? Math.max(...allValues, 0);
  const { max: niceMax, step } = niceScale(dataMax);

  const n = labels.length;
  // Points sit at band centres so single-column posts read cleanly.
  const xAt = (i) => PLOT.x + (n === 1 ? PLOT.w / 2 : (PLOT.w * i) / (n - 1));
  const yAt = (v) => PLOT.y + PLOT.h * (1 - v / niceMax);

  let paths = "";
  series.forEach((s, si) => {
    const pts = s.data.map((v, i) => `${r2(xAt(i))} ${r2(yAt(v))}`);
    const color = seriesVar(si);
    if (area) {
      const d =
        `M${r2(xAt(0))} ${r2(PLOT.y + PLOT.h)} L` +
        pts.join(" L ") +
        ` L${r2(xAt(n - 1))} ${r2(PLOT.y + PLOT.h)} Z`;
      paths += `<path class="chart__area" d="${d}" style="fill:${color}"/>`;
    }
    paths += `<polyline class="chart__line" points="${pts.join(" ")}" style="stroke:${color}"/>`;
    paths += s.data
      .map(
        (v, i) =>
          `<circle class="chart__dot" cx="${r2(xAt(i))}" cy="${r2(yAt(v))}" r="3.5" style="fill:${color}"><title>${esc(s.name)} · ${esc(labels[i])}: ${esc(fmtValue(v, unit))}</title></circle>`,
      )
      .join("");
  });

  const centers = labels.map((_, i) => xAt(i));
  const svg = frame(
    yAxis(niceMax, step, unit) +
      `<line class="chart__axis" x1="${PLOT.x}" y1="${r2(PLOT.y + PLOT.h)}" x2="${r2(PLOT.x + PLOT.w)}" y2="${r2(PLOT.y + PLOT.h)}"/>` +
      paths +
      xLabels(labels, centers),
    spec,
  );

  const legend =
    series.length > 1
      ? legendHtml(
          series.map((s, i) => ({ label: s.name, color: seriesVar(i) })),
        )
      : "";
  return { svg, legend };
}

function renderDonut(spec) {
  const raw = spec.data ?? spec.slices;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ChartError("a donut needs a `data` list of { name, value }");
  }
  const slices = raw.map((d, i) => ({
    name: d.name ?? `Slice ${i + 1}`,
    value: Number(d.value),
  }));
  const total = slices.reduce((s, d) => s + (d.value || 0), 0);
  if (total <= 0) throw new ChartError("donut values sum to zero");
  const unit = spec.unit ?? "";

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 130;
  const rInner = 78;

  let arcs = "";
  if (slices.length === 1) {
    // A single 100% slice: a full ring (two-circle mask, no arc seam).
    arcs =
      `<circle cx="${cx}" cy="${cy}" r="${rOuter}" style="fill:${seriesVar(0)}"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${rInner}" class="chart__donut-hole"/>`;
  } else {
    let a = -Math.PI / 2; // start at top
    slices.forEach((d, i) => {
      const frac = d.value / total;
      const a1 = a + frac * 2 * Math.PI;
      arcs += `<path class="chart__arc" d="${annular(cx, cy, rOuter, rInner, a, a1)}" style="fill:${seriesVar(i)}"><title>${esc(d.name)}: ${esc(fmtValue(d.value, unit))} (${Math.round(frac * 100)}%)</title></path>`;
      a = a1;
    });
  }

  const inner =
    arcs +
    `<text class="chart__donut-total" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle">${esc(fmtValue(total, unit))}</text>`;

  const svg =
    `<svg class="chart__svg chart__svg--donut" viewBox="0 0 ${size} ${size}" role="img"` +
    `${ariaLabel(spec)} preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

  const legend = legendHtml(
    slices.map((d, i) => ({
      label: `${d.name} · ${Math.round((d.value / total) * 100)}%`,
      color: seriesVar(i),
    })),
  );
  return { svg, legend };
}

// Annular sector (donut slice) from angle a0 to a1, sweeping clockwise.
function annular(cx, cy, ro, ri, a0, a1) {
  const p = (r, a) => [r2(cx + r * Math.cos(a)), r2(cy + r * Math.sin(a))];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(ro, a0);
  const [x1, y1] = p(ro, a1);
  const [x2, y2] = p(ri, a1);
  const [x3, y3] = p(ri, a0);
  return (
    `M${x0} ${y0} A${ro} ${ro} 0 ${large} 1 ${x1} ${y1} ` +
    `L${x2} ${y2} A${ri} ${ri} 0 ${large} 0 ${x3} ${y3} Z`
  );
}

function ariaLabel(spec) {
  const label = spec.title || spec.caption || `${spec.type} chart`;
  return ` aria-label="${esc(label)}"`;
}

// Wrap cartesian chart contents in the responsive SVG frame.
function frame(inner, spec) {
  return (
    `<svg class="chart__svg" viewBox="0 0 ${W} ${H}" role="img"` +
    `${ariaLabel(spec)} preserveAspectRatio="xMidYMid meet">${inner}</svg>`
  );
}

/**
 * Render a parsed chart spec to a `<figure class="chart">` string.
 * Throws ChartError on a malformed spec.
 */
export function renderChart(spec) {
  if (!spec || typeof spec !== "object") {
    throw new ChartError("empty or invalid chart definition");
  }
  const type = String(spec.type ?? "").trim();

  let out;
  switch (type) {
    case "stacked-bar":
    case "bar": {
      // `stacked-bar` stacks by default, `bar` groups (clustered, flush bars);
      // either can be flipped with `stacked: true|false` or `grouped: true`.
      const stacked =
        spec.stacked ?? (type === "stacked-bar" && spec.grouped !== true);
      out = stacked ? renderStackedBar(spec) : renderGroupedBar(spec);
      break;
    }
    case "line":
      out = renderLine(spec, { area: false });
      break;
    case "area":
      out = renderLine(spec, { area: true });
      break;
    case "donut":
    case "pie":
      out = renderDonut(spec);
      break;
    default:
      throw new ChartError(
        `unknown chart \`type\`: "${type}" (use bar, stacked-bar, line, area, or donut)`,
      );
  }

  const title = spec.title
    ? `<p class="chart__title">${esc(spec.title)}</p>`
    : "";
  const caption = spec.caption
    ? `<figcaption class="chart__caption">${esc(spec.caption)}</figcaption>`
    : "";

  return (
    `<figure class="chart" role="group"${ariaLabel(spec)}>` +
    title +
    out.svg +
    out.legend +
    caption +
    `</figure>`
  );
}
