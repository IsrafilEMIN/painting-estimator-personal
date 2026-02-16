import type { Estimate, EstimateStatus, Room, Service } from '@/types/paintingEstimator';

export const ESTIMATE_STATUS_TRANSITIONS: Readonly<Record<EstimateStatus, readonly EstimateStatus[]>> = {
  Draft: ['Sent', 'Archived'],
  Sent: ['Draft', 'Approved', 'Archived'],
  Approved: ['Archived'],
  Archived: ['Draft'],
};

export interface EstimateValidationIssue {
  field: 'projectAddress' | 'rooms' | 'services' | 'status';
  code:
    | 'PROJECT_ADDRESS_REQUIRED'
    | 'AT_LEAST_ONE_ROOM_REQUIRED'
    | 'ROOM_NAME_REQUIRED'
    | 'AT_LEAST_ONE_SERVICE_REQUIRED'
    | 'SERVICE_TYPE_REQUIRED'
    | 'INVALID_STATUS_TRANSITION';
  message: string;
}

export interface EstimateValidationResult {
  isValid: boolean;
  issues: EstimateValidationIssue[];
}

type EstimateValidationInput = Pick<Estimate, 'projectAddress' | 'rooms'>;

const hasText = (value: string | undefined | null): boolean => Boolean(value && value.trim().length > 0);

const validateService = (service: Service, roomName: string): EstimateValidationIssue[] => {
  if (!service.type) {
    return [
      {
        field: 'services',
        code: 'SERVICE_TYPE_REQUIRED',
        message: `A service in "${roomName}" is missing a service type.`,
      },
    ];
  }

  return [];
};

const validateRoom = (room: Room): EstimateValidationIssue[] => {
  const issues: EstimateValidationIssue[] = [];
  const roomName = hasText(room.name) ? room.name : 'Unnamed room';

  if (!hasText(room.name)) {
    issues.push({
      field: 'rooms',
      code: 'ROOM_NAME_REQUIRED',
      message: 'Every room needs a name.',
    });
  }

  if (!room.services || room.services.length === 0) {
    issues.push({
      field: 'services',
      code: 'AT_LEAST_ONE_SERVICE_REQUIRED',
      message: `Room "${roomName}" must include at least one service.`,
    });
  } else {
    room.services.forEach((service) => {
      issues.push(...validateService(service, roomName));
    });
  }

  return issues;
};

export const validateEstimateForCalculation = (estimate: EstimateValidationInput): EstimateValidationResult => {
  const issues: EstimateValidationIssue[] = [];

  if (!hasText(estimate.projectAddress)) {
    issues.push({
      field: 'projectAddress',
      code: 'PROJECT_ADDRESS_REQUIRED',
      message: 'Project address is required.',
    });
  }

  if (!estimate.rooms || estimate.rooms.length === 0) {
    issues.push({
      field: 'rooms',
      code: 'AT_LEAST_ONE_ROOM_REQUIRED',
      message: 'Add at least one room before calculating or saving.',
    });
  } else {
    estimate.rooms.forEach((room) => {
      issues.push(...validateRoom(room));
    });
  }

  return { isValid: issues.length === 0, issues };
};

export const validateEstimateForPersistence = validateEstimateForCalculation;

export const canTransitionEstimateStatus = (from: EstimateStatus, to: EstimateStatus): boolean => {
  if (from === to) return true;
  return ESTIMATE_STATUS_TRANSITIONS[from].includes(to);
};

export const validateEstimateStatusTransition = (
  from: EstimateStatus,
  to: EstimateStatus
): EstimateValidationResult => {
  if (canTransitionEstimateStatus(from, to)) {
    return { isValid: true, issues: [] };
  }

  return {
    isValid: false,
    issues: [
      {
        field: 'status',
        code: 'INVALID_STATUS_TRANSITION',
        message: `Invalid status transition: ${from} -> ${to}.`,
      },
    ],
  };
};

