export const BACKUP_VERSION = 1;

export interface BackupFile {
  version: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

/** Trigger a client-side file download of `content`. */
export const triggerDownload = (filename: string, content: string, mime = "application/json") => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Pull the transactions array out of a parsed backup file (tolerant of shape). */
export const readBackupTransactions = (parsed: unknown): Record<string, unknown>[] => {
  if (!parsed || typeof parsed !== "object") {
    return [];
  }
  const data = (parsed as { data?: unknown }).data;
  const transactions =
    data && typeof data === "object"
      ? (data as { transactions?: unknown }).transactions
      : (parsed as { transactions?: unknown }).transactions;

  if (!Array.isArray(transactions)) {
    return [];
  }
  return transactions.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
};
