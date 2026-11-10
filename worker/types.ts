export type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  MODEL_INPUT_USD_PER_MILLION?: string;
  MODEL_OUTPUT_USD_PER_MILLION?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRO_PRICE_ID?: string;
  BILLING_MODE?: string;
  BILLING_LIVE_ENABLED?: string;
  ADMIN_USER_IDS?: string;
  SITE_URL?: string;
  DEV_AUTH?: string;
};
export type Actor = { id: string; email: string; name: string };
export type AppEnv = {
  Bindings: Env;
  Variables: { actor: Actor; requestId: string };
};
export type Row = Record<string, any>;
export class Problem extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();
export const str = (v: unknown) => JSON.stringify(v);
export function parse<T = any>(v: any, fallback: T = {} as T): T {
  try {
    return typeof v === "string" ? JSON.parse(v) : (v ?? fallback);
  } catch {
    return fallback;
  }
}
