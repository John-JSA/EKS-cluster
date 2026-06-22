"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const params = useParams();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-10 shadow-sm">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="text-2xl font-extrabold text-slate-950">Thank you for your donation!</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Your support makes a real difference for students and communities in Ghana.
          A receipt has been sent to your email by Stripe.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/projects/${params.id}`}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700"
          >
            Back to project
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            See all projects
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-500">Loading...</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
