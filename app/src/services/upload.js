const WORKER_URL = import.meta.env.VITE_UPLOAD_WORKER_URL;
const UPLOAD_TOKEN = import.meta.env.VITE_UPLOAD_TOKEN;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB, must match worker/src/index.js

export function validateCoverFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return '僅支援 JPG / PNG / WebP / GIF 圖片';
  if (file.size > MAX_BYTES) return '檔案過大（上限 5MB）';
  return null;
}

// Uploads directly to the Cloudflare Worker proxy (see /worker) — R2 credentials
// never touch the frontend. Returns the public cover URL.
export async function uploadCover(file) {
  if (!WORKER_URL) throw new Error('尚未設定 VITE_UPLOAD_WORKER_URL');

  const error = validateCoverFile(file);
  if (error) throw new Error(error);

  const res = await fetch(`${WORKER_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPLOAD_TOKEN}`,
      'Content-Type': file.type,
    },
    body: file,
  });
  if (!res.ok) throw new Error(`上傳失敗（${res.status}）`);
  const data = await res.json();
  return data.url;
}
