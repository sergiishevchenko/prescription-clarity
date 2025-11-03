const mock = {
  hash: jest.fn(async () => "mocked-hash"),
  compare: jest.fn(async () => true),
};

jest.mock("bcryptjs", () => ({
  __esModule: true,
  ...mock,
  default: mock,
}));
