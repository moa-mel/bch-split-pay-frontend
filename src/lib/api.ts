
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000/api/v1';

export interface SplitRecipient {
  name: string;
  address: string;
  percentage: number;
}

export interface SplitRequest {
  totalAmount: number;
  recipients: SplitRecipient[];
}

export interface SplitPreview {
  totalAmount: string;
  percentageTotal: number;
  allocations: Array<{
    name: string;
    address: string;
    amount: string;
    amountSatoshis: string;
  }>;
  totalSatoshis: string;
  minerFeeSatoshis: string;
  requiredFundingSatoshis: string;
  network: string;
  contractAddress: string;
  enforcement: string;
  status: string;
}

export interface SplitExecution {
  network: string;
  contractAddress: string;
  transactionId: string;
  status: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  targetAmount: number;
  creatorAddress: string;
}

export interface ContributionRequest {
  contributor: string;
  amount: number;
  transactionId: string;
}

export interface Contribution {
  id: string;
  contributor: string;
  amount: string;
  transactionId: string;
  confirmed: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  targetAmount: string;
  creatorAddress: string;
  status: string;
  contributions: Contribution[];
  createdAt: string;
  vaultAddress?: string;
  network?: string;
  requiredFundingSatoshis?: string;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message;

    throw new Error(
      message || `Request failed (${response.status})`,
    );
  }

  return body as T;
}

export const api = {
  previewSplit: (payload: SplitRequest) =>
    request<SplitPreview>('/splits/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  executeSplit: (payload: SplitRequest) =>
    request<SplitExecution>('/splits/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createGroup: (payload: CreateGroupRequest) =>
    request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listGroups: () =>
    request<Group[]>('/groups'),

  addContribution: (
    groupId: string,
    payload: ContributionRequest,
  ) =>
    request<Contribution>(
      `/groups/${groupId}/contributions`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),
};
