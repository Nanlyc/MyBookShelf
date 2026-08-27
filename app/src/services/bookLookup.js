// ISBN cover/metadata lookup. Priority per doc §5.5:
// 1. Google Books API (free, no key, can backfill title/authors/publisher too)
// 2. Open Library covers URL (free, no key) as fallback

export async function lookupByIsbn(isbn) {
  const clean = (isbn || '').replace(/-/g, '').trim();
  if (!clean) return null;

  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`);
    const data = await res.json();
    const info = data.items?.[0]?.volumeInfo;
    if (info) {
      const thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
      return {
        cover: thumb ? thumb.replace(/^http:/, 'https:').replace('zoom=1', 'zoom=2') : `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`,
        title: info.title || '',
        authors: info.authors?.join(', ') || '',
        publisher: info.publisher || '',
        published_date: info.publishedDate || '',
      };
    }
  } catch {
    // network/API failure — fall through to Open Library fallback below
  }

  return { cover: `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg` };
}
