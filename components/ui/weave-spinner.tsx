"use client";

import React from "react";

import { cn } from "@/lib/utils";

type WeaveSpinnerProps = {
  className?: string;
  label?: string;
  size?: number;
};

export function WeaveSpinner({
  className,
  label = "Loading",
  size = 54
}: WeaveSpinnerProps) {
  const dimension = `${size}px`;
  const half = `${size / 2}px`;
  const line = `${Math.max(2, size * 0.037)}px`;
  const core = `${Math.max(8, size * 0.18)}px`;
  const offset = `${size * 0.16}px`;

  return (
    <div
      className={cn("weave-spinner inline-flex items-center justify-center", className)}
      aria-label={label}
      role="status"
    >
      <style>
        {`
          .weave-spinner__container {
            position: relative;
            transform-style: preserve-3d;
            perspective: 1200px;
          }

          .weave-spinner__node {
            position: absolute;
            top: 50%;
            left: 50%;
            border-radius: 999px;
            transform: translate(-50%, -50%);
            background: var(--spinner-node);
            box-shadow:
              0 0 16px color-mix(in srgb, var(--spinner-node) 65%, var(--brand)),
              0 0 30px color-mix(in srgb, var(--brand) 78%, transparent);
            animation: weave-node-pulse 1.7s ease-in-out infinite;
          }

          .weave-spinner__thread {
            position: absolute;
            background: linear-gradient(
              90deg,
              transparent,
              color-mix(in srgb, var(--primary-soft) 82%, white),
              transparent
            );
            box-shadow: 0 0 10px color-mix(in srgb, var(--primary-soft) 48%, transparent);
            transform-origin: center;
          }

          .weave-spinner__t1 {
            animation: weave-line-one 2s ease-in-out infinite;
          }

          .weave-spinner__t2 {
            animation: weave-line-two 2.2s ease-in-out infinite;
          }

          .weave-spinner__t3 {
            animation: weave-line-three 2.3s ease-in-out infinite;
          }

          .weave-spinner__t4 {
            animation: weave-line-four 2.1s ease-in-out infinite;
          }

          @keyframes weave-node-pulse {
            0%,
            100% {
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              transform: translate(-50%, -50%) scale(1.25);
            }
          }

          @keyframes weave-line-one {
            0%,
            100% {
              transform: translateY(0) rotateZ(0deg);
              opacity: 0.7;
            }
            50% {
              transform: translateY(7px) rotateZ(12deg);
              opacity: 1;
            }
          }

          @keyframes weave-line-two {
            0%,
            100% {
              transform: translateX(0) rotateZ(0deg);
              opacity: 0.7;
            }
            50% {
              transform: translateX(-7px) rotateZ(-12deg);
              opacity: 1;
            }
          }

          @keyframes weave-line-three {
            0%,
            100% {
              transform: translateY(0) rotateZ(0deg);
              opacity: 0.7;
            }
            50% {
              transform: translateY(-7px) rotateZ(-10deg);
              opacity: 1;
            }
          }

          @keyframes weave-line-four {
            0%,
            100% {
              transform: translateX(0) rotateZ(0deg);
              opacity: 0.7;
            }
            50% {
              transform: translateX(7px) rotateZ(10deg);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        className="weave-spinner__container"
        style={{ width: dimension, height: dimension }}
      >
        <div
          className="weave-spinner__thread weave-spinner__t1"
          style={{ top: offset, left: 0, width: dimension, height: line }}
        />
        <div
          className="weave-spinner__thread weave-spinner__t2"
          style={{ top: 0, left: `calc(100% - ${offset})`, width: line, height: dimension }}
        />
        <div
          className="weave-spinner__thread weave-spinner__t3"
          style={{ bottom: offset, left: 0, width: dimension, height: line }}
        />
        <div
          className="weave-spinner__thread weave-spinner__t4"
          style={{ top: 0, left: offset, width: line, height: dimension }}
        />
        <div
          className="weave-spinner__node"
          style={{ width: core, height: core, marginTop: `calc(${core} / -2)`, marginLeft: `calc(${core} / -2)` }}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
