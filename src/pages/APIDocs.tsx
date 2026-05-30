import { useState } from 'react';
import { Terminal, Shield, Copy, Play, ArrowRight, CornerDownRight, Database, Code, CheckCircle, RefreshCw } from 'lucide-react';

export default function APIDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'cuts' | 'scenes' | 'annotations' | 'transcode'>('cuts');
  const [selectedLang, setSelectedLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playResponse, setPlayResponse] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const endpoints = [
    {
      id: 'cuts' as const,
      method: 'POST' as const,
      path: '/v1/cuts/trim',
      title: 'Trim Movie Cuts',
      desc: 'Snip a videography clip instantly by supplying precise microsecond timestamp windows. Avoids sluggish re-encoding overheads.',
      params: [
        { name: 'video_url', type: 'string', required: true, desc: 'Secure cloud source link (HTTPS, S3 or GCS).' },
        { name: 'start_sec', type: 'number', required: true, desc: 'Boundary start offset (Seconds).' },
        { name: 'end_sec', type: 'number', required: true, desc: 'Boundary finish offset (Seconds).' },
        { name: 'container_copy', type: 'boolean', required: false, desc: 'Enable ultra-fast direct frame indexing without transcoding.' }
      ]
    },
    {
      id: 'scenes' as const,
      method: 'POST' as const,
      path: '/v1/scenes/detect',
      title: 'Analyze Scenes',
      desc: 'Dispatch specialized luminance delta shift analyzers to index hard cuts and dissolve changes. Generates scene splits automatically.',
      params: [
        { name: 'video_url', type: 'string', required: true, desc: 'Target input S3/GCS or public streaming source URL.' },
        { name: 'sensitivity', type: 'float', required: false, desc: 'Luminance thresholds (0.00 to 1.00).' },
        { name: 'generate_images', type: 'boolean', required: false, desc: 'Save standalone preview JPG keyframes of detected splits.' }
      ]
    },
    {
      id: 'annotations' as const,
      method: 'POST' as const,
      path: '/v1/annotations/auto',
      title: 'Auto Annotate Dataset',
      desc: 'Index spatial tracks on moving objects, people, vehicles and activity prompts to export bounding box labels array.',
      params: [
        { name: 'video_url', type: 'string', required: true, desc: 'Cloud hosted source MP4 video feed.' },
        { name: 'categories', type: 'array [string]', required: true, desc: 'Object label limits (e.g., ["car", "face", "sign"]).' },
        { name: 'min_confidence', type: 'float', required: false, desc: 'Filtering threshold (Default: 0.50).' }
      ]
    },
    {
      id: 'transcode' as const,
      method: 'POST' as const,
      path: '/v1/transcode',
      title: 'Transcode Stream Codec',
      desc: 'Direct file containers re-encoding and bit-rate scaling for optimal multi-device browser compatibility.',
      params: [
        { name: 'video_url', type: 'string', required: true, desc: 'Source URL of video.' },
        { name: 'preset', type: 'string', required: true, desc: 'Format targets: "h264_1080p", "hevc_2160p", "webm_vp9".' },
        { name: 'crf', type: 'integer', required: false, desc: 'Constant Rate Factor index (0 to 51, Default: 23).' }
      ]
    }
  ];

  const currentDef = endpoints.find(e => e.id === selectedEndpoint) || endpoints[0];

  const docsSnippets = {
    cuts: {
      curl: `curl -X POST "https://api.mediaforge.io/v1/cuts/trim" \\
  -H "Authorization: Bearer mf_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "s3://assets/source.mp4",
    "start_sec": 12.4,
    "end_sec": 45.8,
    "container_copy": true
  }'`,
      js: `import { MediaForge } from '@mediaforge/sdk';

const forge = new MediaForge({ apiKey: 'mf_live_YOUR_KEY' });

const result = await forge.cuts.trim({
  videoUrl: 's3://assets/source.mp4',
  startSec: 12.4,
  endSec: 45.8,
  containerCopy: true
});

console.log('Trim complete:', result.download_url);`,
      python: `from mediaforge import MediaForge

client = MediaForge(api_key="mf_live_YOUR_KEY")

result = client.cuts.trim(
    video_url="s3://assets/source.mp4",
    start_sec=12.4,
    end_sec=45.8,
    container_copy=True
)

print(f"File cut successfully: {result.download_url}")`
    },
    scenes: {
      curl: `curl -X POST "https://api.mediaforge.io/v1/scenes/detect" \\
  -H "Authorization: Bearer mf_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "s3://assets/source.mp4",
    "sensitivity": 0.45,
    "generate_images": true
  }'`,
      js: `import { MediaForge } from '@mediaforge/sdk';

const forge = new MediaForge({ apiKey: 'mf_live_YOUR_KEY' });

const scenes = await forge.scenes.detect({
  videoUrl: 's3://assets/source.mp4',
  sensitivity: 0.45,
  generateImages: true
});

console.log('Scene cuts indices:', scenes.cuts);`,
      python: `from mediaforge import MediaForge

client = MediaForge(api_key="mf_live_YOUR_KEY")

scenes = client.scenes.detect(
    video_url="s3://assets/source.mp4",
    sensitivity=0.45,
    generate_images=True
)

print(f"Identified {len(scenes.cuts)} scene cuts.")`
    },
    annotations: {
      curl: `curl -X POST "https://api.mediaforge.io/v1/annotations/auto" \\
  -H "Authorization: Bearer mf_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "s3://assets/source.mp4",
    "categories": ["car", "person"],
    "min_confidence": 0.65
  }'`,
      js: `import { MediaForge } from '@mediaforge/sdk';

const forge = new MediaForge({ apiKey: 'mf_live_YOUR_KEY' });

const modelLogs = await forge.annotations.auto({
  videoUrl: 's3://assets/source.mp4',
  categories: ['car', 'person'],
  minConfidence: 0.65
});

console.log('Spatial annotations detected:', modelLogs.detections);`,
      python: `from mediaforge import MediaForge

client = MediaForge(api_key="mf_live_YOUR_KEY")

annotations = client.annotations.auto(
    video_url="s3://assets/source.mp4",
    categories=["car", "person"],
    min_confidence=0.65
)

print(f"Generated bounding logs: {annotations.detections}")`
    },
    transcode: {
      curl: `curl -X POST "https://api.mediaforge.io/v1/transcode" \\
  -H "Authorization: Bearer mf_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "s3://assets/source.mp4",
    "preset": "h264_1080p",
    "crf": 22
  }'`,
      js: `import { MediaForge } from '@mediaforge/sdk';

const forge = new MediaForge({ apiKey: 'mf_live_YOUR_KEY' });

const transcodeJob = await forge.transcoding.create({
  videoUrl: 's3://assets/source.mp4',
  preset: 'h264_1080p',
  crf: 22
});

console.log('Job dispatched:', transcodeJob.id);`,
      python: `from mediaforge import MediaForge

client = MediaForge(api_key="mf_live_YOUR_KEY")

job = client.transcoding.create(
    video_url="s3://assets/source.mp4",
    preset="h264_1080p",
    crf=22
)

print(f"Dispatched encoding: {job.id}")`
    }
  };

  const docsResponses = {
    cuts: {
      status: "success",
      id: "cut_job_8b910a3f",
      copied_frames: 1004,
      download_link: "https://api.mediaforge.io/down/cut_compiled_h264.mp4",
      execution_latency_ms: 38,
      source_resolution_index: "1920x1080"
    },
    scenes: {
      status: "completed",
      total_cuts: 2,
      detector_model: "resnet_lum_v4",
      cuts: [
        { time_offset_seconds: 4.28, confidence: 0.98, keyframe_url: "https://api.mediaforge.io/key/s1.jpg" },
        { time_offset_seconds: 12.91, confidence: 0.94, keyframe_url: "https://api.mediaforge.io/key/s2.jpg" }
      ],
      average_scene_duration: 8.44
    },
    annotations: {
      status: "labeled",
      class_counts: { car: 12, person: 2 },
      model_inference_ms: 541,
      detections: [
        { label: "car", tracking_id: 1, first_seen_sec: 1.2, bbox: [0.12, 0.45, 0.35, 0.28], max_confidence: 0.98 },
        { label: "person", tracking_id: 2, first_seen_sec: 4.5, bbox: [0.65, 0.48, 0.11, 0.29], max_confidence: 0.93 }
      ]
    },
    transcode: {
      status: "queued",
      job_id: "trans_9f82x1a",
      preset: "h264_1080p",
      crf: 22,
      webhook_payload_url: "https://user-app.com/webhooks-receiver"
    }
  };

  const handleCopyCode = () => {
    const text = docsSnippets[selectedEndpoint][selectedLang];
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlaySandboxRequest = () => {
    setIsPlaying(true);
    setPlayResponse('// Executing REST query...');
    setTimeout(() => {
      setPlayResponse(JSON.stringify(docsResponses[selectedEndpoint], null, 2));
      setIsPlaying(false);
    }, 850);
  };

  return (
    <div id="api-docs-view" className="bg-slate-950 min-h-screen border-b border-purple-950/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left endpoint selector sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-1.5 border-b border-purple-950/15 pb-4">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 font-bold">API REFERENCE</span>
            <h2 className="text-xl font-bold text-white tracking-tight">MediaForge v1</h2>
          </div>
          
          <div className="space-y-1">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold ml-2.5 mb-2">Endpoint Pipelines</span>
            {endpoints.map((e) => {
              const isActive = selectedEndpoint === e.id;
              return (
                <button
                  key={e.id}
                  id={`endpoint-btn-${e.id}`}
                  onClick={() => {
                    setSelectedEndpoint(e.id);
                    setPlayResponse('');
                  }}
                  className={`w-full flex items-center space-x-2.5 rounded-lg px-3.5 py-2.5 text-left text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-purple-950/60 border border-purple-800/40 text-purple-300 shadow-md'
                      : 'border border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-white'
                  }`}
                >
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${
                    e.method === 'POST' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'
                  }`}>
                    {e.method}
                  </span>
                  <span className="font-semibold">{e.path}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl border border-purple-950/20 bg-slate-900/20 space-y-3">
            <span className="block text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">Authentication</span>
            <p className="text-xxs text-slate-400 leading-relaxed font-mono">
              Inject your client dashboard secret keys into standard HTTP headers as a Bearer credentials parameter.
            </p>
            <div className="bg-slate-950/70 p-2.5 rounded font-mono text-[9px] text-slate-400 border border-purple-950/20 overflow-x-auto select-all">
              Authorization: Bearer mf_live_...
            </div>
          </div>
        </div>

        {/* Center / Right dual structure */}
        <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Docs Description Area */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{currentDef.title}</h1>
              <span className="inline-flex items-center space-x-2 text-xxs font-mono text-purple-400 bg-purple-950/35 px-2.5 py-1 rounded border border-purple-900/20 font-bold">
                <span>POST</span>
                <span>https://api.mediaforge.io{currentDef.path}</span>
              </span>
              <p className="text-xs text-slate-450 leading-relaxed mt-4">{currentDef.desc}</p>
            </div>

            {/* Request parameters table */}
            <div className="space-y-3.5">
              <span className="block text-xs font-mono text-slate-300 font-bold tracking-wider uppercase border-b border-purple-950/10 pb-2">
                Payload parameters
              </span>
              <div className="space-y-4">
                {currentDef.params.map((p) => (
                  <div key={p.name} className="font-mono text-xxs border-l border-purple-950/20 pl-3 space-y-1">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-slate-200 font-bold text-xs">{p.name}</span>
                      <span className="text-slate-500 font-semibold">{p.type}</span>
                      {p.required ? (
                        <span className="text-rose-400 text-[10px] font-bold">required</span>
                      ) : (
                        <span className="text-slate-600 font-bold">optional</span>
                      )}
                    </div>
                    <p className="text-slate-400 leading-normal">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Playground Right card */}
          <div className="rounded-xl border border-purple-950/30 bg-slate-900/70 overflow-hidden flex flex-col justify-between shadow-2xl h-fit">
            
            {/* Header tab controller */}
            <div className="border-b border-purple-950/10 bg-slate-950 px-4 py-3 flex items-center justify-between">
              <span className="text-xxs font-mono text-slate-400 font-semibold uppercase">API SDK Request</span>
              <div className="flex bg-slate-900 rounded border border-purple-900/20 p-0.5 space-x-0.5">
                {(['curl', 'js', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`rounded px-2.5 py-1 text-[9px] font-mono font-bold transition uppercase ${
                      selectedLang === lang ? 'bg-purple-600 text-white' : 'text-slate-550 hover:text-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Snippet terminal wrapper */}
            <div className="bg-slate-950/60 p-4 relative group">
              <button
                id="docs-btn-copy"
                onClick={handleCopyCode}
                className="absolute top-2.5 right-2.5 p-1.5 rounded border border-purple-950/30 bg-slate-900 text-slate-400 hover:text-white transition"
                title="Copy snippet"
              >
                {copied ? <span className="text-xxs font-mono text-emerald-400">Copied!</span> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <pre className="overflow-x-auto text-[10.5px] text-slate-300 font-mono leading-relaxed h-44 select-all pt-2.5">
                {docsSnippets[selectedEndpoint][selectedLang]}
              </pre>
            </div>

            {/* Run mock command bar */}
            <div className="border-t border-purple-950/10 bg-slate-950 px-4 py-2.5 flex items-center justify-between">
              <button
                id="docs-btn-run-simulation"
                onClick={handlePlaySandboxRequest}
                disabled={isPlaying}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xxs font-bold font-mono uppercase tracking-wide transition ${
                  isPlaying ? 'bg-slate-900 text-slate-500' : 'bg-purple-600 hover:bg-purple-500 text-white shadow shadow-purple-600/10'
                }`}
              >
                <Play className="h-3.5 w-3.5 fill-current text-white shrink-0" />
                <span>{isPlaying ? 'Contacting Sandbox...' : 'Try Active Query'}</span>
              </button>
              <span className="text-xxs font-mono text-slate-550">status: click query to play</span>
            </div>

            {/* Response area terminal */}
            <div className="bg-slate-950 border-t border-purple-950/15 p-4 flex-1">
              <div className="flex justify-between items-center text-xxs font-mono text-purple-400 border-b border-purple-950/10 pb-1.5 mb-2.5">
                <span>MOCK_API_RESPONSE_PAYLOAD</span>
                <span className="text-slate-600">application/json</span>
              </div>
              <pre className="overflow-x-auto text-xxs text-emerald-400 font-mono leading-relaxed h-48 max-h-48 select-all">
                {playResponse || '// Click "Try Active Query" above to test responses.'}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
