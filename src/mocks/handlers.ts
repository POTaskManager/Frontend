import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/auth/login', async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.get('/api/auth/session', async () => {
    return HttpResponse.json({ user: { email: 'member@example.com', role: 'member' } });
  }),
  http.get('/api/projects', async () => HttpResponse.json([])),
  http.get('/api/tasks', async () => HttpResponse.json([])),
  http.get('/api/notifications', async () => HttpResponse.json([])),
  http.get('/api/activity', async () => HttpResponse.json([])),
  http.get('/api/users', async () => HttpResponse.json([])),
  http.get('/api/roles', async () => HttpResponse.json([{ id: 'r1', name: 'admin' }]))
];


