
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
    <div className="flex flex-col h-full text-white relative">
      <style>{scanAnimationStyles}</style>

      {/* Top Bar: Mode Selector */}
      <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-4 border border-slate-700/50 backdrop-blur-md relative z-10">
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

      {/* Main Viewport */}
      <div className="flex-grow relative rounded-[32px] overflow-hidden bg-black border border-slate-800 shadow-inner group">
        {/* Loading / Scanning Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 pointer-events-none">
             {/* If we have an image, we are scanning it. If not, we are initializing camera */}
             {image ? (
                <>
                  <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-scan z-40"></div>
                  <div className="absolute bottom-10 left-0 right-0 text-center">
                    <span className="inline-block bg-black/60 backdrop-blur-md text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/30 animate-pulse">
                      ANALYZING {mode.toUpperCase()}...
                    </span>
                  </div>
                </>
             ) : (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                   <LeafIcon className="w-12 h-12 text-cyan-500 animate-bounce mb-4" />
                   <p className="text-cyan-400 text-sm font-mono animate-pulse">INITIALIZING SENSORS...</p>
                </div>
             )}
          </div>
        )}

        {/* Camera Feed */}
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0 absolute'}`}
        />

        {/* Captured/Uploaded Image */}
        {image && !isCameraActive && (
          <div className="relative w-full h-full bg-slate-900">
            <img src={image} alt="Scanned item" className="w-full h-full object-contain opacity-80" />
            
            {/* Detections */}
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
                  <div className={`absolute inset-0 border-2 border-${color}-400/80 rounded-lg shadow-[0_0_15px] shadow-${color}-400/30 animate-pulse`}>
                      <div className={`absolute top-0 left-0 w-2 h-2 bg-${color}-400 rounded-br`}></div>
                      <div className={`absolute bottom-0 right-0 w-2 h-2 bg-${color}-400 rounded-tl`}></div>
                  </div>
                  
                  <div className={`absolute -top-3 left-0 right-0 flex justify-center z-10`}>
                     <div className={`flex items-center space-x-2 bg-black/80 border border-${color}-500/50 px-2 py-1 rounded-full backdrop-blur-md transform -translate-y-full mb-1`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-${color}-400`}></div>
                        <span className={`text-${color}-400 font-bold text-[10px] tracking-wider uppercase whitespace-nowrap`}>
                          {det.label}
                        </span>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Idle State */}
        {!image && !isCameraActive && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                 <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center mb-4">
                    <CameraIcon className="w-8 h-8 opacity-50" />
                 </div>
                 <p className="text-sm font-medium tracking-wide">CAMERA OFFLINE</p>
                 <p className="text-xs opacity-50 mt-1">Tap start to scan</p>
            </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-32 left-4 right-4 bg-red-500/90 text-white text-xs p-3 rounded-xl border border-red-400 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-4">
            {error}
        </div>
      )}

      {/* No Results Toast */}
      {detections.length === 0 && !isLoading && image && (
         <div className="absolute bottom-32 left-4 right-4 bg-slate-800/90 text-gray-300 text-xs p-3 rounded-xl border border-slate-600 shadow-xl backdrop-blur text-center">
            No clear matches found for {mode} mode.
         </div>
      )}

      {/* Control Deck */}
      <div className="pt-6 pb-2 px-4 flex items-center justify-between relative z-20">
          
          {/* Left: Upload */}
          <button
            onClick={triggerFileUpload}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Upload Image"
          >
            <UploadIcon className="w-5 h-5" />
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </button>

          {/* Center: Main Action (Shutter or Start) */}
          <div className="relative">
              {isCameraActive ? (
                  // Shutter Button
                  <button
                    onClick={handleCapture}
                    disabled={isLoading}
                    className="w-20 h-20 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200 active:scale-95 group hover:bg-white/20"
                  >
                      <div className="w-16 h-16 rounded-full bg-white group-hover:scale-90 transition-transform duration-200"></div>
                  </button>
              ) : (
                  // Start / Scan Again Button
                  <button
                    onClick={image ? scanAgain : startCamera}
                    disabled={isLoading}
                    className={`h-16 px-8 rounded-full font-bold shadow-lg shadow-cyan-500/20 transition-all duration-300 transform active:scale-95 flex items-center space-x-2
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
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 active:scale-95 ${
                showHistory 
                ? 'bg-cyan-500 text-slate-900 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' 
                : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-white'
            }`}
            title="History"
          >
            <HistoryIcon className="w-5 h-5" />
          </button>
      </div>

      {/* History Slide-up Panel */}
      {showHistory && (
        <div className="absolute inset-x-0 bottom-0 top-20 z-40 bg-slate-900/95 backdrop-blur-xl rounded-t-[32px] border-t border-slate-700 p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white tracking-wide">Scan History</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-800 rounded-full text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            {history.length > 0 ? (
                <>
                <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {history.map((scan) => (
                        <div key={scan.id} className="flex gap-4 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                            <img src={scan.image} alt="Thumbnail" className="w-16 h-16 rounded-xl object-cover bg-black" />
                            <div className="flex-grow min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-1">
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
                                    <p className="text-sm font-medium text-gray-200 truncate">{scan.detections[0].label}</p>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No clear detection</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={onClearHistory} className="mt-4 w-full py-3 text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
                    Clear All Records
                </button>
                </>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
                    <HistoryIcon className="w-12 h-12 opacity-20 mb-4" />
                    <p>No scans recorded yet.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default CameraView;
