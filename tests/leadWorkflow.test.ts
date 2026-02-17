import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIVE_LEAD_STAGES,
  LEAD_STAGE_ORDER,
  canTransitionLeadStage,
  validateLeadStageTransition,
} from '../src/domain/lead/workflow';

test('lead stage order and active stages cover expected pipeline points', () => {
  assert.deepEqual(LEAD_STAGE_ORDER, [
    'Intake',
    'Qualified',
    'Nurturing',
    'OfferDraft',
    'OfferSent',
    'Negotiation',
    'Won',
    'Lost',
  ]);

  assert.deepEqual(ACTIVE_LEAD_STAGES, [
    'Intake',
    'Qualified',
    'Nurturing',
    'OfferDraft',
    'OfferSent',
    'Negotiation',
  ]);
});

test('lead workflow allows expected transition paths', () => {
  assert.equal(canTransitionLeadStage('Intake', 'Qualified'), true);
  assert.equal(canTransitionLeadStage('OfferSent', 'Negotiation'), true);
  assert.equal(canTransitionLeadStage('Negotiation', 'Won'), true);
  assert.equal(canTransitionLeadStage('Lost', 'Qualified'), true);
});

test('lead workflow blocks invalid stage transitions', () => {
  assert.equal(canTransitionLeadStage('Intake', 'Won'), false);
  assert.equal(canTransitionLeadStage('Won', 'Lost'), false);

  const invalid = validateLeadStageTransition('Qualified', 'Won');
  assert.equal(invalid.isValid, false);
  assert.equal(invalid.issues.length, 1);
  assert.match(invalid.issues[0].message, /Invalid lead stage transition/);
});
