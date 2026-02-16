import { useState, useEffect, useCallback } from 'react';
import type { Estimate, EstimateStatus } from '@/types/paintingEstimator';
import { createEstimateService } from '@/services/estimate/createEstimateService';

const estimateService = createEstimateService();

export const useEstimates = (userId?: string) => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchEstimates = useCallback(async () => {
    setHasAttemptedFetch(false);
    setIsLoading(true);
    setError(null);

    if (!userId) {
      setEstimates([]);
      setIsLoading(false);
      setHasAttemptedFetch(true);
      return;
    }

    try {
      const fetched = await estimateService.listEstimates(userId);
      setEstimates(fetched);
    } catch (fetchError) {
      console.error('Error fetching estimates:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch estimates.');
      setEstimates([]);
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  }, [userId]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const getEstimate = useCallback(
    async (estimateId: string): Promise<Estimate | null> => {
      if (!userId) return null;
      try {
        return await estimateService.getEstimate(userId, estimateId);
      } catch (fetchError) {
        console.error('Error fetching estimate:', fetchError);
        return null;
      }
    },
    [userId]
  );

  const createEstimate = async (
    customerId: string,
    customerName: string,
    projectAddress: string
  ): Promise<string | null> => {
    if (!userId) {
      setError('User not authenticated.');
      return null;
    }

    setError(null);
    try {
      const created = await estimateService.createEstimate(userId, {
        customerId,
        customerName,
        projectAddress,
      });
      setEstimates((prev) =>
        [created, ...prev].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      );
      return created.id;
    } catch (createError) {
      console.error('Error creating estimate:', createError);
      setError(createError instanceof Error ? createError.message : 'Failed to create estimate.');
      return null;
    }
  };

  const updateEstimate = async (estimateData: Estimate): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated.');
      return false;
    }

    setError(null);
    try {
      const updated = await estimateService.saveEstimate(userId, estimateData);
      setEstimates((prev) =>
        prev
          .map((estimate) => (estimate.id === updated.id ? updated : estimate))
          .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      );
      return true;
    } catch (updateError) {
      console.error('Error updating estimate:', updateError);
      setError(updateError instanceof Error ? updateError.message : 'Failed to update estimate.');
      return false;
    }
  };

  const updateEstimateStatus = async (
    estimateId: string,
    nextStatus: EstimateStatus
  ): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated.');
      return false;
    }

    setError(null);
    try {
      await estimateService.updateEstimateStatus(userId, estimateId, nextStatus);
      setEstimates((prev) =>
        prev
          .map((estimate) =>
            estimate.id === estimateId ? { ...estimate, status: nextStatus, lastModified: new Date() } : estimate
          )
          .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      );
      return true;
    } catch (statusError) {
      console.error('Error updating estimate status:', statusError);
      setError(statusError instanceof Error ? statusError.message : 'Failed to update estimate status.');
      return false;
    }
  };

  const deleteEstimate = async (estimateId: string): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated.');
      return false;
    }

    if (!window.confirm('Are you sure you want to permanently delete this estimate?')) {
      return false;
    }

    setError(null);
    try {
      await estimateService.deleteEstimate(userId, estimateId);
      setEstimates((prev) => prev.filter((estimate) => estimate.id !== estimateId));
      return true;
    } catch (deleteError) {
      console.error('Error deleting estimate:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete estimate.');
      return false;
    }
  };

  const duplicateEstimate = async (estimateId: string): Promise<string | null> => {
    if (!userId) {
      setError('User not authenticated.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const duplicated = await estimateService.duplicateEstimate(userId, estimateId);
      setEstimates((prev) =>
        [duplicated, ...prev].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      );
      return duplicated.id;
    } catch (duplicateError) {
      console.error('Error duplicating estimate:', duplicateError);
      setError(duplicateError instanceof Error ? duplicateError.message : 'Failed to duplicate estimate.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    estimates,
    isLoading,
    error,
    hasAttemptedFetch,
    fetchEstimates,
    createEstimate,
    updateEstimate,
    updateEstimateStatus,
    deleteEstimate,
    getEstimate,
    duplicateEstimate,
  };
};

