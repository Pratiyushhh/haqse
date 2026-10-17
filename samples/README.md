# Sample images for testing HaqSe

HaqSe reads photos of payout screens, bills and documents. Most people opening it for the first
time don't have an Indian gig-work payout screenshot to hand, so these are here to make every
camera feature testable in about two minutes.

They are **synthetic**. Every one is drawn from scratch by [`generate.py`](generate.py) — none is
a photograph of anyone's real payout or document, and the two identity documents carry a visible
SAMPLE marking so they cannot be mistaken for genuine ones.

Download one, then use **🖼 Choose from gallery** in the app.

---

## Upload these in order

The order matters: the Deduction Detective compares a payout against the worker's own history, so
it needs a clean week on file before it can tell that something is unusual.

| # | File | Where | What it should do |
|---|---|---|---|
| 1 | `1-payout-swiggy-clean.png` | Hisaab | A normal week. Ledger fills, real hourly rate appears, and it is compared against your state's minimum wage. TDS is **not** flagged — it's statutory tax, not something to contest. |
| 2 | `2-payout-swiggy-penalty.png` | Hisaab | Same platform, next week, with a ₹400 "Quality penalty" that has never appeared before. **The Deduction Detective flags it.** |
| 3 | `3-payout-blinkit.png` | Hisaab | A second platform. The income certificate now shows a real platform mix. |
| 4 | `4-petrol-bill.png` | Hisaab | Recognised as an expense, not earnings. Your net and true hourly rate both drop. |
| 5 | `5-driving-licence.png` | Kaagaz | Read and stored with the number **masked** — only the last four characters are kept. Valid until Jan 2027, so it shows as covered. |
| 6 | `6-puc-certificate.png` | Kaagaz | Expires 27 Oct 2026, so it triggers the **urgent renewal warning** with the real fine for being caught without it. |

## Then try the rest of the app

Once the ledger has data, the other flows have something real to work with:

- **Saathi** → ask *"Aaj tak kitna bacha?"* — it answers from the payouts you just uploaded, and
  refuses to invent anything they don't contain. Tap **🔊 Read aloud** to hear it.
- **Likho** → *"Swiggy ne quality penalty mein ₹400 kaat liye, galat tha"* — it pulls the flagged
  deduction in as evidence and writes four letters.
- **Haq** → your matched schemes, ranked, with official links.
- **Safety** → live weather for your city, and the order break-even calculator.
- **AI log** (top right) → every model call made, with real token counts and latency.

## Regenerating them

```bash
pip install pillow
python samples/generate.py
```

Edit the values in `generate.py` to test other cases — a payout with no hours printed on it, a
much larger penalty, an already-expired document.
