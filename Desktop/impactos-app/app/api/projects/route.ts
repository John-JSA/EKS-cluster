import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { sendDonationNotification } from "@/app/lib/email";

const prisma = new PrismaClient();

function getUserId(session: any) {
  return session?.user?.id;
}

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      donations: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, amount: true, donorName: true, createdAt: true },
      },
    },
  });

  return Response.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = getUserId(session);

  if (!userId) {
    return Response.json({ error: "You must sign in first." }, { status: 401 });
  }

  const body = await req.json();

  const project = await prisma.project.create({
    data: {
      title: body.title,
      description: body.description,
      location: body.location,
      beneficiaries: body.beneficiaries,
      fundingGoal: Number(body.fundingGoal),
      raised: 0,
      status: "PENDING",
      ownerId: userId,
    },
  });

  return Response.json(project);
}

export async function PATCH(req: Request) {
  const body = await req.json();

  if (body.amount) {
    const session = await auth();
    const userId = getUserId(session);

    if (!userId) {
      return Response.json({ error: "Sign in to support a project." }, { status: 401 });
    }

    const donorName = session?.user?.name || body.donorName || null;

    const [updated] = await prisma.$transaction([
      prisma.project.update({
        where: { id: Number(body.id) },
        data: { raised: { increment: Number(body.amount) } },
      }),
      prisma.donation.create({
        data: {
          amount: Number(body.amount),
          donorName,
          projectId: Number(body.id),
          userId: userId ?? undefined,
        },
      }),
    ]);

    const project = await prisma.project.findUnique({
      where: { id: Number(body.id) },
      include: { owner: { select: { name: true, email: true } } },
    });

    if (project?.owner?.email) {
      await sendDonationNotification({
        ownerEmail: project.owner.email,
        ownerName: project.owner.name || "there",
        donorName: donorName || "Someone",
        amount: Number(body.amount),
        projectTitle: project.title,
      });
    }

    return Response.json(updated);
  }

  const session = await auth();
  const userId = getUserId(session);

  if (!userId) {
    return Response.json({ error: "You must sign in first." }, { status: 401 });
  }

  const existing = await prisma.project.findUnique({
    where: { id: Number(body.id) },
  });

  if (!existing) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  if (existing.ownerId && existing.ownerId !== userId) {
    return Response.json({ error: "You can only edit your own project." }, { status: 403 });
  }

  const updated = await prisma.project.update({
    where: { id: Number(body.id) },
    data: {
      title: body.title,
      description: body.description,
      location: body.location,
      beneficiaries: body.beneficiaries,
      fundingGoal: Number(body.fundingGoal),
      ownerId: existing.ownerId || userId,
    },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = getUserId(session);

  if (!userId) {
    return Response.json({ error: "You must sign in first." }, { status: 401 });
  }

  const body = await req.json();

  const existing = await prisma.project.findUnique({
    where: { id: Number(body.id) },
  });

  if (!existing) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  if (existing.ownerId && existing.ownerId !== userId) {
    return Response.json({ error: "You can only delete your own project." }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: Number(body.id) } });

  return Response.json({ success: true });
}
