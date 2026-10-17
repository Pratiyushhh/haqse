import { useState } from 'react';
import { PhotoPicker } from '../components/PhotoPicker';
import { Busy, Card, ErrorNote } from '../components/ui';
import { callAI, compressImage } from '../lib/api';
import { daysUntil, newId, type AppState, type DocRecord } from '../lib/store';

type Extracted = {
  docType: string;
  numberMasked: string;
  holderName: string;
  expiryDate: string;
  confidence: string;
  note: string;
};

const LABELS: Record<string, string> = {
  driving_licence: 'Driving Licence',
  rc: 'Vehicle RC',
  insurance: 'Insurance',
  puc: 'PUC certificate',
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  eshram: 'e-Shram card',
  other: 'Document',
  unreadable: 'Could not read',
};

/** What it costs to be caught without each document, so the nudge has teeth. */
const PENALTY: Record<string, string> = {
  puc: '₹10,000 fine under the Motor Vehicles Act',
  insurance: '₹2,000 fine and your claim refused after an accident',
  driving_licence: '₹5,000 fine for driving without a valid licence',
  rc: 'Vehicle can be seized',
};

export default function Documents({
  state,
  addDocument,
}: {
  state: AppState;
  addDocument: (d: DocRecord) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const { base64, mimeType } = await compressImage(file);
      const r = await callAI<Extracted>('extract_document', { imageBase64: base64, mimeType });
      if (r.docType === 'unreadable') {
        setError(`Could not read that document. ${r.note}`);
        return;
      }
      addDocument({
        id: newId(),
        docType: r.docType,
        numberMasked: r.numberMasked,
        holderName: r.holderName,
        expiryDate: r.expiryDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...state.documents].sort((a, b) => {
    const da = daysUntil(a.expiryDate) ?? 99999;
    const db = daysUntil(b.expiryDate) ?? 99999;
    return da - db;
  });

  return (
    <Card
      title="Kaagaz — your documents"
      sub="Photograph a licence, RC, insurance or PUC. The app reads the expiry date and warns you before it runs out."
    >
      <PhotoPicker
        disabled={busy}
        onFile={(f) => void onFile(f)}
        cameraLabel="📄 Take a photo"
        galleryLabel="🖼 Choose from gallery"
      />
      {busy && <Busy label="Reading the document…" />}
      <ErrorNote error={error} />

      <div className="banner ok" style={{ marginTop: 12 }}>
        <strong>Your numbers stay yours</strong>
        Only the last four characters of any document number are ever kept, and everything stays on
        this phone. The photo itself is never stored.
      </div>

      {sorted.length === 0 ? (
        <p className="muted">No documents saved yet.</p>
      ) : (
        <ul className="list" style={{ marginTop: 12 }}>
          {sorted.map((d) => {
            const days = daysUntil(d.expiryDate);
            const urgent = days !== null && days <= 30;
            const expired = days !== null && days < 0;
            return (
              <li key={d.id}>
                <strong>{LABELS[d.docType] ?? d.docType}</strong>
                <div className="muted">
                  {d.numberMasked || 'number not read'}
                  {d.holderName ? ` · ${d.holderName}` : ''}
                </div>
                {d.expiryDate ? (
                  <div
                    className={`banner ${expired ? 'danger' : urgent ? 'warn' : 'ok'}`}
                    style={{ marginTop: 6 }}
                  >
                    <strong>
                      {expired
                        ? `Expired ${Math.abs(days!)} days ago`
                        : `Expires in ${days} days (${d.expiryDate})`}
                    </strong>
                    {(expired || urgent) && PENALTY[d.docType]
                      ? `Riding without it: ${PENALTY[d.docType]}. Renew this week.`
                      : 'You are covered for now.'}
                  </div>
                ) : (
                  <div className="muted">No expiry date on this document.</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
