import { HealthRecord } from '@/types';

export const MOCK_HEALTH_RECORDS: HealthRecord[] = [
  {
    id: '1',
    petId: '1',
    type: 'vaccination',
    title: 'Rabies Vaccination',
    description: '3-year rabies vaccine administered',
    date: new Date('2023-12-15'),
    veterinarian: 'Dr. James Chen',
    notes: 'Next due: December 2026',
    createdAt: new Date('2023-12-15'),
  },
  {
    id: '2',
    petId: '1',
    type: 'checkup',
    title: 'Annual Wellness Exam',
    description: 'Comprehensive physical examination',
    date: new Date('2025-12-01'),
    veterinarian: 'Dr. Sarah Mitchell',
    notes: 'Weight: 30kg, Heart rate: normal, Temperature: 38.5°C. All systems healthy.',
    createdAt: new Date('2025-12-01'),
  },
  {
    id: '3',
    petId: '2',
    type: 'vaccination',
    title: 'FVRCP Vaccine',
    description: 'Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia',
    date: new Date('2024-06-20'),
    veterinarian: 'Dr. Sarah Mitchell',
    notes: 'Annual booster administered',
    createdAt: new Date('2024-06-20'),
  },
  {
    id: '4',
    petId: '2',
    type: 'checkup',
    title: 'Dental Examination',
    description: 'Oral health check and teeth cleaning',
    date: new Date('2025-11-15'),
    veterinarian: 'Dr. Emily Rodriguez',
    notes: 'Minor tartar buildup removed. Gums healthy.',
    createdAt: new Date('2025-11-15'),
  },
  {
    id: '5',
    petId: '1',
    type: 'medication',
    title: 'Heartworm Preventative',
    description: 'Monthly heartworm prevention medication',
    date: new Date('2025-12-01'),
    veterinarian: 'Dr. Sarah Mitchell',
    notes: 'Continue monthly dosage',
    createdAt: new Date('2025-12-01'),
  },
  {
    id: '6',
    petId: '3',
    type: 'checkup',
    title: 'Initial Health Screening',
    description: 'First veterinary visit and health assessment',
    date: new Date('2023-03-15'),
    veterinarian: 'Dr. James Chen',
    notes: 'Healthy young cockatiel. Weight: 95g',
    createdAt: new Date('2023-03-15'),
  },
];

export async function getHealthRecords(petId?: string): Promise<HealthRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let records = [...MOCK_HEALTH_RECORDS];
  if (petId) {
    records = records.filter(r => r.petId === petId);
  }
  return records.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function addHealthRecord(
  record: Omit<HealthRecord, 'id' | 'createdAt'>
): Promise<HealthRecord> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newRecord: HealthRecord = {
    ...record,
    id: String(Date.now()),
    createdAt: new Date(),
  };
  return newRecord;
}
