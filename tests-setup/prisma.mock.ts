type AsyncMockFn<
  Args extends unknown[] = unknown[],
  Return = unknown,
> = jest.Mock<Promise<Return>, Args>;

const mockUser = {
  findUnique: jest.fn() as AsyncMockFn<[unknown], unknown>,
  create: jest.fn() as AsyncMockFn<[unknown], unknown>,
  update: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

const mockSession = {
  create: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findUnique: jest.fn() as AsyncMockFn<[unknown], unknown>,
  deleteMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: { user: mockUser, session: mockSession },
  default: { user: mockUser, session: mockSession },
}));

export const prismaMock = { user: mockUser, session: mockSession };

beforeEach(() => jest.clearAllMocks());
