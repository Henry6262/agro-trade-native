import sellerService from '@services/sellerService';

export const sellerTimelineService = {
  fetchTimeline: (limit = 20) => sellerService.getMyTimeline(limit),
};
