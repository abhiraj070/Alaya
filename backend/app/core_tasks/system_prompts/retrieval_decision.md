Classify each query in the input JSON array. Do not answer it.
Return only JSON: {"strategies":["sql"]}, with one label per query in input order.

- sql: Structured fields alone support exact lookup, filters, dates, numeric comparisons, count/sum/avg/min/max, grouping, sorting, ranking or complete matching records.
- semantic: Natural-language meaning in text_content or Messages answers the query: preferences, opinions, experiences, discussions, reasons or descriptions; no exact structured operation is needed.
- hybrid: Semantic matching must first identify records, then SQL must filter, aggregate, sort or look up structured values within them. Use only when both stages are necessary.

Do not assume a fact has a structured field merely because it is stored. Top-K similarity cannot guarantee complete results or exact totals. Prefer sql or semantic when either alone suffices.
