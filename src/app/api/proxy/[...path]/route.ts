import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy uses BACKEND_URL (container network)
const API_BASE_URL = process.env.BACKEND_URL || 'http://backend:4200';


async function handleRequest(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const backendUrl = `${API_BASE_URL}/${params.path.join('/')}`;
  const method = req.method;
  const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined;

  const headersToSend = Object.fromEntries(
    Array.from(req.headers.entries()).filter(([key]) =>
      key.toLowerCase() !== 'host' &&
      key.toLowerCase() !== 'connection' &&
      key.toLowerCase() !== 'content-length'
    )
  );

  // Ensure Content-Type is set if not present
  if (!headersToSend['content-type']) {
    headersToSend['content-type'] = 'application/json';
  }

  console.log('headersToSend', headersToSend)

  const res = await fetch(backendUrl, {
    method,
    headers: headersToSend,
    body: body || undefined,
  });


  // Handle different content types
  const contentType = res.headers.get('content-type') || '';
  let data;
  let response;

  if (contentType.includes('application/json')) {
    data = await res.json();
    response = NextResponse.json(data, { status: res.status });
  } else {
    // For non-JSON responses (like plain text), return as-is
    const text = await res.text();
    response = new NextResponse(text, {
      status: res.status,
      statusText: res.statusText,
      headers: { 'content-type': contentType }
    });
  }

  // Forward Set-Cookie headers from backend (important for cookie-based auth)
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      response.headers.append(key, value);
    }
  });

  return response;
}

export async function GET(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context);
}

export async function POST(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context);
}

export async function PATCH(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context);
}

export async function DELETE(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context);
}

export async function PUT(req: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(req, context);
}
