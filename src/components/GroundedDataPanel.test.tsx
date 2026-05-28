import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Id } from '../../convex/_generated/dataModel';
import { GroundedDataPanel } from './GroundedDataPanel';

const GROUNDED_FILE_INPUT_ID = 'grounded-file-input';

afterEach(() => {
  cleanup();
});

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

  const view = render(<GroundedDataPanel {...props} />);
  return { onUploadFiles, ...view };
}

describe('GroundedDataPanel', () => {
  it('links Upload file label to the hidden file input', () => {
    const { container } = renderPanel();

    const fileInput = within(container).getByLabelText(/upload grounded context files/i);
    expect(fileInput).toHaveAttribute('id', GROUNDED_FILE_INPUT_ID);
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveClass('grounded-file-input');

    const uploadLabel = within(container).getByText('Upload file');
    expect(uploadLabel.tagName).toBe('LABEL');
    expect(uploadLabel).toHaveAttribute('for', GROUNDED_FILE_INPUT_ID);
  });

  it('opens file picker from drag-drop area via programmatic click', async () => {
    const user = userEvent.setup();
    const { container } = renderPanel();

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
    await user.click(
      within(container).getByRole('button', { name: /open grounded context file picker/i })
    );
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('uploads when a file is selected via the file input', async () => {
    const user = userEvent.setup();
    const { onUploadFiles, container } = renderPanel();

    const fileInput = within(container).getByLabelText(/upload grounded context files/i);
    const file = new File(['hello world'], 'notes.txt', { type: 'text/plain' });

    await user.upload(fileInput, file);

    expect(onUploadFiles).toHaveBeenCalledTimes(1);
    expect(onUploadFiles.mock.calls[0]?.[0]).toBeInstanceOf(FileList);
  });

  it('disables upload controls while uploading', () => {
    const { container } = renderPanel({ isUploading: true });

    expect(within(container).getByText('Upload file')).toHaveAttribute('aria-disabled', 'true');
    expect(within(container).getByLabelText(/upload grounded context files/i)).toBeDisabled();
  });
});
