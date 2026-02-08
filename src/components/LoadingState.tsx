"use client";

import { useState } from "react";

const LOADING_MESSAGES = [
  "Scanning the credits...",
  "Checking the discography...",
  "Crossing over...",
  "Finding a double threat...",
  "Stage or screen? Both...",
];

function pickMessage() {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

export default function LoadingState() {
  const [message] = useState(pickMessage);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      <div
        className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-10 lg:p-12 overflow-hidden"
        style={{
          borderTop: "3px solid var(--accent-red)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-6">
          {/* Film credits skeleton — left */}
          <div className="flex-1 flex flex-col gap-4 w-full max-w-[280px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-3 rounded bg-[var(--surface-elevated)]" />
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-12 h-[72px] rounded bg-[var(--surface-elevated)] animate-shimmer" />
                <div className="flex-1 flex flex-col gap-2 py-1">
                  <div className="w-3/4 h-3 rounded bg-[var(--surface-elevated)]" />
                  <div className="w-1/3 h-2.5 rounded bg-[var(--surface-elevated)]" />
                  <div className="w-1/2 h-2.5 rounded bg-[var(--surface-elevated)]" />
                </div>
              </div>
            ))}
          </div>

          {/* Center — photo + narrative skeleton */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4 py-4">
            {/* Circular photo skeleton */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--surface-elevated)] animate-shimmer" />

            {/* Simple red dot spinner */}
            <div className="flex items-center gap-1.5 my-2">
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]"
                style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: "0s" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]"
                style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: "0.2s" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]"
                style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: "0.4s" }}
              />
            </div>

            <p className="font-[family-name:var(--font-lora)] italic text-[var(--text-muted)] text-sm">
              {message}
            </p>

            {/* Name + text skeletons */}
            <div className="w-40 h-5 rounded bg-[var(--surface-elevated)]" />
            <div className="w-20 h-3 rounded-full bg-[var(--surface-elevated)]" />
            <div className="flex flex-col gap-1.5 items-center mt-2">
              <div className="w-56 h-2.5 rounded bg-[var(--surface-elevated)]" />
              <div className="w-48 h-2.5 rounded bg-[var(--surface-elevated)]" />
              <div className="w-52 h-2.5 rounded bg-[var(--surface-elevated)]" />
            </div>
          </div>

          {/* Music credits skeleton — right */}
          <div className="flex-1 flex flex-col gap-4 w-full max-w-[280px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-3 rounded bg-[var(--surface-elevated)]" />
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-12 h-12 rounded bg-[var(--surface-elevated)] animate-shimmer" />
                <div className="flex-1 flex flex-col gap-2 py-1">
                  <div className="w-3/4 h-3 rounded bg-[var(--surface-elevated)]" />
                  <div className="w-1/2 h-2.5 rounded bg-[var(--surface-elevated)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
