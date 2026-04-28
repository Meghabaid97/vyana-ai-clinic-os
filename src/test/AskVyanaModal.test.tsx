import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AskVyanaModal from "@/components/AskVyanaModal";

describe("<AskVyanaModal />", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <AskVyanaModal open={false} initialQuestion="" onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders empty state with suggestion chips when opened", () => {
    render(<AskVyanaModal open={true} initialQuestion="" onClose={() => {}} />);
    expect(screen.getByPlaceholderText(/Ask anything about your health/i)).toBeInTheDocument();
    expect(screen.getByText(/What does HbA1c 8.1 mean\?/i)).toBeInTheDocument();
  });

  it("calls onClose when the X button is clicked", () => {
    const onClose = vi.fn();
    render(<AskVyanaModal open={true} initialQuestion="" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/Close/i));
    expect(onClose).toHaveBeenCalled();
  });

  it("submits a question and renders the answer from the mocked edge function", async () => {
    render(<AskVyanaModal open={true} initialQuestion="What is BP?" onClose={() => {}} />);
    const askBtn = screen.getByRole("button", { name: /^Ask$/i });
    fireEvent.click(askBtn);
    await waitFor(() => {
      expect(screen.getByText(/High confidence/i)).toBeInTheDocument();
    });
  });
});
