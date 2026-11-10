import Stripe from "stripe";
import type { Context } from "hono";
import { AppEnv, Env, Problem, id, now } from "./types";
import { one, run, stmt, insert } from "./db";
export function stripeClient(env: Env) {
  if (!env.STRIPE_SECRET_KEY)
    throw new Problem(
      503,
      "BILLING_NOT_CONFIGURED",
      "Billing is not connected yet. Your current learning space remains available.",
    );
  const test = env.STRIPE_SECRET_KEY.startsWith("sk_test_");
  if (
    !test &&
    (env.BILLING_MODE !== "live" || env.BILLING_LIVE_ENABLED !== "true")
  )
    throw new Problem(
      503,
      "LIVE_BILLING_DISABLED",
      "Live billing requires explicit operator configuration.",
    );
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 1,
    timeout: 20000,
  });
}
export async function checkout(c: Context<AppEnv>) {
  const client = stripeClient(c.env),
    actor = c.get("actor"),
    db = c.env.DB;
  if (!c.env.STRIPE_PRO_PRICE_ID)
    throw new Problem(
      503,
      "PRICE_NOT_CONFIGURED",
      "A test plan price has not been configured.",
    );
  let sub = await one(
    db,
    "SELECT * FROM subscriptions WHERE user_id=?",
    actor.id,
  );
  if (!sub) {
    await run(
      db,
      "INSERT OR IGNORE INTO subscriptions (user_id,status,plan,updated_at) VALUES (?,?,?,?)",
      actor.id,
      "free",
      "free",
      now(),
    );
    sub = await one(
      db,
      "SELECT * FROM subscriptions WHERE user_id=?",
      actor.id,
    );
  }
  if (!sub!.customer_id) {
    const customer = await client.customers.create(
      { email: actor.email, metadata: { kleos_user: actor.id } },
      { idempotencyKey: "kleos-customer-" + actor.id },
    );
    await run(
      db,
      "UPDATE subscriptions SET customer_id=? WHERE user_id=?",
      customer.id,
      actor.id,
    );
    sub!.customer_id = customer.id;
  }
  if (
    ["active", "trialing"].includes(sub!.status) &&
    sub!.period_end > Date.now() / 1000
  )
    throw new Problem(
      409,
      "ALREADY_SUBSCRIBED",
      "You already have an active subscription. Open the billing portal.",
    );
  const origin = c.env.SITE_URL || new URL(c.req.url).origin;
  const session = await client.checkout.sessions.create(
    {
      customer: sub!.customer_id,
      mode: "subscription",
      line_items: [{ price: c.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      subscription_data: { metadata: { kleos_user: actor.id } },
      client_reference_id: actor.id,
      success_url: origin + "/?view=settings&checkout=success",
      cancel_url: origin + "/?view=settings&checkout=cancelled",
    },
    {
      idempotencyKey:
        "kleos-checkout-" + actor.id + "-" + Math.floor(Date.now() / 600000),
    },
  );
  return c.json({ url: session.url, testMode: !session.livemode });
}
export async function portal(c: Context<AppEnv>) {
  const sub = await one(
    c.env.DB,
    "SELECT * FROM subscriptions WHERE user_id=?",
    c.get("actor").id,
  );
  if (!sub?.customer_id)
    throw new Problem(409, "NO_BILLING_ACCOUNT", "No billing account yet.");
  const session = await stripeClient(c.env).billingPortal.sessions.create({
    customer: sub.customer_id,
    return_url:
      (c.env.SITE_URL || new URL(c.req.url).origin) + "/?view=settings",
  });
  return c.json({ url: session.url });
}
export async function webhook(c: Context<AppEnv>) {
  const client = stripeClient(c.env);
  if (!c.env.STRIPE_WEBHOOK_SECRET)
    throw new Problem(
      503,
      "WEBHOOK_NOT_CONFIGURED",
      "Webhook is not configured.",
    );
  const signature = c.req.header("stripe-signature");
  if (!signature)
    throw new Problem(400, "INVALID_SIGNATURE", "Missing webhook signature.");
  let ev: Stripe.Event;
  try {
    ev = await client.webhooks.constructEventAsync(
      await c.req.text(),
      signature,
      c.env.STRIPE_WEBHOOK_SECRET,
      300,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    throw new Problem(400, "INVALID_SIGNATURE", "Invalid webhook signature.");
  }
  const db = c.env.DB;
  if (await one(db, "SELECT id FROM webhook_events WHERE id=?", ev.id))
    return c.json({ received: true, duplicate: true });
  if (ev.livemode && c.env.BILLING_LIVE_ENABLED !== "true")
    throw new Problem(400, "LIVE_EVENT_DISABLED", "Live events are disabled.");
  if (
    [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ].includes(ev.type)
  ) {
    const payload = ev.data.object as Stripe.Subscription;
    const customer =
      typeof payload.customer === "string"
        ? payload.customer
        : payload.customer.id;
    const sub = await one(
      db,
      "SELECT * FROM subscriptions WHERE customer_id=?",
      customer,
    );
    if (sub) {
      // Retrieve canonical state: old or reordered deliveries cannot resurrect a cancelled subscription.
      const canonical =
        ev.type === "customer.subscription.deleted"
          ? payload
          : await client.subscriptions.retrieve(payload.id);
      const matches = canonical.items.data.some(
        (item) => item.price.id === c.env.STRIPE_PRO_PRICE_ID,
      );
      const periodEnd = Math.max(
        0,
        ...canonical.items.data.map((item) => item.current_period_end || 0),
      );
      await db.batch([
        stmt(
          db,
          "UPDATE subscriptions SET subscription_id=?,status=?,plan=?,period_end=?,cancel_at_end=?,event_created=?,updated_at=? WHERE user_id=? AND event_created<=?",
          canonical.id,
          canonical.status,
          matches ? "pro" : "free",
          periodEnd,
          canonical.cancel_at_period_end ? 1 : 0,
          ev.created,
          now(),
          sub.user_id,
          ev.created,
        ),
        stmt(
          db,
          "INSERT OR IGNORE INTO webhook_events (id,type,created_at) VALUES (?,?,?)",
          ev.id,
          ev.type,
          now(),
        ),
      ]);
    } else {
      throw new Problem(
        409,
        "CUSTOMER_NOT_MAPPED",
        "Customer is not mapped yet; retry this event.",
      );
    }
  } else
    await run(
      db,
      "INSERT OR IGNORE INTO webhook_events (id,type,created_at) VALUES (?,?,?)",
      ev.id,
      ev.type,
      now(),
    );
  return c.json({ received: true });
}
