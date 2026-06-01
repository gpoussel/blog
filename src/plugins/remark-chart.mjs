import { parse as parseYaml } from "yaml";
import { renderChart, ChartError } from "./charts/render.mjs";

// remark plugin: turn a `:::chart` container directive holding a single YAML
// (or JSON) code block into a static, theme-aware SVG figure.
//
//   :::chart
//   ```yaml
//   type: stacked-bar
//   title: Energy mix by year
//   unit: "%"
//   x: [2019, 2022, 2025]
//   series:
//     - name: Renewables
//       data: [22, 31, 44]
//     - name: Fossil
//       data: [78, 69, 56]
//   ```
//   :::
//
// The rendering itself lives in ./charts/render.mjs (deterministic, no runtime
// JS), so a chart re-themes with the page and stays on-brand. Runs after
// remark-directive, which parses the `:::` syntax. Authoring is documented for
// writers in the `blog-writing` skill.

/** Depth-first walk applying `visitor` to every node. */
function walk(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, visitor);
  }
}

/** First `code` node anywhere under `node` (the chart's data block). */
function firstCode(node) {
  if (!node || typeof node !== "object") return null;
  if (node.type === "code") return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = firstCode(child);
      if (found) return found;
    }
  }
  return null;
}

// Replace the directive node in place with a raw-HTML node carrying the figure.
function emitHtml(node, value) {
  node.type = "html";
  node.value = value;
  delete node.children;
  delete node.data;
}

export default function remarkChart() {
  return (tree, file) => {
    walk(tree, (node) => {
      if (node.type !== "containerDirective" || node.name !== "chart") return;

      const code = firstCode(node);
      if (!code || !code.value.trim()) {
        file.message(
          "Empty :::chart directive (expected a ```yaml data block inside).",
          node,
          "remark-chart:empty",
        );
        emitHtml(
          node,
          chartError("a :::chart needs a ```yaml data block inside"),
        );
        return;
      }

      let spec;
      try {
        spec = parseYaml(code.value);
      } catch (err) {
        file.message(
          `:::chart YAML is invalid: ${err.message}`,
          node,
          "remark-chart:yaml",
        );
        emitHtml(node, chartError(`invalid chart YAML: ${err.message}`));
        return;
      }

      try {
        emitHtml(node, renderChart(spec));
      } catch (err) {
        if (err instanceof ChartError) {
          file.message(`:::chart: ${err.message}`, node, "remark-chart:spec");
          emitHtml(node, chartError(err.message));
          return;
        }
        throw err;
      }
    });
  };
}

// A visible build-time note so a broken chart is obvious in the page, not silent.
function chartError(message) {
  const esc = String(message)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<figure class="chart chart--error" role="group" aria-label="Chart error"><p class="chart__error">Chart error: ${esc}</p></figure>`;
}
