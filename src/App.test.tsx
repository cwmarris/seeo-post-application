import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { renderApp } from './test/utils';

describe('App', () => {
  it('renders a single sidebar brand wordmark with TM', () => {
    renderApp(<App />);

    expect(screen.getByLabelText(/seeo trademark know/i)).toBeInTheDocument();
    expect(screen.getByText('TM')).toBeInTheDocument();
    expect(screen.queryByAltText(/seeo logo/i)).not.toBeInTheDocument();
  });

  it('navigates between tabs and updates the header title', async () => {
    const user = userEvent.setup();
    renderApp(<App />);

    expect(screen.getAllByRole('heading', { level: 1, name: 'Analytics Dashboard' })[0]).toBeInTheDocument();

    await user.click(screen.getAllByText('Post Composer')[0]);
    expect(screen.getAllByRole('heading', { level: 1, name: 'STEEP AI Post Composer' })[0]).toBeInTheDocument();
  });

  it('renders updated founder bios in the composer', async () => {
    const user = userEvent.setup();
    renderApp(<App />);

    await user.click(screen.getAllByText('Post Composer')[0]);

    const voiceContext = () => screen.getByText(/voice context:/i);

    // Craig
    expect(voiceContext()).toHaveTextContent('Co-founder of seeo.ai. Former President/Owner and co-founder of Coretex');

    // Dean
    await user.click(screen.getAllByText('Dean Marris')[0]);
    expect(voiceContext()).toHaveTextContent('Former co-founder of Coretex and Chief Data Science Officer at EROAD');

    // Bede
    await user.click(screen.getAllByText('Bede Cammock-Elliott')[0]);
    expect(voiceContext()).toHaveTextContent('Managing Director of seedigital');
  });

  it('generates a draft and shows the editor textarea', async () => {
    renderApp(<App />);

    fireEvent.click(screen.getAllByText('Post Composer')[0]);
    fireEvent.click(screen.getByRole('button', { name: /generate draft/i }));

    const editor = await screen.findByLabelText('Draft Content Editor', {}, { timeout: 4000 });
    expect(editor).not.toHaveValue('');
  }, 8000);
});

