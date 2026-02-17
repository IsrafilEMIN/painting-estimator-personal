import type { LeadStage } from '@/types/paintingEstimator';

export const LEAD_STAGE_ORDER: readonly LeadStage[] = [
  'Intake',
  'Qualified',
  'Nurturing',
  'OfferDraft',
  'OfferSent',
  'Negotiation',
  'Won',
  'Lost',
];

export const ACTIVE_LEAD_STAGES: readonly LeadStage[] = [
  'Intake',
  'Qualified',
  'Nurturing',
  'OfferDraft',
  'OfferSent',
  'Negotiation',
];

export const CLOSED_LEAD_STAGES: readonly LeadStage[] = ['Won', 'Lost'];

export const LEAD_STAGE_TRANSITIONS: Readonly<Record<LeadStage, readonly LeadStage[]>> = {
  Intake: ['Qualified', 'Nurturing', 'Lost'],
  Qualified: ['Nurturing', 'OfferDraft', 'Lost'],
  Nurturing: ['Qualified', 'OfferDraft', 'Lost'],
  OfferDraft: ['Nurturing', 'OfferSent', 'Lost'],
  OfferSent: ['OfferDraft', 'Negotiation', 'Won', 'Lost'],
  Negotiation: ['OfferSent', 'Won', 'Lost'],
  Won: ['Won'],
  Lost: ['Intake', 'Qualified', 'Lost'],
};

export interface LeadValidationIssue {
  field: 'stage';
  code: 'INVALID_LEAD_STAGE_TRANSITION';
  message: string;
}

export interface LeadValidationResult {
  isValid: boolean;
  issues: LeadValidationIssue[];
}

export const canTransitionLeadStage = (from: LeadStage, to: LeadStage): boolean => {
  if (from === to) return true;
  return LEAD_STAGE_TRANSITIONS[from].includes(to);
};

export const validateLeadStageTransition = (from: LeadStage, to: LeadStage): LeadValidationResult => {
  if (canTransitionLeadStage(from, to)) {
    return { isValid: true, issues: [] };
  }

  return {
    isValid: false,
    issues: [
      {
        field: 'stage',
        code: 'INVALID_LEAD_STAGE_TRANSITION',
        message: `Invalid lead stage transition: ${from} -> ${to}.`,
      },
    ],
  };
};
