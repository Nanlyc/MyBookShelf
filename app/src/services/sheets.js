import { getToken, refreshToken } from './auth';

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const SHEET_NAME = 'Sheet1';
const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

// Column order must match the Google Sheet header row exactly
const COLUMNS = [
  'id', 'title', 'authors', 'publisher', 'source', 'status',
  'tags', 'isbn', 'published_date', 'cover', 'rating', 'notes',
  'dateAdded', 'dateFinished', 'series_name', 'series_order', 'deleted', 'updatedAt',
];

// A–R (18 columns)
const DELETED_COL = 'Q';
const UPDATED_AT_COL = 'R';
const LAST_COL = UPDATED_AT_COL;

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

function rowToBook(row, rowIndex) {
  const book = { _row: rowIndex };
  COLUMNS.forEach((col, i) => {
    book[col] = row[i] ?? '';
  });
  if (book.rating !== '') book.rating = Number(book.rating);
  else book.rating = null;
  return book;
}

function bookToRow(book) {
  return COLUMNS.map(col => {
    if (col === 'rating') return book.rating ?? '';
    return book[col] ?? '';
  });
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) {
    await refreshToken();
    return apiFetch(url, options); // retry once after refresh
  }
  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);
  return res.json();
}

export async function loadBooks() {
  const data = await apiFetch(
    `${BASE}/values/${SHEET_NAME}?majorDimension=ROWS`
  );
  const rows = data.values ?? [];
  // row 0 is headers, data starts at row 1 (sheet row 2)
  return rows.slice(1).map((row, i) => rowToBook(row, i + 2));
}

export async function appendBook(book) {
  const row = bookToRow({ ...book, updatedAt: new Date().toISOString() });
  await apiFetch(
    `${BASE}/values/${SHEET_NAME}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: [row] }) }
  );
}

// Optimistic concurrency: compare the row's current updatedAt against the value
// the client last loaded. A mismatch means another device wrote to this row since —
// bail out instead of silently clobbering it (doc §7.1).
export async function updateBook(book) {
  const current = await apiFetch(`${BASE}/values/${SHEET_NAME}!${UPDATED_AT_COL}${book._row}`);
  const remoteUpdatedAt = current.values?.[0]?.[0] ?? '';
  if (book.updatedAt && remoteUpdatedAt && remoteUpdatedAt !== book.updatedAt) {
    throw new ConflictError('此書籍已在其他裝置被更新');
  }
  const updatedAt = new Date().toISOString();
  const row = bookToRow({ ...book, updatedAt });
  await apiFetch(
    `${BASE}/values/${SHEET_NAME}!A${book._row}:${LAST_COL}${book._row}?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: [row] }) }
  );
  return updatedAt;
}

// Soft delete: only update the `deleted` + `updatedAt` columns (Q:R, adjacent)
export async function softDeleteBook(book) {
  const updatedAt = new Date().toISOString();
  await apiFetch(
    `${BASE}/values/${SHEET_NAME}!${DELETED_COL}${book._row}:${UPDATED_AT_COL}${book._row}?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: [['true', updatedAt]] }) }
  );
  return updatedAt;
}

export async function batchAppendBooks(books) {
  if (books.length === 0) return;
  const now = new Date().toISOString();
  const rows = books.map(b => bookToRow({ ...b, updatedAt: now }));
  await apiFetch(
    `${BASE}/values/${SHEET_NAME}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: rows }) }
  );
}

export async function replaceAllBooks(books) {
  // Clear all data rows first
  await apiFetch(
    `${BASE}/values/${SHEET_NAME}!A2:${LAST_COL}:clear`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  if (books.length === 0) return;
  const now = new Date().toISOString();
  const rows = books.map(b => bookToRow({ ...b, updatedAt: now }));
  await apiFetch(
    `${BASE}/values/${SHEET_NAME}!A2:${LAST_COL}${books.length + 1}?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: rows }) }
  );
}

// Idempotent — always rewrites the header row to match COLUMNS, so schema
// additions (e.g. a new tracked column) self-heal on next load.
export async function ensureHeaders() {
  await apiFetch(
    `${BASE}/values/${SHEET_NAME}!A1:${LAST_COL}1?valueInputOption=RAW`,
    { method: 'PUT', body: JSON.stringify({ values: [COLUMNS] }) }
  );
}
