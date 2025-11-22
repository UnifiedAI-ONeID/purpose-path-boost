import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Lead {
  id?: string;
  email: string;
  name?: string;
  source?: string;
  status: 'new' | 'contacted' | 'converted' | 'archived';
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

const COLLECTION_NAME = 'leads';

export const leadsService = {
  /**
   * Capture a new lead (public facing)
   */
  async captureLead(email: string, name?: string, source: string = 'web'): Promise<string> {
    const leadData: Omit<Lead, 'id'> = {
      email,
      name,
      source,
      status: 'new',
      createdAt: new Date(),
      metadata: {
        userAgent: window.navigator.userAgent,
        capturedAt: new Date().toISOString()
      }
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), leadData);
    return docRef.id;
  }
};
