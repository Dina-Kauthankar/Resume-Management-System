export function cleanExtractedText(
  text: string
): string {
  if (!text) {
    return "";
  }

  // ----------------------------------------------------------
  // 1. Strip LaTeX commands & formatting tags
  // ----------------------------------------------------------

  // Commands with brackets:
  // \textbf{text} -> text
  // \textit{text} -> text
  // \emph{text} -> text
  // etc.
  text = text.replace(
    /\\(?:textbf|textit|emph|underline|section|subsection|subsubsection|caption|title|author|href)\{([^}]*)\}/g,
    "$1"
  );

  // Simple LaTeX commands:
  // \item
  // \newline
  // \noindent
  text = text.replace(
    /\\[a-zA-Z]+/g,
    " "
  );

  // LaTeX comments
  text = text.replace(
    /%.*$/gm,
    ""
  );

  // LaTeX environments:
  // \begin{itemize}
  // \end{itemize}
  text = text.replace(
    /\\(?:begin|end)\{[^}]*\}/g,
    " "
  );

  // ----------------------------------------------------------
  // 2. Normalize Unicode
  // ----------------------------------------------------------

  text = text.normalize("NFC");

  text = text
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ");

  // ----------------------------------------------------------
  // 3. Replace common ligatures and symbols
  // ----------------------------------------------------------

  text = text
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/–/g, "-")
    .replace(/—/g, "-");

  // ----------------------------------------------------------
  // 4. Remove unprintable control characters
  // ----------------------------------------------------------

  text = text.replace(
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,
    ""
  );

  // ----------------------------------------------------------
  // 5. Collapse excessive whitespace
  // ----------------------------------------------------------

  const lines = text
    .split(/\r?\n/)
    .map((line) =>
      line.replace(/\s+/g, " ").trim()
    )
    .filter((line) => line.length > 0);

  return lines.join("\n");
}
