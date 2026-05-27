import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { renderApp } from '../test/utils';

describe('DashboardView scheduled queue modal', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens the modal on card click', async () => {
    const user = userEvent.setup();
    renderApp(<App />);

    await user.click(screen.getByRole('button', { name: /open scheduled post post-2/i }));
    expect(screen.getByRole('dialog', { name: /scheduled post details/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/post content/i)).toBeInTheDocument();
  });

  it('persists edits and reflects in the queue card', async () => {
    const user = userEvent.setup();
    renderApp(<App />);

    await user.click(screen.getByRole('button', { name: /open scheduled post post-2/i }));

    const editor = screen.getByLabelText(/post content/i);
    fireEvent.change(editor, { target: { value: 'Updated scheduled post text' } });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Modal closed
    expect(screen.queryByRole('dialog', { name: /scheduled post details/i })).not.toBeInTheDocument();

    // Queue card preview updated
    const queueCard = screen.getByRole('button', { name: /open scheduled post post-2/i });
    expect(within(queueCard).getByText('Updated scheduled post text')).toBeInTheDocument();
  });
});

