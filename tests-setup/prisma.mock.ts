type Fn = jest.Mock<any, any>;

const mockUser = {
  findUnique: jest.fn() as Fn,
  create: jest.fn() as Fn,
  update: jest.fn() as Fn,
};

const mockSession = {
  create: jest.fn() as Fn,
  findUnique: jest.fn() as Fn,
  deleteMany: jest.fn() as Fn,
};

jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: { user: mockUser, session: mockSession },
  default: { user: mockUser, session: mockSession },
}));

export const prismaMock = { user: mockUser, session: mockSession };

beforeEach(() => jest.clearAllMocks());
