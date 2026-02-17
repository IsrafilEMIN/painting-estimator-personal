import React, { useEffect, useState } from 'react';
import type { LeadSource, NewLeadInput } from '@/types/paintingEstimator';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLead: (input: NewLeadInput) => Promise<void> | void;
}

interface LeadFormState {
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  projectAddress: string;
  scopeSummary: string;
  expectedValue: string;
  confidence: string;
  assignedPainter: string;
  nextAction: string;
  nextActionDate: string;
  notes: string;
}

const initialFormState: LeadFormState = {
  name: '',
  email: '',
  phone: '',
  source: 'Website',
  projectAddress: '',
  scopeSummary: '',
  expectedValue: '',
  confidence: '50',
  assignedPainter: '',
  nextAction: '',
  nextActionDate: '',
  notes: '',
};

const sourceOptions: LeadSource[] = ['Website', 'Referral', 'Phone', 'Partner', 'RepeatCustomer', 'Other'];

const parseNextActionDate = (value: string): Date | undefined => {
  if (!value) {
    return undefined;
  }
  return new Date(`${value}T12:00:00`);
};

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onCreateLead }) => {
  const [form, setForm] = useState<LeadFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initialFormState);
      setErrors({});
      setIsSubmitting(false);
      setSubmitError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const onFieldChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof LeadFormState]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof LeadFormState, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone is required.';
    }

    if (!form.projectAddress.trim()) {
      nextErrors.projectAddress = 'Project address is required.';
    }

    if (!form.scopeSummary.trim()) {
      nextErrors.scopeSummary = 'Scope summary is required.';
    }

    const expectedValue = Number(form.expectedValue);
    if (!Number.isFinite(expectedValue) || expectedValue <= 0) {
      nextErrors.expectedValue = 'Expected value must be greater than 0.';
    }

    const confidence = Number(form.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
      nextErrors.confidence = 'Confidence must be between 0 and 100.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload: NewLeadInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      source: form.source,
      projectAddress: form.projectAddress.trim(),
      scopeSummary: form.scopeSummary.trim(),
      expectedValue: Number(form.expectedValue),
      confidence: Number(form.confidence),
      assignedPainter: form.assignedPainter.trim() || undefined,
      nextAction: form.nextAction.trim() || undefined,
      nextActionDate: parseNextActionDate(form.nextActionDate),
      notes: form.notes.trim() || undefined,
    };

    try {
      await onCreateLead(payload);
      onClose();
    } catch (error) {
      console.error('Error creating lead:', error);
      setSubmitError('Lead could not be created. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">New Lead Intake</h3>
            <p className="text-sm text-slate-600">Capture lead details for nurturing, offer prep, and bid tracking.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="leadName" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Contact Name
            </label>
            <input
              id="leadName"
              name="name"
              value={form.name}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="leadSource" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Source
            </label>
            <select
              id="leadSource"
              name="source"
              value={form.source}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="leadEmail" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Email
            </label>
            <input
              id="leadEmail"
              name="email"
              type="email"
              value={form.email}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="leadPhone" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Phone
            </label>
            <input
              id="leadPhone"
              name="phone"
              value={form.phone}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="leadAddress" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Project Address
            </label>
            <input
              id="leadAddress"
              name="projectAddress"
              value={form.projectAddress}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.projectAddress ? <p className="mt-1 text-xs text-red-600">{errors.projectAddress}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="leadScope" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Scope Summary
            </label>
            <textarea
              id="leadScope"
              name="scopeSummary"
              value={form.scopeSummary}
              onChange={onFieldChange}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.scopeSummary ? <p className="mt-1 text-xs text-red-600">{errors.scopeSummary}</p> : null}
          </div>

          <div>
            <label htmlFor="leadValue" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Expected Value (CAD)
            </label>
            <input
              id="leadValue"
              name="expectedValue"
              type="number"
              min={0}
              step={100}
              value={form.expectedValue}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.expectedValue ? <p className="mt-1 text-xs text-red-600">{errors.expectedValue}</p> : null}
          </div>

          <div>
            <label htmlFor="leadConfidence" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Win Confidence (%)
            </label>
            <input
              id="leadConfidence"
              name="confidence"
              type="number"
              min={0}
              max={100}
              step={1}
              value={form.confidence}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.confidence ? <p className="mt-1 text-xs text-red-600">{errors.confidence}</p> : null}
          </div>

          <div>
            <label htmlFor="leadPainter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Assigned Painter / Crew
            </label>
            <input
              id="leadPainter"
              name="assignedPainter"
              value={form.assignedPainter}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="leadNextAction" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Next Action
            </label>
            <input
              id="leadNextAction"
              name="nextAction"
              value={form.nextAction}
              onChange={onFieldChange}
              placeholder="Call for site visit"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="leadActionDate" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Next Action Date
            </label>
            <input
              id="leadActionDate"
              name="nextActionDate"
              type="date"
              value={form.nextActionDate}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="leadNotes" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Internal Notes
            </label>
            <textarea
              id="leadNotes"
              name="notes"
              value={form.notes}
              onChange={onFieldChange}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
        </div>

        {submitError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p> : null}

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Create Lead'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
