import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ImportWorkbench } from "@/components/app/import-workbench";

const refresh = vi.fn();
const mockSubmitImportRequest = vi.hoisted(() => vi.fn());
const mockWaitForImportCompletion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh
  })
}));

vi.mock("@/lib/client/imports", () => ({
  submitImportRequest: mockSubmitImportRequest,
  waitForImportCompletion: mockWaitForImportCompletion
}));

describe("ImportWorkbench", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.clearAllMocks();
  });

  it("switches input modes and shows the matching placeholders", () => {
    render(<ImportWorkbench sourceArtifacts={[]} />);

    expect(
      screen.getByPlaceholderText(/Instagram, TikTok, blog, newsletter, or any travel link/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }));
    expect(screen.getByPlaceholderText(/Paste a caption, blog excerpt/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /upload a screenshot/i }));
    expect(screen.getByPlaceholderText(/Paste OCR text or describe/i)).toBeInTheDocument();
  });

  it("submits imports and shows the success state", async () => {
    mockSubmitImportRequest.mockResolvedValue({
      job: {
        id: "artifact-1",
        status: "queued",
        extractedPlaces: 0
      },
      importJob: {
        status: "queued",
        stage: "queued",
        stageDetail: "Queued for background processing."
      },
      statusUrl: "/api/imports/artifact-1"
    });
    mockWaitForImportCompletion.mockResolvedValue({
      job: {
        id: "artifact-1",
        status: "complete",
        extractedPlaces: 2
      },
      importJob: {
        status: "complete",
        stage: "complete",
        stageDetail: "Saved 2 verified place(s)."
      }
    });

    render(<ImportWorkbench sourceArtifacts={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /paste text/i }));
    fireEvent.change(screen.getByPlaceholderText(/Paste a caption, blog excerpt/i), {
      target: { value: "Kyoto food guide: Men-ya Inoichi and % Arabica Kyoto Higashiyama." }
    });
    fireEvent.change(screen.getByPlaceholderText(/Destination hint \(optional/i), {
      target: { value: "Kyoto" }
    });

    fireEvent.click(screen.getByRole("button", { name: /send to zylo/i }));

    await waitFor(() =>
      expect(screen.getByText(/Imported 2 place\(s\) and saved the job/i)).toBeInTheDocument()
    );

    expect(mockSubmitImportRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "text",
        destinationHint: "Kyoto"
      })
    );
    expect(mockWaitForImportCompletion).toHaveBeenCalledWith(
      "/api/imports/artifact-1",
      expect.objectContaining({
        onProgress: expect.any(Function)
      })
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces API errors to the user", async () => {
    mockSubmitImportRequest.mockRejectedValue(new Error("Quota exceeded"));

    render(<ImportWorkbench sourceArtifacts={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/Instagram, TikTok, blog, newsletter/i), {
      target: { value: "https://www.instagram.com/reel/test" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Destination hint \(optional/i), {
      target: { value: "Kyoto" }
    });
    fireEvent.click(screen.getByRole("button", { name: /send to zylo/i }));

    await waitFor(() => expect(screen.getByText(/Quota exceeded/i)).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
  });

  it("allows link imports without a destination hint", async () => {
    mockSubmitImportRequest.mockResolvedValue({
      job: {
        id: "artifact-1",
        status: "queued",
        extractedPlaces: 0
      },
      statusUrl: "/api/imports/artifact-1"
    });
    mockWaitForImportCompletion.mockResolvedValue({
      job: {
        id: "artifact-1",
        status: "complete",
        extractedPlaces: 1
      },
      importJob: {
        status: "complete",
        stage: "complete",
        stageDetail: "Saved 1 verified place(s)."
      }
    });

    render(<ImportWorkbench sourceArtifacts={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/Instagram, TikTok, blog, newsletter/i), {
      target: { value: "https://www.instagram.com/p/DLFBmZ2sUCx/" }
    });

    fireEvent.click(screen.getByRole("button", { name: /send to zylo/i }));

    await waitFor(() => expect(mockSubmitImportRequest).toHaveBeenCalledTimes(1));
    expect(mockSubmitImportRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "url",
        content: "https://www.instagram.com/p/DLFBmZ2sUCx/"
      })
    );
  });
});
