import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { DiaryEntry, ListResponse } from '@shared/api.interface';

export async function getDiaryList(
  page?: number,
  pageSize?: number,
): Promise<ListResponse<DiaryEntry>> {
  try {
    const params: Record<string, number> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    const response = await axiosForBackend.get('/api/diary', { params });
    return response.data;
  } catch (error: unknown) {
    logger.error('getDiaryList failed', error);
    throw error;
  }
}

export async function getDiary(id: string): Promise<DiaryEntry> {
  try {
    const response = await axiosForBackend.get(`/api/diary/${id}`);
    return response.data;
  } catch (error: unknown) {
    logger.error('getDiary failed', error);
    throw error;
  }
}

export async function createDiary(data: unknown): Promise<DiaryEntry> {
  try {
    const response = await axiosForBackend.post('/api/diary', data);
    return response.data;
  } catch (error: unknown) {
    logger.error('createDiary failed', error);
    throw error;
  }
}

export async function updateDiary(
  id: string,
  data: unknown,
): Promise<DiaryEntry> {
  try {
    const response = await axiosForBackend.patch(`/api/diary/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    logger.error('updateDiary failed', error);
    throw error;
  }
}

export async function deleteDiary(id: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/diary/${id}`);
  } catch (error: unknown) {
    logger.error('deleteDiary failed', error);
    throw error;
  }
}
