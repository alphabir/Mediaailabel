import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Image as ImageIcon, Video, Layers, Plus, Trash2, 
  Download, Code, FileCode, CheckCircle2, AlertCircle, Sparkles, 
  Scissors, Layout, Upload, Compass, RefreshCw, ChevronRight, X, Paintbrush, 
  MousePointer, HelpCircle, Save, Minimize2, Eye, EyeOff, Check, Copy
} from 'lucide-react';
import { db, DBDataset, DBDatasetItem, DBAnnotation } from '../../lib/supabaseClient';

interface DataLabelingSectionProps {
  userId: string;
}

export default function DataLabelingSection({ userId }: DataLabelingSectionProps) {
  // Global View mode: 'datasets' or 'studio'
  const [viewMode, setViewMode] = useState<'datasets' | 'studio'>('datasets');
  
  // Datasets State
  const [datasets, setDatasets] = useState<DBDataset[]>([]);
  const [activeDataset, setActiveDataset] = useState<DBDataset | null>(null);
  const [datasetItems, setDatasetItems] = useState<DBDatasetItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DBDatasetItem | null>(null);
  const [annotations, setAnnotations] = useState<DBAnnotation[]>([]);
  const [loading, setLoading] = useState(true);

  // New Dataset Dialog Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDesc, setNewDatasetDesc] = useState('');
  const [newDatasetType, setNewDatasetType] = useState<'image' | 'video'>('image');
  const [newDatasetClasses, setNewDatasetClasses] = useState<string[]>(['Car', 'Pedestrian', 'Bicycle']);
  const [customClassInput, setCustomClassInput] = useState('');

  // Active Interactive Tool Selection
  const [labelTool, setLabelTool] = useState<'bbox' | 'polygon' | 'segmentation'>('bbox');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showLabelsOverlay, setShowLabelsOverlay] = useState(true);

  // Drawing States for interactive Canvas mapping (normalized percentage coords: 0-100)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number, y: number } | null>(null);
  
  // Active polygon vertices being clicked step-by-step
  const [polyVertices, setPolyVertices] = useState<{ x: number, y: number }[]>([]);
  // Active brush points for segmentation paint stroke
  const [segmentStroke, setSegmentStroke] = useState<{ x: number, y: number }[]>([]);

  // Local uploaded assets state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [importUrlInput, setImportUrlInput] = useState('');
  const [showImportDropdown, setShowImportDropdown] = useState(false);

  // Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'yolo' | 'coco' | 'voc' | 'json'>('coco');
  const [generatedPayloads, setGeneratedPayloads] = useState<{ filename: string; text: string }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [exportAnnotations, setExportAnnotations] = useState<DBAnnotation[]>([]);

  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Datasets on Init
  useEffect(() => {
    loadUserDatasets();
  }, [userId]);

  const loadUserDatasets = async () => {
    setLoading(true);
    try {
      const data = await db.getDatasets(userId);
      setDatasets(data);
      if (data.length > 0 && !activeDataset) {
        // Auto-select first to keep workflow immediate
        handleSelectDataset(data[0]);
      }
    } catch (err) {
      console.error('Failed to resolve datasets schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDataset = async (dataset: DBDataset) => {
    setActiveDataset(dataset);
    setLoading(true);
    try {
      const items = await db.getDatasetItems(dataset.id);
      setDatasetItems(items);
      
      // Select first item
      if (items.length > 0) {
        setSelectedItem(items[0]);
        // Default selected class to first defined tags
        if (dataset.classes.length > 0) {
          setSelectedClass(dataset.classes[0]);
        }
        // Load its annotations
        const anns = await db.getItemAnnotations(items[0].id);
        setAnnotations(anns);
      } else {
        setSelectedItem(null);
        setAnnotations([]);
      }
    } catch (err) {
      console.error('Error fetching dataset components:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDatasetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDatasetName.trim()) return;

    try {
      const created = await db.createDataset(
        userId,
        newDatasetName,
        newDatasetDesc,
        newDatasetClasses,
        newDatasetType
      );
      setDatasets(prev => [created, ...prev]);
      setShowCreateModal(false);
      handleSelectDataset(created);
      setViewMode('studio');
      
      // Reset form variables
      setNewDatasetName('');
      setNewDatasetDesc('');
    } catch (err) {
      console.error('Error creating dataset:', err);
    }
  };

  const handleDeleteDataset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this dataset? This will permanently wipe all uploaded items and annotation records.')) return;
    try {
      await db.deleteDataset(id);
      const filtered = datasets.filter(d => d.id !== id);
      setDatasets(filtered);
      if (activeDataset?.id === id) {
        if (filtered.length > 0) {
          handleSelectDataset(filtered[0]);
        } else {
          setActiveDataset(null);
          setSelectedItem(null);
        }
      }
    } catch (err) {
      console.error('Failed to wipe dataset:', err);
    }
  };

  const handleSelectDatasetItem = async (item: DBDatasetItem) => {
    setSelectedItem(item);
    setPolyVertices([]);
    setSegmentStroke([]);
    setIsDrawing(false);
    setDrawStart(null);
    try {
      const anns = await db.getItemAnnotations(item.id);
      setAnnotations(anns);
    } catch (err) {
      console.error('Error fetching annotations:', err);
    }
  };

  // Add Label Tag Class inside Active configuration
  const handleAddClassTag = () => {
    if (!customClassInput.trim()) return;
    if (newDatasetClasses.includes(customClassInput.trim())) return;
    setNewDatasetClasses(prev => [...prev, customClassInput.trim()]);
    setCustomClassInput('');
  };

  const handleRemoveClassTag = (className: string) => {
    setNewDatasetClasses(prev => prev.filter(c => c !== className));
  };

  // Drag Drop Ingestion File Handlers
  const triggerManualFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileIngestion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeDataset || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Safety size checks
    if (file.size > 80 * 1024 * 1024) {
      alert('File exceeds safe sandbox limits of 80MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    
    try {
      const mockUrl = await db.uploadFile(userId, file, (pct) => {
        setUploadProgress(pct);
      });

      const nextItem = await db.addDatasetItem(
        activeDataset.id,
        file.name,
        mockUrl,
        file.type.startsWith('video/') ? 'video' : 'image'
      );

      setDatasetItems(prev => [...prev, nextItem]);
      setSelectedItem(nextItem);
      // Fetch annotations (should be empty for new uploads)
      setAnnotations([]);
    } catch (err: any) {
      alert('Error uploading file to container: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddRemoteUrl = async () => {
    if (!activeDataset || !importUrlInput.trim()) return;
    
    const name = importUrlInput.split('/').pop() || 'remote_asset.jpg';
    const isVideo = importUrlInput.endsWith('.mp4') || importUrlInput.endsWith('.webm');

    try {
      const nextItem = await db.addDatasetItem(
        activeDataset.id,
        name,
        importUrlInput.trim(),
        isVideo ? 'video' : 'image'
      );

      setDatasetItems(prev => [...prev, nextItem]);
      setSelectedItem(nextItem);
      setAnnotations([]);
      setImportUrlInput('');
      setShowImportDropdown(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this asset from training corpus?')) return;
    try {
      await db.deleteDatasetItem(id);
      const remaining = datasetItems.filter(i => i.id !== id);
      setDatasetItems(remaining);
      if (selectedItem?.id === id) {
        if (remaining.length > 0) {
          handleSelectDatasetItem(remaining[0]);
        } else {
          setSelectedItem(null);
          setAnnotations([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Convert click coordinates to 0-100 normalized layout
  const computeNormalizedCoordinates = (clientX: number, clientY: number): { x: number, y: number } | null => {
    if (!workspaceContainerRef.current) return null;
    const rect = workspaceContainerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100);
    const y = Math.min(Math.max(((clientY - rect.top) / rect.height) * 100, 0), 100);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  // INTERACTIVE CANVAS MOUSE EVENTS
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!selectedItem) return;
    const coords = computeNormalizedCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    if (labelTool === 'bbox') {
      setIsDrawing(true);
      setDrawStart(coords);
      setCurrentMousePos(coords);
    } else if (labelTool === 'segmentation') {
      setIsDrawing(true);
      setSegmentStroke([coords]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!selectedItem) return;
    const coords = computeNormalizedCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    setCurrentMousePos(coords);

    if (isDrawing) {
      if (labelTool === 'bbox') {
        // Just track it
      } else if (labelTool === 'segmentation') {
        setSegmentStroke(prev => [...prev, coords]);
      }
    }
  };

  const handleCanvasMouseUp = async (e: React.MouseEvent) => {
    if (!selectedItem || !selectedClass) return;

    if (labelTool === 'bbox' && isDrawing && drawStart && currentMousePos) {
      const width = Math.abs(currentMousePos.x - drawStart.x);
      const height = Math.abs(currentMousePos.y - drawStart.y);
      const x = Math.min(drawStart.x, currentMousePos.x);
      const y = Math.min(drawStart.y, currentMousePos.y);

      // Require a minimum size to prevent accidental dots
      if (width > 2 && height > 2) {
        const nextAnn: DBAnnotation = {
          id: 'ann-' + Math.random().toString(36).substring(2, 8),
          item_id: selectedItem.id,
          class_name: selectedClass,
          type: 'bbox',
          coordinates: { x, y, width, height },
          created_at: new Date().toISOString()
        };

        const updated = [...annotations, nextAnn];
        setAnnotations(updated);
        await db.saveItemAnnotations(selectedItem.id, updated);
      }
    } else if (labelTool === 'segmentation' && isDrawing && segmentStroke.length > 2) {
      const nextAnn: DBAnnotation = {
        id: 'ann-' + Math.random().toString(36).substring(2, 8),
        item_id: selectedItem.id,
        class_name: selectedClass,
        type: 'segmentation',
        coordinates: segmentStroke,
        created_at: new Date().toISOString()
      };

      const updated = [...annotations, nextAnn];
      setAnnotations(updated);
      await db.saveItemAnnotations(selectedItem.id, updated);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setSegmentStroke([]);
  };

  const handlePolygonClick = async (e: React.MouseEvent) => {
    if (!selectedItem || labelTool !== 'polygon' || !selectedClass) return;
    const coords = computeNormalizedCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    // Check if clicked near first point to complete the polygon loop
    if (polyVertices.length > 2) {
      const first = polyVertices[0];
      const dist = Math.sqrt(Math.pow(coords.x - first.x, 2) + Math.pow(coords.y - first.y, 2));
      if (dist < 3.5) {
        // Close Polygon!
        const nextAnn: DBAnnotation = {
          id: 'ann-' + Math.random().toString(36).substring(2, 8),
          item_id: selectedItem.id,
          class_name: selectedClass,
          type: 'polygon',
          coordinates: polyVertices,
          created_at: new Date().toISOString()
        };

        const updated = [...annotations, nextAnn];
        setAnnotations(updated);
        await db.saveItemAnnotations(selectedItem.id, updated);
        setPolyVertices([]);
        return;
      }
    }

    setPolyVertices(prev => [...prev, coords]);
  };

  const handleRemoveAnnotation = async (id: string) => {
    const updated = annotations.filter(a => a.id !== id);
    setAnnotations(updated);
    if (selectedItem) {
      await db.saveItemAnnotations(selectedItem.id, updated);
    }
  };

  const handleClearAllAnnotations = async () => {
    if (!selectedItem || annotations.length === 0) return;
    if (!confirm('Reset all labels drawn for the active asset?')) return;
    setAnnotations([]);
    setPolyVertices([]);
    setSegmentStroke([]);
    await db.saveItemAnnotations(selectedItem.id, []);
  };

  // Convert tag names to distinctive high contrast hex colors
  const getColorForClass = (idx: number) => {
    const pal = [
      '#a855f7', // purple
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#ef4444', // red
      '#84cc16'  // lime
    ];
    return pal[idx % pal.length];
  };

  const getClassColor = (className: string) => {
    if (!activeDataset) return '#a855f7';
    const idx = activeDataset.classes.indexOf(className);
    return getColorForClass(idx !== -1 ? idx : 0);
  };

  // GENERATE THE HIGHLY ACCURATE EXPORTS
  const runExportCompile = async () => {
    if (!activeDataset) return;
    try {
      const allAnns = await db.getDatasetAnnotations(activeDataset.id);
      setExportAnnotations(allAnns);
      setShowExportModal(true);
      compilePayloadsForFormat(exportFormat, allAnns);
    } catch (err) {
      console.error('Error fetching annotations for export:', err);
    }
  };

  const compilePayloadsForFormat = (format: 'yolo' | 'coco' | 'voc' | 'json', allAnns: DBAnnotation[]) => {
    if (!activeDataset || datasetItems.length === 0) return;

    let payloads: { filename: string; text: string }[] = [];

    if (format === 'yolo') {
      // YOLO Format: exports dataset.yaml definition file AND sample individual labels txt file
      let yamlText = `# YOLOv8 Dataset definition Config\npath: datasets/${activeDataset.name.toLowerCase().replace(/ /g, '_')}\ntrain: images/train\nval: images/val\n\nnames:\n`;
      activeDataset.classes.forEach((c, idx) => {
        yamlText += `  ${idx}: ${c}\n`;
      });

      payloads.push({ filename: 'dataset.yaml', text: yamlText });

      // Generate text files content for each labelled image/video
      datasetItems.forEach(item => {
        const itemAnns = allAnns.filter(a => a.item_id === item.id);
        let txt = '';
        itemAnns.forEach(ann => {
          const classIdx = activeDataset.classes.indexOf(ann.class_name);
          const i = classIdx !== -1 ? classIdx : 0;
          
          if (ann.type === 'bbox') {
            // YOLO wants x_center, y_center, width, height (normalized 0.0 to 1.0)
            const xc = (ann.coordinates.x + ann.coordinates.width / 2) / 100;
            const yc = (ann.coordinates.y + ann.coordinates.height / 2) / 100;
            const w = ann.coordinates.width / 100;
            const h = ann.coordinates.height / 100;
            txt += `${i} ${xc.toFixed(5)} ${yc.toFixed(5)} ${w.toFixed(5)} ${h.toFixed(5)}\n`;
          } else if (ann.type === 'polygon' || ann.type === 'segmentation') {
            // YOLO segmentation format is class_index x1 y1 x2 y2 ... normalized
            const coordsList = ann.coordinates as { x: number, y: number }[];
            if (coordsList && coordsList.length > 0) {
              const polyStr = coordsList.map(v => `${(v.x / 100).toFixed(5)} ${(v.y / 100).toFixed(5)}`).join(' ');
              txt += `${i} ${polyStr}\n`;
            }
          }
        });
        payloads.push({ 
          filename: `labels/${item.name.split('.')[0] || 'annotation'}.txt`, 
          text: txt || `# No labels indexed for ${item.name}` 
        });
      });

    } else if (format === 'coco') {
      // COCO JSON standard
      const cocoObj: any = {
        info: {
          year: new Date().getFullYear(),
          version: "1.0",
          description: activeDataset.description,
          contributor: "MediaForge Studio User",
          date_created: new Date().toISOString()
        },
        licenses: [],
        categories: activeDataset.classes.map((c, idx) => ({
          id: idx + 1,
          name: c,
          supercategory: "object"
        })),
        images: datasetItems.map((item, idx) => ({
          id: idx + 1,
          width: 1920, // simulated standard bounds
          height: 1080,
          file_name: item.name,
          license: 1,
          coco_url: item.url,
          date_captured: item.created_at
        })),
        annotations: []
      };

      let annCounter = 1;
      datasetItems.forEach((item, itemIdx) => {
        const itemAnns = allAnns.filter(a => a.item_id === item.id);
        itemAnns.forEach(ann => {
          const classIdx = activeDataset.classes.indexOf(ann.class_name);
          const category_id = classIdx !== -1 ? classIdx + 1 : 1;

          let bbox: number[] = [];
          let segmentation: number[][] = [];
          let area = 0;

          if (ann.type === 'bbox') {
            // Absolute pixels mapped from our 1920x1080 frame
            const x = (ann.coordinates.x / 100) * 1920;
            const y = (ann.coordinates.y / 100) * 1080;
            const w = (ann.coordinates.width / 100) * 1920;
            const h = (ann.coordinates.height / 100) * 1080;
            bbox = [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
            area = Math.round(w * h);
            segmentation = [[Math.round(x), Math.round(y), Math.round(x + w), Math.round(y), Math.round(x + w), Math.round(y + h), Math.round(x), Math.round(y + h)]];
          } else if (ann.type === 'polygon' || ann.type === 'segmentation') {
            const list = ann.coordinates as { x: number, y: number }[];
            const flat: number[] = [];
            let minX = 1920, maxX = 0, minY = 1080, maxY = 0;
            list.forEach(v => {
              const px = (v.x / 100) * 1920;
              const py = (v.y / 100) * 1080;
              flat.push(Math.round(px), Math.round(py));
              if (px < minX) minX = px;
              if (px > maxX) maxX = px;
              if (py < minY) minY = py;
              if (py > maxY) maxY = py;
            });
            bbox = [Math.round(minX), Math.round(minY), Math.round(maxX - minX), Math.round(maxY - minY)];
            area = Math.round((maxX - minX) * (maxY - minY) * 0.7); // Approximate shape area density
            segmentation = [flat];
          }

          cocoObj.annotations.push({
            id: annCounter++,
            image_id: itemIdx + 1,
            category_id,
            segmentation,
            area,
            bbox,
            iscrowd: 0
          });
        });
      });

      payloads.push({ 
        filename: 'annotations_coco.json', 
        text: JSON.stringify(cocoObj, null, 2) 
      });

    } else if (format === 'voc') {
      // PASCAL VOC XML standard
      datasetItems.forEach(item => {
        const itemAnns = allAnns.filter(a => a.item_id === item.id);
        
        let xmlStr = `<annotation>\n  <folder>images</folder>\n  <filename>${item.name}</filename>\n  <path>${item.url}</path>\n  <source>\n    <database>MediaForge Labeling Suite</database>\n  </source>\n  <size>\n    <width>1920</width>\n    <height>1080</height>\n    <depth>3</depth>\n  </size>\n  <segmented>0</segmented>\n`;
        
        itemAnns.forEach(ann => {
          let xmin = 0, ymin = 0, xmax = 0, ymax = 0;
          if (ann.type === 'bbox') {
            xmin = Math.round((ann.coordinates.x / 100) * 1920);
            ymin = Math.round((ann.coordinates.y / 100) * 1080);
            xmax = Math.round(((ann.coordinates.x + ann.coordinates.width) / 100) * 1920);
            ymax = Math.round(((ann.coordinates.y + ann.coordinates.height) / 100) * 1080);
          } else {
            const coordsList = ann.coordinates as { x: number, y: number }[];
            if (coordsList.length > 0) {
              const xs = coordsList.map(v => v.x);
              const ys = coordsList.map(v => v.y);
              xmin = Math.round((Math.min(...xs) / 100) * 1920);
              ymin = Math.round((Math.min(...ys) / 100) * 1080);
              xmax = Math.round((Math.max(...xs) / 100) * 1920);
              ymax = Math.round((Math.max(...ys) / 100) * 1080);
            }
          }
          
          xmlStr += `  <object>\n    <name>${ann.class_name}</name>\n    <pose>Unspecified</pose>\n    <truncated>0</truncated>\n    <difficult>0</difficult>\n    <bndbox>\n      <xmin>${xmin}</xmin>\n      <ymin>${ymin}</ymin>\n      <xmax>${xmax}</xmax>\n      <ymax>${ymax}</ymax>\n    </bndbox>\n  </object>\n`;
        });

        xmlStr += `</annotation>`;
        payloads.push({ 
          filename: `annotations/${item.name.split('.')[0] || 'annotation'}.xml`, 
          text: xmlStr 
        });
      });

    } else if (format === 'json') {
      // Direct raw serialization format JSON
      const entries = datasetItems.map(item => {
        const itemAnns = allAnns.filter(a => a.item_id === item.id);
        return {
          id: item.id,
          name: item.name,
          url: item.url,
          type: item.type,
          created_at: item.created_at,
          annotations: itemAnns.map(ann => ({
            id: ann.id,
            label: ann.class_name,
            geometry_type: ann.type,
            normalized_coordinates: ann.coordinates
          }))
        };
      });

      payloads.push({
        filename: 'raw_annotations.json',
        text: JSON.stringify({ dataset_id: activeDataset.id, name: activeDataset.name, entries }, null, 2)
      });
    }

    setGeneratedPayloads(payloads);
  };

  useEffect(() => {
    if (showExportModal) {
      compilePayloadsForFormat(exportFormat, exportAnnotations);
    }
  }, [exportFormat, exportAnnotations, showExportModal]);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  const downloadPayloadFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPolysCount = () => annotations.filter(a => a.type === 'polygon').length;
  const getBboxCount = () => annotations.filter(a => a.type === 'bbox').length;
  const getSegCount = () => annotations.filter(a => a.type === 'segmentation').length;

  return (
    <div className="space-y-6 font-mono text-slate-100 max-w-6xl mx-auto">
      
      {/* Upper Navigation Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-950/15 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Layers className="h-5.5 w-5.5 text-purple-400" />
            <span>AI vision Dataset Labeler</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build and annotate machine learning datasets directly inside your developer environment.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-900 border border-purple-950/25 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('datasets')}
            className={`px-3 py-1 text-xxs font-bold uppercase tracking-wider rounded transition-all ${
              viewMode === 'datasets' 
                ? 'bg-purple-950/40 text-purple-300 border border-purple-900/40 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manage Datasets
          </button>
          
          <button
            onClick={() => setViewMode('studio')}
            disabled={!activeDataset}
            className={`px-3 py-1 text-xxs font-bold uppercase tracking-wider rounded transition-all flex items-center space-x-1.5 ${
              !activeDataset ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              viewMode === 'studio' 
                ? 'bg-purple-950/40 text-purple-300 border border-purple-900/40 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Labeling Studio</span>
            {activeDataset && (
              <span className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </div>

      {loading && viewMode === 'datasets' ? (
        <div className="text-center py-24 space-y-3">
          <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xxs text-slate-400">Loading datasets from system memory...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: DATASET MANAGEMENT GRID */}
          {viewMode === 'datasets' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 animate-fade-in"
            >
              <div className="flex justify-between items-center bg-slate-900/30 border border-purple-950/20 rounded-xl p-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-205 uppercase">My Dataset Repository</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Separate images and videos into clean categories for model training.</p>
                </div>

                <button
                  onClick={() => {
                    setNewDatasetClasses(['Car', 'Pedestrian', 'Bicycle']);
                    setShowCreateModal(true);
                  }}
                  className="flex items-center space-x-1 border border-purple-505 bg-purple-900/20 hover:bg-purple-900/30 text-purple-303 px-3 py-1.5 rounded-lg text-xxs font-bold uppercase transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create dataset</span>
                </button>
              </div>

              {datasets.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-purple-950/20 rounded-xl bg-slate-950/20 space-y-4">
                  <Database className="h-10 w-10 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400">No active labeling datasets found</p>
                    <p className="text-[10px] text-slate-500">Create your very first vision corpus folder above to start annotating.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {datasets.map((dataset) => {
                    const isActive = activeDataset?.id === dataset.id;
                    const isVideo = dataset.type === 'video';

                    return (
                      <div
                        key={dataset.id}
                        onClick={() => handleSelectDataset(dataset)}
                        className={`p-5 rounded-xl border text-left flex flex-col justify-between space-y-4 cursor-pointer transition ${
                          isActive 
                            ? 'border-purple-605 bg-purple-950/10 shadow-md shadow-purple-500/5' 
                            : 'border-purple-950/15 bg-slate-900/30 hover:border-purple-900/30'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 bg-purple-950/40 border border-purple-900/30 text-purple-400 rounded-lg flex items-center justify-center">
                                {isVideo ? <Video className="h-4.5 w-4.5" /> : <ImageIcon className="h-4.5 w-4.5" />}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-tight">{dataset.name}</h4>
                                <span className="text-[8px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded text-purple-404 font-bold border border-purple-950/30">
                                  {dataset.type} corpus
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleDeleteDataset(dataset.id, e)}
                              className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/10 transition"
                              title="Delete dataset"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="text-[10px] text-slate-400 font-mono leading-relaxed line-clamp-2">
                            {dataset.description || 'No dataset description registered.'}
                          </p>

                          {/* Classes pill metadata indicators */}
                          <div className="flex flex-wrap gap-1">
                            {dataset.classes.map((cls, idx) => (
                              <span 
                                key={cls} 
                                className="text-[8px] px-2 py-0.5 rounded font-mono text-slate-300 bg-slate-950 border border-slate-900/50"
                                style={{ borderLeftColor: getColorForClass(idx), borderLeftWidth: '3px' }}
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Card metadata row */}
                        <div className="flex items-center justify-between border-t border-purple-950/10 pt-3 text-[10px]">
                          <span className="text-slate-500 font-mono">
                            Created: {new Date(dataset.created_at).toLocaleDateString()}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDataset(dataset);
                              setViewMode('studio');
                            }}
                            className="text-purple-400 hover:text-purple-305 font-bold flex items-center space-x-1 text-[10px] uppercase hover:underline"
                          >
                            <span>Launch Labeller</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW 2: INTERACTIVE LABELING WORKSPACE */}
          {viewMode === 'studio' && activeDataset && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              
              {/* LHS: Item Management (Uploading & Files Deck) */}
              <div className="lg:col-span-3 bg-slate-900/30 border border-purple-950/20 rounded-xl p-4.5 space-y-4 lg:max-h-[700px] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-purple-950/10 pb-3">
                  <div>
                    <span className="text-xxs font-bold uppercase tracking-widest text-purple-303 block">Training Assets</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5">{datasetItems.length} items loaded</span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowImportDropdown(!showImportDropdown)}
                      className="p-1 rounded bg-purple-950/30 border border-purple-900/20 hover:border-purple-600 transition text-purple-400"
                      title="Add target asset"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>

                    {showImportDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-purple-950 p-3.5 rounded-xl shadow-xl z-20 space-y-3">
                        <div className="text-[10px] font-bold text-slate-300 uppercase">Load custom vision asset</div>
                        
                        <button
                          onClick={() => {
                            setShowImportDropdown(false);
                            triggerManualFileInput();
                          }}
                          className="w-full py-1.5 px-2.5 rounded text-left text-xxs bg-purple-950/20 hover:bg-purple-900/25 border border-purple-900/20 text-purple-303 flex items-center space-x-2"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Local File</span>
                        </button>

                        <div className="border-t border-purple-950/40 my-2 pt-2 space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-mono">Or Load Asset from Web URL</label>
                          <input
                            type="text"
                            placeholder="https://images.unsplash.com/example.jpg"
                            value={importUrlInput}
                            onChange={(e) => setImportUrlInput(e.target.value)}
                            className="w-full bg-slate-900 border border-purple-950/30 text-slate-300 rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-purple-600"
                          />
                          <button
                            onClick={handleAddRemoteUrl}
                            className="w-full mt-1.5 py-1 text-center bg-indigo-650 hover:bg-indigo-600 text-[10px] text-white font-bold rounded"
                            disabled={!importUrlInput}
                          >
                            Index Remote Link
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileIngestion}
                      accept={activeDataset.type === 'video' ? 'video/*' : 'image/*'}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Upload Status bar */}
                {isUploading && (
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-purple-950/25 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-purple-400 font-bold">Uploading file: {uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* File list scroll deck */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
                  {datasetItems.length === 0 ? (
                    <div className="py-12 text-center text-[10px] text-slate-505 border border-dashed border-purple-950/10 rounded-lg">
                      No matching media items indexed. Click the plus button above or upload sample.
                    </div>
                  ) : (
                    datasetItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      const hasVideo = item.type === 'video';

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectDatasetItem(item)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between gap-2 ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-950/15'
                              : 'border-purple-950/10 bg-slate-950/40 hover:bg-slate-955/20'
                          }`}
                        >
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <div className="h-9 w-9 rounded-md bg-purple-950/20 border border-purple-900/10 flex-shrink-0 overflow-hidden relative flex items-center justify-center">
                              {hasVideo ? (
                                <Video className="h-4.5 w-4.5 text-slate-500" />
                              ) : (
                                <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                            
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold text-white truncate leading-tight tracking-tight uppercase">
                                {item.name}
                              </p>
                              <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">
                                {hasVideo ? 'Video' : 'Image'} Asset
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/10 transition"
                            title="Purge Item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Global Dashboard Navigation Back Link */}
                <button
                  onClick={() => setViewMode('datasets')}
                  className="w-full py-2 border border-purple-950/25 bg-slate-950 hover:bg-purple-950/10 text-slate-450 hover:text-white rounded-lg text-xxs font-bold uppercase transition block text-center"
                >
                  Return to Repo list
                </button>
              </div>

              {/* CENTER: True Interactive Canvas Studio Annotation Workspace */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* Upper Canvas Toolbar control panel */}
                <div className="bg-slate-900/30 border border-purple-950/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Current Tool:</span>
                    
                    <div className="flex bg-slate-950 border border-purple-950/40 p-0.5 rounded">
                      {[
                        { id: 'bbox', label: 'Bounding Box', icon: Minimize2 },
                        { id: 'polygon', label: 'Polygon', icon: Compass },
                        { id: 'segmentation', label: 'Segmentation-Paint', icon: Paintbrush }
                      ].map(tool => {
                        const Icon = tool.icon;
                        const active = labelTool === tool.id;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              setLabelTool(tool.id as any);
                              setPolyVertices([]);
                            }}
                            className={`px-2.5 py-1 text-[9px] font-bold uppercase font-mono rounded transition flex items-center space-x-1 ${
                              active 
                                ? 'bg-purple-950/50 text-purple-300' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title={tool.label}
                          >
                            <Icon className="h-3 w-3" />
                            <span className="hidden sm:inline">{tool.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Show/Hide Label overlay indicators */}
                  <div className="flex items-center space-x-3 text-[10px]">
                    <button
                      onClick={() => setShowLabelsOverlay(!showLabelsOverlay)}
                      className="text-slate-400 hover:text-white transition flex items-center space-x-1"
                    >
                      {showLabelsOverlay ? <Eye className="h-3.5 w-3.5 text-purple-400" /> : <EyeOff className="h-3.5 w-3.5" />}
                      <span>Labels</span>
                    </button>

                    <button
                      onClick={handleClearAllAnnotations}
                      disabled={annotations.length === 0}
                      className={`text-[9px] font-bold uppercase hover:underline flex items-center space-x-1 px-2.5 py-1 border border-purple-950/30 rounded ${
                        annotations.length === 0 ? 'text-slate-600 cursor-not-allowed border-none' : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      Clear File Labels
                    </button>
                  </div>
                </div>

                {/* Canvas viewport wrapper */}
                <div className="relative border border-purple-950/30 rounded-xl overflow-hidden bg-black flex flex-col justify-center items-center select-none shadow-2xl min-h-[380px]">
                  
                  {selectedItem ? (
                    <div 
                      ref={workspaceContainerRef}
                      className="relative w-full max-w-4xl cursor-crosshair overflow-hidden"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onClick={handlePolygonClick}
                    >
                      
                      {/* Sub-item: Image View */}
                      {selectedItem.type === 'image' ? (
                        <img
                          src={selectedItem.url}
                          alt={selectedItem.name}
                          className="w-full h-auto max-h-[500px] object-contain block pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="relative w-full h-auto">
                          <video
                            ref={videoRef}
                            src={selectedItem.url}
                            controls
                            className="w-full max-h-[500px]"
                            crossOrigin="anonymous"
                          />
                        </div>
                      )}

                      {/* Transparent SVG annotation canvas overlay layer */}
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        
                        {/* RENDER ALREADY DRAWN REGISTERED ANNOTATIONS */}
                        {annotations.map((ann) => {
                          const clsColor = getClassColor(ann.class_name);
                          
                          if (ann.type === 'bbox') {
                            const { x, y, width, height } = ann.coordinates;
                            return (
                              <g key={ann.id}>
                                <rect
                                  x={x}
                                  y={y}
                                  width={width}
                                  height={height}
                                  fill={`${clsColor}15`}
                                  stroke={clsColor}
                                  strokeWidth="0.8"
                                />
                                {showLabelsOverlay && (
                                  <foreignObject
                                    x={x}
                                    y={y - 5.5 < 0 ? y + 0.5 : y - 5.5}
                                    width={width + 10}
                                    height="5"
                                  >
                                    <div 
                                      className="text-[2.2px] font-bold font-mono px-0.8 py-0.2 rounded inline-block text-white uppercase leading-none shadow-sm"
                                      style={{ backgroundColor: clsColor }}
                                    >
                                      {ann.class_name}
                                    </div>
                                  </foreignObject>
                                )}
                              </g>
                            );
                          } else if (ann.type === 'polygon' && Array.isArray(ann.coordinates)) {
                            const pointsStr = ann.coordinates.map((v: any) => `${v.x},${v.y}`).join(' ');
                            const ptStart = ann.coordinates[0];
                            return (
                              <g key={ann.id}>
                                <polygon
                                  points={pointsStr}
                                  fill={`${clsColor}15`}
                                  stroke={clsColor}
                                  strokeWidth="0.8"
                                />
                                {showLabelsOverlay && ptStart && (
                                  <foreignObject
                                    x={ptStart.x}
                                    y={ptStart.y - 5.5 < 0 ? ptStart.y + 0.5 : ptStart.y - 5.5}
                                    width="28"
                                    height="5"
                                  >
                                    <div 
                                      className="text-[2.2px] font-bold font-mono px-0.8 py-0.2 rounded inline-block text-white uppercase leading-none shadow-sm"
                                      style={{ backgroundColor: clsColor }}
                                    >
                                      {ann.class_name}
                                    </div>
                                  </foreignObject>
                                )}
                              </g>
                            );
                          } else if (ann.type === 'segmentation' && Array.isArray(ann.coordinates)) {
                            const pointsStr = ann.coordinates.map((v: any) => `${v.x},${v.y}`).join(' ');
                            const ptStart = ann.coordinates[0];
                            return (
                              <g key={ann.id}>
                                <polyline
                                  points={pointsStr}
                                  fill="none"
                                  stroke={clsColor}
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  opacity="0.84"
                                />
                                {showLabelsOverlay && ptStart && (
                                  <foreignObject
                                    x={ptStart.x}
                                    y={ptStart.y - 5.5 < 0 ? ptStart.y + 0.5 : ptStart.y - 5.5}
                                    width="28"
                                    height="5"
                                  >
                                    <div 
                                      className="text-[2.2px] font-bold font-mono px-0.8 py-0.2 rounded inline-block text-white uppercase leading-none shadow-sm"
                                      style={{ backgroundColor: clsColor }}
                                    >
                                      {ann.class_name}
                                    </div>
                                  </foreignObject>
                                )}
                              </g>
                            );
                          }
                          return null;
                        })}

                        {/* RENDER LIVE DRAG FEEDBACKS BASED ON CURRENT SELECTION */}
                        {isDrawing && labelTool === 'bbox' && drawStart && currentMousePos && (
                          <rect
                            x={Math.min(drawStart.x, currentMousePos.x)}
                            y={Math.min(drawStart.y, currentMousePos.y)}
                            width={Math.abs(currentMousePos.x - drawStart.x)}
                            height={Math.abs(currentMousePos.y - drawStart.y)}
                            fill="none"
                            stroke="#fff"
                            strokeWidth="0.6"
                            strokeDasharray="1.2"
                          />
                        )}

                        {/* Direct Line trace guides for current polygon building */}
                        {labelTool === 'polygon' && polyVertices.length > 0 && (
                          <g>
                            {/* Connected vertices */}
                            <polyline
                              points={polyVertices.map(v => `${v.x},${v.y}`).join(' ')}
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth="0.6"
                            />
                            {/* Dynamic cursor line projection */}
                            {currentMousePos && (
                              <line
                                x1={polyVertices[polyVertices.length - 1].x}
                                y1={polyVertices[polyVertices.length - 1].y}
                                x2={currentMousePos.x}
                                y2={currentMousePos.y}
                                stroke="#f59e0b"
                                strokeWidth="0.5"
                                strokeDasharray="1"
                              />
                            )}
                            {/* Circles around anchor vertices */}
                            {polyVertices.map((v, idx) => (
                              <circle
                                key={idx}
                                cx={v.x}
                                cy={v.y}
                                r="1.3"
                                fill={idx === 0 ? "#10b981" : "#a855f7"}
                                stroke="#fff"
                                strokeWidth="0.3"
                              />
                            ))}
                          </g>
                        )}

                        {/* Dynamic brush trace preview segment drawing */}
                        {isDrawing && labelTool === 'segmentation' && segmentStroke.length > 0 && (
                          <polyline
                            points={segmentStroke.map(v => `${v.x},${v.y}`).join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.8"
                          />
                        )}

                      </svg>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3">
                      <ImageIcon className="h-10 w-10 text-slate-700 animate-pulse mx-auto" />
                      <p className="text-xs text-slate-500">Wait. No active media file is designated.</p>
                      <button
                        onClick={triggerManualFileInput}
                        className="py-1 px-3 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/35 text-[10px] text-purple-303 font-bold rounded uppercase font-mono"
                      >
                        Injest file now
                      </button>
                    </div>
                  )}
                </div>

                {/* Keyboard and Controls helpers bar */}
                <div className="bg-slate-900/10 border border-purple-950/10 rounded-lg p-3 text-[9px] text-slate-500 leading-relaxed font-mono flex justify-between items-center">
                  <span>
                    💡 <strong className="text-slate-400">Bounding Box:</strong> Click and drag to label. <span className="mx-2">|</span>
                    <strong className="text-slate-400">Polygon:</strong> Click vertices, click green root circle to close loop. <span className="mx-2">|</span>
                    <strong className="text-slate-400">Segmentation:</strong> Drag brush to paint.
                  </span>

                  <span className="hidden sm:inline border border-purple-950/15 rounded bg-slate-950 px-2 py-0.5 text-[8px] text-purple-400">
                    NORMALIZED COORD VIEW (100x100)
                  </span>
                </div>
              </div>

              {/* RHS: active labels directory & format exports dashboard */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* 1. Class Target Tag Selector */}
                <div className="bg-slate-900/30 border border-purple-950/20 rounded-xl p-4.5 space-y-4">
                  <span className="text-xxs font-bold uppercase tracking-widest text-slate-205 block">Class Tags Array</span>

                  <div className="space-y-2">
                    {activeDataset.classes.map((cls, idx) => {
                      const isSelected = selectedClass === cls;
                      const cColor = getClassColor(cls);

                      return (
                        <button
                          key={cls}
                          onClick={() => setSelectedClass(cls)}
                          className={`w-full text-left p-2 rounded-lg border text-xxs font-mono flex items-center justify-between transition ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-955/15 font-bold text-white' 
                              : 'border-purple-950/10 bg-slate-950/40 hover:bg-slate-950 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cColor }} />
                            <span>{cls}</span>
                          </div>

                          {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Layer Labels indexed for selected item */}
                <div className="bg-slate-900/30 border border-purple-950/20 rounded-xl p-4.5 space-y-4.5">
                  <div className="flex items-center justify-between border-b border-purple-950/10 pb-2.5">
                    <span className="text-xxs font-bold uppercase tracking-widest text-slate-205 flex items-center space-x-1.5">
                      <Layers className="h-4 w-4 text-purple-400" />
                      <span>Item Labels ({annotations.length})</span>
                    </span>

                    <div className="flex space-x-2 text-[8px] text-slate-500 font-mono">
                      <span>Bbox:{getBboxCount()}</span>
                      <span>Poly:{getPolysCount()}</span>
                      <span>Seg:{getSegCount()}</span>
                    </div>
                  </div>

                  <div className="space-y-1.8 max-h-56 overflow-y-auto pr-0.5">
                    {annotations.length === 0 ? (
                      <div className="py-8 text-center text-[10px] text-slate-600 font-mono border border-dashed border-purple-950/5 rounded-lg">
                        No label layers drawn yet. Drag on canvas above to target targets.
                      </div>
                    ) : (
                      annotations.map((ann) => {
                        const styleColor = getClassColor(ann.class_name);
                        return (
                          <div 
                            key={ann.id}
                            className="bg-slate-950/60 rounded-lg p-2 border border-purple-950/10 flex justify-between items-center text-[10px]"
                          >
                            <div className="overflow-hidden space-y-0.5. p-0.5">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: styleColor }} />
                                <span className="text-white font-bold">{ann.class_name}</span>
                                <span className="text-[7.5px] px-1 py-0.2 rounded font-mono uppercase bg-purple-950/20 text-purple-400 border border-purple-900/30">
                                  {ann.type}
                                </span>
                              </div>
                              
                              {ann.type === 'bbox' && (
                                <p className="text-[8.5px] text-slate-500 font-mono leading-none">
                                  x:{ann.coordinates.x} y:{ann.coordinates.y} w:{ann.coordinates.width} h:{ann.coordinates.height}
                                </p>
                              )}
                              {ann.type === 'polygon' && (
                                <p className="text-[8.5px] text-slate-500 font-mono leading-none">
                                  Vertices: {ann.coordinates?.length || 0} nodes
                                </p>
                              )}
                              {ann.type === 'segmentation' && (
                                <p className="text-[8.5px] text-slate-500 font-mono leading-none">
                                  Brush path: {ann.coordinates?.length || 0} tracepoints
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleRemoveAnnotation(ann.id)}
                              className="text-slate-500 hover:text-red-400 p-1"
                              title="Delete layer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Export Compilation Center panel */}
                <div className="bg-slate-900/30 border border-purple-950/20 rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center space-x-1.5">
                    <Code className="h-4 w-4 text-purple-400" />
                    <span className="text-xxs font-bold uppercase tracking-widest text-slate-205">Training Export compiler</span>
                  </div>

                  <p className="text-[9.5px] text-slate-405 leading-relaxed font-mono">
                    Converts current geometry points into specialized vision structures. Matches exact deep learning model guidelines.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { id: 'coco', label: 'COCO JSON', desc: 'Standard instances' },
                      { id: 'yolo', label: 'YOLO txt', desc: 'Normalized centermap' },
                      { id: 'voc', label: 'Pascal XML', desc: 'Object coord bounds' },
                      { id: 'json', label: 'Raw JSON', desc: 'Plain coordinate nodes' }
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        onClick={() => setExportFormat(fmt.id as any)}
                        className={`p-2.5 rounded-lg border text-left flex flex-col justify-between space-y-1 transition text-xxs font-mono ${
                          exportFormat === fmt.id 
                            ? 'border-purple-600 bg-purple-950/15'
                            : 'border-purple-950/10 bg-slate-950/35 hover:bg-slate-950'
                        }`}
                      >
                        <span className="text-white font-bold">{fmt.label}</span>
                        <span className="text-[8px] text-slate-500">{fmt.desc}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={runExportCompile}
                    disabled={datasetItems.length === 0}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-605 hover:from-purple-600 hover:to-indigo-505 text-xxs font-bold tracking-widest uppercase cursor-pointer text-white flex items-center justify-center space-x-1 border border-purple-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Compile Vision Exports</span>
                  </button>
                </div>

              </div>
              
            </motion.div>
          )}

        </AnimatePresence>
      )}

      {/* DIALOG 1: CREATE NEW DATASET MODAL OVERLAY */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-purple-950 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl font-mono text-slate-100"
            >
              <div className="bg-slate-900/60 px-5 py-4 border-b border-purple-950/40 flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Initialize core Dataset Repository</span>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-550 hover:text-white transition p-1"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreateDatasetSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase">Dataset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Traffic Sign detector"
                    value={newDatasetName}
                    onChange={(e) => setNewDatasetName(e.target.value)}
                    className="w-full bg-slate-900 border border-purple-950/30 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase">Description / Operational Directive</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Autonomous vehicle vision labeling task for regulatory warning signs."
                    value={newDatasetDesc}
                    onChange={(e) => setNewDatasetDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-purple-950/30 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase">Corpus Media Type</label>
                    <div className="flex bg-slate-905 border border-purple-950/30 p-1 rounded">
                      <button
                        type="button"
                        onClick={() => setNewDatasetType('image')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition rounded ${
                          newDatasetType === 'image' 
                            ? 'bg-purple-950/50 text-purple-300' 
                            : 'text-slate-450'
                        }`}
                      >
                        Image Set
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewDatasetType('video')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition rounded ${
                          newDatasetType === 'video' 
                            ? 'bg-purple-950/50 text-purple-300' 
                            : 'text-slate-450'
                        }`}
                      >
                        Video Clips
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase">Initialize Label classes</label>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        placeholder="Tag class"
                        value={customClassInput}
                        onChange={(e) => setCustomClassInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-purple-950/30 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddClassTag}
                        className="px-3 bg-purple-900/30 border border-purple-600 rounded text-purple-300 text-xxs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seed classes list badges */}
                <div className="space-y-1 border-t border-purple-950/20 pt-3">
                  <label className="text-[9px] text-slate-500 uppercase">Target Classes list:</label>
                  <div className="flex flex-wrap gap-1 bg-slate-950/40 p-2.5 rounded-lg border border-purple-950/10 min-h-12 max-h-24 overflow-y-auto">
                    {newDatasetClasses.length === 0 ? (
                      <span className="text-[9px] text-slate-600">No classes registered. Type tag name above and add.</span>
                    ) : (
                      newDatasetClasses.map((c, idx) => (
                        <span 
                          key={c} 
                          className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-purple-950/40 text-slate-300 flex items-center space-x-1"
                          style={{ borderLeftColor: getColorForClass(idx), borderLeftWidth: '3px' }}
                        >
                          <span>{c}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveClassTag(c)}
                            className="text-slate-500 hover:text-red-400 hover:font-bold ml-1 font-mono text-[8px]"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Submit actions bottom */}
                <div className="flex justify-end space-x-3 border-t border-purple-950/20 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-purple-950/20 bg-slate-950 hover:bg-slate-900/40 rounded-lg text-xxs font-bold uppercase transition text-slate-400"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={newDatasetClasses.length === 0}
                    className="px-5 py-2 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-xxs font-bold uppercase cursor-pointer text-white border border-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Instantiate Dataset Schema
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG 2: EXPORT ARCHIVE COMPILE PREVIEW MODAL */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-purple-950 max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl font-mono text-slate-100"
            >
              
              {/* Export Modal header */}
              <div className="bg-slate-900/60 px-5 py-4 border-b border-purple-950/40 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Vision Model Label Exports Compiled</span>
                </div>
                
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-550 hover:text-white transition p-1"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Format selection toggles in popup */}
              <div className="bg-slate-950 px-5 py-3 border-b border-purple-950/15 flex items-center space-x-3 flex-wrap gap-2 text-xxs text-slate-550">
                <span>Select active export blueprint:</span>
                <div className="flex bg-slate-900 border border-purple-950/25 p-0.5 rounded shadow">
                  {['coco', 'yolo', 'voc', 'json'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt as any)}
                      className={`px-3 py-1 font-bold uppercase transition rounded ${
                        exportFormat === fmt 
                          ? 'bg-purple-955/30 text-purple-305' 
                          : 'text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code viewer tabs file trees */}
              <div className="p-6 space-y-5">
                <div className="space-y-1">
                  <div className="text-[10px] text-purple-400 font-bold uppercase">Export Structure mapping trees:</div>
                  <p className="text-[9px] text-slate-500 leading-relaxed max-w-xl">
                    Below are the synthesized datasets config templates based on labeled coordinates. Copy individual blocks or download individual files.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* File Lists Column */}
                  <div className="md:col-span-4 bg-slate-900/40 rounded-xl p-3 border border-purple-950/10 space-y-2 max-h-72 overflow-y-auto">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider">Generated Payload Files:</span>
                    <div className="space-y-1">
                      {generatedPayloads.map((payload, idx) => (
                        <div 
                          key={payload.filename}
                          className="p-2 rounded bg-slate-950 border border-purple-950/5 text-[10px] flex items-center justify-between hover:border-purple-650 transition"
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <FileCode className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                            <span className="text-slate-300 truncate select-all">{payload.filename}</span>
                          </div>

                          <button
                            onClick={() => downloadPayloadFile(payload.filename, payload.text)}
                            className="text-emerald-440 hover:text-white"
                            title="Download file"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Code view area Column */}
                  <div className="md:col-span-8 space-y-3">
                    {generatedPayloads.length > 0 ? (
                      <div className="space-y-2">
                        {generatedPayloads.slice(0, 2).map((payload, idx) => (
                          <div key={idx} className="bg-black/80 rounded-xl border border-purple-950/30 overflow-hidden">
                            <div className="bg-slate-900/50 px-4 py-1.5 flex justify-between items-center border-b border-purple-950/20 text-[9px]">
                              <span className="text-slate-400 font-mono italic">{payload.filename}</span>
                              <button
                                onClick={() => handleCopyText(payload.text, idx)}
                                className="flex items-center space-x-1 bg-purple-950/20 px-2 py-0.5 rounded text-purple-301 hover:text-white transition"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="h-2.5 w-2.5 text-emerald-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-2.5 w-2.5" />
                                    <span>Copy Block</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-4 overflow-auto text-[8.5px] text-slate-350 max-h-48 leading-relaxed font-mono selection:bg-purple-900/30">
                              <code>{payload.text}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-[10px] text-slate-500">Wait. Generating compiled payloads...</div>
                    )}
                  </div>

                </div>

              </div>

              {/* Close footer panel actions */}
              <div className="p-5 bg-slate-900/40 border-t border-purple-950/30 flex justify-between items-center">
                <span className="text-[9px] text-slate-550 font-mono">
                  Standard format rules successfully synchronized for ML frameworks.
                </span>

                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-5 py-1.8 bg-purple-650 hover:bg-purple-600 text-xxs font-mono font-bold text-white uppercase rounded shadow transition"
                >
                  Close Exports Dialog
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
