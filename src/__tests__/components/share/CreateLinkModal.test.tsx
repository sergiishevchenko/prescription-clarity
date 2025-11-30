import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateLinkModal } from "@/components/share/CreateLinkModal";

jest.mock("@/components/shared/ToastProvider", () => ({
  useToast: () => jest.fn(),
}));

describe("CreateLinkModal", () => {
  it("returns null when closed or shareUrl is null", () => {
    const { container: closed } = render(
      <CreateLinkModal open={false} shareUrl={null} onClose={() => {}} />,
    );
    expect(closed.firstChild).toBeNull();

    const { container: noUrl } = render(
      <CreateLinkModal open shareUrl={null} onClose={() => {}} />,
    );
    expect(noUrl.firstChild).toBeNull();
  });

  it("renders share URL when open", () => {
    render(
      <CreateLinkModal
        open
        shareUrl="https://example.com/share/abc"
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByDisplayValue("https://example.com/share/abc"),
    ).toBeInTheDocument();
    expect(screen.getByText(/share your profile/i)).toBeInTheDocument();
  });

  it("copies link to clipboard when Copy is clicked", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn();

    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(
      <CreateLinkModal
        open
        shareUrl="https://example.com/share/abc"
        onClose={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith("https://example.com/share/abc");
  });
});
