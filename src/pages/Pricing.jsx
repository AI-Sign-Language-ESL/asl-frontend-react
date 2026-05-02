import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    name: "Free",
    desc: "Essential communication for everyone.",
    price: "0",
    plan_type: "free",
    features: [
      "Basic translation (Text & Voice)",
      "Standard 3D Avatar Quality",
      "Limited daily recognition minutes",
      "Community Support"
    ]
  },
  {
    name: "Pro",
    desc: "For professionals and daily active users.",
    price: "12",
    yearlyPrice: "120",
    popular: true,
    plan_type: "premium",
    features: [
      "Everything in Free",
      "Unlimited Real-time tracking",
      "HD 3D Avatar rendering",
      "EgypTalk Premium Voices",
      "Priority Email Support"
    ]
  },
  {
    name: "Enterprise",
    desc: "Custom solutions for hospitals & schools.",
    price: "Custom",
    plan_type: "enterprise",
    features: [
      "Dedicated API Access",
      "Custom vocabulary models",
      "On-premise deployment options",
      "24/7 Phone Support",
      "SLA Guarantee"
    ]
  }
];

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  const handleGetStarted = (plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role === 'organization' && plan.plan_type === 'free') {
      alert('Organizations must subscribe to a paid plan.');
      return;
    }

    if (plan.plan_type === 'free') {
      navigate('/home');
      return;
    }

    if (plan.plan_type === 'enterprise') {
      alert('Please contact sales@tafahom.io');
      return;
    }

    // Redirect to payment page
    navigate('/payment-checkout', {
      state: {
        plan: plan.plan_type,
        price: isYearly ? plan.yearlyPrice : plan.price
      }
    });
  };

  return (
    <div className="flex flex-col items-center pb-24 w-full max-w-6xl mx-auto px-4">
      <div className="text-center space-y-6 mb-12 mt-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-text-main tracking-tight">Simple, transparent pricing</h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto font-medium">
          We believe accessibility should be free. Advanced tools are available for professionals who need more processing power.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mt-8 bg-bg-card/50 w-fit mx-auto p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setIsYearly(false)}
            className={classNames(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              !isYearly ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-text-main"
            )}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsYearly(true)}
            className={classNames(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              isYearly ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-text-main"
            )}
          >
            Yearly
            <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-black uppercase">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {plans.map((plan, i) => {
          const isOrgDisabled = user?.role === 'organization' && plan.plan_type === 'free';
          
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={classNames(
                "relative rounded-[2.5rem] p-8 flex flex-col h-full transition-all duration-500",
                plan.popular 
                  ? "bg-gradient-to-br from-primary/20 via-bg-card to-bg-card border-2 border-primary/30 shadow-[0_30px_60px_rgba(59,130,246,0.15)] md:-translate-y-4" 
                  : "bg-bg-card/40 border border-white/5 hover:border-white/10",
                isOrgDisabled && "opacity-50 grayscale pointer-events-none"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 px-6 rounded-full flex items-center gap-2 shadow-xl shadow-primary/40 border border-white/20">
                  <Star className="w-3 h-3 fill-white" /> Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-3xl font-black mb-3 text-text-main tracking-tight">{plan.name}</h3>
                <p className="text-text-muted text-sm leading-relaxed font-medium">{plan.desc}</p>
              </div>
              
              <div className="mb-8 pb-8 border-b border-white/5">
                <div className="flex items-baseline gap-1">
                  {plan.price !== "Custom" && <span className="text-2xl text-text-muted font-bold">$</span>}
                  <span className="text-6xl font-black text-text-main tracking-tighter">
                    {plan.price === "Custom" ? "Custom" : (isYearly ? plan.yearlyPrice : plan.price)}
                  </span>
                  {plan.price !== "Custom" && <span className="text-text-muted font-bold ml-1">/ {isYearly ? "year" : "mo"}</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-4 text-sm font-medium text-text-main/80">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary stroke-[4px]" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleGetStarted(plan)}
                disabled={isOrgDisabled}
                className={classNames(
                  "w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98]",
                  plan.popular 
                    ? "bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1" 
                    : "bg-white/5 hover:bg-white/10 text-text-main border border-white/5"
                )}
              >
                {isOrgDisabled ? "Not for Organizations" : (plan.price === "Custom" ? "Contact Sales" : "Get Started")}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;
