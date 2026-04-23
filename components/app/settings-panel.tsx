"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/client/api";
import { saveProfileSettingsRequest } from "@/lib/client/profile-settings";
import { platformConnections } from "@/lib/data";
import {
  filterHomeCityOptions,
  getHomeCityDisplayLabel,
  resolveHomeCityOption
} from "@/lib/home-city-options";

export function SettingsPanel({
  signOutAction,
  profile
}: {
  signOutAction: (formData: FormData) => void | Promise<void>;
  profile: { displayName: string; email: string; homeCity: string };
}) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [homeCityInput, setHomeCityInput] = useState(getHomeCityDisplayLabel(profile.homeCity));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const filteredHomeCities = useMemo(
    () => filterHomeCityOptions(homeCityInput).slice(0, 8),
    [homeCityInput]
  );
  const selectedHomeCity = resolveHomeCityOption(homeCityInput);

  async function handleSaveProfile() {
    setSaveState("saving");
    setSaveMessage("");

    try {
      const result = await saveProfileSettingsRequest({
        displayName,
        homeCity: homeCityInput
      });

      setDisplayName(result.profile?.displayName ?? displayName);
      setHomeCityInput(getHomeCityDisplayLabel(result.profile?.homeCity ?? homeCityInput));
      setSaveState("saved");
      setSaveMessage("Profile updated.");
      setCityPickerOpen(false);
    } catch (error) {
      setSaveState("error");
      setSaveMessage(getApiErrorMessage(error, "Could not save profile settings."));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="app-card px-6 py-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Account</p>
        <div className="mt-5 grid gap-4">
          <div>
            <label
              htmlFor="settings-display-name"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]"
            >
              Display name
            </label>
            <Input
              id="settings-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              className="bg-[color:var(--glass-bg)] text-[color:var(--app-text)] placeholder:text-[color:var(--app-text-soft)]"
            />
          </div>

          <div>
            <label
              htmlFor="settings-email"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]"
            >
              Email
            </label>
            <Input
              id="settings-email"
              value={profile.email}
              readOnly
              className="bg-[color:var(--glass-bg)] text-[color:var(--app-text-soft)]"
            />
          </div>

          <div>
            <label
              htmlFor="settings-home-city"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]"
            >
              Home city
            </label>
            <Input
              id="settings-home-city"
              value={homeCityInput}
              onFocus={() => setCityPickerOpen(true)}
              onChange={(event) => {
                setHomeCityInput(event.target.value);
                setCityPickerOpen(true);
                setSaveState("idle");
                setSaveMessage("");
              }}
              placeholder="Start typing a city"
              className="bg-[color:var(--glass-bg)] text-[color:var(--app-text)] placeholder:text-[color:var(--app-text-soft)]"
              autoComplete="off"
            />
            {cityPickerOpen ? (
              <div className="mt-3 overflow-hidden rounded-[22px] border border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] shadow-[0_22px_44px_rgba(15,23,42,0.12)]">
                {filteredHomeCities.length > 0 ? (
                  filteredHomeCities.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setHomeCityInput(option.label);
                        setCityPickerOpen(false);
                        setSaveState("idle");
                        setSaveMessage("");
                      }}
                      className="flex w-full items-center justify-between gap-4 border-b border-[color:var(--line)] px-4 py-3 text-left last:border-b-0 hover:bg-[color:var(--glass-bg)]"
                    >
                      <span className="font-semibold text-[color:var(--app-text)]">{option.label}</span>
                      <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-text-soft)]">
                        {option.value}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-[color:var(--app-text-soft)]">
                    No supported city matches that input yet.
                  </div>
                )}
              </div>
            ) : null}
            <p className="mt-2 text-sm leading-6 text-[color:var(--app-text-soft)]">
              Pick a city from the list so Zylo can use a real canonical location for local map focus and nearby planning.
            </p>
            {!selectedHomeCity && homeCityInput.trim() ? (
              <p className="mt-2 text-sm text-amber-500">
                Choose one of the listed city options before saving.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="app"
              size="md"
              onClick={handleSaveProfile}
              disabled={saveState === "saving" || !selectedHomeCity}
            >
              {saveState === "saving" ? "Saving..." : "Save profile"}
            </Button>
            {saveMessage ? (
              <p
                className={`text-sm ${
                  saveState === "error" ? "text-rose-400" : "text-[color:var(--app-text-soft)]"
                }`}
              >
                {saveMessage}
              </p>
            ) : null}
          </div>
        </div>

        <form action={signOutAction} className="mt-8 border-t border-[color:var(--line)] pt-6">
          <Button type="submit" variant="secondary" size="md">
            Sign out
          </Button>
        </form>
      </div>

      <div className="app-card px-6 py-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Connected accounts</p>
        <div className="mt-5 space-y-4">
          {platformConnections.map((connection) => {
            return (
              <div key={connection.id} className="app-card-soft px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[color:var(--app-text)]">{connection.platform}</p>
                  <span className="app-pill px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    {connection.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--app-text-soft)]">{connection.summary}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
