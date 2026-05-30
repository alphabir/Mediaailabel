import { motion } from 'motion/react';
import { Play, Layers, BadgeAlert, CheckCircle, Split, FileVideo, Users, FileJson, ArrowRight, ClipboardList, RefreshCw, Sparkles, Check } from 'lucide-react';

interface FeaturesProps {
  setCurrentPage: (page: string) => void;
}

export default function Features({ setCurrentPage }: FeaturesProps) {
  const coreFeatures = [
    {
      id: 'cutting',
      title: "Video Cutting",
      desc: "Snip exact segments using start and end timestamps down to the microsecond. Our engine copies the direct dynamic parameters index, removing the need for sluggish re-encoding.",
      icon: Split,
      badge: "Fast Copy Support",
      perfValue: "42ms latency"
    },
    {
      id: 'merging',
      title: "Video Merging",
      desc: "Merge separate clips, configure audio fade overlays, and generate multi-scene reels in a single pipeline stream callback request.",
      icon: FileVideo,
      badge: "Adaptive Codec Match",
      perfValue: "Zero frame lag"
    },
    {
      id: 'scene-detection',
      title: "Scene Detection",
      desc: "Identify camera shifts and content transitions. Returns exact millisecond cuts array coupled with thumbnail file links and luminance charts.",
      icon: Layers,
      badge: "AI Powered",
      perfValue: "99.4% Accuracy"
    },
    {
      id: 'subtitles',
      title: "Subtitle Rendering",
      desc: "Whisper-driven speech-to-text with auto-timing. Burn subtitles directly onto the image raster or export standalone VTT / SRT files.",
      icon: Users,
      badge: "Multi Language",
      perfValue: "95% Word accuracy"
    },
    {
      id: 'thumbnails',
      title: "Thumbnail Generation",
      desc: "Select the most visually descriptive frames automatically or trigger exact timestamp screenshots. Perfect for grid preview assets.",
      icon: Sparkles,
      badge: "Auto Focus Selector",
      perfValue: "Under 15ms"
    },
    {
      id: 'transcoding',
      title: "Video Transcoding",
      desc: "Convert H265, ProRes, or AVI straight to browser-compatible MP4/WebM containers with dynamic bitrates configured per device.",
      icon: RefreshCw,
      badge: "Hardware-Accelerated",
      perfValue: "60fps throughput"
    },
    {
      id: 'labeling',
      title: "Data Labeling",
      desc: "Configure manual bounding-box tasks or review flows. Easily draw elements and store precision keyframes over any sequence stretch.",
      icon: ClipboardList,
      badge: "Multi-User Supported",
      perfValue: "Offline Workspace Available"
    },
    {
      id: 'auto-annotation',
      title: "Auto Annotation",
      desc: "Trigger AI models to identify cars, apparel, faces, or activity triggers. Skips manual annotation entirely for standard target categories.",
      icon: CheckCircle,
      badge: "Gemini / YOLO Engines",
      perfValue: "Dense tracking tags"
    },
    {
      id: 'dataset-export',
      title: "Dataset Export",
      desc: "Export bounding-boxes and categories in standard ML-ready formats like Pascal VOC, COCO JSON, YOLO txt, or TFRecord formats instantly.",
      icon: FileJson,
      badge: "One-Click Download",
      perfValue: "Fully standard schemas"
    }
  ];

  return (
    <div id="features-view" className="bg-slate-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <span className="text-xs font-semibold font-mono uppercase tracking-widest text-purple-400">
            Enterprise Grade Pipeline API
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            9 Operations. One Unified Endpoint.
          </h1>
          <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Stop stitching separate ffmpeg, transcript, and AI tagger microservices together. MediaForge wraps the complete media lifestyle into a reliable low-latency cloud infrastructure.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group relative rounded-xl border border-purple-950/20 bg-slate-900/10 p-6 flex flex-col justify-between hover:border-purple-600/40 hover:bg-slate-900/35 transition-all duration-300 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-950/40 text-purple-400 border border-purple-900/20 group-hover:bg-purple-600 group-hover:text-white transition duration-350">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] bg-slate-900 text-purple-300 font-mono font-bold border border-purple-950/40 px-2 py-0.5 rounded-full">
                      {f.perfValue}
                    </span>
                  </div>
                  <div className="mt-5 space-y-2">
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-white flex items-center space-x-2">
                      <span>{f.title}</span>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500 opacity-60"></span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-purple-950/20 flex items-center justify-between">
                  <span className="text-xxs font-mono text-slate-500 font-semibold uppercase">{f.badge}</span>
                  <span className="text-xxs font-mono text-purple-450 hover:underline cursor-pointer" onClick={() => setCurrentPage('docs')}>
                    Read Spec docs →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison Section */}
        <div className="mt-28 py-10 bg-slate-950 border border-purple-950/20 rounded-xl p-8 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <h3 className="text-xl font-bold text-white tracking-tight">The MediaForge Advantage</h3>
            <p className="text-xs text-slate-400">Comparing typical manual ffmpeg setups against our low-latency infrastructure</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left font-mono text-xs border border-purple-950/25">
              <thead className="border-b border-purple-950/30 bg-slate-950 text-slate-300">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase">Feature Metric</th>
                  <th className="py-3 px-4 font-semibold uppercase text-rose-400">Legacy Cluster Sets</th>
                  <th className="py-3 px-4 font-semibold text-purple-400 uppercase">MediaForge Serverless</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/15 bg-slate-950/10 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">Video Cut latency</td>
                  <td className="py-3.5 px-4 text-rose-500 font-medium">10,000ms+ (requires reseed)</td>
                  <td className="py-3.5 px-4 text-purple-300 font-bold">42ms average (direct copy indices)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">Scene detection reliability</td>
                  <td className="py-3.5 px-4 text-rose-550 font-medium">Static luminance skips (60%)</td>
                  <td className="py-3.5 px-4 text-purple-300 font-bold">Spectral analysis model (99.4%)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">Subtitle Render Engine</td>
                  <td className="py-3.5 px-4 text-rose-550 font-medium">Custom shell subprocess block</td>
                  <td className="py-3.5 px-4 text-purple-300 font-bold">Whisper-parallel pipelines (8s/hr)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">Annotation Integration</td>
                  <td className="py-3.5 px-4 text-rose-550 font-medium">Separated manually synced files</td>
                  <td className="py-3.5 px-4 text-purple-300 font-bold">Embedded frame bboxes directly</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Banner at bottom */}
        <div className="mt-20 text-center max-w-2xl mx-auto space-y-5">
          <h3 className="text-2xl font-bold text-white tracking-normal">Ready to speed up your media deployment?</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Create an account in 15 seconds. Use our interactive developer sandbox to write rules, try labeling tools, and trigger clips live.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              id="cta-go-signup"
              onClick={() => {
                setCurrentPage('login');
              }}
              className="rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-5 py-3 transition"
            >
              Sign Up For Free Account
            </button>
            <button
              id="cta-go-dashboard"
              onClick={() => {
                setCurrentPage('dashboard');
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <span>Explore sandbox console</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
