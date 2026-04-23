import { render, screen } from "@testing-library/react";

import { SettingsPanel } from "@/components/app/settings-panel";

describe("SettingsPanel", () => {
  it("shows editable account settings without provider diagnostics", () => {
    render(
      <SettingsPanel
        signOutAction={async () => undefined}
        profile={{
          displayName: "Cindy",
          email: "cindy@example.com",
          homeCity: "New York"
        }}
      />
    );

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Connected accounts")).toBeInTheDocument();
    expect(screen.getByLabelText("Home city")).toHaveValue("New York, USA");
    expect(screen.getByRole("button", { name: "Save profile" })).toBeInTheDocument();
    expect(screen.queryByText("Provider status")).not.toBeInTheDocument();
    expect(screen.queryByText("Import history")).not.toBeInTheDocument();
  });
});
