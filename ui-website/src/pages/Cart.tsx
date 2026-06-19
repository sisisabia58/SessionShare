import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, ArrowRight } from 'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
import { paymentApi } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export function Cart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Default to Pro plan if accessed directly
  const planName = location.state?.planName || 'Premium';
  const basePrice = location.state?.basePrice || 50000;
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };
  const handleIncrease = () => {
    if (quantity < 12) setQuantity((q) => q + 1);
  };
  const totalPrice = quantity * basePrice;
  const totalDays = quantity * 30;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      let planCode = 'basic';
      if (planName.includes('Phantom')) {
        planCode = 'premium_phantom';
      } else if (planName === 'Premium' || planName === 'Pro') {
        planCode = 'premium';
      }

      const res = await paymentApi.createOrder({
        plan: planCode,
        plan_display_name: `${planName} Plan`,
        quantity,
        total_days: totalDays,
        amount: totalPrice,
      });

      navigate('/payment', {
        state: {
          planName,
          totalPrice,
          totalDays,
          quantity,
          orderId: res.order_id,
          qrString: res.qr_string,
          expiredAt: res.expired_at,
        }
      });
    } catch (err: any) {
      showToast('error', err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/order-premium"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Back to plans">
              
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Your Cart</h1>
              <p className="text-zinc-400 text-sm">
                Review your plan and select duration.
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
            className="glass-card rounded-3xl p-6 sm:p-8">
            
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
              <div className="w-12 h-12 rounded-xl bg-lime-400/10 flex items-center justify-center text-lime-400">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{planName} Plan</h2>
                <p className="text-zinc-400 text-sm">
                  Rp {basePrice.toLocaleString('id-ID')} per 30 days
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-4">
                  Select Duration (Quantity)
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-1">
                    <button
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
                      
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-12 text-center font-bold text-lg">
                      {quantity}
                    </div>
                    <button
                      onClick={handleIncrease}
                      disabled={quantity >= 12}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
                      
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-zinc-400 text-sm">
                    ={' '}
                    <span className="font-bold text-white">
                      {totalDays} days
                    </span>{' '}
                    of access
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold mb-4">Order Summary</h3>
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>
                    {planName} Plan ({quantity}x)
                  </span>
                  <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Taxes & Fees</span>
                  <span>Rp 0</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="font-bold text-lg">Total Due</span>
                  <span className="font-extrabold text-2xl text-lime-400">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-lime-400 text-black font-bold text-lg hover:bg-lime-500 transition-colors group disabled:opacity-50">
                {loading ? 'Processing...' : 'Proceed to Checkout'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}