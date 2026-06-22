import { stripe } from "@/app/lib/stripe";
import { PrismaClient } from "@prisma/client";
import { sendDonationNotification } from "@/app/lib/email";
import Stripe from "stripe";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing Stripe signature or webhook secret." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { projectId, donorName, userId } = session.metadata as {
      projectId: string;
      donorName: string;
      userId: string;
    };

    // Idempotency check — skip if this session was already processed
    const existing = await prisma.donation.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (existing) return Response.json({ received: true });

    const amount = (session.amount_total ?? 0) / 100;

    await prisma.$transaction([
      prisma.project.update({
        where: { id: Number(projectId) },
        data: { raised: { increment: amount } },
      }),
      prisma.donation.create({
        data: {
          amount,
          donorName: donorName || null,
          projectId: Number(projectId),
          userId: userId || undefined,
          stripeSessionId: session.id,
        },
      }),
    ]);

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: { owner: { select: { name: true, email: true } } },
    });

    if (project?.owner?.email) {
      await sendDonationNotification({
        ownerEmail: project.owner.email,
        ownerName: project.owner.name || "there",
        donorName: donorName || "Someone",
        amount,
        projectTitle: project.title,
      });
    }
  }

  return Response.json({ received: true });
}
