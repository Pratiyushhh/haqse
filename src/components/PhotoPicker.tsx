import { useRef } from 'react';

/**
 * Two ways in, because a phone has two.
 *
 * `capture="environment"` opens the camera directly, which is right when the
 * worker is holding a paper bill. But a payout screen is usually already a
 * screenshot sitting in the gallery, and a camera-only input makes that
 * impossible to reach. So there are two inputs over one handler: the same
 * file either way.
 *
 * On desktop both open a file chooser, which is what an evaluator needs.
 */
export function PhotoPicker({
  onFile,
  disabled,
  cameraLabel,
  galleryLabel,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  cameraLabel: string;
  galleryLabel: string;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset so picking the same file twice still fires a change event.
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handle}
      />
      <input ref={galleryRef} type="file" accept="image/*" className="sr-only" onChange={handle} />

      <button className="primary" onClick={() => cameraRef.current?.click()} disabled={disabled}>
        {cameraLabel}
      </button>
      <button
        style={{ width: '100%', marginTop: 8 }}
        onClick={() => galleryRef.current?.click()}
        disabled={disabled}
      >
        {galleryLabel}
      </button>
    </>
  );
}
