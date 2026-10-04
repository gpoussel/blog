/** Depth-first walk applying `visitor` to every parent node. */
function walk(node, visitor) {
  if (!node || typeof node !== "object" || !Array.isArray(node.children)) {
    return;
  }
  visitor(node);
  for (const child of node.children) walk(child, visitor);
}

/**
 * remark plugin: turn every text directive back into the plain text it came
 * from.
 *
 * remark-directive parses `:name` anywhere in prose, so ordinary text such as
 * "a 1:9 ratio" or "from 17:45" becomes a `textDirective` node. No plugin here
 * handles text directives, and an unhandled one renders as an empty `<div>`
 * that splits the paragraph in two. This restores `:name[label]` as written.
 * Attributes (`{…}`) are rare enough in prose to be dropped.
 * Runs after the plugins that handle `:::` container directives.
 */
export default function remarkDirectiveFallback() {
  return (tree) => {
    walk(tree, (parent) => {
      parent.children = parent.children.flatMap((node) => {
        if (node.type !== "textDirective") return [node];
        const restored = [{ type: "text", value: `:${node.name}` }];
        if (node.children?.length) {
          restored.push({ type: "text", value: "[" }, ...node.children, {
            type: "text",
            value: "]",
          });
        }
        return restored;
      });
    });
  };
}
