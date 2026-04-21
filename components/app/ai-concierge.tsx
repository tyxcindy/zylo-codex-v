"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { tasteProfile } from "@/lib/data";

export function AIConcierge() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Upload a food photo or tell me your trip vibe. I’ll fit recommendations around the places already on your itinerary."
    },
    {
      role: "user",
      text: "I want a cozy Tokyo dessert stop near Omotesando after coffee."
    },
    {
      role: "assistant",
      text: "Based on your saved coffee route and your design-forward taste profile, I’d stack a refined dessert counter within a short walk so you stay in the same pocket of the city."
    }
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendPrompt() {
    if (!draft.trim()) {
      return;
    }

    const nextMessages = [...messages, { role: "user", text: draft }];
    setMessages(nextMessages);
    setLoading(true);

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: draft
      })
    });

    const payload = await response.json();
    setLoading(false);
    setDraft("");

    setMessages([
      ...nextMessages,
      {
        role: "assistant",
        text: payload.reply ?? payload.error ?? "Zylo could not answer right now."
      }
    ]);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <div className="flex items-center gap-3 text-sm text-[color:var(--text-soft)]">
          <Sparkles className="h-4 w-4" />
          Ask Zylo
        </div>
        <div className="mt-5 space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[90%] rounded-[24px] px-4 py-4 text-sm leading-7 ${
                message.role === "assistant"
                  ? "border border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] text-[color:var(--app-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "ml-auto border border-white/16 bg-[linear-gradient(135deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_72%,white)_100%)] text-white shadow-[0_16px_28px_rgba(91,104,255,0.22)]"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask for nearby food, sequencing help, or a better neighborhood flow."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="app" onClick={sendPrompt} disabled={loading}>
              {loading ? "Thinking..." : "Send prompt"}
            </Button>
            <Button variant="ghost" disabled>
              Attach image soon
            </Button>
          </div>
        </div>
      </Card>
      <Card className="glass-panel border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] text-[color:var(--app-text)] shadow-[var(--glass-shadow)]">
        <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Taste profile</p>
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-sm text-[color:var(--app-text-soft)]">Priorities</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tasteProfile.priorities.map((item) => (
                <span key={item} className="app-pill px-3 py-1 text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-[color:var(--app-text-soft)]">Favorite cuisines</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tasteProfile.favoriteCuisines.map((item) => (
                <span key={item} className="app-pill px-3 py-1 text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-[color:var(--app-text-soft)]">Avoids</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tasteProfile.avoids.map((item) => (
                <span key={item} className="app-pill px-3 py-1 text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
