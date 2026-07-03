import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'medium' | 'large';
}

export function Modal({ open, onClose, title, children, actions, size = 'medium' }: ModalProps) {
  if (!open) return null;

  const sizeClass = size === 'large' ? 'max-w-4xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} rounded-2xl border border-border bg-surface shadow-2xl`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1 rounded-lg hover:bg-raised">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {actions && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2 border-t border-border">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook-based prompt replacement
export function usePrompt() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    defaultValue: string;
    placeholder: string;
    resolve: ((value: string | null) => void) | null;
  }>({
    open: false,
    title: '',
    message: '',
    defaultValue: '',
    placeholder: '',
    resolve: null,
  });

  const prompt = useCallback(
    (title: string, message: string, defaultValue = '', placeholder = ''): Promise<string | null> => {
      return new Promise(resolve => {
        setState({
          open: true,
          title,
          message,
          defaultValue,
          placeholder,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = () => {
    const input = document.getElementById('modal-input') as HTMLInputElement;
    state.resolve?.(input?.value || null);
    setState(s => ({ ...s, open: false, resolve: null }));
  };

  const handleCancel = () => {
    state.resolve?.(null);
    setState(s => ({ ...s, open: false, resolve: null }));
  };

  const PromptDialog = () => {
    if (!state.open) return null;
    return (
      <Modal
        open={state.open}
        onClose={handleCancel}
        title={state.title}
        actions={
          <>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-secondary hover:text-primary border border-border rounded-xl hover:bg-raised transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm bg-primary text-canvas font-semibold rounded-xl hover:bg-white transition-colors"
            >
              Confirm
            </button>
          </>
        }
      >
        <p className="text-sm text-secondary mb-3">{state.message}</p>
        <input
          id="modal-input"
          type="text"
          defaultValue={state.defaultValue}
          placeholder={state.placeholder}
          onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
          className="w-full bg-canvas border border-border rounded-xl px-4 py-2.5 text-primary text-sm outline-none focus:border-primary/60 transition-colors"
          autoFocus
        />
      </Modal>
    );
  };

  return { prompt, PromptDialog };
}

// Confirmation dialog hook
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
    resolve: null,
  });

  const confirm = useCallback(
    (title: string, message: string, confirmLabel = 'Confirm', danger = false): Promise<boolean> => {
      return new Promise(resolve => {
        setState({ open: true, title, message, confirmLabel, danger, resolve });
      });
    },
    []
  );

  const handleConfirm = () => {
    state.resolve?.(true);
    setState(s => ({ ...s, open: false }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState(s => ({ ...s, open: false }));
  };

  const ConfirmDialog = () => {
    if (!state.open) return null;
    return (
      <Modal
        open={state.open}
        onClose={handleCancel}
        title={state.title}
        actions={
          <>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-secondary hover:text-primary border border-border rounded-xl hover:bg-raised transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                state.danger
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-primary text-canvas hover:bg-white'
              }`}
            >
              {state.confirmLabel}
            </button>
          </>
        }
      >
        <p className="text-sm text-secondary">{state.message}</p>
      </Modal>
    );
  };

  return { confirm, ConfirmDialog };
}
