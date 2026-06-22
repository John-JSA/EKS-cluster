"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ProjectFormData } from "@/app/lib/types";

type Props = {
  isSignedIn: boolean;
  onSubmit: (data: ProjectFormData) => Promise<void>;
};

type FormState = {
  title: string;
  description: string;
  location: string;
  beneficiaries: string;
  fundingGoal: string;
};

export default function SubmitProjectForm({ isSignedIn, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    location: "",
    beneficiaries: "",
    fundingGoal: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isSignedIn) {
      alert("Please sign in before submitting a project.");
      signIn("github");
      return;
    }

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.beneficiaries.trim() ||
      !form.fundingGoal.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (Number(form.fundingGoal) <= 0) {
      alert("Funding goal must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: form.title,
        description: form.description,
        location: form.location,
        beneficiaries: form.beneficiaries,
        fundingGoal: Number(form.fundingGoal),
      });
      setForm({ title: "", description: "", location: "", beneficiaries: "", fundingGoal: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pb-14">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-bold">Submit a School Need</h2>
        <p className="mt-2 text-slate-600">
          Add a real education need from Ghana and test how the platform grows.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Project Title</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-500"
              placeholder="School lacks tablets and digital lesson content"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="Describe the school challenge, what is missing, and the impact on students or teachers."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Location</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="Ashanti Region, Ghana"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Beneficiaries</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="500 students"
              value={form.beneficiaries}
              onChange={(e) => setForm((prev) => ({ ...prev, beneficiaries: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Funding Goal (USD)</label>
            <input
              type="number"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="50000"
              value={form.fundingGoal}
              onChange={(e) => setForm((prev) => ({ ...prev, fundingGoal: e.target.value }))}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl px-5 py-3 font-medium text-white transition ${
                loading ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Submitting..." : "Submit Project"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
