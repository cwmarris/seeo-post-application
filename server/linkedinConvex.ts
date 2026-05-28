import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { getConvexUrlForServer } from './linkedinEnv.js';

export type StoredLinkedInConnection = {
  sessionId: string;
  memberId: string;
  memberName?: string;
  memberEmail?: string;
  memberUrn: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes?: string;
};

export type PublicLinkedInStatus = {
  connected: boolean;
  memberId?: string;
  memberName?: string;
  memberEmail?: string;
  memberUrn?: string;
  expiresAt?: number;
  scopes?: string;
};

function getClient(): ConvexHttpClient | null {
  const url = getConvexUrlForServer();
  if (!url) return null;
  return new ConvexHttpClient(url);
}

export async function getLinkedInStatus(sessionId: string): Promise<PublicLinkedInStatus> {
  const client = getClient();
  if (!client) {
    return { connected: false };
  }

  const status = await client.query(api.linkedinConnections.getBySession, { sessionId });
  return status ?? { connected: false };
}

export async function getLinkedInTokenRow(
  sessionId: string
): Promise<StoredLinkedInConnection | null> {
  const client = getClient();
  if (!client) return null;

  const row = await client.query(api.linkedinConnections.getTokenBySession, { sessionId });
  if (!row) return null;

  return {
    sessionId: row.sessionId,
    memberId: row.memberId,
    memberName: row.memberName,
    memberEmail: row.memberEmail,
    memberUrn: row.memberUrn,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiresAt: row.expiresAt,
    scopes: row.scopes,
  };
}

export async function saveLinkedInConnection(
  connection: StoredLinkedInConnection
): Promise<void> {
  const client = getClient();
  if (!client) {
    throw new Error(
      'Convex is not configured (set CONVEX_URL or VITE_CONVEX_URL for LinkedIn token storage)'
    );
  }

  await client.mutation(api.linkedinConnections.upsertFromOAuth, {
    sessionId: connection.sessionId,
    memberId: connection.memberId,
    memberName: connection.memberName,
    memberEmail: connection.memberEmail,
    memberUrn: connection.memberUrn,
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken,
    expiresAt: connection.expiresAt,
    scopes: connection.scopes,
  });
}

export async function disconnectLinkedIn(sessionId: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  await client.mutation(api.linkedinConnections.disconnect, { sessionId });
}
