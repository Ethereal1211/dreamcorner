import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { AiSettings } from '@shared/api.interface';

export async function getSettings(): Promise<AiSettings> {
  try {
    const response = await axiosForBackend.get('/api/ai-settings');
    return response.data;
  } catch (error: unknown) {
    logger.error('getAiSettings failed', error);
    throw error;
  }
}

export async function updateSettings(
  patch: Partial<AiSettings>,
): Promise<AiSettings> {
  try {
    const response = await axiosForBackend.patch('/api/ai-settings', patch);
    return response.data;
  } catch (error: unknown) {
    logger.error('updateAiSettings failed', error);
    throw error;
  }
}
