// Cloudflare Worker: proxies cover-image uploads into a private R2 bucket binding
// and returns the public URL. Keeps R2 credentials off the frontend entirely —
// the binding lives only in this Worker's runtime.

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (request.method !== 'POST' || new URL(request.url).pathname !== '/upload') {
      return new Response('Not found', { status: 404, headers });
    }

    const auth = request.headers.get('Authorization') || '';
    if (auth !== `Bearer ${env.UPLOAD_TOKEN}`) {
      return new Response('Unauthorized', { status: 401, headers });
    }

    const contentType = request.headers.get('Content-Type') || '';
    if (!ALLOWED_TYPES.includes(contentType)) {
      return new Response('Unsupported file type', { status: 415, headers });
    }

    const body = await request.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_BYTES) {
      return new Response('File empty or too large (max 5MB)', { status: 413, headers });
    }

    const ext = EXT_BY_TYPE[contentType];
    const key = `${crypto.randomUUID()}.${ext}`;

    await env.COVERS.put(key, body, { httpMetadata: { contentType } });

    const url = `${env.PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
