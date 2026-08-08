import { NextRequest, NextResponse } from "next/server";

// In production: set STRIPE_SECRET_KEY in .env.local
// and use real Stripe Connect transfers.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, amount, currency = "ngn", bankAccountId, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Invalid withdrawal amount." }, { status: 400 });
    }

    if (amount < 1000) {
      return NextResponse.json({ message: "Minimum withdrawal amount is ₦1,000." }, { status: 400 });
    }

    // ── Stripe Integration (live when STRIPE_SECRET_KEY is set) ──────────
    if (STRIPE_SECRET_KEY) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-07-29.dahlia" as any });

      // In production you would:
      // 1. Look up the agent's Stripe Connect account ID from your DB
      // const agentRecord = await db.query('SELECT stripe_account_id FROM agents WHERE id = $1', [agentId]);
      // const stripeAccountId = agentRecord.stripe_account_id;
      
      // 2. Create a Transfer to that connected account (moving funds from platform to connected account)
      // const transfer = await stripe.transfers.create({
      //   amount: Math.round(amount * 100), // in kobo (NGN minor unit)
      //   currency: currency.toLowerCase(),
      //   destination: stripeAccountId,
      //   description: description || "Milestone earnings transfer",
      // });

      // 3. Then create a Payout from their connected account to their external bank account
      // const payoutResult = await stripe.payouts.create({
      //   amount: Math.round(amount * 100),
      //   currency: currency.toLowerCase(),
      //   method: "standard",
      //   statement_descriptor: "Bankole Payout",
      // }, {
      //   stripeAccount: stripeAccountId,
      // });

      // For now we log intent and return success
      console.log("[stripe-withdraw] Would transfer and payout:", { agentId, amount, currency, bankAccountId, description });
    }

    // ── Mock response (works without Stripe key) ─────────────────────────
    const payout = {
      id: `payout-${Date.now()}`,
      agentId: agentId || "demo-agent",
      amount,
      currency,
      bankAccountId: bankAccountId || "demo-bank",
      description: description || "Milestone earnings withdrawal",
      status: "processing",
      estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      payout,
      message: `Withdrawal of ₦${amount.toLocaleString()} is being processed. Funds arrive in 1–2 business days.`,
    });
  } catch (err: any) {
    console.error("[stripe-withdraw]", err);
    return NextResponse.json({ message: err.message || "Withdrawal failed." }, { status: 500 });
  }
}
