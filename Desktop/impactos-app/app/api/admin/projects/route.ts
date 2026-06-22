import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function isAdmin() {
  const session = await auth();
  return session?.user?.email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      donations: {
        select: { id: true, amount: true, donorName: true, createdAt: true },
      },
    },
  });

  return Response.json(projects);
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, status } = await req.json();

  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: Number(id) },
    data: { status },
  });

  return Response.json(updated);
}
