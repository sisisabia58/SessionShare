import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Download, X } from 'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
import { QRCodeCanvas } from 'qrcode.react';
import { userApi, paymentApi } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const planName = location.state?.planName;
  const totalPrice = location.state?.totalPrice;
  const totalDays = location.state?.totalDays;
  const orderId = location.state?.orderId;
  const qrString = location.state?.qrString;
  const expiredAtStr = location.state?.expiredAt;

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval>>();
  const countTimerRef = useRef<ReturnType<typeof setInterval>>();
  const qrRef = useRef<HTMLDivElement>(null);

  // Download the full QRIS card (header + QR + footer) as a PNG.
  // We draw everything onto an offscreen canvas to match the white card UI.
  const handleDownloadQR = () => {
    const qrCanvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!qrCanvas) return;

    // 2× scale for sharp output on retina/mobile screens
    const scale    = 2;
    const qrSize   = 200 * scale;
    const pad      = 28 * scale;
    const headerH  = 48 * scale;
    const footerH  = 44 * scale;
    const radius   = 18 * scale;

    const W = qrSize + pad * 2;
    const H = qrSize + headerH + footerH + pad * 2;

    const out = document.createElement('canvas');
    out.width  = W;
    out.height = H;
    const ctx = out.getContext('2d')!;

    // ── White rounded card background ──────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, radius);
    ctx.fill();

    // ── Header: "QRIS" left, "SESSION SHARE" right ─────────────────
    const headerMidY = pad + headerH / 2;
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#000000';
    ctx.font = `bold ${18 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('QRIS', pad, headerMidY);

    ctx.fillStyle = '#71717a';
    ctx.font = `${8 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('SESSION SHARE', W - pad, headerMidY);

    // ── QR code (with thin border) ──────────────────────────────────
    const qrX = pad;
    const qrY = pad + headerH;

    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1 * scale;
    const bPad = 4 * scale;
    ctx.strokeRect(qrX - bPad, qrY - bPad, qrSize + bPad * 2, qrSize + bPad * 2);

    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // ── Footer text ─────────────────────────────────────────────────
    ctx.fillStyle = '#a1a1aa';
    ctx.font = `${8 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(
      'One QR for all e-wallets & mobile banking',
      W / 2,
      qrY + qrSize + footerH / 2 + 4 * scale,
    );

    // ── Trigger download ────────────────────────────────────────────
    const link = document.createElement('a');
    link.href     = out.toDataURL('image/png');
    link.download = `SessionShare-QRIS-${orderId?.slice(0, 8) ?? 'payment'}.png`;
    link.click();
  };

  useEffect(() => {
    if (!orderId || !qrString || !expiredAtStr) {
      // If accessed without order state, redirect back to order premium page
      showToast('warning', 'Session expired or invalid transaction.');
      navigate('/order-premium');
      return;
    }

    const expiryTime = new Date(expiredAtStr).getTime();

    // 1. Countdown timer
    const updateCountdown = async () => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        if (countTimerRef.current) clearInterval(countTimerRef.current);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);

        // Final status check before showing "Expired":
        // User may have paid after the 15-min UI deadline but within Pakasir's
        // real 1-hour window. If the webhook already processed it, redirect.
        try {
          const { order } = await userApi.getOrder(orderId!);
          if (order.status === 'completed') {
            showToast('success', 'Payment received! Premium plan activated.');
            navigate('/dashboard');
            return;
          }
        } catch {
          // Silently fall through to expired state
        }

        setIsExpired(true);
        setTimeLeft('Expired');
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    countTimerRef.current = setInterval(updateCountdown, 1000);

    // 2. Poll Order Status
    const pollStatus = async () => {
      try {
        const { order } = await userApi.getOrder(orderId);
        if (order.status === 'completed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          if (countTimerRef.current) clearInterval(countTimerRef.current);
          showToast('success', 'Payment successful! Premium plan activated.');
          navigate('/dashboard');
        } else if (order.status === 'expired' || order.status === 'cancelled') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          if (countTimerRef.current) clearInterval(countTimerRef.current);
          setIsExpired(true);
          showToast('error', `Order status: ${order.status}`);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    pollTimerRef.current = setInterval(pollStatus, 5000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countTimerRef.current) clearInterval(countTimerRef.current);
    };
  }, [orderId, qrString, expiredAtStr, navigate, showToast]);

  // Cancel order: notify Pakasir + update DB, then navigate away
  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await paymentApi.cancelOrder(orderId!);
      showToast('info', 'Payment cancelled successfully.');
      navigate('/order-premium');
    } catch (err: any) {
      showToast('error', err?.message ?? 'Failed to cancel payment. Please try again.');
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  if (!orderId || !qrString) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/cart"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Back to cart">
              
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Complete Payment
              </h1>
              <p className="text-zinc-400 text-sm">
                Scan the QRIS code to activate your premium access.
              </p>
            </div>
          </div>

          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="glass-card rounded-3xl overflow-hidden">
            
            {/* Payment Header */}
            <div className="bg-lime-400/10 border-b border-lime-400/20 p-6 text-center">
              <p className="text-sm text-lime-400 font-bold mb-2 uppercase tracking-wider">
                Total Amount Due
              </p>
              <div className="text-4xl sm:text-5xl font-extrabold text-white">
                Rp {totalPrice?.toLocaleString('id-ID')}
              </div>
              <p className="text-zinc-400 text-sm mt-2">
                {planName} Plan — {totalDays} Days Access
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* QRIS Code */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-5 rounded-2xl shadow-2xl mb-4 flex flex-col items-center">
                  {/* QRIS header label */}
                  <div className="flex items-center justify-between mb-3 w-full px-1">
                    <span className="text-black font-extrabold tracking-tight text-lg">QRIS</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Session Share
                    </span>
                  </div>
                  
                  {isExpired ? (
                    <div className="w-[200px] h-[200px] bg-zinc-100 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-zinc-200">
                      <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                      <span className="text-xs text-zinc-600 font-bold">QRIS Code Expired</span>
                      <span className="text-[10px] text-zinc-400 mt-1">Please create a new transaction.</span>
                    </div>
                  ) : (
                    <div ref={qrRef} className="p-2 bg-white rounded-xl border border-zinc-200">
                      <QRCodeCanvas value={qrString} size={200} />
                    </div>
                  )}

                  <p className="text-center text-[10px] text-zinc-500 mt-3 font-medium">
                    One QR for all e-wallets &amp; mobile banking
                  </p>
                </div>

                {!isExpired && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold bg-white/10 px-4 py-2 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                      Waiting for payment...
                    </div>
                    <span className="text-sm text-zinc-400 font-medium mt-1">
                      Expires in: <strong className="text-lime-400 font-mono">{timeLeft}</strong>
                    </span>
                    {/* Download QR — helpful on mobile where direct scanning isn't always possible */}
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-full transition-colors mt-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save QR as image
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-lime-400" />
                  Payment Instructions (QRIS Only)
                </h3>
                <ol className="space-y-4 text-sm text-zinc-300 list-decimal list-inside pl-2">
                  <li className="pl-2">
                    Open your preferred banking or e-wallet app (Gopay, OVO,
                    Dana, BCA, etc).
                  </li>
                  <li className="pl-2">
                    Select the <strong>Scan QR</strong> option.
                  </li>
                  <li className="pl-2">Scan the QR code displayed above.</li>
                  <li className="pl-2">
                    Verify the amount is exactly{' '}
                    <strong>Rp {totalPrice?.toLocaleString('id-ID')}</strong>.
                  </li>
                  <li className="pl-2">Confirm the payment in your app.</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isExpired}
                  className="w-full flex items-center justify-center py-4 rounded-full border border-white/10 text-zinc-400 font-medium hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* ── Confirmation Modal ────────────────────────────────────── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isCancelling && setShowCancelConfirm(false)}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-sm space-y-5 border border-white/10"
          >
            {/* Close button */}
            <button
              onClick={() => setShowCancelConfirm(false)}
              disabled={isCancelling}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + heading */}
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-lg font-bold">Cancel this payment?</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                The QR code will be invalidated and your pending order will be
                cancelled. You can start a new transaction anytime.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-1">
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Payment'
                )}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                className="w-full py-3.5 rounded-full border border-white/10 text-zinc-400 font-medium hover:bg-white/5 hover:text-white transition-colors disabled:opacity-40"
              >
                Keep QR
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}