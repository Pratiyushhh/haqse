import type { ReactNode } from 'react';
import { plainText } from '../lib/text';

export { plainText };

export function Card({ title, sub, children }: { title?: string; sub?: string; children: ReactNode }) {
  return (
    <section className="card">
      {title && <h2>{title}</h2>}
      {sub && <p className="sub">{sub}</p>}
      {children}
    </section>
  );
}

/**
 * Errors are shown, never swallowed and never replaced with plausible-looking
 * content. If a model call fails the worker sees that it failed.
 */
export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="banner danger" role="alert">
      <strong>Could not finish that</strong>
      {error}
    </div>
  );
}

export function Busy({ label }: { label: string }) {
  return (
    <p className="muted" role="status" aria-live="polite">
      <span className="spin" aria-hidden="true">
        ◌
      </span>{' '}
      {label}
    </p>
  );
}

export function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
