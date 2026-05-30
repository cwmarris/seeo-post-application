import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/utils';
import { DashboardView } from './DashboardView';
import type { LinkedInPost } from '../utils/mockData';

function createSamplePosts(): LinkedInPost[] {
  return [
    {
      id: 'scheduled-test-post',
      authorId: 'dean',
      content: 'Scheduled post text',
      status: 'scheduled',
      scheduledTime: '2026-05-28T09:00:00',
      steepFocus: ['Technological'],
      tone: 'Tech Visionary',
    },
  ];
}

function DashboardHarness({ initialPosts }: { initialPosts: LinkedInPost[] }) {
  const [posts, setPosts] = React.useState(initialPosts);

  return (
    <DashboardView
      posts={posts}
      rlScore={0}
      averageRating={0}
      totalRated={0}
      handlePostNow={(id) => {
        setPosts((current) =>
          current.map((p) => (p.id === id ? { ...p, status: 'published' } : p))
        );
      }}
      handleUpdateScheduledPost={(id, updates) => {
        setPosts((current) =>
          current.map((p) =>
            p.id === id ?
              { ...p, content: updates.content, scheduledTime: updates.scheduledTime, authorId: updates.authorId }
            : p
          )
        );
      }}
    />
  );
}

function renderDashboard(posts = createSamplePosts()) {
  return renderApp(
    <DashboardHarness initialPosts={posts} />
  );
}

describe('DashboardView scheduled queue modal', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens the modal on card click', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole('button', { name: /open scheduled post scheduled-test-post/i }));
    expect(screen.getByRole('dialog', { name: /scheduled post details/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/post content/i)).toBeInTheDocument();
  });

  it('persists edits and reflects in the queue card', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole('button', { name: /open scheduled post scheduled-test-post/i }));

    const editor = screen.getByLabelText(/post content/i);
    fireEvent.change(editor, { target: { value: 'Updated scheduled post text' } });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Modal closed
    expect(screen.queryByRole('dialog', { name: /scheduled post details/i })).not.toBeInTheDocument();

    // Queue card preview updated
    const queueCard = screen.getByRole('button', { name: /open scheduled post scheduled-test-post/i });
    expect(within(queueCard).getByText('Updated scheduled post text')).toBeInTheDocument();
  });

  it('does not show a LinkedIn preview link for dry-run posts', () => {
    renderDashboard([
      {
        id: 'dry-run-post',
        authorId: 'craig',
        content: 'Dry run post',
        status: 'published',
        steepFocus: ['Social'],
        tone: 'Thought Leader',
        publishResult: {
          mode: 'dry_run',
          message: 'Would post to LinkedIn (dry run)',
          previewUrl: 'https://www.linkedin.com/feed/?seeo_dry_run=urn%3Ali%3Aperson%3A1',
        },
      },
    ]);

    expect(screen.getByRole('status')).toHaveTextContent(/no live linkedin post was created/i);
    expect(screen.queryByRole('link', { name: /open on linkedin/i })).not.toBeInTheDocument();
  });

  it('shows the LinkedIn preview link for live posts', () => {
    renderDashboard([
      {
        id: 'live-post',
        authorId: 'craig',
        content: 'Live post',
        status: 'published',
        steepFocus: ['Social'],
        tone: 'Thought Leader',
        publishResult: {
          mode: 'live',
          message: 'Posted to LinkedIn.',
          previewUrl: 'https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A999',
        },
      },
    ]);

    const link = screen.getByRole('link', { name: /open on linkedin/i });
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A999');
  });
});
