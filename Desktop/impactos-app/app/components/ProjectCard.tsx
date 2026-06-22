"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { currency, progressPercent } from "@/app/lib/utils";
import { Project, ProjectFormData } from "@/app/lib/types";

type Props = {
  project: Project;
  isSignedIn: boolean;
  onFund: (id: number, amount: number) => Promise<void>;
  onSaveEdit: (id: number, data: ProjectFormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

type EditForm = {
  title: string;
  description: string;
  location: string;
  beneficiaries: string;
  fundingGoal: string;
};

export default function ProjectCard({
  project,
  isSignedIn,
  onFund,
  onSaveEdit,
  onDelete,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [editForm, setEditForm] = useState<EditForm>({
    title: project.title,
    description: project.description,
    location: project.location,
    beneficiaries: project.beneficiaries,
    fundingGoal: String(project.fundingGoal),
  });

  function startEdit() {
    if (!isSignedIn) {
      alert("Please sign in before editing a project.");
      signIn("github");
      return;
    }
    setEditForm({
      title: project.title,
      description: project.description,
      location: project.location,
      beneficiaries: project.beneficiaries,
      fundingGoal: String(project.fundingGoal),
    });
    setIsEditing(true);
  }

  async function saveEdit() {
    if (
      !editForm.title.trim() ||
      !editForm.description.trim() ||
      !editForm.location.trim() ||
      !editForm.beneficiaries.trim() ||
      !editForm.fundingGoal.trim()
    ) {
      alert("Please fill in all edit fields.");
      return;
    }

    if (Number(editForm.fundingGoal) <= 0) {
      alert("Funding goal must be greater than 0.");
      return;
    }

    await onSaveEdit(project.id, {
      title: editForm.title,
      description: editForm.description,
      location: editForm.location,
      beneficiaries: editForm.beneficiaries,
      fundingGoal: Number(editForm.fundingGoal),
    });
    setIsEditing(false);
  }

  async function handleFund(amount: number) {
    if (amount <= 0) {
      alert("Funding amount must be greater than 0.");
      return;
    }
    setIsFunding(true);
    try {
      await onFund(project.id, amount);
    } finally {
      setIsFunding(false);
    }
  }

  async function handleCustomFunding() {
    const value = Number(customAmount);
    if (!value || value <= 0) {
      alert("Please enter a valid custom amount.");
      return;
    }
    await handleFund(value);
    setCustomAmount("");
  }

  async function handleDelete() {
    const confirmed = confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    if (!isSignedIn) {
      alert("Please sign in before deleting a project.");
      signIn("github");
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(project.id);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{project.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{project.location}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          Education
        </span>
      </div>

      <p className="mt-4 leading-7 text-slate-600">{project.description}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Beneficiaries</p>
          <p className="mt-1 font-semibold">{project.beneficiaries}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Funding Goal</p>
          <p className="mt-1 font-semibold">{currency(project.fundingGoal)}</p>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-4 font-semibold text-blue-900">Edit Project</h4>
          <div className="grid gap-3">
            <input
              className="rounded-xl border px-4 py-2"
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Title"
            />
            <textarea
              className="rounded-xl border px-4 py-2"
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
            />
            <input
              className="rounded-xl border px-4 py-2"
              value={editForm.location}
              onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Location"
            />
            <input
              className="rounded-xl border px-4 py-2"
              value={editForm.beneficiaries}
              onChange={(e) => setEditForm((prev) => ({ ...prev, beneficiaries: e.target.value }))}
              placeholder="Beneficiaries"
            />
            <input
              type="number"
              className="rounded-xl border px-4 py-2"
              value={editForm.fundingGoal}
              onChange={(e) => setEditForm((prev) => ({ ...prev, fundingGoal: e.target.value }))}
              placeholder="Funding Goal"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={saveEdit}
              className="rounded-xl bg-blue-700 px-4 py-2 font-medium text-white"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-xl border px-4 py-2 font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">
            {currency(project.raised)} raised
          </span>
          <span className="text-slate-500">
            {progressPercent(project.raised, project.fundingGoal)}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${progressPercent(project.raised, project.fundingGoal)}%` }}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Support this project</p>
        <div className="flex flex-wrap gap-2">
          {[10, 50, 100, 500, 1000].map((amount) => (
            <button
              key={amount}
              onClick={() => handleFund(amount)}
              disabled={isFunding}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:bg-gray-200"
            >
              {isFunding ? "Processing..." : currency(amount)}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
          />
          <button
            onClick={handleCustomFunding}
            disabled={isFunding}
            className="rounded-xl bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-slate-700 disabled:bg-gray-400"
          >
            {isFunding ? "Processing..." : "Give Custom"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={startEdit}
          className="rounded-2xl border border-blue-300 px-5 py-3 font-medium text-blue-700 transition hover:bg-blue-50"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-2xl border border-red-300 px-5 py-3 font-medium text-red-700 transition hover:bg-red-50 disabled:bg-gray-100"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
        <button className="rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50">
          View Details
        </button>
      </div>
    </div>
  );
}
