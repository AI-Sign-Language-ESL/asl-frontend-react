import React, { forwardRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { Camera, ChevronDown } from 'lucide-react';
import classNames from 'classnames';

const CameraPreview = forwardRef(({ isActive, error, onStart, onStop, onUserMedia, onUserMediaError, disabled }, ref) => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Enumerate all video input devices so the user can pick their virtual camera
  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Must request permission first so device labels are visible
        await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => {});
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = all.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (e) {
        // Permission denied — list will be empty
      }
    };
    loadDevices();
  }, []);

  const videoConstraints = selectedDeviceId
    ? { deviceId: { exact: selectedDeviceId }, width: 1280, height: 720 }
    : { width: 1280, height: 720 };

  return (
    <div className="flex-1 glass rounded-3xl overflow-hidden flex flex-col relative border border-border-subtle">
      <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-card/50 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={classNames(
            "w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]",
            isActive ? "bg-success text-success animate-pulse" : "bg-text-muted text-text-muted"
          )} />
          <span className="font-semibold text-sm tracking-wide text-text-main">
            {isActive ? 'Recording' : 'Camera Off'}
          </span>
        </div>

        {/* Camera device selector — visible when camera is off */}
        {!isActive && devices.length > 1 && (
          <div className="relative flex items-center gap-1">
            <Camera className="w-4 h-4 text-text-muted" />
            <select
              value={selectedDeviceId}
              onChange={e => setSelectedDeviceId(e.target.value)}
              className="appearance-none bg-bg-card border border-border-subtle text-text-main text-xs rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[200px] truncate"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-text-muted absolute right-2 pointer-events-none" />
          </div>
        )}

        <button
          onClick={isActive ? onStop : onStart}
          disabled={disabled}
          className={classNames(
            "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all",
            disabled && "opacity-50 cursor-not-allowed",
            isActive
              ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
              : "bg-primary text-white hover:bg-secondary shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          )}
        >
          {isActive ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        {isActive ? (
          <>
            <Webcam
              ref={ref}
              audio={false}
              videoConstraints={videoConstraints}
              onUserMedia={onUserMedia}
              onUserMediaError={onUserMediaError}
              className="w-full h-full object-cover opacity-80"
              mirrored={true}
            />
            <motion.div
              animate={{ y: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-primary/20 to-transparent border-b border-primary/50 pointer-events-none"
            />
            <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-white/20 rounded-tl-xl" />
            <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-white/20 rounded-tr-xl" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-white/20 rounded-bl-xl" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-white/20 rounded-br-xl" />
          </>
        ) : (
          <div className="text-text-muted flex flex-col items-center gap-4">
            <Camera className="w-16 h-16 opacity-20" />
            <p>Camera is currently off</p>
          </div>
        )}
      </div>
    </div>
  );
});

CameraPreview.displayName = 'CameraPreview';

export default CameraPreview;
