import { isPrototypeMode } from '../lib/config';
import { prototypeDelay, request } from './apiClient';
import type { Sender } from '../types/email';

const DEFAULT_PROTOTYPE_SENDER: Sender = {
  id: 'snd_default',
  displayName: 'Primary Ethereal Inbox',
  email: 'primary@ethereal.email',
  etherealUser: 'primary@ethereal.email',
};

export async function fetchSenders(): Promise<Sender[]> {
  if (!isPrototypeMode) {
    try {
      const res = await request<{ ok: true; data: Sender[] }>('/senders');
      return res.data;
    } catch (err) {
      console.warn('Backend unavailable, falling back to prototype sender:', err);
    }
  }

  await prototypeDelay(200);
  return [DEFAULT_PROTOTYPE_SENDER];
}

export async function createSender(displayName: string): Promise<Sender> {
  if (!isPrototypeMode) {
    const res = await request<{ ok: true; data: Sender }>('/senders', {
      method: 'POST',
      body: { displayName },
    });
    return res.data;
  }

  await prototypeDelay(400);
  return {
    id: `snd_${Date.now()}`,
    displayName,
    email: `${displayName.toLowerCase().replace(/\s+/g, '.')}@ethereal.email`,
    etherealUser: `${displayName.toLowerCase().replace(/\s+/g, '.')}@ethereal.email`,
  };
}
