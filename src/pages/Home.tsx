import { motion } from 'motion/react';
import { Terminal, Shield, ArrowRight, Zap, Play, Layers, BadgeAlert, CheckCircle, Flame, FileJson } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HomeProps {
  setCurrentPage: (page: string) => void;
  setUserLoggedIn: (b: boolean) => void;
}

export default function Home({ setCurrentPage, setUserLoggedIn }: HomeProps) {
  const [activeTab, setActiveTab] = useState<'node' | 'curl' | 'python'>('curl');
  const [isExecuting, setIsExecuting] = useState(false);
  const [percentComplete, setPercentComplete] = useState(0);
  const [outputJson, setOutputJson] = useState('// Click "Run Code Request" in the terminal below...');

  const codeSnippets = {
    curl: `curl -X POST "https://api.mediaforge.io/v1/process" \\
  -H "Authorization: Bearer mf_live_4f9a7c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "s3://bucket/sports_car_clip.mp4",
    "pipelines": {
      "transcoding": { "resolution": "1080p", "codec": "h264" },
      "scene_detection": { "threshold": 0.4 },
      "auto_annotation": { "categories": ["car", "person", "road"] }
    }
  }'`,
    node: `import { MediaForge } from '@mediaforge/sdk';

const forge = new MediaForge({ apiKey: 'mf_live_4f9a7c' });

const job = await forge.jobs.create({
  videoUrl: 's3://bucket/sports_car_clip.mp4',
  pipelines: {
    transcoding: { resolution: '1080p', codec: 'h264' },
    sceneDetection: { threshold: 0.4 },
    autoAnnotation: { categories: ['car', 'person', 'road'] }
  }
});

console.log(\`Job dispatched: \${job.id}\`);`,
    python: `from mediaforge import MediaForge

client = MediaForge(api_key="mf_live_4f9a7c")

job = client.jobs.create(
    video_url="s3://bucket/sports_car_clip.mp4",
    pipelines={
        "transcoding": {"resolution": "1080p", "codec": "h264"},
        "scene_detection": {"threshold": 0.4},
        "auto_annotation": {"categories": ["car", "person", "road"]}
    }
)

print(f"Processing Job Initialized: {job.id}")`
  };

  const handleRunCode = () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setPercentComplete(0);
    setOutputJson('// Contacting serverless engine...\n// Allocating cluster nodes...');

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setPercentComplete(Math.min(current, 100));

      if (current === 20) {
        setOutputJson('// Serverless nodes online. Fetching source video clip (42.8 MB)...');
      } else if (current === 40) {
        setOutputJson('// Analyzing audio wavelengths & transcoding H265 -> H264...\n// Running model: ResNet + MobileNet object detector...');
      } else if (current === 60) {
        setOutputJson('// Scene split detected at 00:04.28 and 00:12.90.\n// Subtitle transcripts completed (English).');
      } else if (current === 80) {
        setOutputJson('// Compiling boundary box dataset logs (VOC format)...');
      } else if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setOutputJson(JSON.stringify({
            status: "completed",
            job_id: "job_9a8f273010b",
            metrics: {
              source_duration_sec: 18.4,
              processing_time_ms: 1245,
              billing_credits_used: 0.15
            },
            scene_cuts: [
              { timestamp_sec: 4.28, confidence: 0.98, thumbnail: "https://api.mediaforge.io/thumbs/scene_1.jpg" },
              { timestamp_sec: 12.9, confidence: 0.95, thumbnail: "https://api.mediaforge.io/thumbs/scene_2.jpg" }
            ],
            annotations: [
              { timestamp: 1.2, label: "sports car", bbox: [0.12, 0.45, 0.35, 0.28], confidence: 0.99 },
              { timestamp: 4.5, label: "racetrack", bbox: [0.0, 0.65, 1.0, 0.35], confidence: 0.96 }
            ],
            transcoding: {
              format: "mp4",
              downloads: {
                h264_1080p: "https://api.mediaforge.io/dl/h264_1080.mp4",
                subtitles_vtt: "https://api.mediaforge.io/dl/vocals.vtt"
              }
            }
          }, null, 2));
          setIsExecuting(false);
        }, 150);
      }
    }, 450);
  };

  return (
    <div id="home-view" className="relative isolate overflow-hidden bg-slate-950">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[130px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-950/20 blur-[150px]" />
        <div className="absolute top-[10%] left-[5%] w-full h-[1px] bg-gradient-to-r from-transparent via-purple-700/10 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          {/* Hero text */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 rounded-full border border-purple-950/40 bg-purple-950/25 px-3.5 py-1 text-xs text-purple-300"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse"></span>
              <span className="font-mono">MediaForge v2.4 API is now live</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-5xl lg:leading-tight leading-tight">
                Unified Video Processing & <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Data Labeling API</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                The developer-first infrastructure for frame-perfect cut-and-merge pipelines, audio transcript syncing, sub-second scene classifications, and rich AI dataset annotations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              <button
                id="hero-go-dashboard"
                onClick={() => {
                  setUserLoggedIn(true);
                  setCurrentPage('dashboard');
                }}
                className="flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/15 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.01] transition-all"
              >
                <span>Launch Free Sandbox</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                id="hero-go-docs"
                onClick={() => setCurrentPage('docs')}
                className="flex items-center justify-center space-x-1.5 rounded-lg border border-purple-950/40 bg-purple-950/20 px-5 py-3 text-sm font-medium text-purple-300 hover:bg-purple-950/40"
              >
                <Terminal className="h-4 w-4" />
                <span>Browse API Specs</span>
              </button>
            </motion.div>

            {/* Micro Specs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="grid grid-cols-3 gap-4 border-t border-purple-950/20 pt-6 text-center sm:text-left"
            >
              <div>
                <span className="block text-xl font-bold text-white">40ms</span>
                <span className="text-xs text-slate-500 font-medium">Cut Latency</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-white">99.98%</span>
                <span className="text-xs text-slate-500 font-medium">Auto-Annotation Acc</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-white">96.3 GB/s</span>
                <span className="text-xs text-slate-500 font-medium">Pipeline Throt</span>
              </div>
            </motion.div>
          </div>

          {/* Code Execution Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="rounded-xl border border-purple-950/40 bg-slate-900/80 shadow-2xl backdrop-blur-sm overflow-hidden">
              {/* Card Titlebar */}
              <div className="flex items-center justify-between border-b border-purple-950/10 bg-slate-950 px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">MediaForge_Request_Tester.sh</span>
                </div>
                {/* Code lang tabs */}
                <div className="flex items-center space-x-1 bg-slate-900 rounded-md p-0.5 border border-purple-950/30">
                  {(['curl', 'node', 'python'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveTab(lang)}
                      className={`rounded px-2.5 py-1 text-xxs font-mono font-semibold uppercase tracking-wider transition ${
                        activeTab === lang ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Console Code display */}
              <div className="p-4 bg-slate-950/50">
                <pre className="overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed max-h-56">
                  {codeSnippets[activeTab]}
                </pre>
              </div>

              {/* Execution progress and output bar */}
              <div className="border-t border-purple-950/10 bg-slate-900 px-4 py-3 flex items-center justify-between">
                <button
                  id="sandbox-run-trigger"
                  onClick={handleRunCode}
                  disabled={isExecuting}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-md text-xs font-bold font-mono uppercase tracking-wide transition-all ${
                    isExecuting
                      ? 'bg-slate-850 text-slate-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/10'
                  }`}
                >
                  <Flame className={`h-4.5 w-4.5 ${isExecuting ? 'animate-bounce text-slate-500' : 'text-amber-400 fill-current'}`} />
                  <span>{isExecuting ? 'Processing...' : 'Run Code Request'}</span>
                </button>
                {isExecuting && (
                  <div className="flex-1 mx-4 max-w-xs">
                    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                      <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${percentComplete}%` }}></div>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-1.5 font-mono text-xxs text-slate-500">
                  <span>POST /v1/process</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                </div>
              </div>

              {/* Console Output area */}
              <div className="border-t border-purple-950/10 bg-slate-950 p-4">
                <div className="flex items-center space-x-2 pb-2 text-xxs font-mono text-purple-400 border-b border-purple-950/10">
                  <FileJson className="h-3.5 w-3.5" />
                  <span>API Response Headers: 200 OK — mime: application/json</span>
                </div>
                <pre className="mt-2 overflow-x-auto text-xxs text-emerald-400 font-mono leading-relaxed h-48 select-all">
                  {outputJson}
                </pre>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dynamic features block grid */}
        <div className="mt-28 py-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              Powering the next generation of video intelligence
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Skip maintaining cluster server arrays, complex ffmpeg wrappers, and fragile machine learning ingestion scripts. MediaForge handles all of it under a single REST interface.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative rounded-xl border border-purple-950/20 bg-slate-900/20 p-6 flex flex-col justify-between hover:border-purple-600/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-950/60 text-purple-400 border border-purple-900/30">
                  <Play className="h-5 w-5 fill-current" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Video Cutting & Merging</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Frame-accurate trims using hardware-accelerated direct copy encoders. Merge dozens of tracks with complex clip transitions in sub-second API execution limits.
                </p>
              </div>
              <button onClick={() => setCurrentPage('features')} className="mt-6 flex items-center space-x-1 text-xs font-semibold text-purple-400 hover:text-purple-300">
                <span>View cut specifications</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Feature 2 */}
            <div className="relative rounded-xl border border-purple-950/20 bg-slate-900/20 p-6 flex flex-col justify-between hover:border-purple-600/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-950/60 text-purple-400 border border-purple-900/30">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Smart Scene Classification</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Analyze luminance buffers and spatial shifts to auto-detect scene cuts. Fetch timestamp logs and base64 scene thumbnails instantly with direct pipeline integration.
                </p>
              </div>
              <button onClick={() => setCurrentPage('features')} className="mt-6 flex items-center space-x-1 text-xs font-semibold text-purple-400 hover:text-purple-300">
                <span>Explore classification specs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Feature 3 */}
            <div className="relative rounded-xl border border-purple-950/20 bg-slate-900/20 p-6 flex flex-col justify-between hover:border-purple-600/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-950/60 text-purple-400 border border-purple-900/30">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Automated Annotations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Auto-generate bounding boxes for dozens of common class domains. Build ML-ready labeling workflows backed by standard COCO JSON format outputs on demand.
                </p>
              </div>
              <button onClick={() => setCurrentPage('features')} className="mt-6 flex items-center space-x-1 text-xs font-semibold text-purple-400 hover:text-purple-300">
                <span>See model accuracies</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Labeling Interactive mock zone */}
        <div className="mt-20 border border-purple-950/40 bg-slate-950/40 rounded-xl p-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-900/30 border border-purple-600/20 text-purple-400">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Computer-Vision Ready AI Data Annotation
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connect your raw videography feeds directly to MediaForge. Our deep learning labeling pipelines categorize elements, generate frame-perfect subtitle files, and construct coordinate bounding box logs.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span>Exports matching COCO, Pascal VOC, and Mask R-CNN JSONs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span>Over 120 custom categories tracked seamlessly</span>
                </li>
              </ul>
              <button
                id="sandbox-labeling-go"
                onClick={() => {
                  setUserLoggedIn(true);
                  setCurrentPage('dashboard');
                }}
                className="mt-4 flex items-center space-x-1 text-xs font-bold font-mono tracking-wider uppercase text-purple-300 hover:text-white"
              >
                <span>Try active labeling sandbox</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-purple-950/60 aspect-[16/10] bg-slate-900 group">
              {/* Fake video with bounding box overlays */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=600')] bg-cover bg-center opacity-80" />
              <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />

              {/* Bounding Box 1 */}
              <div className="absolute top-[28%] left-[22%] w-[38%] h-[44%] border-2 border-purple-500 rounded bg-purple-500/10 hover:bg-purple-500/20 transition cursor-pointer">
                <span className="absolute -top-5 left-0 bg-purple-600 text-[10px] font-mono font-bold text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  car_sports [98.4%]
                </span>
              </div>

              {/* Bounding Box 2 */}
              <div className="absolute top-[46%] left-[64%] w-[12%] h-[30%] border-2 border-indigo-400 rounded bg-indigo-400/10 hover:bg-indigo-400/20 transition cursor-pointer">
                <span className="absolute -top-5 left-0 bg-indigo-500 text-[10px] font-mono font-bold text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  person_observer [91.0%]
                </span>
              </div>

              <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 border border-purple-950/40">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>DATASET_LABELING_PREVIEW : FRAME 0142_B</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
