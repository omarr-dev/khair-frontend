import { api } from './api-client';
import { FollowUpResponse } from '@/types/follow-up';

export const followUpApi = {
  getFollowUpData: (date?: string) =>
    api.get<FollowUpResponse>('/statistics/follow-up', {
      params: { date: date || undefined },
    }),
};
