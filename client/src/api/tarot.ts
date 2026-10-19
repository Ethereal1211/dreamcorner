import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TarotCard,
  TarotDrawRecord,
  TarotDrawResponse,
  ListResponse,
} from '@shared/api.interface';

export async function getCards(): Promise<TarotCard[]> {
  try {
    const response = await axiosForBackend.get('/api/tarot/cards');
    return response.data?.cards ?? [];
  } catch (error: unknown) {
    logger.error('getCards failed', error);
    throw error;
  }
}

export async function getDraws(
  page?: number,
  pageSize?: number,
): Promise<ListResponse<TarotDrawRecord>> {
  try {
    const params: Record<string, number> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    const response = await axiosForBackend.get('/api/tarot/draws', { params });
    return response.data;
  } catch (error: unknown) {
    logger.error('getDraws failed', error);
    throw error;
  }
}

export async function getDrawById(id: string): Promise<TarotDrawRecord> {
  try {
    const response = await axiosForBackend.get(`/api/tarot/draws/${id}`);
    return response.data;
  } catch (error: unknown) {
    logger.error('getDrawById failed', error);
    throw error;
  }
}

export async function drawCard(context?: string): Promise<TarotDrawResponse> {
  try {
    const response = await axiosForBackend.post('/api/tarot/draw', {
      context: context ?? '',
    });
    return response.data;
  } catch (error: unknown) {
    logger.error('drawCard failed', error);
    throw error;
  }
}
