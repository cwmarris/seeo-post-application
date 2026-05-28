import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroundedDocumentsBridge } from './GroundedDocumentsBridge';

describe('GroundedDocumentsBridge (local mode)', () => {
  it('uploads a .txt file and shows it in the list', async () => {
    const user = userEvent.setup();
    const onEffectiveGroundedTextChange = vi.fn();

    render(<GroundedDocumentsBridge onEffectiveGroundedTextChange={onEffectiveGroundedTextChange} />);

    expect(screen.getByText(/convex is not configured/i)).toBeInTheDocument();

    const fileInput = screen.getByLabelText(/upload grounded context files/i);
    const file = new File(['hello world'], 'notes.txt', { type: 'text/plain' });

    await user.upload(fileInput, file);

    expect(await screen.findByText('notes.txt')).toBeInTheDocument();
  });
});

