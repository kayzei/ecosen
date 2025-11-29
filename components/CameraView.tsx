
import React, { useState, useRef, useEffect } from 'react';
import geminiService from '../services/geminiService';
import { DetectedObject, ScanHistoryItem, ScanMode } from '../types';
import { LeafIcon } from './icons/LeafIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';

interface CameraViewProps {
  history: ScanHistoryItem[];
  onScanComplete: (image: string, detections: DetectedObject[], mode: ScanMode) => void;
  onClearHistory: () => void;
}

const scanAnimationStyles = `
  @keyframes scan {
    0% { top: 0%; opacity: 0; }
    15% { opacity: 1; }
    85% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  .animate-scan {
    animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
`;

const CameraView: React.FC<CameraViewProps> = ({ history, onScanComplete, onClearHistory }) => {
  const [image, setImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [mode, setMode] = useState<ScanMode>('waste');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const analyzeImage = async (dataUrl: string, mimeType: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const base64Image = dataUrl.split(',')[1];
      const result = await geminiService.analyzeImage(base64Image, mimeType, mode);
      setDetections(result);
      if (result && result.length > 0) {
        onScanComplete(dataUrl, result, mode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsLoading(true);
    setError(null);
    setImage(null);
    setDetections([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions and try again.");
      setIsCameraActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        analyzeImage(dataUrl, 'image/jpeg');
      }
      stopCamera();
    }
  };

  const scanAgain = () => {
    setImage(null);
    setDetections([]);
    setError(null);
    startCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (isCameraActive) {
            stopCamera();
        }
        setImage(dataUrl);
        setDetections([]);
        analyzeImage(dataUrl, file.type);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getThemeColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('plastic') || l.includes('water') || l.includes('blue')) return 'cyan';
    if (l.includes('glass') || l.includes('plant') || l.includes('maize') || l.includes('crop') || l.includes('healthy')) return 'emerald';
    if (l.includes('organic') || l.includes('blight') || l.includes('disease') || l.includes('muddy')) return 'amber';
    if (l.includes('metal') || l.includes('rock')) return 'slate';
    return 'cyan';
  };

  return (
    <div className="flex flex-col min-h-full text-white relative">
      <style>{scanAnimationStyles}</style>

      {/* Mode Selector - Sticky Top */}
      <div className="sticky top-0 z-50 px-4 pt-2 pb-2 bg-gradient-to-b from-slate-900 via-slate-900/95 to-transparent backdrop-blur-sm">
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-lg">
            {(['waste', 'crop', 'water'] as ScanMode[]).map((m) => (
            <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                mode === m 
                    ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
            >
                {m}
            </button>
            ))}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-grow flex flex-col relative group">
        
        {/* State: Camera Active - Full Screen */}
        {isCameraActive && (
            <div className="flex-grow relative overflow-hidden bg-black rounded-b-[32px] mx-0 my-0">
                 <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover absolute inset-0"
                />
                 {/* Camera Overlay Elements */}
                 <div className="absolute inset-0 border border-slate-700/30 rounded-b-[32px] pointer-events-none"></div>
                 <div className="absolute top-10 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                 </div>
            </div>
        )}

        {/* State: Result View - Split Image & Scrollable Content */}
        {image && !isCameraActive && (
            <div className="flex flex-col">
                {/* Result Image */}
                <div className="relative w-full aspect-square bg-slate-900 overflow-hidden shadow-2xl">
                    <img src={image} alt="Scanned item" className="w-full h-full object-cover opacity-80" />
                    
                    {/* Overlay Bounding Boxes */}
                    {!isLoading && detections.map((det, index) => {
                        const [x_min, y_min, x_max, y_max] = det.boundingBox;
                        const color = getThemeColor(det.label);
                        
                        return (
                            <div
                            key={index}
                            className="absolute"
                            style={{
                                left: `${x_min * 100}%`,
                                top: `${y_min * 100}%`,
                                width: `${(x_max - x_min) * 100}%`,
                                height: `${(y_max - y_min) * 100}%`,
                            }}
                            >
                            <div className={`absolute inset-0 border-2 border-${color}-400/80 rounded-lg shadow-[0_0_15px] shadow-${color}-400/30 animate-pulse`}></div>
                             <div className={`absolute -top-3 left-0 bg-black/80 border border-${color}-500/50 px-2 py-0.5 rounded-full backdrop-blur-md`}>
                                <span className={`text-${color}-400 font-bold text-[10px] uppercase`}>{index + 1}</span>
                             </div>
                            </div>
                        );
                    })}

                    {/* Scanning Animation Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 z-30 pointer-events-none">
                            <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
                            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-scan z-40"></div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <span className="inline-block bg-black/60 backdrop-blur-md text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/30 animate-pulse">
                                ANALYZING...
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Analysis Results List */}
                <div className="p-4 space-y-4 bg-slate-900 pb-32">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-white tracking-wide flex items-center">
                            <LeafIcon className="w-5 h-5 text-cyan-400 mr-2" />
                            Analysis Report
                         </h3>
                         <span className="text-xs text-gray-500 uppercase font-bold">{detections.length} Items Found</span>
                    </div>

                    {!isLoading && detections.length > 0 ? (
                        detections.map((det, index) => {
                            const color = getThemeColor(det.label);
                            return (
                                <div key={index} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 hover:border-cyan-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <div className={`w-6 h-6 rounded-full bg-${color}-500/20 text-${color}-400 flex items-center justify-center font-bold text-xs mr-3 border border-${color}-500/30`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-200">{det.label}</h4>
                                                <div className="w-24 h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full bg-${color}-500`} style={{width: `${det.confidence * 100}%`}}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-mono text-${color}-400`}>{(det.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="bg-black/20 rounded-xl p-3 text-sm text-gray-300 mt-3 border border-white/5">
                                        <p className="leading-relaxed">
                                            <span className="text-gray-500 text-xs uppercase font-bold block mb-1">Recommendation</span>
                                            {det.recommendation || "No specific recommendation available."}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        !isLoading && (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-sm">No actionable items detected.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        )}

        {/* State: Idle / Welcome */}
        {!image && !isCameraActive && !isLoading && (
             <div className="flex-grow flex flex-col items-center justify-center text-gray-500 p-8">
                 <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center mb-6">
                    <CameraIcon className="w-10 h-10 opacity-50" />
                 </div>
                 <h3 className="text-xl font-medium text-gray-300 tracking-wide mb-2">Ready to Scan</h3>
                 <p className="text-sm opacity-50 text-center max-w-[200px]">
                    Point camera at waste, crops, or water sources for AI analysis.
                 </p>
            </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Error Toast */}
      {error && (
        <div className="sticky bottom-24 mx-4 bg-red-500/90 text-white text-xs p-3 rounded-xl border border-red-400 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-4 z-50">
            {error}
        </div>
      )}

      {/* Sticky Action Deck */}
      <div className={`sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent z-40 flex items-center justify-between transition-transform duration-300 ${!isCameraActive && image ? 'translate-y-0' : ''}`}>
          
          {/* Left: Upload */}
          <button
            onClick={triggerFileUpload}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            title="Upload Image"
          >
            <UploadIcon className="w-5 h-5" />
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </button>

          {/* Center: Main Action */}
          <div className="relative -mt-6">
              {isCameraActive ? (
                  <button
                    onClick={handleCapture}
                    disabled={isLoading}
                    className="w-20 h-20 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200 active:scale-95 group hover:bg-white/20 shadow-2xl shadow-cyan-500/20"
                  >
                      <div className="w-16 h-16 rounded-full bg-white group-hover:scale-90 transition-transform duration-200 shadow-inner"></div>
                  </button>
              ) : (
                  <button
                    onClick={image ? scanAgain : startCamera}
                    disabled={isLoading}
                    className={`h-14 px-8 rounded-full font-bold shadow-lg shadow-cyan-500/20 transition-all duration-300 transform active:scale-95 flex items-center space-x-2
                        ${image 
                            ? 'bg-slate-800 border border-slate-600 text-white hover:bg-slate-700' 
                            : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/40 hover:brightness-110'
                        } disabled:opacity-50 disabled:grayscale`}
                  >
                    {image ? (
                        <>
                            <CameraIcon className="w-5 h-5" />
                            <span>New Scan</span>
                        </>
                    ) : (
                        <span>Start Camera</span>
                    )}
                  </button>
              )}
          </div>

          {/* Right: History */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg ${
                showHistory 
                ? 'bg-cyan-500 text-slate-900 border-cyan-400 shadow-cyan-500/30' 
                : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-white'
            }`}
            title="History"
          >
            <HistoryIcon className="w-5 h-5" />
          </button>
      </div>

      {/* History Slide-up Panel */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white tracking-wide">Scan History</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-800 rounded-full text-gray-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            {history.length > 0 ? (
                <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {history.map((scan) => (
                        <div key={scan.id} className="flex gap-4 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                            <img src={scan.image} alt="Thumbnail" className="w-20 h-20 rounded-xl object-cover bg-black" />
                            <div className="flex-grow min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                        ${scan.mode === 'waste' ? 'bg-purple-500/20 text-purple-300' : ''}
                                        ${scan.mode === 'crop' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                                        ${scan.mode === 'water' ? 'bg-blue-500/20 text-blue-300' : ''}
                                    `}>
                                        {scan.mode}
                                    </span>
                                    <span className="text-xs text-gray-500">{new Date(scan.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                {scan.detections.length > 0 ? (
                                    <>
                                        <p className="text-sm font-bold text-gray-200 truncate">{scan.detections[0].label}</p>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{scan.detections[0].recommendation}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No clear detection</p>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    <button onClick={onClearHistory} className="w-full py-4 mt-4 text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
                        Clear All Records
                    </button>
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
                    <HistoryIcon className="w-16 h-16 opacity-20 mb-6" />
                    <p>No scans recorded yet.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default CameraView;
