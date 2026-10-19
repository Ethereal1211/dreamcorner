import type { ListResponse, Schedule } from '@shared/api.interface';
import { axiosForBackend } from './index';

interface CreateScheduleData {
  title: string;
  description?: string;
  scheduleDate: string;
  scheduleTime: string;
  category: string;
}

interface UpdateScheduleData {
  title?: string;
  description?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  category?: string;
  isDone?: boolean;
}

export async function getSchedules(date?: string): Promise<ListResponse<Schedule>> {
  const { data } = await axiosForBackend.get('/api/schedules', {
    params: date ? { date } : undefined,
  });
  return data;
}

export async function createSchedule(data: CreateScheduleData): Promise<Schedule> {
  const { data: result } = await axiosForBackend.post('/api/schedules', data);
  return result;
}

export async function updateSchedule(
  id: string,
  data: UpdateScheduleData,
): Promise<Schedule> {
  const { data: result } = await axiosForBackend.patch(`/api/schedules/${id}`, data);
  return result;
}

export async function deleteSchedule(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/schedules/${id}`);
}
