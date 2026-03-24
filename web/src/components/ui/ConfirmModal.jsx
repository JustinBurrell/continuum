import Modal from './Modal';
import Button from './Button';

/**
 * Drop-in replacement for window.confirm.
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   // to open: setConfirm({ message: '...', onConfirm: () => doThing() })
 *   // to close: setConfirm(null)
 *
 *   <ConfirmModal
 *     open={!!confirm}
 *     message={confirm?.message}
 *     onConfirm={() => { confirm?.onConfirm(); setConfirm(null); }}
 *     onClose={() => setConfirm(null)}
 *   />
 */
export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-sm">
      <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
        {message}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
