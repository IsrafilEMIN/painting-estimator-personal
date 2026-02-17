import { useCallback, useEffect, useState } from 'react';
import type { Lead, LeadStage, NewLeadInput } from '@/types/paintingEstimator';
import { createLeadService } from '@/services/lead/createLeadService';

const leadService = createLeadService();

const sortByUpdatedAt = (leads: Lead[]): Lead[] =>
  [...leads].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

export const useLeads = (userId?: string) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchLeads = useCallback(async () => {
    setHasAttemptedFetch(false);
    setIsLoading(true);
    setError(null);

    if (!userId) {
      setLeads([]);
      setIsLoading(false);
      setHasAttemptedFetch(true);
      return;
    }

    try {
      const fetched = await leadService.listLeads(userId);
      setLeads(sortByUpdatedAt(fetched));
    } catch (fetchError) {
      console.error('Error fetching leads:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch leads.');
      setLeads([]);
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  }, [userId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (input: NewLeadInput): Promise<string | null> => {
    if (!userId) {
      setError('User not authenticated.');
      return null;
    }

    setError(null);

    try {
      const created = await leadService.createLead(userId, input);
      setLeads((prev) => sortByUpdatedAt([created, ...prev]));
      return created.id;
    } catch (createError) {
      console.error('Error creating lead:', createError);
      setError(createError instanceof Error ? createError.message : 'Failed to create lead.');
      return null;
    }
  };

  const getLead = useCallback(
    async (leadId: string): Promise<Lead | null> => {
      if (!userId) return null;
      try {
        return await leadService.getLead(userId, leadId);
      } catch (getError) {
        console.error('Error fetching lead:', getError);
        return null;
      }
    },
    [userId]
  );

  const updateLeadStage = async (leadId: string, nextStage: LeadStage): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated.');
      return false;
    }

    setError(null);

    try {
      await leadService.updateLeadStage(userId, leadId, nextStage);
      setLeads((prev) =>
        sortByUpdatedAt(
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, stage: nextStage, updatedAt: new Date() } : lead
          )
        )
      );
      return true;
    } catch (stageError) {
      console.error('Error updating lead stage:', stageError);
      setError(stageError instanceof Error ? stageError.message : 'Failed to update lead stage.');
      return false;
    }
  };

  const markLeadConverted = async (leadId: string, customerId: string): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated.');
      return false;
    }

    setError(null);

    try {
      await leadService.markLeadConverted(userId, leadId, customerId);
      setLeads((prev) =>
        sortByUpdatedAt(
          prev.map((lead) =>
            lead.id === leadId
              ? { ...lead, customerId, stage: 'Won', updatedAt: new Date() }
              : lead
          )
        )
      );
      return true;
    } catch (conversionError) {
      console.error('Error marking lead converted:', conversionError);
      setError(conversionError instanceof Error ? conversionError.message : 'Failed to mark lead converted.');
      return false;
    }
  };

  return {
    leads,
    isLoading,
    error,
    hasAttemptedFetch,
    fetchLeads,
    createLead,
    getLead,
    updateLeadStage,
    markLeadConverted,
  };
};
