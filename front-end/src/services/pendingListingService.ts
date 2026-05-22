const PendingListingService = {
  getAll: async () => [],
  getById: async (id: string) => null,
  create: async (data: any) => data,
  update: async (id: string, data: any) => data,
  delete: async (id: string) => true,
  processPendingListing: async () => ({ success: true }),
};

export default PendingListingService;
