"use client";

import { signIn, signOut } from "next-auth/react";
import { Session } from "next-auth";
import { currency } from "@/app/lib/utils";

type Props = {
  session: Session | null;
  isSignedIn: boolean;
  projectCount: number;
  totalRaised: number;
  totalGoal: number;
};

export default function HeroSection({
  session,
  isSignedIn,
  projectCount,
  totalRaised,
  totalGoal,
}: Props) {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-5 py-2 text-base font-semibold text-emerald-800">
              Ghana Education Transformation
            </p>

            <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 sm:text-6xl">
              INEF Education Impact Platform
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isSignedIn ? (
                <>
                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                    Signed in as {session?.user?.name || session?.user?.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn("github")}
                  className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
                >
                  Sign in with GitHub
                </button>
              )}
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Transforming education in Ghana through practical digital access.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              A focused pilot platform where schools and communities can post
              urgent education needs, attract support, and track funding for
              real projects.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                Ghana
              </span>
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
                Digital Classrooms
              </span>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
                Teacher Training
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
            <h2 className="text-2xl font-semibold">Pilot Focus</h2>
            <p className="mt-3 text-slate-300">
              Start with one country, one sector, and measurable outcomes.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Projects</p>
                <p className="mt-2 text-2xl font-bold">{projectCount}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Funds Raised</p>
                <p className="mt-2 text-2xl font-bold">{currency(totalRaised)}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Funding Goal</p>
                <p className="mt-2 text-2xl font-bold">{currency(totalGoal)}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Focus Area</p>
                <p className="mt-2 text-2xl font-bold">Education</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
