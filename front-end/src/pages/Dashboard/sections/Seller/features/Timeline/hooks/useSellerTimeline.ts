import { useCallback, useEffect, useRef, useState } from 'react';
import { sellerTimelineService } from '../service';
import type { SellerTimelineEvent, SellerTimelineHookResult } from '../types';

export const useSellerTimeline = (limit = 10): SellerTimelineHookResult => {
  const [events, setEvents] = useState<SellerTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  const loadTimeline = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await sellerTimelineService.fetchTimeline(limit);
      setEvents(payload.events ?? []);
    } catch (error) {
      console.error('Failed to load seller timeline', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadTimeline().catch((error) => console.error('Timeline init failed', error));
  }, [loadTimeline]);

  const refresh = useCallback(async () => {
    await loadTimeline();
  }, [loadTimeline]);

  return {
    events,
    isLoading,
    refresh,
  };
};
