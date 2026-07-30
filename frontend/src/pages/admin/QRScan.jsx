import { Camera, KeyRound, QrCode, ScanLine, StopCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import ActionButton from '../../components/ActionButton.jsx';
import Badge from '../../components/Badge.jsx';
import { Card } from '../../components/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import api from '../../lib/api.js';

/**
 * Extract the QR token from scanned data.
 * Handles both raw tokens ("abc123") and URL format ("/admin/scan?token=abc123").
 */
function extractToken(rawData) {
  const text = (rawData || '').trim();
  if (!text) return '';
  try {
    // If it looks like a URL, extract the token param
    const url = new URL(text, 'http://dummy');
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) return tokenParam;
  } catch {
    // Not a URL — treat as raw token
  }
  return text;
}

export default function QRScan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannedBook, setScannedBook] = useState(null);
  const [scannedCopy, setScannedCopy] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const frameCheckRef = useRef(null);

  // Browsers require HTTPS (or localhost) to reliably deliver camera frames.
  // Over plain http, some corporate setups let the permission prompt through
  // but the stream never actually delivers video — a black, frozen picture.
  const insecureContext = typeof window !== 'undefined'
    && window.isSecureContext === false
    && location.hostname !== 'localhost';

  // Auto-resolve token from URL params (phone camera scan opens this URL)
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      resolveToken(urlToken);
    }
  }, [searchParams]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      clearTimeout(frameCheckRef.current);
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, []);

  async function resolveToken(token) {
    const t = token.trim();
    if (!t) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/books/scan/${encodeURIComponent(t)}`);
      if (data.book) {
        setScannedBook(data.book);
        setScannedCopy(data.copy);
      } else {
        setError('No book found for this QR code.');
      }
    } catch (err) {
      setError(err.message || 'QR code not recognised. Make sure it belongs to a library book.');
    } finally {
      setLoading(false);
    }
  }

  async function startScan() {
    setError('');
    setScannedBook(null);
    setScannedCopy(null);

    if (!videoRef.current) {
      setError('Video element not ready. Please try again.');
      return;
    }

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          // Stop scanning after first successful read
          scanner.stop();
          scannerRef.current = null;
          setScanning(false);
          const token = extractToken(result.data);
          if (token) resolveToken(token);
        },
        {
          onDecodeError: () => {}, // per-frame decode errors are expected
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
        }
      );

      scannerRef.current = scanner;
      await scanner.start();
      setScanning(true);

      // The camera permission can succeed while the stream never actually
      // delivers frames (black/frozen video) — most often an insecure (http)
      // origin, a physical privacy shutter, or another app holding the camera.
      // Detect that instead of leaving the admin staring at a dead preview.
      clearTimeout(frameCheckRef.current);
      frameCheckRef.current = setTimeout(() => {
        const video = videoRef.current;
        if (video && scannerRef.current && video.videoWidth === 0) {
          stopScan();
          setError(
            insecureContext
              ? 'Camera opened but no picture is coming through — this page is loaded over http, and most browsers silently break camera capture on insecure origins. Ask IT to enable HTTPS, or use the manual token field below.'
              : 'Camera opened but no picture is coming through. Check for a physical camera privacy shutter, close any other app using the camera (Teams/Zoom), and try again — or use the manual token field below.'
          );
        }
      }, 3000);
    } catch (err) {
      console.error('QR Scanner error:', err);
      setError('Camera unavailable. Grant camera permission or use the manual token field below.');
    }
  }

  function stopScan() {
    clearTimeout(frameCheckRef.current);
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setScanning(false);
  }

  function handleManualLookup(e) {
    e.preventDefault();
    resolveToken(manualToken);
  }

  // ── Issue/reserve-for-employee form state ──
  const [empEmail, setEmpEmail] = useState('');
  const [empSuggestions, setEmpSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [borrowDays, setBorrowDays] = useState(7);
  const [borrowing, setBorrowing] = useState(false);
  const [borrowFlash, setBorrowFlash] = useState({ type: '', msg: '' });

  // Look up matching employees as the admin types, so they don't have to know
  // the exact email — pick a name off the list instead.
  useEffect(() => {
    const query = empEmail.trim();
    if (query.length < 2) {
      setEmpSuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      api.get(`/employees?search=${encodeURIComponent(query)}&per_page=6`)
        .then(data => setEmpSuggestions(data.employees || []))
        .catch(() => setEmpSuggestions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [empEmail]);

  function selectEmployee(emp) {
    setEmpEmail(emp.email);
    setEmpSuggestions([]);
    setShowSuggestions(false);
  }

  const isIssue = !!scannedCopy?.id;

  async function handleBorrow() {
    if (!empEmail.trim() || !scannedBook?.id) return;
    setBorrowing(true);
    setBorrowFlash({ type: '', msg: '' });
    try {
      if (isIssue) {
        // Copy-level scan -> issue this specific copy to the employee
        await api.post('/borrow', {
          book_copy_id: scannedCopy.id,
          days_requested: borrowDays,
          employee_email: empEmail.trim(),
        });
        setBorrowFlash({ type: 'success', msg: `Book issued to ${empEmail} — return by ${new Date(Date.now() + borrowDays * 86400000).toLocaleDateString()}` });
      } else {
        // Book-level scan -> no specific copy in hand, so reserve on their behalf
        await api.post('/reservations', {
          book_id: scannedBook.id,
          employee_email: empEmail.trim(),
        });
        setBorrowFlash({ type: 'success', msg: `Book reserved for ${empEmail}. They'll be notified when it's ready.` });
      }
    } catch (err) {
      setBorrowFlash({ type: 'error', msg: err.data?.error || err.message || 'Failed to process request' });
    } finally {
      setBorrowing(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Circulation desk"
        title="Scan a Book QR Code"
        description="Scan a book's QR label to issue or reserve it for an employee. This is a librarian-desk workflow — employees no longer scan on their own devices."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Scanner panel */}
        <Card className="p-5">
          {insecureContext && (
            <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              This page is loaded over http, not https. Most browsers block or silently break live camera capture on insecure pages — if the camera shows a black screen, that's almost certainly why. Ask IT to enable HTTPS for this site, or use the manual token field below in the meantime.
            </p>
          )}
          {/*
            qr-scanner wraps the <video> in its own <div> with position:relative
            and sets the video to position:absolute. We need to let that wrapper
            fill our container, so we use explicit height + relative positioning.
          */}
          <style>{`
            .qr-container video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              border-radius: 1rem;
            }
            .qr-container > div {
              width: 100% !important;
              height: 100% !important;
            }
            .qr-container .scan-region-highlight {
              border-radius: 12px;
            }
            .qr-container .scan-region-highlight-svg {
              stroke: #f59e0b !important;
            }
            .qr-container .code-outline-highlight {
              stroke: #10b981 !important;
              stroke-width: 3 !important;
            }
          `}</style>
          <div
            className="qr-container relative overflow-hidden rounded-3xl bg-navy-950"
            style={{ height: '420px' }}
          >
            {/* Grid background — hidden when camera is active */}
            {!scanning && (
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />
            )}

            {/* Video element — qr-scanner takes control of this */}
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: scanning ? 'block' : 'none',
              }}
            />

            {!scanning && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative grid h-64 w-64 place-items-center rounded-3xl border-2 border-sky-300/70 bg-white/5">
                  <ScanLine className="absolute top-8 h-8 w-48 text-emerald-300" />
                  <QrCode size={120} className="text-white" />
                  <span className="absolute -bottom-12 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy-900">
                    <Camera size={17} /> Ready to scan
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {scanning
                ? 'Scanning — hold the QR code steady in the frame.'
                : 'Click Start Scan to activate the camera.'}
            </p>
            {scanning
              ? <ActionButton icon={StopCircle} variant="subtle" onClick={stopScan}>Stop Scan</ActionButton>
              : (
                <ActionButton icon={QrCode} variant="gradient" onClick={startScan} disabled={loading}>
                  {loading ? 'Looking up…' : 'Start Scan'}
                </ActionButton>
              )
            }
          </div>

          {/* Manual token entry for testing without a physical QR print */}
          <form onSubmit={handleManualLookup} className="mt-4 flex gap-2 border-t border-corporate-line pt-4">
            <input
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder="Paste QR token manually…"
              className="flex-1 rounded-xl border border-corporate-line px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <ActionButton
              type="submit"
              icon={KeyRound}
              variant="subtle"
              disabled={loading || !manualToken.trim()}
            >
              Look up
            </ActionButton>
          </form>
        </Card>

        {/* Result + Borrow panel */}
        <Card className="p-5">
          {!scannedBook ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 text-slate-400">
              <QrCode size={56} />
              <p className="text-center text-sm font-semibold">Scan result will appear here</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-600">
                <Camera size={18} /> Scan successful
              </div>
              <h2 className="text-2xl font-extrabold text-corporate-ink">{scannedBook.title}</h2>
              <p className="mt-1 text-slate-500">by {scannedBook.author}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {scannedBook.isbn && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">ISBN</p>
                    <p className="mt-1 font-bold text-corporate-ink">{scannedBook.isbn}</p>
                  </div>
                )}
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400">Status</p>
                  <p className="mt-1"><Badge>{scannedCopy?.status === 'available' ? 'Available' : scannedCopy?.status || 'Book-level'}</Badge></p>
                </div>
                {scannedCopy?.copy_code && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Copy Code</p>
                    <p className="mt-1 font-bold text-corporate-ink">{scannedCopy.copy_code}</p>
                  </div>
                )}
                {scannedBook.category && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Category</p>
                    <p className="mt-1 font-bold text-corporate-ink">{scannedBook.category}</p>
                  </div>
                )}
              </div>

              {/* ── Issue / Reserve Form ── */}
              <div className="mt-6 border-t border-corporate-line pt-5">
                <h3 className="mb-4 text-lg font-extrabold text-corporate-ink">
                  {isIssue ? 'Issue This Book' : 'Reserve This Book'}
                </h3>
                {!isIssue && (
                  <p className="mb-4 -mt-2 text-sm text-slate-500">
                    This QR is a book-level label with no specific copy attached, so this will place a reservation instead of an immediate issue.
                  </p>
                )}

                {borrowFlash.msg && (
                  <div className={`mb-4 rounded-xl p-3 text-sm font-semibold ${borrowFlash.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {borrowFlash.msg}
                  </div>
                )}

                <div className="grid gap-4">
                  {/* Employee lookup */}
                  <div className="relative">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Employee Name or Email</label>
                    <input
                      type="text"
                      value={empEmail}
                      onChange={e => setEmpEmail(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Start typing a name or email…"
                      autoComplete="off"
                      className="w-full rounded-xl border border-corporate-line px-3 py-2.5 text-sm text-corporate-ink focus:outline-none focus:ring-2 focus:ring-navy-500"
                    />
                    {showSuggestions && empSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-corporate-line bg-white shadow-soft">
                        {empSuggestions.map(emp => (
                          <button
                            type="button"
                            key={emp.id}
                            onClick={() => selectEmployee(emp)}
                            className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="font-bold text-corporate-ink">{emp.name}</span>
                            <span className="text-xs text-slate-500">{emp.email}{emp.department ? ` · ${emp.department}` : ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isIssue && (
                    <>
                      {/* Borrow Duration */}
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Borrow Duration (Days)</label>
                        <div className="flex flex-wrap items-center gap-2">
                          {[7, 14, 21, 30].map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setBorrowDays(d)}
                              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${borrowDays === d ? 'border-navy-500 bg-navy-50 text-navy-700' : 'border-corporate-line bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                              {d} days
                            </button>
                          ))}
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={borrowDays}
                            onChange={e => setBorrowDays(Math.max(1, Math.min(90, Number(e.target.value))))}
                            className="w-20 rounded-xl border border-corporate-line px-3 py-2 text-center text-sm font-bold text-corporate-ink focus:outline-none focus:ring-2 focus:ring-navy-500"
                          />
                        </div>
                      </div>

                      {/* Issue / Return dates preview */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-navy-50 p-3">
                          <p className="text-xs font-bold uppercase text-navy-400">Issue Date</p>
                          <p className="mt-1 font-bold text-navy-800">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="rounded-xl bg-navy-50 p-3">
                          <p className="text-xs font-bold uppercase text-navy-400">Return By</p>
                          <p className="mt-1 font-bold text-navy-800">{new Date(Date.now() + borrowDays * 86400000).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Issue / Reserve Button */}
                  <ActionButton
                    icon={QrCode}
                    variant="gradient"
                    className="w-full justify-center py-3 text-base"
                    onClick={handleBorrow}
                    disabled={borrowing || !empEmail.trim()}
                  >
                    {isIssue
                      ? (borrowing ? 'Issuing…' : 'Issue Book')
                      : (borrowing ? 'Reserving…' : 'Reserve Book')}
                  </ActionButton>
                </div>
              </div>
            </>
          )}
        </Card>

      </div>
    </>
  );
}
