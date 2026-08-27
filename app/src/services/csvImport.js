import Papa from 'papaparse';

// Common Notion export column names → our field names
const AUTO_MAP = {
  '書名': 'title', 'title': 'title', 'Title': 'title', '名稱': 'title',
  '作者': 'authors', 'authors': 'authors', 'Author': 'authors', 'Authors': 'authors',
  '出版社': 'publisher', 'publisher': 'publisher', 'Publisher': 'publisher',
  '來源': 'source', 'source': 'source', 'Source': 'source',
  '狀態': 'status', 'status': 'status', 'Status': 'status',
  '標籤': 'tags', 'tags': 'tags', 'Tags': 'tags', 'Tag': 'tags',
  'ISBN': 'isbn', 'isbn': 'isbn',
  '出版日期': 'published_date', 'published_date': 'published_date',
  '封面': 'cover', 'cover': 'cover', 'Cover': 'cover',
  '評分': 'rating', 'rating': 'rating', 'Rating': 'rating',
  '心得': 'notes', 'notes': 'notes', 'Notes': 'notes', '筆記': 'notes',
  '加入日期': 'dateAdded', 'dateAdded': 'dateAdded',
  '完成日期': 'dateFinished', 'dateFinished': 'dateFinished',
  '系列': 'series_name', 'series_name': 'series_name',
  '集數': 'series_order', 'series_order': 'series_order',
};

export const OUR_FIELDS = [
  { key: 'title', label: '書名 *' },
  { key: 'authors', label: '作者' },
  { key: 'publisher', label: '出版社' },
  { key: 'source', label: '來源' },
  { key: 'status', label: '狀態' },
  { key: 'tags', label: '標籤' },
  { key: 'isbn', label: 'ISBN' },
  { key: 'published_date', label: '出版日期' },
  { key: 'cover', label: '封面圖網址' },
  { key: 'rating', label: '評分' },
  { key: 'notes', label: '心得筆記' },
  { key: 'dateAdded', label: '加入日期' },
  { key: 'dateFinished', label: '完成日期' },
  { key: 'series_name', label: '系列名稱' },
  { key: 'series_order', label: '集數' },
];

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => resolve(result),
      error: err => reject(err),
    });
  });
}

export function buildAutoMapping(csvHeaders) {
  const mapping = {};
  csvHeaders.forEach(h => {
    if (AUTO_MAP[h]) mapping[h] = AUTO_MAP[h];
    else mapping[h] = '';
  });
  return mapping;
}

export function applyMapping(rows, mapping) {
  return rows.map(row => {
    const book = {
      id: crypto.randomUUID(),
      status: '未讀',
      deleted: '',
      dateAdded: new Date().toISOString().slice(0, 10),
    };
    Object.entries(mapping).forEach(([csvCol, ourField]) => {
      if (!ourField) return;
      let val = row[csvCol] ?? '';
      // normalize ISBN: remove hyphens
      if (ourField === 'isbn') val = val.replace(/-/g, '');
      // normalize rating to number
      if (ourField === 'rating') val = val ? Number(val) || '' : '';
      book[ourField] = val;
    });
    return book;
  });
}

export function mergeBooks(existing, incoming) {
  const key = b => `${b.title?.trim()}|||${b.authors?.trim()}`;
  const existingKeys = new Set(existing.map(key));
  const newBooks = incoming.filter(b => !existingKeys.has(key(b)));
  return { newBooks, skipped: incoming.length - newBooks.length };
}

// Exports using the same Chinese column labels the import auto-mapper recognizes,
// so a round-tripped export re-imports without manual field mapping.
export function exportToCSV(books) {
  const rows = books.map(b => {
    const row = {};
    OUR_FIELDS.forEach(f => {
      row[f.label.replace(' *', '')] = b[f.key] ?? '';
    });
    return row;
  });
  return Papa.unparse(rows);
}

export function downloadCSV(csvString, filename) {
  const blob = new Blob(['﻿' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
