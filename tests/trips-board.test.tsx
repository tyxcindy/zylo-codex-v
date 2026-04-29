import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";

import { TripsBoard } from "@/components/app/trips-board";
import { destinations, places } from "@/lib/data";

vi.mock("next/image", () => ({
  default: ({
    alt,
    fill: _fill,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => <img alt={alt} {...props} />
}));

describe("TripsBoard", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
        removeItem: vi.fn((key: string) => storage.delete(key))
      },
      configurable: true
    });

    vi.clearAllMocks();
  });

  it("adds and deletes trip days from the itinerary", () => {
    render(<TripsBoard initialPlannerNotes="" destinations={destinations} places={places} />);

    fireEvent.click(screen.getByRole("button", { name: /add new activity/i }));
    expect(screen.getByText("Day 6")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /delete day 6/i }));
    expect(screen.queryByText("Day 6")).not.toBeInTheDocument();
  });

  it("returns a deleted day's place back into saved places", () => {
    render(<TripsBoard initialPlannerNotes="" destinations={destinations} places={places} />);

    expect(screen.getByText("0 left")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /delete day 5/i }));

    expect(screen.getByText("1 left")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open tokyo city view deck in google maps/i })).toHaveAttribute(
      "href",
      expect.stringContaining("google.com/maps/search")
    );
  });

  it("lets you unslot a place, adjust travelers, and keeps map links active", () => {
    render(<TripsBoard initialPlannerNotes="" destinations={destinations} places={places} />);

    const dayOneMapLink = screen.getByRole("link", { name: /open day 1 on the map workspace/i });
    expect(dayOneMapLink).toHaveAttribute("href", expect.stringContaining("/map?scope=day&day="));

    fireEvent.click(screen.getByRole("button", { name: /remove hidden cafe in shibuya from this day/i }));
    expect(screen.getByText("1 left")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /increase travelers/i }));

    const travelersCard = screen.getAllByText("Travelers")[0]?.parentElement;
    expect(travelersCard).not.toBeNull();
    expect(within(travelersCard as HTMLElement).getByText("3")).toBeInTheDocument();
  });

  it("supports dragging a planned stop back into saved places", () => {
    render(<TripsBoard initialPlannerNotes="" destinations={destinations} places={places} />);

    const plannedStop = screen.getByText("Hidden Cafe in Shibuya").closest("[draggable='true']");
    expect(plannedStop).not.toBeNull();

    fireEvent.dragStart(plannedStop as HTMLElement);
    fireEvent.dragOver(screen.getByTestId("saved-places-dropzone"));
    fireEvent.drop(screen.getByTestId("saved-places-dropzone"));

    expect(screen.getByText("1 left")).toBeInTheDocument();
  });

  it("keeps planner notes scoped to each itinerary", () => {
    render(<TripsBoard initialPlannerNotes="Profile note" destinations={destinations} places={places} />);

    const notesField = screen.getByPlaceholderText(/Add anything here/i);
    fireEvent.change(notesField, { target: { value: "Book sushi counter for day two." } });

    fireEvent.click(screen.getByRole("button", { name: /new itinerary/i }));

    expect(screen.getByPlaceholderText(/Add anything here/i)).toHaveValue("");

    const tokyoCard = screen.getByText("Tokyo Drift").closest("[role='button']");
    expect(tokyoCard).not.toBeNull();
    fireEvent.click(tokyoCard as HTMLElement);

    expect(screen.getByPlaceholderText(/Add anything here/i)).toHaveValue(
      "Book sushi counter for day two."
    );
  });

  it("can render a gallery-only itinerary list without the editable planner", () => {
    render(
      <TripsBoard
        initialPlannerNotes=""
        destinations={destinations}
        places={places}
        galleryOnly
      />
    );

    expect(screen.getByText(/itinerary gallery/i)).toBeInTheDocument();
    expect(screen.queryByText(/editable itinerary/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open in planner/i })).toBeInTheDocument();
  });

  it("shows a back-to-itineraries button in planner-only mode", () => {
    render(
      <TripsBoard
        initialPlannerNotes=""
        destinations={destinations}
        places={places}
        plannerOnly
        initialTripId="trip_1"
      />
    );

    expect(screen.getByRole("link", { name: /back to itineraries/i })).toHaveAttribute(
      "href",
      "/trips"
    );
  });
});
