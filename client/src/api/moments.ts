import type { ListResponse, Moment } from '@shared/api.interface';
import { axiosForBackend } from './index';

interface CreateMomentData {
  content: string;
  images?: string[];
}

export async function getMoments(
  page = 1,
  pageSize = 20,
): Promise<ListResponse<Moment>> {
  const { data } = await axiosForBackend.get('/api/moments', {
    params: { page, pageSize },
  });
  return data;
}

export async function createMoment(data: CreateMomentData): Promise<Moment> {
  const { data: result } = await axiosForBackend.post('/api/moments', data);
  return result;
}

export async function likeMoment(id: string): Promise<Moment> {
  const { data: result } = await axiosForBackend.post(`/api/moments/${id}/like`);
  return result;
}

export async function deleteMoment(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/moments/${id}`);
}
