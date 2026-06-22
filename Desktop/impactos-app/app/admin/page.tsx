"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { currency } from "@/app/lib/utils";
import { Project } from "@/app/lib/types";

export default function AdminPage() {
  const { status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { signIn("github"); return; }
    fetchProjects();
  }, [status]);

  async function fetchProjects() {
    const res = await fetch("/api/admin/projects");
    if (res.status === 403) { setUnauthorized(true); setLoading(false); return; }
    setProjects(await res.json());
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    await fetch("/api/admin/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchProjects();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-xl font-semibold text-red-600">Access denied</p>
        <p className="text-slate-500">You are not authorized to view this page.</p>
        <Link href="/" className="text-emerald-600 hover:underline">Go home</Link>
      </main>
    );
  }

  const pending = projects.filter((p) => p.status === "PENDING");
  const approved = projects.filter((p) => p.status === "APPROVED");
  const rejected = projects.filter((p) => p.status === "REJECTED");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to site
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-700">Pending Review</p>
            <p className="mt-1 text-3xl font-bold text-amber-900">{pending.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-700">Approved</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">{approved.length}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">Rejected</p>
            <p className="mt-1 text-3xl font-bold text-red-900">{rejected.length}</p>
          </div>
        </div>

        {/* Projects */}
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        project.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : project.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{project.location}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {project.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>Goal: <strong>{currency(project.fundingGoal)}</strong></span>
                    <span>Raised: <strong className="text-emerald-700">{currency(project.raised)}</strong></span>
                    <span>Donors: <strong>{project.donations?.length || 0}</strong></span>
                    {project.owner && (
                      <span>By: <strong>{project.owner.name || project.owner.email}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {project.status !== "APPROVED" && (
                    <button
                      onClick={() => updateStatus(project.id, "APPROVED")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  )}
                  {project.status !== "REJECTED" && (
                    <button
                      onClick={() => updateStatus(project.id, "REJECTED")}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  )}
                  {project.status !== "PENDING" && (
                    <button
                      onClick={() => updateStatus(project.id, "PENDING")}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Set Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              No projects yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
