import type { ListResponse, PeriodPrediction, PeriodRecord } from '@shared/api.interface';
import { axiosForBackend } from './index';

interface CreatePeriodData {
  startDate: string;
  endDate?: string;
  cycleLength?: number;
  periodLength?: number;
  notes?: string;
  symptoms?: string[];
}

interface UpdatePeriodData {
  startDate?: string;
  endDate?: string | null;
  cycleLength?: number;
  periodLength?: number;
  notes?: string;
  symptoms?: string[];
}

export async function getRecords(): Promise<ListResponse<PeriodRecord>> {
  const { data } = await axiosForBackend.get('/api/period/records');
  return data;
}

export async function getPrediction(): Promise<PeriodPrediction> {
  const { data } = await axiosForBackend.get('/api/period/prediction');
  return data;
}

export async function createRecord(data: CreatePeriodData): Promise<PeriodRecord> {
  const { data: result } = await axiosForBackend.post('/api/period/records', data);
  return result;
}

export async function updateRecord(
  id: string,
  data: UpdatePeriodData,
): Promise<PeriodRecord> {
  const { data: result } = await axiosForBackend.patch(`/api/period/records/${id}`, data);
  return result;
}

export async function deleteRecord(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/period/records/${id}`);
}
