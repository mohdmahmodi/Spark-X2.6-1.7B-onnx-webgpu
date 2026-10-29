// Benchmarks page: key numbers, XHToken's comparison with other models, this build against the original,
// validation table and speed charts. The numbers live in data.js with their sources.
import { columnChart, lineChart } from "./charts.js";
import { decorateCode, icon } from "./code.js";
import { ACCURACY, ALL_BENCHMARKS, DECODE, FIGURES, FIRST_TOKEN, MODEL_COLORS, MODEL_PARAMS, MODELS, QUALITY, REFERENCE, SIZES, SUMMARY,
  SYSTEMS } from "./data.js";

const $ = (id) => document.getElementById(id);
const el = (tag, className, text) => Object.assign(document.createElement(tag), className ? { className } : {}, text != null ? { textContent: text } : {});
const formatTokens = (n) => n.toLocaleString("en-US");
const formatSeconds = (s) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(1)} s`);
// the model-card images are rendered on a light background (tools/shots.mjs passes ?theme=light)
if (new URLSearchParams(location.search).get("theme") === "light") document.body.classList.add("light");

const legend = (items) => items.map(([name, color]) => `<span><i style="background: ${color}"></i>${name}</span>`).join("");

// smallest round axis maximum above the data, with four or five ticks
function niceAxis(max) {
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => max / s <= 4.2) ?? 100;
  const top = Math.ceil((max * 1.08) / step) * step;
  return { yMax: top, ticks: Array.from({ length: top / step + 1 }, (_, i) => i * step) };
}

// ------------------------------------------------------------------ static content

for (const node of document.querySelectorAll("[data-figures]")) {
  node.innerHTML = FIGURES.map(([label, value, unit, note]) =>
    `<div><div class="label">${label}</div><div class="value">${value}<small>${unit}</small></div><div class="note">${note}</div></div>`).join("");
}

const multiples = QUALITY.map((bench) => {
  const cell = el("div");
  cell.append(el("h3", null, bench.name), el("p", "task", bench.task), el("div", "chart"));
  $("quality-grid").append(cell);
  return { bench, chart: cell.querySelector(".chart") };
});
$("quality-legend").innerHTML = legend(MODELS.map((m, i) => [i === REFERENCE ? `${m} (reference)` : m, MODEL_COLORS[i]]));

{
  const split = (name) => name.replace("-", "<br />"); // "Spark-X2.6-4B" -> "Spark / X2.6-4B", as in XHToken's table
  const column = (i) => (i === 0 ? "ours" : i === REFERENCE ? "ref" : "");
  const cell = (tag, i, content) => `<${tag}${column(i) ? ` class="${column(i)}"` : ""}>${content}</${tag}>`;
  const head = `<thead><tr><th>Benchmark</th>${MODELS.map((m, i) => cell("th", i, split(m))).join("")}</tr></thead>`;
  const params = `<tr class="params"><td>Total parameters</td>${MODEL_PARAMS.map((p, i) => cell("td", i, p)).join("")}</tr>`;
  const body = ALL_BENCHMARKS.map(([group, rows]) => {
    const groupRow = group === "Average" ? "" : `<tr class="group"><td>${group}</td>${MODELS.map((_, i) => cell("td", i, "")).join("")}</tr>`;
    return groupRow + rows.map(([name, ...cells]) => {
      // the best of the other models; the reference column does not compete
      const best = Math.max(...cells.map((c, i) => (c && i !== REFERENCE ? parseFloat(c) : -Infinity)));
      const tds = cells.map((c, i) => {
        const cls = [column(i), i > 0 && i !== REFERENCE && c && parseFloat(c) === best ? "best" : ""].filter(Boolean).join(" ");
        return `<td${cls ? ` class="${cls}"` : ""}>${c ?? "–"}</td>`;
      }).join("");
      return `<tr${group === "Average" ? ' class="average"' : ""}><td>${name}</td>${tds}</tr>`;
    }).join("");
  }).join("");
  $("quality-table").innerHTML = `${head}<tbody>${params}${body}</tbody>`;
}

// bf16 reference, official INT4 weights, this build
const PARITY_COLORS = { bf16: "#2959d3", int4: "#bedcf7", web: "#f87d19" };
$("acc-legend").innerHTML = legend(SYSTEMS.map((s) => [s.name, PARITY_COLORS[s.key]]));

$("summary-table").innerHTML = "<thead><tr><th>Check</th><th>bf16</th><th>INT4</th><th>This build</th><th></th></tr></thead><tbody>" +
  SUMMARY.map(([check, bf16, int4, ours]) => `<tr><td>${check}</td><td>${bf16}</td><td>${int4}</td><td><strong>${ours}</strong></td>` +
    `<td><span class="pass">${icon("check")}Pass</span></td></tr>`).join("") + "</tbody>";

decorateCode(document);

// ------------------------------------------------------------------ charts (redrawn on resize)

function draw() {
  for (const { bench, chart } of multiples) {
    // a null score was not reported: an empty slot with a dash
    columnChart(chart, [{ bars: bench.scores.map((v, i) => ({ value: v ?? 0, color: MODEL_COLORS[i], strong: i === 0, text: v == null ? "–" : v.toFixed(1),
      tip: `${MODELS[i]}: ${v == null ? "not reported" : v.toFixed(1)}` })) }], { ...niceAxis(Math.max(...bench.scores)), height: 230, gap: 2, labelSize: 10 });
  }

  columnChart($("acc-chart"), ACCURACY.map((bench) => ({
    label: bench.name,
    sublabel: bench.detail,
    bars: SYSTEMS.map((s) => {
      const pct = (100 * bench[s.key]) / bench.n;
      return { value: pct, color: PARITY_COLORS[s.key], strong: s.ours, text: bench.count ? `${bench[s.key]}/${bench.n}` : `${pct.toFixed(1)}%`,
        tip: `${s.name}: ${bench[s.key]} of ${bench.n}` };
    }),
  })), { yMax: 100, ticks: [0, 25, 50, 75, 100], tickLabel: (v) => `${v}%` });

  // this build next to the 4B build, same page, GPU and measurement
  const sizeColors = ["#f87d19", "var(--ref-bar)"];
  columnChart($("history-chart"), SIZES.map((s) => ({
    label: s.label,
    sublabel: s.detail,
    bars: s.values.map((v, i) => ({ value: v, color: sizeColors[i], strong: i === 0, text: `${v.toFixed(0)}`,
      tip: `${["Spark-X2.6-1.7B", "Spark-X2.6-4B"][i]}: ${v.toFixed(1)} tok/s` })),
  })), { ...niceAxis(Math.max(...SIZES.flatMap((s) => s.values))), height: 340 });
  $("history-legend").innerHTML = legend([["Spark-X2.6-1.7B, this build", sizeColors[0]], ["Spark-X2.6-4B build", sizeColors[1]]]);

  lineChart($("tps-chart"), DECODE, { ...niceAxis(Math.max(...DECODE.map(([, v]) => v))), pointLabel: (v) => `${v.toFixed(0)} tok/s`,
    tip: (a, b) => `${formatTokens(a)} tokens of context: ${b.toFixed(1)} tok/s` });
  lineChart($("ttft-chart"), FIRST_TOKEN, { ...niceAxis(Math.max(...FIRST_TOKEN.map(([, v]) => v))), pointLabel: formatSeconds, firstLabelLift: 12,
    tip: (a, b) => `${formatTokens(a)}-token prompt: ${formatSeconds(b)}` });
}

// ------------------------------------------------------------------ screenshot mode and layout

const params = new URLSearchParams(location.search);
if (params.has("shot")) {
  document.body.classList.add("shot");
  for (const id of params.get("shot").split(",")) {
    const node = $(id);
    node?.classList.add("shoot");
    // keep the ancestors visible so the element can be screenshotted on its own
    for (let p = node?.parentElement; p && p !== document.body; p = p.parentElement) p.classList.add("shoot-path");
  }
}

let lastWidth = 0;
new ResizeObserver(() => {
  const w = document.querySelector(".page").clientWidth;
  if (w !== lastWidth) {
    lastWidth = w;
    draw();
  }
}).observe(document.querySelector(".page"));
document.fonts.ready.then(() => {
  draw();
  document.body.dataset.ready = "1";
});
