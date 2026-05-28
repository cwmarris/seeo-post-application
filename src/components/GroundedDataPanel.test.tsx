import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Id } from '../../convex/_generated/dataModel';
import { GroundedDataPanel } from './GroundedDataPanel';

function renderPanel(overrides?: Partial<React.ComponentProps<typeof GroundedDataPanel>>) {
  const onUploadFiles = vi.fn().mockResolvedValue(undefined);
  const props: React.ComponentProps<typeof GroundedDataPanel> = {
    convexReady: true,
    documents: [],
    isLoading: false,
    selectedDocIds: [] as Id<'groundedDocuments'>[],
    setSelectedDocIds: vi.fn(),
    manualGroundedText: '',
    setManualGroundedText: vi.fn(),
    onUploadFiles: onUploadFiles as unknown as (files: FileList | File[]) => Promise<void>,
    onSavePastedContext: vi.fn(async () => undefined),
    onDeleteDocument: vi.fn(async () => undefined),
    uploadError: null,
    uploadNotice: null,
    isUploading: false,
    ...overrides,
  };

  render(<GroundedDataPanel {...props} />);
  return { onUploadFiles };
}

describe('GroundedDataPanel', () => {
  it('supports click upload via visible button', async () => {
    const user = userEvent.setup();
    const { onUploadFiles } = renderPanel();

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
    await user.click(screen.getByRole('button', { name: /upload file/i }));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();

    const fileInput = screen.getByLabelText(/upload grounded context files/i);
    const file = new File(['hello world'], 'notes.txt', { type: 'text/plain' });

    await user.upload(fileInput, file);

    expect(onUploadFiles).toHaveBeenCalledTimes(1);
    expect(onUploadFiles.mock.calls[0]?.[0]).toBeInstanceOf(FileList);
  });
});

