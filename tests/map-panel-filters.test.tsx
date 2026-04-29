import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes, ReactNode } from "react";

import { MapPanel } from "@/components/app/map-panel";
import { destinations, places, trips } from "@/lib/data";

const assignPlaceToPrimaryTripDay = vi.fn();
const useSearchParamsMock = vi.hoisted(() => vi.fn());

vi.mock("next/image", () => ({
  default: ({
    alt,
    fill: _fill,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => <img alt={alt} {...props} />
}));

vi.mock("next/navigation", () => ({
  useSearchParams: useSearchParamsMock
}));

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "dark" })
}));

vi.mock("@/lib/use-trip-draft", () => ({
  useTripDraft: () => ({
    primaryTrip: trips[0],
    assignPlaceToPrimaryTripDay
  })
}));

vi.mock("@/components/ui/map", () => ({
  Map: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MapControls: () => null,
  MapRoute: () => null,
  MapMarker: ({ children }: { children: ReactNode }) => <div data-testid="marker">{children}</div>,
  MarkerContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MarkerTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  MapPopup: ({ children }: { children: ReactNode }) => <div>{children}</div>
}));

describe("MapPanel filters", () => {
  beforeEach(() => {
    assignPlaceToPrimaryTripDay.mockReset();
  });

  it("honors the day filter passed from the trip planner", () => {
    useSearchParamsMock.mockReturnValue({
      get: (key: string) => {
        if (key === "scope") {
          return "day";
        }

        if (key === "day") {
          return "day_1";
        }

        if (key === "city") {
          return "Tokyo";
        }

        return null;
      }
    });

    render(<MapPanel destinations={destinations} places={places} homeCity="New York" />);

    expect(screen.getAllByText("Hidden Cafe in Shibuya").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sushi Dai Outer Market")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /day 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tokyo/i })).toBeInTheDocument();
  });
});
