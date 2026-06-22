"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import HeroSection from "./components/HeroSection";
import ProjectCard from "./components/ProjectCard";
import SubmitProjectForm from "./components/SubmitProjectForm";
import { currency } from "./lib/utils";
import { Project, ProjectFormData } from "./lib/types";

export default function Page() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [message, setMessage] = useState("");
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";

  const totalRaised = useMemo(
    () => projects.reduce((sum, p) => sum + p.raised, 0),
    [projects]
  );
  const totalGoal = useMemo(
    () => projects.reduce((sum, p) => sum + p.fundingGoal, 0),
    [projects]
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setMessage("Failed to load projects.");
    }
  }

  async function handleAddProject(data: ProjectFormData) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create project");
    await fetchProjects();
    setMessage("Project submitted successfully.");
  }

  async function handleFund(id: number, amount: number, donorName?: string) {
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, amount, donorName }),
    });

    if (!res.ok) throw new Error("Funding update failed");
    await fetchProjects();
    setMessage(`${currency(amount)} added successfully.`);
  }

  async function handleSaveEdit(id: number, data: ProjectFormData) {
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });

    if (!res.ok) throw new Error("Edit failed");
    await fetchProjects();
    setMessage("Project updated successfully.");
  }

  async function handleDelete(id: number) {
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) throw new Error("Delete failed");
    await fetchProjects();
    setMessage("Project deleted successfully.");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <HeroSection
        session={session}
        isSignedIn={isSignedIn}
        projectCount={projects.length}
        totalRaised={totalRaised}
        totalGoal={totalGoal}
      />

      {message && (
        <div className="mx-auto mt-6 max-w-6xl px-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            {message}
          </div>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Education Projects</h2>
          <p className="mt-1 text-slate-600">
            Interactive pilot projects for schools and communities in Ghana.
          </p>
        </div>

        {projects.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            No projects yet. Add the first school need below.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isSignedIn={isSignedIn}
              onFund={(id, amount, donorName) => handleFund(id, amount, donorName)}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>

      <SubmitProjectForm isSignedIn={isSignedIn} onSubmit={handleAddProject} />
    </main>
  );
}
