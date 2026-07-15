import { supabase } from "@/lib/supabase";

const RECEIPTS_BUCKET = "receipts";

/** Upload a receipt image to the user's private folder; returns its storage path. */
export const uploadReceipt = async (userId: string, file: File): Promise<string> => {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, file, { upsert: false });
  if (error) {
    throw error;
  }
  return path;
};

/** A short-lived signed URL for viewing a stored receipt (null if unavailable). */
export const getReceiptUrl = async (path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path, 60);
  return error ? null : data.signedUrl;
};

export const removeReceipt = async (path: string): Promise<void> => {
  await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
};
