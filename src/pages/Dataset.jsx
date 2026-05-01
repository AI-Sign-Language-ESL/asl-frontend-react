import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, Tag, Video, Loader2, X, AlertCircle } from 'lucide-react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { datasetService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dataset = () => {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const steps = [
    { id: 1, title: "Record / Upload", icon: <Video className="w-5 h-5" /> },
    { id: 2, title: "Label Data", icon: <Tag className="w-5 h-5" /> },
    { id: 3, title: "Submit", icon: <CheckCircle2 className="w-5 h-5" /> }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const maxSize = 50 * 1024 * 1024;

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().endsWith('.mov')) {
      setError('Please upload MP4, WebM, or MOV files only.');
      return;
    }
    if (selectedFile.size > maxSize) {
      setError('File size must be under 50MB.');
      return;
    }
    setError('');
    setFile(selectedFile);
    setStep(2);
  };

  const handleSubmitDataset = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to contribute.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('word', label);

      await datasetService.contribute(formData);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFile(null);
    setLabel('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-12 pb-20">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Contribute to EASL-10K</h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          Help us build the largest open-source dataset for Egyptian Sign Language. Your contribution directly improves the AI's accuracy.
        </p>
        <div className="flex justify-center mt-6">
          <Link to="/my-contributions" className="flex items-center gap-2 px-6 py-2.5 rounded-full glass border border-white/10 hover:bg-white/5 transition-colors text-text-main font-medium shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            View My Contributions
          </Link>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center justify-between relative px-8">
        <div className="absolute left-14 right-14 top-1/2 h-0.5 bg-white/10 -z-10 -translate-y-1/2" />
        <motion.div 
          className="absolute left-14 top-1/2 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" 
          style={{ right: step === 1 ? '66%' : step === 2 ? '33%' : '14%' }} 
        />
        
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-3">
            <div className={classNames(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500 border-2",
              step >= s.id ? "bg-primary border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)] text-white" : "glass border-white/10 text-text-muted"
            )}>
              {s.icon}
            </div>
            <span className={classNames("font-medium text-sm", step >= s.id ? "text-white" : "text-text-muted")}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="glass rounded-[2.5rem] p-8 md:p-12 min-h-[400px] flex flex-col items-center justify-center border border-white/10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6 z-10 w-full"
          >
            {step === 1 && (
              <>
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-4">
                  <UploadCloud className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Upload your recording</h2>
                <p className="text-text-muted max-w-md">Ensure you are in a well-lit area and your hands are clearly visible in the frame.</p>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={classNames(
                    "w-full max-w-md h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer group mt-4",
                    dragActive ? "border-primary bg-primary/10" : "border-white/20 hover:bg-white/5 hover:border-primary/50"
                  )}
                >
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mov"
                    onChange={handleFileChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center">
                    <span className="font-medium text-text-muted group-hover:text-white transition-colors">Drag & drop or Click to browse</span>
                    <span className="text-xs text-text-muted/60">MP4, WebM, or MOV (Max 50MB)</span>
                  </label>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 mb-4">
                  <Tag className="w-10 h-10 text-secondary" />
                </div>
                <h2 className="text-2xl font-semibold">Label the sign</h2>
                <p className="text-text-muted max-w-md">What word or phrase did you just sign in Egyptian Sign Language?</p>
                <input
                  type="text"
                  placeholder="e.g. Hello, Doctor, Thank you"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full max-w-md px-6 py-4 rounded-xl glass border-white/20 focus:border-primary outline-none mt-4 text-center text-lg"
                />
                {file && (
                  <div className="flex items-center gap-2 text-text-muted text-sm mt-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>{file.name}</span>
                    <button onClick={resetForm} className="ml-2 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center border border-success/30 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                </div>
                <h2 className="text-3xl font-bold">Ready to Submit!</h2>
                <p className="text-text-muted max-w-md">Thank you for your contribution. Once verified, it will be added to the EASL dataset.</p>
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-12 z-10 w-full justify-center">
          {step > 1 && step < 3 && (
            <button onClick={resetForm} className="px-8 py-3 rounded-full glass hover:bg-white/10 transition-colors font-medium">
              Back
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleSubmitDataset}
              disabled={submitting}
              className="px-8 py-3 rounded-full bg-success hover:bg-success/80 text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit
            </button>
          )}
          {step < 2 && (
            <button
              onClick={() => step === 1 ? null : setStep(step + 1)}
              disabled={step === 1 || (step === 2 && !label.trim())}
              className="px-8 py-3 rounded-full bg-primary hover:bg-secondary text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
          {step === 3 && (
            <button onClick={resetForm} className="px-8 py-3 rounded-full bg-success hover:bg-success/80 text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] font-medium">
              Submit Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dataset;