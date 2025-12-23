export function normalizeAIResponse(content: any): string {
  if (!content) return "";

  if (typeof content === "string") {
    return content;
  }

  // LangChain array blocks
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === "string") return c;
        if (c?.text) return c.text;
        return "";
      })
      .join("\n");
  }

  // Object fallback
  if (typeof content === "object") {
    if ("text" in content) return content.text;
    if ("content" in content) return String(content.content);
  }

  return String(content);
}
