import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id: Number(id), status: "APPROVED" },
    include: {
      owner: { select: { name: true, email: true } },
      donations: {
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, donorName: true, createdAt: true },
      },
    },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(project);
}
