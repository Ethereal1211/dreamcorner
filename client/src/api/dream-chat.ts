import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { ChatMessage, ListResponse, TarotChatDrawResult } from '@shared/api.interface';

export async function getMessages(
  page?: number,
  pageSize?: number,
): Promise<ListResponse<ChatMessage>> {
  try {
    const params: Record<string, number> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    const response = await axiosForBackend.get('/api/dream-chat/messages', {
      params,
    });
    return response.data;
  } catch (error: unknown) {
    logger.error('getMessages failed', error);
    throw error;
  }
}

export async function sendMessage(
  content: string,
  messageType?: string,
): Promise<ChatMessage[]> {
  try {
    const response = await axiosForBackend.post('/api/dream-chat/messages', {
      content,
      messageType: messageType ?? 'text',
    });
    const data = response.data;
    if (data.tarotMessage) {
      return [data.userMessage, data.tarotMessage, data.dreamMessage];
    }
    return [data.userMessage, data.dreamMessage];
  } catch (error: unknown) {
    logger.error('sendMessage failed', error);
    throw error;
  }
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/dream-chat/messages/${id}`);
  } catch (error: unknown) {
    logger.error('deleteMessage failed', error);
    throw error;
  }
}

export async function clearMessages(): Promise<void> {
  try {
    await axiosForBackend.delete('/api/dream-chat/clear');
  } catch (error: unknown) {
    logger.error('clearMessages failed', error);
    throw error;
  }
}

export async function drawTarotInChat(
  context?: string,
): Promise<ChatMessage[]> {
  try {
    const response = await axiosForBackend.post('/api/dream-chat/draw-tarot', {
      context: context ?? '',
    });
    const { userMessage, tarotMessage, dreamMessage } = response.data;
    return [userMessage, tarotMessage, dreamMessage];
  } catch (error: unknown) {
    logger.error('drawTarotInChat failed', error);
    throw error;
  }
}
