import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import classNames from 'classnames';

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Free",
      desc: "Essential communication for everyone.",
      price: "0",
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
      price: isYearly ? "120" : "12",
      popular: true,
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
      features: [
        "Dedicated API Access",
        "Custom vocabulary models",
        "On-premise deployment options",
        "24/7 Phone Support",
        "SLA Guarantee"
      ]
    }
  ];

  return (
    <div className="flex flex-col items-center pb-24 w-full max-w-6xl mx-auto">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold">Simple, transparent pricing</h1>
        <p className="text-text-muted text-lg max-w-xl mx-auto">
          We believe accessibility should be free. Advanced tools are available for professionals who need more processing power.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={classNames("text-sm font-medium", !isYearly ? "text-text-main" : "text-text-muted")}>Monthly</span>
          <button 
            onClick={() => setIsYearly(!isYearly)}
            className="w-14 h-7 bg-text-muted/20 rounded-full relative p-1 transition-colors hover:bg-text-muted/30"
          >
            <div className={classNames(
              "w-5 h-5 bg-primary rounded-full transition-transform duration-300",
              isYearly ? "translate-x-7" : "translate-x-0"
            )} />
          </button>
          <span className={classNames("text-sm font-medium", isYearly ? "text-text-main" : "text-text-muted")}>
            Yearly <span className="text-success text-xs ml-1">(Save 20%)</span>
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={classNames(
              "relative rounded-[2rem] p-8 flex flex-col h-full",
              plan.popular 
                ? "bg-gradient-to-b from-primary/20 to-bg-card border-2 border-primary shadow-[0_0_40px_rgba(59,130,246,0.2)] transform md:-translate-y-4" 
                : "glass border border-border-subtle"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full flex items-center gap-1 shadow-lg shadow-primary/30">
                <Star className="w-3 h-3 fill-white" /> Most Popular
              </div>
            )}
            
            <h3 className="text-2xl font-bold mb-2 text-text-main">{plan.name}</h3>
            <p className="text-text-muted text-sm mb-6 h-10">{plan.desc}</p>
            
            <div className="mb-8 border-b border-border-subtle pb-8">
              <div className="flex items-end gap-1">
                {plan.price !== "Custom" && <span className="text-2xl text-text-muted font-medium">$</span>}
                <span className="text-5xl font-bold text-text-main tracking-tight">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-text-muted mb-1">/ {isYearly ? "year" : "mo"}</span>}
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feat, j) => (
                <li key={j} className="flex flex-start gap-3 text-sm text-text-main/90 leading-tight">
                  <Check className="w-5 h-5 text-primary shrink-0 -mt-0.5" />
                  {feat}
                </li>
              ))}
            </ul>

            <button className={classNames(
              "w-full py-4 rounded-xl font-bold transition-all mt-auto",
              plan.popular 
                ? "bg-primary hover:bg-secondary text-white shadow-lg shadow-primary/25" 
                : "bg-bg-card border border-border-subtle text-text-main hover:bg-border-subtle"
            )}>
              {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
