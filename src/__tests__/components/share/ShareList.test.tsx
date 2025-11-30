import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareList, type ShareListItem } from "@/components/share/ShareList";

const items: ShareListItem[] = [
  {
    id: "1",
    name: "Viewer One",
    email: "one@example.com",
    connectedSince: "2025-11-28",
    status: "active",
  },
  {
    id: "2",
    name: "Viewer Two",
    email: "two@example.com",
    connectedSince: "2025-11-20",
    status: "revoked",
  },
];

describe("ShareList", () => {
  it("renders all items with name and email", () => {
    render(<ShareList items={items} onRevoke={() => {}} />);

    expect(screen.getByText("Viewer One")).toBeInTheDocument();
    expect(screen.getByText("one@example.com")).toBeInTheDocument();
    expect(screen.getByText("Viewer Two")).toBeInTheDocument();
    expect(screen.getByText("two@example.com")).toBeInTheDocument();
  });

  it("renders Revoke button only for active items", () => {
    render(<ShareList items={items} onRevoke={() => {}} />);

    expect(screen.getByRole("button", { name: /revoke/i })).toBeInTheDocument();
    expect(screen.getAllByText(/revoked/i).length).toBeGreaterThanOrEqual(1);
  });

  it("calls onRevoke with correct id when Revoke is clicked", async () => {
    const user = userEvent.setup();
    const handleRevoke = jest.fn();

    render(<ShareList items={items} onRevoke={handleRevoke} />);

    await user.click(screen.getByRole("button", { name: /revoke/i }));

    expect(handleRevoke).toHaveBeenCalledTimes(1);
    expect(handleRevoke).toHaveBeenCalledWith("1");
  });

  it("disables Revoke button when revokingId matches item id", () => {
    render(<ShareList items={items} onRevoke={() => {}} revokingId="1" />);

    const button = screen.getByRole("button", { name: /revoking/i });
    expect(button).toBeDisabled();
  });
});
