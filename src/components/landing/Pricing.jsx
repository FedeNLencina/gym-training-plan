import React from 'react';
import { Check, Flame, ShieldAlert } from 'lucide-react';
import { PRICING_PLANS } from '../../data/mockData';

export default function Pricing({ onSelectPlan }) {
  return (
    <section id="planes" className="section-pricing">
      <div className="container">
        <div className="section-header text-center">
          <div className="badge mb-3">
            <Flame size={14} /> Membresías & Planes
          </div>
          <h2>
            Elige el Plan que Mejor se <span className="text-gradient-red">Adapte a Ti</span>
          </h2>
          <p className="section-subtitle">
            Acceso 100% digital a la app o membresía combinada para entrenar en persona en las instalaciones de Atlas Gym.
          </p>
        </div>

        <div className="pricing-grid">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card card-glass ${plan.isPopular ? 'popular' : ''}`}
            >
              {plan.isPopular && (
                <div className="pricing-badge-popular">
                  {plan.badge}
                </div>
              )}

              <h3 className="pricing-plan-name">{plan.name}</h3>
              <p className="pricing-plan-sub">{plan.subtitle}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span className="pricing-amount">{plan.price}</span>
                <span className="pricing-period">{plan.period}</span>
              </div>

              <ul className="pricing-features-list">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="pricing-feature-item">
                    <Check size={18} className="text-primary-vibrant" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={plan.isPopular ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%' }}
                onClick={() => onSelectPlan && onSelectPlan(plan)}
              >
                <span>{plan.ctaText}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
