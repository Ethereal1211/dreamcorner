import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { UserSettings } from '@shared/api.interface';

export async function getSettings(): Promise<UserSettings> {
  try {
    const response = await axiosForBackend.get('/api/user-settings');
    return response.data;
  } catch (error: unknown) {
    logger.error('getSettings failed', error);
    throw error;
  }
}

export async function updateSettings(
  patch: Partial<UserSettings>,
): Promise<UserSettings> {
  try {
    const response = await axiosForBackend.patch(
      '/api/user-settings',
      patch,
    );
    return response.data;
  } catch (error: unknown) {
    logger.error('updateSettings failed', error);
    throw error;
  }
}
