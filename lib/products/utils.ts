import type { AxiosError } from "axios";

export function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (typeof v === "string" && !v.trim()) continue;
    out[k as keyof T] = v as T[keyof T];
  }
  return out;
}

export function getAxiosErrorMessage(error: unknown): string | null {
  const err = error as AxiosError | null;
  if (!err || typeof err !== "object") return null;

  const data = (err as AxiosError).response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return null;
}

export function parseContentDispositionFilename(value: string | null): string | null {
  if (!value) return null;

  // Supports: filename="foo.xlsx" and filename*=UTF-8''foo.xlsx
  const filenameStar = /filename\*=UTF-8''([^;\n]+)/i.exec(value);
  if (filenameStar?.[1]) {
    try {
      return decodeURIComponent(filenameStar[1].trim());
    } catch {
      return filenameStar[1].trim();
    }
  }

  const filename = /filename="?([^";\n]+)"?/i.exec(value);
  if (filename?.[1]) return filename[1].trim();
  return null;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
