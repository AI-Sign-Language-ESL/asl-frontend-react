import React, { useState, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send, Play, Pause, RotateCcw } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { useFBX, Environment } from '@react-three/drei';

const AvatarModel = () => {
  const fbx = useFBX('/idle.fbx');

  useEffect(() => {
    fbx.traverse((obj) => {
      const name = obj.name.toLowerCase();
      if (name.includes('arm') && !name.includes('fore')) {
        if (name.includes('left')) obj.rotation.z = 1;
        if (name.includes('right')) obj.rotation.z = -1;
      }
    });
  }, [fbx]);

  // Adjusted scale to 0.02 for FBX
  return <primitive object={fbx} scale={0.02} position={[0, -2.5, 0]} />;
};

const Generator = () => {
  const [inputText, setInputText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 max-w-5xl mx-auto w-full pb-6">

      {/* Input Area */}
      <div className="glass p-4 rounded-3xl flex gap-3 border border-border-subtle items-center drop-shadow-xl relative z-10">
        <button className="p-3 bg-bg-card hover:bg-bg-card/80 rounded-full transition-colors group">
          <Mic className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to translate into sign language..."
          className="flex-1 bg-transparent outline-none text-text-main placeholder:text-text-muted/50 text-lg"
        />
        <button className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-full font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2">
          <span>Generate</span>
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Canvas Area */}
      <div className="flex-1 glass rounded-3xl border border-border-subtle relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="flex-1 w-full relative">
          <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }} dpr={[1, 1.5]}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[0, 2, 5]} intensity={1} />
            <Environment preset="city" />
            <Suspense fallback={null}>
              <AvatarModel />
            </Suspense>
          </Canvas>

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-bg-card/80 backdrop-blur-md px-6 py-3 rounded-full border border-border-subtle shadow-2xl">
            <button className="p-2 hover:bg-bg-card rounded-full transition-colors text-text-main">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-primary hover:bg-secondary rounded-full flex items-center justify-center transition-colors shadow-lg text-white"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Generator;
