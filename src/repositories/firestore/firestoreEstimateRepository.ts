import type { Estimate, EstimateStatus } from '@/types/paintingEstimator';
import type { CreateEstimateInput, EstimateRepository } from '@/repositories/estimateRepository';
import type { Firestore } from 'firebase/firestore';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  convertFirestoreTimestamps,
  isTimestampLike,
  safeClone,
} from '@/repositories/firestore/firestoreDataUtils';

export class FirestoreEstimateRepository implements EstimateRepository {
  constructor(private readonly firestore: Firestore) {}

  private estimatesCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/estimates`);
  }

  private estimateCounterRef(userId: string) {
    return doc(this.firestore, `users/${userId}/counters/estimate`);
  }

  async listByUser(userId: string): Promise<Estimate[]> {
    const estimatesColRef = this.estimatesCollection(userId);
    const q = query(estimatesColRef, orderBy('lastModified', 'desc'));
    const querySnapshot = await getDocs(q);

    const estimates: Estimate[] = [];
    querySnapshot.forEach((snapshot) => {
      estimates.push({
        id: snapshot.id,
        ...(convertFirestoreTimestamps(snapshot.data()) as Omit<Estimate, 'id'>),
      });
    });

    return estimates;
  }

  async getById(userId: string, estimateId: string): Promise<Estimate | null> {
    const estimateRef = doc(this.firestore, `users/${userId}/estimates`, estimateId);
    const estimateSnap = await getDoc(estimateRef);
    if (!estimateSnap.exists()) {
      return null;
    }

    return {
      id: estimateSnap.id,
      ...(convertFirestoreTimestamps(estimateSnap.data()) as Omit<Estimate, 'id'>),
    };
  }

  async create(userId: string, input: CreateEstimateInput): Promise<Estimate> {
    const estimatesColRef = this.estimatesCollection(userId);
    const counterRef = this.estimateCounterRef(userId);
    const estimateRef = doc(estimatesColRef);
    const now = Timestamp.now();
    let newEstimateNumber = '00001';

    await runTransaction(this.firestore, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      const currentCountRaw = counterSnap.data()?.count;
      const currentCount =
        typeof currentCountRaw === 'number' && Number.isFinite(currentCountRaw) ? currentCountRaw : 0;
      const nextCount = currentCount + 1;

      newEstimateNumber = nextCount.toString().padStart(5, '0');

      transaction.set(counterRef, { count: nextCount }, { merge: true });
      transaction.set(estimateRef, {
        customerId: input.customerId,
        customerName: input.customerName,
        projectAddress: input.projectAddress,
        estimateNumber: newEstimateNumber,
        status: 'Draft' as const,
        createdAt: now,
        lastModified: now,
        materialCost: 0,
        laborCost: 0,
        overheadCost: 0,
        profitAmount: 0,
        total: 0,
        rooms: [],
      });
    });

    return {
      id: estimateRef.id,
      customerId: input.customerId,
      customerName: input.customerName,
      projectAddress: input.projectAddress,
      estimateNumber: newEstimateNumber,
      status: 'Draft',
      createdAt: now.toDate(),
      lastModified: now.toDate(),
      materialCost: 0,
      laborCost: 0,
      overheadCost: 0,
      profitAmount: 0,
      total: 0,
      rooms: [],
    };
  }

  async update(userId: string, estimate: Estimate): Promise<Estimate> {
    const estimateRef = doc(this.firestore, `users/${userId}/estimates`, estimate.id);
    const { id, ...dataToUpdate } = estimate;

    const plainData: Record<string, unknown> = {};
    Object.entries(dataToUpdate).forEach(([key, value]) => {
      if (key === 'createdAt' || key === 'lastModified' || value === undefined) {
        return;
      }
      plainData[key] = safeClone(value);
    });

    let createdAtTimestamp: Timestamp;
    const incomingCreatedAt: unknown = dataToUpdate.createdAt;
    if (incomingCreatedAt instanceof Date) {
      createdAtTimestamp = Timestamp.fromDate(incomingCreatedAt);
    } else if (isTimestampLike(incomingCreatedAt)) {
      createdAtTimestamp = Timestamp.fromDate(incomingCreatedAt.toDate());
    } else {
      createdAtTimestamp = Timestamp.now();
    }

    await setDoc(
      estimateRef,
      {
        ...plainData,
        createdAt: createdAtTimestamp,
        lastModified: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      ...estimate,
      id,
      createdAt: createdAtTimestamp.toDate(),
      lastModified: new Date(),
    };
  }

  async updateStatus(userId: string, estimateId: string, nextStatus: EstimateStatus): Promise<void> {
    const estimateRef = doc(this.firestore, `users/${userId}/estimates`, estimateId);
    await setDoc(
      estimateRef,
      {
        status: nextStatus,
        lastModified: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async delete(userId: string, estimateId: string): Promise<void> {
    const estimateRef = doc(this.firestore, `users/${userId}/estimates`, estimateId);
    await deleteDoc(estimateRef);
  }

  async duplicate(userId: string, estimateId: string): Promise<Estimate> {
    const originalEstimate = await this.getById(userId, estimateId);
    if (!originalEstimate) {
      throw new Error('Original estimate not found');
    }

    const estimatesColRef = this.estimatesCollection(userId);
    const counterRef = this.estimateCounterRef(userId);
    const newEstimateRef = doc(estimatesColRef);
    const now = Timestamp.now();
    const plainRooms = safeClone(originalEstimate.rooms);
    let newEstimateNumber = '00001';

    await runTransaction(this.firestore, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      const currentCountRaw = counterSnap.data()?.count;
      const currentCount =
        typeof currentCountRaw === 'number' && Number.isFinite(currentCountRaw) ? currentCountRaw : 0;
      const nextCount = currentCount + 1;

      newEstimateNumber = nextCount.toString().padStart(5, '0');

      transaction.set(counterRef, { count: nextCount }, { merge: true });
      transaction.set(newEstimateRef, {
        customerId: originalEstimate.customerId,
        customerName: originalEstimate.customerName,
        projectAddress: originalEstimate.projectAddress,
        estimateNumber: newEstimateNumber,
        status: 'Draft' as const,
        createdAt: now,
        lastModified: now,
        materialCost: 0,
        laborCost: 0,
        overheadCost: 0,
        profitAmount: 0,
        total: 0,
        rooms: plainRooms,
      });
    });

    return {
      id: newEstimateRef.id,
      customerId: originalEstimate.customerId,
      customerName: originalEstimate.customerName,
      projectAddress: originalEstimate.projectAddress,
      estimateNumber: newEstimateNumber,
      status: 'Draft',
      createdAt: now.toDate(),
      lastModified: now.toDate(),
      materialCost: 0,
      laborCost: 0,
      overheadCost: 0,
      profitAmount: 0,
      total: 0,
      rooms: plainRooms,
    };
  }
}
