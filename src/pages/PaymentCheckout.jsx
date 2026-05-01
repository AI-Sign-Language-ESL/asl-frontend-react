import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';

const PaymentCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const plan = location.state?.plan || 'free';
  const price = location.state?.price || 0;

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate payment processing
    try {
      // Here you would integrate with Visa/payment provider
      // For now, we'll simulate a successful payment
      const transactionId = `VIS_${Date.now()}`;

      // In production, this would be handled by the payment provider webhook
      // For now, we'll make a direct API call
      const response = await fetch('/api/billing/webhook/payment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          user_id: user.id,
          plan_type: plan,
          amount: price,
          status: 'completed',
          payment_method: 'visa',
        }),
      });

      if (response.ok) {
        navigate('/home', { state: { paymentSuccess: true } });
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError('Payment processing error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : '';
  };

  const formatExpiry = (value) => {
    const v = value.replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-bg-main">
      <div className="w-full max-w-md glass rounded-2xl border border-border-subtle p-8 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-main mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-main">Payment Details</h1>
          <p className="text-text-muted mt-2">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${price}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              required
              disabled={loading}
              className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 text-text-main font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Cardholder Name</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="JOHN DOE"
              required
              disabled={loading}
              className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 text-text-main"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Expiry Date</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength="5"
                required
                disabled={loading}
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 text-text-main font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">CVV</label>
              <input
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="123"
                maxLength="4"
                required
                disabled={loading}
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 text-text-main font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Lock className="w-3 h-3" />
            <span>Your payment info is secure and encrypted</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-bold disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Pay $${price}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentCheckout;
