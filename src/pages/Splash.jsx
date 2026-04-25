import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { useFBX, useAnimations, Environment } from '@react-three/drei';

const Avatar = () => {
  const fbx = useFBX('/ahln.fbx');
  const { actions, names } = useAnimations(fbx.animations, fbx);

  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]].reset().fadeIn(0.5).play();
    } else {
      // Fallback to A-pose if no animations are present in the FBX
      fbx.traverse((obj) => {
        const name = obj.name.toLowerCase();
        if (name.includes('arm') && !name.includes('fore')) {
          if (name.includes('left')) obj.rotation.z = 1; // Drop left arm
          if (name.includes('right')) obj.rotation.z = -1; // Drop right arm
        }
      });
    }
  }, [actions, names, fbx]);

  // Adjusted scale to 0.018 for FBX 
  return <primitive object={fbx} scale={0.018} position={[0, -2, 0]} />;
};

const AnimatedText = ({ text }) => {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.5 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 10,
    },
  };

  return (
    <motion.div
      style={{ display: "flex", overflow: "hidden", justifyContent: "center", flexWrap: "wrap", gap: "0.5rem" }}
      variants={container}
      initial="hidden"
      animate="visible"
      className="text-xl md:text-3xl font-medium mt-8 tracking-[0.2em] text-text-main font-oswald uppercase"
    >
      {words.map((word, index) => (
        <motion.span variants={child} key={index} className="inline-block drop-shadow-md">
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

const Splash = () => {
  const navigate = useNavigate();
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 500);

    const redirectTimer = setTimeout(() => {
      navigate('/home');
    }, 6000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      {/* 3D Avatar Container */}
      <div className="w-full h-[50vh] md:h-[60vh] relative">
        <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={1} />
          <Environment preset="city" />
          <Suspense fallback={null}>
            <Avatar />
          </Suspense>
        </Canvas>
      </div>

      {/* Animated Text */}
      <div className="h-24">
        {showText && <AnimatedText text="A world where no one is left behind" />}
      </div>
    </motion.div>
  );
};

export default Splash;
