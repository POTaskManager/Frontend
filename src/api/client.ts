import { z } from 'zod';

export async function apiGet<T>(input: string, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(input, { credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return schema.parse(data);
}

export async function apiMutate<T>(input: string, init: RequestInit, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }, credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return schema.parse(data);
}


