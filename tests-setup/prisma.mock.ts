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
  updateMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  delete: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

const mockScheduleEntry = {
  findMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findFirst: jest.fn() as AsyncMockFn<[unknown], unknown>,
  createMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  update: jest.fn() as AsyncMockFn<[unknown], unknown>,
  delete: jest.fn() as AsyncMockFn<[unknown], unknown>,
  deleteMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  count: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

const mockDayStatus = {
  findUnique: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  upsert: jest.fn() as AsyncMockFn<[unknown], unknown>,
  deleteMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

const mockSchedule = {
  findFirst: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  create: jest.fn() as AsyncMockFn<[unknown], unknown>,
  update: jest.fn() as AsyncMockFn<[unknown], unknown>,
  updateMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  delete: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

const mockShareLink = {
  create: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findUnique: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findFirst: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  update: jest.fn() as AsyncMockFn<[unknown], unknown>,
  delete: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

const mockCareAccess = {
  create: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findUnique: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findFirst: jest.fn() as AsyncMockFn<[unknown], unknown>,
  findMany: jest.fn() as AsyncMockFn<[unknown], unknown>,
  delete: jest.fn() as AsyncMockFn<[unknown], unknown>,
};

// Transaction mock - executes callback with the same mock client
const mock$transaction = jest.fn(async (callback: (tx: unknown) => unknown) => {
  // If callback is a function, call it with the mock prisma client
  if (typeof callback === "function") {
    return callback({
      medication: mockMedication,
      schedule: mockSchedule,
      scheduleEntry: mockScheduleEntry,
      dayStatus: mockDayStatus,
      user: mockUser,
      session: mockSession,
      shareLink: mockShareLink,
      careAccess: mockCareAccess,
    });
  }
  // If it's an array of promises, resolve them
  return Promise.all(callback as Promise<unknown>[]);
}) as AsyncMockFn<[unknown], unknown>;

jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    user: mockUser,
    session: mockSession,
    medication: mockMedication,
    scheduleEntry: mockScheduleEntry,
    schedule: mockSchedule,
    dayStatus: mockDayStatus,
    shareLink: mockShareLink,
    careAccess: mockCareAccess,
    $transaction: mock$transaction,
  },
  default: {
    user: mockUser,
    session: mockSession,
    medication: mockMedication,
    scheduleEntry: mockScheduleEntry,
    schedule: mockSchedule,
    dayStatus: mockDayStatus,
    shareLink: mockShareLink,
    careAccess: mockCareAccess,
    $transaction: mock$transaction,
  },
}));

export const prismaMock = {
  user: mockUser,
  session: mockSession,
  medication: mockMedication,
  scheduleEntry: mockScheduleEntry,
  schedule: mockSchedule,
  dayStatus: mockDayStatus,
  shareLink: mockShareLink,
  careAccess: mockCareAccess,
  $transaction: mock$transaction,
};

beforeEach(() => jest.clearAllMocks());
