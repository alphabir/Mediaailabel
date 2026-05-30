import { Check, Info, ArrowRight, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface PricingProps {
  setCurrentPage: (page: string) => void;
  setUserLoggedIn: (b: boolean) => void;
}

export default function Pricing({ setCurrentPage, setUserLoggedIn }: PricingProps) {
  // Usage calculator state
  const [videoMinutes, setVideoMinutes] = useState(1200);
  const [annotationMins, setAnnotationMins] = useState(300);
  const [exportGB, setExportGB] = useState(15);

  // Compute mock calculated price
  // $0.015 per video minute processed
  // $0.08 per annotation minute
  // $0.05 per GB dataset volume
  const computedProcessingCost = videoMinutes * 0.015;
  const computedAnnotationCost = annotationMins * 0.08;
  const computedExportCost = exportGB * 0.05;
  const computedTotal = computedProcessingCost + computedAnnotationCost + computedExportCost;

  // Plan recommendation helper
  const getRecommendedPlan = (total: number) => {
    if (total === 0) return { name: 'Hobby Tier', price: '$0' };
    if (total < 40) return { name: 'Developer Plan', price: '$29/mo base' };
    if (total < 250) return { name: 'Startup Tier', price: '$149/mo' };
    return { name: 'Enterprise Cluster', price: 'Custom Quote' };
  };

  const recPlan = getRecommendedPlan(computedTotal);

  const plans = [
    {
      name: 'Hobby',
      price: '$0',
      description: 'Ideal for prototyping, testing and hackathons.',
      features: [
        '50 minutes of processing/mo',
        '20 scene cuts analysis requests',
        'Basic bbox manual annotation UI',
        'Direct download in COCO JSON',
        'Shared runtime cluster nodes',
        'Developer Community support'
      ],
      btnText: 'Start Prototyping',
      popular: false
    },
    {
      name: 'Developer',
      price: '$29',
      unit: '/mo',
      description: 'Built for indie developers and production micro-features.',
      features: [
        '1,500 minutes of processing/mo',
        'Auto subtitles & SRT/VTT render',
        'Auto scene classification API',
        '300 mins frame-level labels search',
        'Mock signing Webhook delivery',
        'Premium ticket respond email (24h)'
      ],
      btnText: 'Launch Developer Tier',
      popular: true
    },
    {
      name: 'Startup',
      price: '$149',
      unit: '/mo',
      description: 'High throughput pipeline setups with SLA guarantees.',
      features: [
        '10,000 minutes of processing/mo',
        'Parallel node cluster (up to 8 slots)',
        'Full AI Auto Annotation batch parser',
        'Complete COCO, YOLO, Voc export',
        'Webhooks signing endpoints',
        '99.9% uptime SLA guarantee'
      ],
      btnText: 'Scale Up Operations',
      popular: false
    }
  ];

  return (
    <div id="pricing-view" className="bg-slate-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header content */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <span className="text-xs font-semibold font-mono uppercase tracking-widest text-purple-400">
            Simple Developer Billing
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Predictable Pay-As-You-Go Billing
          </h1>
          <p className="text-sm text-slate-450 max-w-xl mx-auto leading-relaxed">
            No massive upfront contracts. Start building inside our free sandbox sandbox tier, update to developer scaling when requests begin to grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border ${
                p.popular
                  ? 'border-purple-600 bg-purple-950/20 relative shadow-xl shadow-purple-500/5'
                  : 'border-purple-950/30 bg-slate-900/10'
              } p-8 flex flex-col justify-between hover:border-purple-500/40 transition duration-300`}
            >
              <div>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white font-semibold font-mono text-[9px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    Most Popular Choice
                  </span>
                )}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-100">{p.name}</h3>
                  <p className="text-xs text-slate-400">{p.description}</p>
                </div>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  {p.unit && <span className="ml-1 text-sm text-slate-400">{p.unit}</span>}
                </div>
                <ul className="mt-8 space-y-3.5 text-xs text-slate-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start space-x-2.5">
                      <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                id={`btn-pricing-${p.name.toLowerCase()}`}
                onClick={() => {
                  setUserLoggedIn(true);
                  setCurrentPage('dashboard');
                }}
                className={`mt-8 w-full rounded-lg py-2.5 text-xs font-bold text-center transition-all ${
                  p.popular
                    ? 'bg-purple-600 text-white shadow hover:bg-purple-500'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {p.btnText}
              </button>
            </div>
          ))}
        </div>

        {/* Live interactive cost calculator widget */}
        <div className="mt-28 border border-purple-950/40 bg-slate-900/40 rounded-xl p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            
            {/* Left side inputs */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-1.5 border-b border-purple-950/10 pb-4">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                  <span className="bg-purple-950 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded text-[11px] font-mono font-bold">LIVE</span>
                  <span>Usage Pricing Estimator</span>
                </h3>
                <p className="text-xxs text-slate-400 leading-normal">
                  Adjust sliders to calculate API billing charges based on your real expected throughput limits.
                </p>
              </div>

              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Video Cutting & Transcoding</span>
                  <span className="text-purple-400 font-bold">{videoMinutes.toLocaleString()} minutes</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={videoMinutes}
                  onChange={(e) => setVideoMinutes(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-slate-950 accent-purple-500 appearance-none cursor-ew-resize"
                />
                <span className="block text-[10px] text-slate-500 font-mono">Cost rate: $0.015 per video minute processed</span>
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">AI Auto-Annotation Tracker</span>
                  <span className="text-purple-400 font-bold">{annotationMins.toLocaleString()} minutes</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="50"
                  value={annotationMins}
                  onChange={(e) => setAnnotationMins(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-slate-950 accent-purple-500 appearance-none cursor-ew-resize"
                />
                <span className="block text-[10px] text-slate-500 font-mono">Cost rate: $0.08 per annotation analyzed minute</span>
              </div>

              {/* Slider 3 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Bounding-box Export Volume</span>
                  <span className="text-purple-400 font-bold">{exportGB.toLocaleString()} Gigabytes</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={exportGB}
                  onChange={(e) => setExportGB(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-slate-950 accent-purple-500 appearance-none cursor-ew-resize"
                />
                <span className="block text-[10px] text-slate-500 font-mono">Cost rate: $0.05 per exported data Gigabyte</span>
              </div>
            </div>

            {/* Right side display card */}
            <div className="md:col-span-5 bg-slate-950/80 rounded-xl border border-purple-950/40 p-6 space-y-6">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-semibold">ESTIMATED EXPENDITURE</span>
                <div className="flex items-baseline justify-center sm:justify-start">
                  <span className="text-4xl font-extrabold text-white">${computedTotal.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-mono ml-1.5">/month</span>
                </div>
              </div>

              <div className="border-t border-purple-950/10 pt-4 space-y-2.5 font-mono text-xxs text-slate-400">
                <div className="flex justify-between">
                  <span>Processing Base:</span>
                  <span>${computedProcessingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annotation Base:</span>
                  <span>${computedAnnotationCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Transfer:</span>
                  <span>${computedExportCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="rounded-lg bg-purple-950/20 px-3.5 py-3 border border-purple-900/20 text-xxs space-y-1">
                <span className="block font-mono text-purple-400 font-bold">Recommended configuration:</span>
                <span className="block text-slate-350">{recPlan.name} ({recPlan.price})</span>
              </div>

              <button
                id="pricing-calc-submit"
                onClick={() => {
                  setUserLoggedIn(true);
                  setCurrentPage('dashboard');
                }}
                className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:scale-[1.01] transition-all"
              >
                <span>Launch This Architecture</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
