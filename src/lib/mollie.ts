// ============================================================
// Mollie REST API wrapper — lichter dan de officiële SDK
// Docs: https://docs.mollie.com/reference/v2/
// ============================================================

const API_BASE = "https://api.mollie.com/v2";

function getKey(): string {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY niet geconfigureerd");
  return key;
}

async function mollie<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Mollie ${res.status}: ${data.detail || data.title || "unknown"}`);
  }
  return data as T;
}

// ------------------------------------------------------------
// Customers
// ------------------------------------------------------------

export interface MollieCustomer {
  id: string;
  name: string;
  email: string;
}

export async function createCustomer(name: string, email: string): Promise<MollieCustomer> {
  return mollie<MollieCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });
}

// ------------------------------------------------------------
// First payment (sets up mandate)
// ------------------------------------------------------------

export interface MolliePayment {
  id: string;
  status: string;
  customerId: string;
  mandateId?: string;
  _links: { checkout?: { href: string } };
}

export async function createFirstPayment(opts: {
  customerId: string;
  amountCents: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<MolliePayment> {
  return mollie<MolliePayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: {
        currency: "EUR",
        value: (opts.amountCents / 100).toFixed(2),
      },
      description: opts.description,
      redirectUrl: opts.redirectUrl,
      webhookUrl: opts.webhookUrl,
      customerId: opts.customerId,
      sequenceType: "first",
      metadata: opts.metadata ?? {},
    }),
  });
}

// ------------------------------------------------------------
// Fetch payment (for webhook verification)
// ------------------------------------------------------------

export async function getPayment(id: string): Promise<MolliePayment & {
  amount: { currency: string; value: string };
  metadata: Record<string, unknown>;
}> {
  return mollie(`/payments/${id}`);
}

// ------------------------------------------------------------
// Create recurring subscription (after first payment succeeds)
// ------------------------------------------------------------

export interface MollieSubscription {
  id: string;
  status: string;
  customerId: string;
  mandateId: string;
}

export async function createSubscription(opts: {
  customerId: string;
  amountCents: number;
  interval: string; // "1 month"
  description: string;
  webhookUrl: string;
  mandateId?: string;
}): Promise<MollieSubscription> {
  return mollie(`/customers/${opts.customerId}/subscriptions`, {
    method: "POST",
    body: JSON.stringify({
      amount: {
        currency: "EUR",
        value: (opts.amountCents / 100).toFixed(2),
      },
      interval: opts.interval,
      description: opts.description,
      webhookUrl: opts.webhookUrl,
      ...(opts.mandateId ? { mandateId: opts.mandateId } : {}),
    }),
  });
}

// ------------------------------------------------------------
// Cancel subscription
// ------------------------------------------------------------

export async function cancelSubscription(customerId: string, subscriptionId: string): Promise<void> {
  await mollie(`/customers/${customerId}/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
}
