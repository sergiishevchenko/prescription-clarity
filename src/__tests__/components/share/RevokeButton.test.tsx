import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RevokeButton } from "@/components/share/RevokeButton";

describe("RevokeButton", () => {
  it("renders default label", () => {
    render(<RevokeButton onClick={() => {}} />);

    expect(screen.getByRole("button", { name: /revoke/i })).toBeInTheDocument();
  });

  it("shows loading state when loading is true", () => {
    render(<RevokeButton onClick={() => {}} loading />);

    expect(
      screen.getByRole("button", { name: /revoking/i }),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<RevokeButton onClick={handleClick} />);

    await user.click(screen.getByRole("button", { name: /revoke/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<RevokeButton onClick={handleClick} disabled />);

    await user.click(screen.getByRole("button", { name: /revoke/i }));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
