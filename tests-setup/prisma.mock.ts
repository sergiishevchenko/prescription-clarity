type MockFn = jest.Mock<unknown, unknown[]>;

const mockUser = {
  findUnique: jest.fn() as MockFn,
  create: jest.fn() as MockFn,
  update: jest.fn() as MockFn,
};

const mockSession = {
  create: jest.fn() as MockFn,
  findUnique: jest.fn() as MockFn,
  deleteMany: jest.fn() as MockFn,
};

jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: { user: mockUser, session: mockSession },
  default: { user: mockUser, session: mockSession },
}));

export const prismaMock = { user: mockUser, session: mockSession };

beforeEach(() => jest.clearAllMocks());
