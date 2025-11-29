
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
    // Basic heuristic for colors based on common labels in different modes
    const l = label.toLowerCase();
    if (l.includes('plastic') || l.includes('water') || l.includes('blue')) return 'cyan';
    if (l.includes('glass') || l.includes('plant') || l.includes('maize') || l.includes('crop') || l.includes('healthy')) return 'emerald';
    if (l.includes('organic') || l.includes('blight') || l.includes('disease') || l.includes('muddy')) return 'amber';
    if (l.includes('metal') || l.includes('rock')) return 'slate';
    return 'cyan'; // default
  };

  const ModeButton = ({ m, label }: { m: ScanMode, label: string }) => (
    <button
      onClick={() => {
        setMode(m);
        // If we switch modes while results are shown, maybe clear them or warn?
        // For now, let's just switch the mode state for the NEXT scan.
      }}
      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
        mode === m 
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
          : 'bg-slate-800 text-gray-500 border border-transparent hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full text-white">
      {/* Mode Selector */}
      <div className="flex space-x-2 mb-4 p-1 bg-slate-800/50 rounded-xl border border-gray-700/50">
        <ModeButton m="waste" label="Waste" />
        <ModeButton m="crop" label="Crops" />
        <ModeButton m="water" label="Water" />
      </div>

      <div className="flex-grow space-y-4">
        <div className="w-full aspect-square bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center relative overflow-hidden group">
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
              <LeafIcon className="w-16 h-16 text-cyan-400 animate-bounce" />
              <p className="mt-4 text-xl font-light tracking-widest text-cyan-200 animate-pulse">
                {isCameraActive ? 'INITIALIZING...' : `ANALYZING ${mode.toUpperCase()}...`}
              </p>
            </div>
          )}
          
          {isCameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {image && !isCameraActive && (
            <div className="relative w-full h-full">
              <img src={image} alt="Scanned item" className="w-full h-full object-contain" />
              {detections.map((det, index) => {
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
                     {/* Radar Ping Effect */}
                    <div className={`absolute inset-0 border-2 border-${color}-400 rounded-lg animate-ping opacity-50`}></div>
                    
                    {/* Main Pulsating Box */}
                    <div className={`absolute inset-0 border-2 border-${color}-400 rounded-lg shadow-[0_0_20px] shadow-${color}-400/50 animate-pulse`}>
                        {/* Inner Glow Fill */}
                        <div className={`absolute inset-0 bg-${color}-400/10`}></div>
                        
                        {/* Tech Corners */}
                        <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-${color}-200`}></div>
                        <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-${color}-200`}></div>
                        <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-${color}-200`}></div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-${color}-200`}></div>
                    </div>
                    
                    {/* Floating Label */}
                    <div className={`absolute -top-10 left-0 flex flex-col items-start z-10 w-48`}>
                       <div className={`flex items-center space-x-2 bg-slate-900/90 border border-${color}-400/50 px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md transform transition-all hover:scale-105`}>
                          <div className={`w-2 h-2 rounded-full bg-${color}-400 animate-pulse`}></div>
                          <span className={`text-${color}-400 font-bold text-xs tracking-wide truncate max-w-[120px]`}>
                            {det.label.toUpperCase()}
                          </span>
                          <span className="text-gray-400 text-xs border-l border-gray-600 pl-2">
                             {(det.confidence * 100).toFixed(0)}%
                          </span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!image && !isCameraActive && !isLoading && (
            <div className="text-center text-gray-400 p-4">
              <CameraIcon className="w-16 h-16 mx-auto text-gray-500 mb-2 opacity-50" />
              <p className="text-lg font-medium text-gray-300">Ready to Scan</p>
              <p className="text-sm mt-1 text-gray-500">
                Mode: <span className="text-cyan-400 capitalize">{mode}</span>
              </p>
            </div>
          )}
        </div>
        
        <canvas ref={canvasRef} className="hidden" />

        {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                {error}
            </div>
        )}
        
        <div className="flex items-center space-x-3">
             {/* Upload Button */}
             <button
                onClick={triggerFileUpload}
                disabled={isLoading}
                title="Upload Image"
                className="p-3.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 shadow-lg hover:bg-slate-700 hover:border-cyan-400/30 hover:shadow-cyan-400/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <UploadIcon className="w-6 h-6" />
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                />
            </button>

            {/* Main Action Button */}
            <button
                onClick={
                    isCameraActive
                    ? handleCapture
                    : image
                    ? scanAgain
                    : startCamera
                }
                disabled={isLoading}
                className={`flex-grow py-3.5 px-6 font-bold rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${isCameraActive 
                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 text-white' 
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/30'
                    }`}
              >
                {isLoading ? 'Processing...' : isCameraActive ? 'Capture' : image ? 'Scan New Item' : `Start ${mode.charAt(0).toUpperCase() + mode.slice(1)} Scan`}
            </button>

            {/* History Toggle */}
            <button
                onClick={() => setShowHistory(!showHistory)}
                aria-pressed={showHistory}
                title="View History"
                className={`p-3.5 rounded-xl border shadow-lg transition-all duration-300 
                    ${showHistory 
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-cyan-500/10' 
                        : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-cyan-300'
                    }`}
            >
                <HistoryIcon className="w-6 h-6" />
            </button>
        </div>

        {detections.length === 0 && !isLoading && image && (
           <div className="p-4 bg-slate-800/50 rounded-xl border border-dashed border-gray-700 text-center">
                <p className="text-gray-400 text-sm">No items identified in this frame for {mode} analysis.</p>
           </div>
        )}
      </div>

      {showHistory && (
        <div className="flex-shrink-0 mt-4 border-t border-gray-700 pt-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-sm uppercase tracking-wider font-bold text-gray-400">Recent Scans</h3>
                {history.length > 0 && (
                     <button onClick={onClearHistory} className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors">
                        Clear History
                     </button>
                )}
            </div>
            {history.length > 0 ? (
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {history.map((scan) => (
                    <div key={scan.id} className="flex items-start bg-slate-800 p-2 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-colors group">
                        <img src={scan.image} alt="Scan thumbnail" className="w-12 h-12 rounded bg-slate-900 object-cover mr-3" />
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-xs text-gray-500">{new Date(scan.id).toLocaleTimeString()}</p>
                            </div>
                            {scan.detections.length > 0 ? (
                                scan.detections.slice(0, 2).map((det, index) => (
                                    <div key={index} className="flex items-center text-sm mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-${getThemeColor(det.label)}-400 mr-2`}></div>
                                        <span className="text-gray-200 capitalize truncate">{det.label}</span>
                                        <span className="text-gray-500 text-xs ml-auto">{(det.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-600 mt-1 italic">No items detected</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-xl">
                    <p className="text-gray-600 text-sm">No scans yet</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default CameraView;