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

const mockMedication = {
  findMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findFirst: jest.fn() as AsyncMockFn<[unknown], unknown>,
  create: jest.fn() as AsyncMockFn<[unknown], unknown>,
  update: jest.fn() as AsyncMockFn<[unknown], unknown>,
  delete: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

const mockScheduleEntry = {
  findMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findFirst: jest.fn() as AsyncMockFn<[unknown], unknown>,
  createMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  update: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    user: mockUser,
    session: mockSession,
    medication: mockMedication,
    scheduleEntry: mockScheduleEntry,
  },
  default: {
    user: mockUser,
    session: mockSession,
    medication: mockMedication,
    scheduleEntry: mockScheduleEntry,
  },
}));

export const prismaMock = {
  user: mockUser,
  session: mockSession,
  medication: mockMedication,
  scheduleEntry: mockScheduleEntry,
};

beforeEach(() => jest.clearAllMocks());
