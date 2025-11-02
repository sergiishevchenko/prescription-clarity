export const cookieStore = new Map<string, string>();

export const mockCookiesAPI = {
  get: jest.fn((name: string) => {
    const value = cookieStore.get(name);
    return value ? { name, value } : undefined;
  }),
  set: jest.fn((name: string, value: string) => {
    cookieStore.set(name, value);
  }),
  delete: jest.fn((name: string) => {
    cookieStore.delete(name);
  }),
  has: jest.fn((name: string) => cookieStore.has(name)),
};

const mockHeadersAPI = {
  get: jest.fn(() => undefined),
  set: jest.fn(() => {}),
  append: jest.fn(() => {}),
  entries: jest.fn(function* () {
    /* iterator */
  }),
};

jest.mock("next/headers", () => ({
  __esModule: true,
  cookies: jest.fn(() => mockCookiesAPI),
  headers: jest.fn(() => mockHeadersAPI),
}));
