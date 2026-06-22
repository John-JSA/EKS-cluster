import { auth } from "@/auth";
import { getStripe } from "@/app/lib/stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Sign in to donate." }, { status: 401 });
  }

  const { projectId, amount, donorName } = await req.json();

  if (!projectId || !amount || Number(amount) <= 0) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: Number(projectId), status: "APPROVED" },
  });

  if (!project) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const checkoutSession = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Donation: ${project.title}`,
            description: `Supporting education in ${project.location}`,
          },
          unit_amount: Math.round(Number(amount) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      projectId: String(project.id),
      donorName: donorName || session.user.name || "",
      userId: session.user.id,
    },
    success_url: `${baseUrl}/projects/${project.id}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/projects/${project.id}`,
  });

  return Response.json({ url: checkoutSession.url });
}
