const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));

interface PrintReportParams {
  periodLabel: string;
  generatedOn: string;
  metrics: Array<{ label: string; value: string }>;
  categories: Array<{ name: string; value: string }>;
}

/**
 * Opens a clean, self-contained print window for a monthly report. Kept separate
 * from the app chrome so we don't have to hide the nav/buttons for printing.
 * All interpolated values are HTML-escaped (category/merchant names are user data).
 */
export const openPrintReport = (params: PrintReportParams): boolean => {
  const metricRows = params.metrics
    .map((metric) => `<tr><th>${escapeHtml(metric.label)}</th><td>${escapeHtml(metric.value)}</td></tr>`)
    .join("");

  const categoryRows = params.categories.length
    ? params.categories
        .map((category) => `<tr><td>${escapeHtml(category.name)}</td><td class="right">${escapeHtml(category.value)}</td></tr>`)
        .join("")
    : `<tr><td colspan="2">No expense data for this period.</td></tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>BudgetFlow Report</title>
<style>
  body { font-family: system-ui, "Segoe UI", Arial, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 20px 0 8px; }
  .muted { color: #666; font-size: 13px; margin: 0 0 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; text-align: left; }
  td.right, th.right { text-align: right; }
  @media print { body { margin: 0; } }
</style></head><body>
  <h1>BudgetFlow Report</h1>
  <p class="muted">${escapeHtml(params.periodLabel)} &middot; generated ${escapeHtml(params.generatedOn)}</p>
  <h2>Summary</h2>
  <table>${metricRows}</table>
  <h2>Expenses by category</h2>
  <table><thead><tr><th>Category</th><th class="right">Amount</th></tr></thead><tbody>${categoryRows}</tbody></table>
</body></html>`;

  const printWindow = window.open("", "_blank", "width=820,height=1000");
  if (!printWindow) {
    return false;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
};
