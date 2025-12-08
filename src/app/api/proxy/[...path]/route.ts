import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';


async function handleRequest(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const backendUrl = `${API_BASE_URL}/${params.path.join('/')}`;
  const method = req.method;
  const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined;

  const res = await fetch(backendUrl, {
    method,
    headers: {
      cookie: req.headers.get('cookie') ?? '',
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Array.from(req.headers.entries()).filter(([key]) => 
          key.toLowerCase() !== 'host' && 
          key.toLowerCase() !== 'cookie'
        )
      )
    },
    body: body || undefined,
  });

  const data = await res.json();
  const response = NextResponse.json(data, { status: res.status });
  
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