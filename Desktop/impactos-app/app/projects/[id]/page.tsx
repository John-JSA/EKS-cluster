"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { currency, progressPercent } from "@/app/lib/utils";
import { Project } from "@/app/lib/types";
import ShareButtons from "@/app/components/ShareButtons";

export default function ProjectDetailPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
    fetchProject();
  }, [params.id]);

  useEffect(() => {
    if (session?.user?.name) setDonorName(session.user.name);
  }, [session]);

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (!res.ok) { setNotFound(true); return; }
      setProject(await res.json());
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleFund(amount: number) {
    if (!isSignedIn) { signIn("github"); return; }
    if (amount <= 0) return;
    setIsFunding(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project!.id, amount, donorName: donorName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || "Failed to start checkout.");
      setIsFunding(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading project...</p>
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-xl font-semibold text-slate-800">Project not found</p>
        <Link href="/" className="text-emerald-600 hover:underline">
          ← Back to all projects
        </Link>
      </main>
    );
  }

  const pct = progressPercent(project.raised, project.fundingGoal);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          ← Back to projects
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            Education · Ghana
          </span>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            {project.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{project.location}</p>

          <p className="mt-5 leading-8 text-slate-600">{project.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Beneficiaries</p>
              <p className="mt-1 font-semibold">{project.beneficiaries}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Funding Goal</p>
              <p className="mt-1 font-semibold">{currency(project.fundingGoal)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Raised</p>
              <p className="mt-1 font-semibold text-emerald-700">{currency(project.raised)}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{pct}% funded</span>
              <span className="text-slate-500">{project.donations?.length || 0} supporters</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-slate-900"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct >= 100 && (
              <p className="mt-2 text-sm font-semibold text-emerald-600">🎉 Fully funded!</p>
            )}
            {pct >= 50 && pct < 100 && (
              <p className="mt-2 text-sm font-semibold text-blue-600">⚡ Halfway there — keep the momentum!</p>
            )}
          </div>

          {/* Share */}
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-slate-700">Share this project</p>
            <ShareButtons url={shareUrl} title={`Support: ${project.title}`} />
          </div>

          {/* Funding panel */}
          <div className="mt-8 rounded-2xl bg-slate-50 p-5 sm:p-6">
            <p className="mb-4 text-lg font-semibold text-slate-800">Support this project</p>

            {!isSignedIn && (
              <p className="mb-4 text-sm text-slate-600">
                <button
                  onClick={() => signIn("github")}
                  className="font-medium text-emerald-600 hover:underline"
                >
                  Sign in with GitHub
                </button>{" "}
                to fund this project.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {[10, 50, 100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleFund(amount)}
                  disabled={isFunding}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:bg-gray-200"
                >
                  {isFunding ? "..." : currency(amount)}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <input
                type="text"
                placeholder="Your name (optional — leave blank to be anonymous)"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
              />
              <button
                onClick={() => {
                  const v = Number(customAmount);
                  if (v > 0) { handleFund(v); setCustomAmount(""); }
                  else alert("Enter a valid amount.");
                }}
                disabled={isFunding}
                className="rounded-xl bg-emerald-600 px-5 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:bg-gray-400 sm:whitespace-nowrap"
              >
                {isFunding ? "Processing..." : "Give Custom"}
              </button>
            </div>

            {message && (
              <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p>
            )}
          </div>

          {/* Supporters */}
          {project.donations && project.donations.length > 0 && (
            <div className="mt-8">
              <p className="mb-4 text-lg font-semibold text-slate-800">
                Supporters ({project.donations.length})
              </p>
              <div className="space-y-2">
                {project.donations.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-700">
                      {d.donorName || "Anonymous"}
                    </span>
                    <span className="font-semibold text-emerald-700">{currency(d.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
