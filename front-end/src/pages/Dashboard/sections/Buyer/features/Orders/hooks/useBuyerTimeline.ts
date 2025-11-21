import { useCallback, useEffect, useState } from 'react';
import { buyerOrdersService } from '../service';
import type { BuyerTimelineEvent, BuyerTimelineHookResult } from '../types';

export const useBuyerTimeline = (limit = 10): BuyerTimelineHookResult => {
  const [events, setEvents] = useState<BuyerTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTimeline = useCallback(async () => {
    try {
      const payload = await buyerOrdersService.fetchTimeline(limit);
      setEvents(payload.events ?? []);
    } catch (error) {
      console.error('Failed to load buyer timeline', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadTimeline();
  }, [loadTimeline]);

  return {
    events,
    isLoading,
    refresh,
  };
};
