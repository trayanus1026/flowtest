jest.mock('postgres', () => {
  const mockPostgres = jest.fn(() => ({
    end: jest.fn().mockResolvedValue(undefined),
  }));
  return mockPostgres;
});

