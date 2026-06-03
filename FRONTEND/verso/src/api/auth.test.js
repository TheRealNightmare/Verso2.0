import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the echo module so apiFetch's socket-id lookup is controllable and we never
// pull in the real laravel-echo / pusher-js singletons.
vi.mock('../lib/echo', () => ({
  getSocketId: vi.fn(() => null),
}));

import { apiFetch, registerUser, loginUser, logoutUser } from './auth';
import { getSocketId } from '../lib/echo';

function mockResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getSocketId.mockReturnValue(null);
    localStorage.clear();
  });

  it('sends Accept + JSON content type and returns parsed data', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ ok: 1 }));
    vi.stubGlobal('fetch', fetchSpy);

    const data = await apiFetch('/ping');
    expect(data).toEqual({ ok: 1 });

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toContain('/ping');
    expect(opts.headers.Accept).toBe('application/json');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.headers.Authorization).toBeUndefined();
    expect(opts.headers['X-Socket-ID']).toBeUndefined();
  });

  it('adds the Authorization header when a token is stored', async () => {
    localStorage.setItem('auth_token', 'tok123');
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal('fetch', fetchSpy);

    await apiFetch('/secure');
    expect(fetchSpy.mock.calls[0][1].headers.Authorization).toBe('Bearer tok123');
  });

  it('adds the X-Socket-ID header when echo provides one', async () => {
    getSocketId.mockReturnValue('sock-9');
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal('fetch', fetchSpy);

    await apiFetch('/secure');
    expect(fetchSpy.mock.calls[0][1].headers['X-Socket-ID']).toBe('sock-9');
  });

  it('omits Content-Type for FormData bodies so the browser sets the boundary', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal('fetch', fetchSpy);

    await apiFetch('/upload', { method: 'POST', body: new FormData() });
    expect(fetchSpy.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
  });

  it('throws { status, ...data } on a non-ok response', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(mockResponse({ message: 'Bad' }, { ok: false, status: 422 }));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(apiFetch('/fail')).rejects.toEqual({ status: 422, message: 'Bad' });
  });

  it('merges caller-supplied headers', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal('fetch', fetchSpy);

    await apiFetch('/x', { headers: { 'X-Custom': 'yes' } });
    expect(fetchSpy.mock.calls[0][1].headers['X-Custom']).toBe('yes');
  });
});

describe('auth endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getSocketId.mockReturnValue(null);
    localStorage.clear();
  });

  it('registerUser POSTs FormData with the expected fields', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ token: 't', user: {} }));
    vi.stubGlobal('fetch', fetchSpy);

    await registerUser({ name: 'Ada', email: 'a@b.c', password: 'pw', bio: 'hi' });

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toContain('/register');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBeInstanceOf(FormData);
    expect(opts.body.get('name')).toBe('Ada');
    expect(opts.body.get('email')).toBe('a@b.c');
    expect(opts.body.get('role')).toBe('user'); // defaulted
    expect(opts.body.get('bio')).toBe('hi');
  });

  it('loginUser POSTs a JSON credential body', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ token: 't' }));
    vi.stubGlobal('fetch', fetchSpy);

    await loginUser({ email: 'a@b.c', password: 'pw' });

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toContain('/login');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.c', password: 'pw' });
  });

  it('logoutUser POSTs to /logout', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal('fetch', fetchSpy);

    await logoutUser();
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toContain('/logout');
    expect(opts.method).toBe('POST');
  });
});
