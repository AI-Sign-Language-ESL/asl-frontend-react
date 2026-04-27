import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HeartHandshake, BrainCircuit, Globe2, EarOff, 
  MessageCircle, ShieldAlert, Users, Database, 
  Activity, Mic2, Smartphone, Sparkles, ArrowRight, PlayCircle, Zap, ShieldCheck
} from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { useTranslation } from 'react-i18next';
import handAnimation from '../assets/hand-animation.json';
import heroImg from '../assets/tafahom-hero.jpg';

const Home = () => {
  const { t } = useTranslation();
  const problems = [
    { icon: <MessageCircle />, title: t('home.problem1_title'), desc: t('home.problem1_desc') },
    { icon: <Globe2 />, title: t('home.problem2_title'), desc: t('home.problem2_desc') },
    { icon: <ShieldAlert />, title: t('home.problem3_title'), desc: t('home.problem3_desc') },
    { icon: <Users />, title: t('home.problem4_title'), desc: t('home.problem4_desc') }
  ];

  const solutions = [
    { icon: <Database />, title: t('home.solution1_title'), desc: t('home.solution1_desc') },
    { icon: <Activity />, title: t('home.solution2_title'), desc: t('home.solution2_desc') },
    { icon: <BrainCircuit />, title: t('home.solution3_title'), desc: t('home.solution3_desc') },
    { icon: <Mic2 />, title: t('home.solution4_title'), desc: t('home.solution4_desc') },
    { icon: <Smartphone />, title: t('home.solution5_title'), desc: t('home.solution5_desc') }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="flex flex-col gap-32 pb-20">
      {/* New Primary Hero Section */}
      <section className="relative pt-16 pb-20 min-h-[70vh] flex items-center overflow-hidden">
        {/* Wavy bottom border */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-0">
          <svg className="relative block w-full h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,116.8,192.41,96.69,235.68,82.52,279.8,64.12,321.39,56.44Z" fill="currentColor" className="text-primary/10"></path>
          </svg>
        </div>

        <div className="w-full px-6 md:px-12 lg:px-16 2xl:px-32 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 relative z-10">
          
          {/* Left Column - Text Content */}
          <div className="flex-[0.8] space-y-8 pt-8">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <h1 className="text-5xl md:text-6xl lg:text-[76px] font-extrabold leading-[1.1] text-text-main mb-6 tracking-tight">
                {t('hero.title_part1')} <br />
                <span className="text-primary">{t('hero.title_part2')}</span>
              </h1>
              <p className="text-lg md:text-xl text-text-muted mt-6 max-w-lg leading-relaxed font-medium">
                {t('hero.subtitle')}
              </p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex pt-4">
              <Link to="/translator" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-bold text-base transition-all shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_25px_rgba(59,130,246,0.5)] flex items-center gap-2 active:scale-95 w-max">
                {t('hero.button')} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-10 mt-6">
              <div className="flex items-center gap-3 ltr:pr-6 rtl:pl-6 border-r rtl:border-l rtl:border-r-0 border-border-subtle">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-md">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-text-main leading-tight whitespace-pre-line">{t('hero.feature1').replace(' ', '\n')}</span>
              </div>

              <div className="flex items-center gap-3 ltr:pr-6 rtl:pl-6 border-r rtl:border-l rtl:border-r-0 border-border-subtle">
                <div className="w-10 h-10 rounded-full bg-[#FBBF24] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-text-main leading-tight whitespace-pre-line">{t('hero.feature2').replace(' ', '\n')}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2DD4BF] flex items-center justify-center text-white shrink-0 shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-text-main leading-tight whitespace-pre-line">{t('hero.feature3').replace(' ', '\n')}</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Image & Decorations */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex-[1.1] relative w-full flex justify-center lg:justify-end items-center mt-12 lg:mt-0"
          >
            {/* The exact background shapes from the design */}
            {/* Main Solid Primary Blob Behind Image */}
            <div className="absolute top-[-5%] left-[5%] w-[85%] h-[105%] bg-primary/80 rounded-[45%_55%_70%_30%/40%_50%_60%_50%] -z-20 scale-105 origin-center transform -rotate-6" />
            
            {/* Dotted pattern circle top right */}
            <div className="absolute top-[-5%] right-[-10%] w-56 h-56 rounded-full bg-[radial-gradient(currentColor_2px,transparent_2px)] [background-size:16px_16px] text-primary/30 opacity-60 -z-30" />
            
            {/* Solid accent circle bottom right */}
            <div className="absolute bottom-[10%] right-[-10%] w-32 h-32 bg-[#FCD34D] rounded-full -z-30" />
            
            {/* Outline blob loop */}
            <svg className="absolute top-[-15%] right-[10%] w-[130%] h-[130%] pointer-events-none -z-40 text-primary opacity-40 scale-125 origin-center" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M40 50 C 60 10, 160 10, 180 50 C 200 90, 160 180, 100 190 C 40 200, -10 120, 40 50 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Main Image Container */}
            <div className="relative w-full max-w-[650px] lg:max-w-[800px] xl:max-w-[950px] aspect-[16/11] z-10 mx-auto lg:-mr-12 2xl:-mr-24 mt-12 lg:mt-0">
              <div className="w-full h-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-slate-100" style={{ borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }}>
                <img src={heroImg} alt="People using sign language translation" className="w-full h-full object-cover scale-[1.03]" />
              </div>
              
              {/* Floating Card 1: Message */}
              <motion.div 
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute -top-4 -right-4 md:-top-6 md:-right-10 bg-bg-card px-5 py-4 rounded-[1.25rem] shadow-xl flex items-center gap-4 z-20"
              >
                <p className="text-xs md:text-sm font-semibold text-text-main leading-snug whitespace-nowrap">{t('hero.card1')}</p>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
              </motion.div>

              {/* Floating Card 2: Social Proof */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.8 }}
                className="absolute bottom-6 -left-4 md:bottom-10 md:-left-12 bg-bg-card p-5 rounded-[1.25rem] shadow-xl z-20"
              >
                <div className="flex -space-x-2 mb-3 ltr:flex-row rtl:flex-row-reverse rtl:space-x-reverse">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-bg-card bg-slate-200 overflow-hidden shrink-0">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-bg-card bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0 shadow-inner">
                    +126
                  </div>
                </div>
                <p className="text-[11px] md:text-xs font-medium text-text-muted whitespace-nowrap leading-[1.4]">
                  <span className="font-bold text-text-main text-xs md:text-sm">{t('hero.card2_bold')}</span> <br/> {t('hero.card2_light')}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Container for remaining sections to constrain width */}
      <div className="w-full max-w-7xl mx-auto px-6 flex flex-col gap-32">

      {/* Version 2.0 Announcement Section */}
      <section className="relative pt-10 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8 z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-primary text-sm font-medium mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              {t('home.version')}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-text-main">
              {t('home.world_where')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {t('home.no_one_left_behind')}
              </span>
            </h1>
            <p className="text-xl text-text-muted mt-6 max-w-2xl leading-relaxed">
              {t('home.world_subtitle')}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-4">
            <Link to="/translator" className="bg-primary hover:bg-secondary text-white px-8 py-4 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center gap-2">
              {t('home.start_translating')} <HeartHandshake className="w-5 h-5 rtl:-scale-x-100" />
            </Link>
            <Link to="/dataset" className="glass px-8 py-4 rounded-full font-semibold text-text-main hover:bg-bg-card transition-colors">
              {t('home.contribute')}
            </Link>
          </motion.div>
        </div>

        {/* Abstract 3D/Visual representation placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="flex-1 relative aspect-square max-w-md w-full rounded-full bg-gradient-to-tr from-primary/20 to-secondary/5 border border-border-subtle flex items-center justify-center p-8 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0,transparent_70%)] rounded-full blur-2xl" />
          <div className="w-full h-full border border-primary/20 rounded-full flex items-center justify-center">
            <div className="w-[80%] h-[80%] border border-secondary/20 rounded-full flex items-center justify-center">
              <div className="w-80 h-80 opacity-90 flex justify-center items-center">
                <Player autoplay loop src={handAnimation} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="flex flex-col items-center text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="max-w-3xl space-y-4 mb-16">
          <EarOff className="w-12 h-12 text-secondary mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-5xl font-bold text-text-main">{t('home.silent_struggle')}</h2>
          <p className="text-lg text-text-muted leading-relaxed">
            {t('home.silent_struggle_desc')}
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
        >
          {problems.map((prob, i) => (
            <motion.div key={i} variants={fadeIn} className="glass p-8 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-secondary mb-6">
                {prob.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-main">{prob.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{prob.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Solution Section */}
      <section className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10" />

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-text-main">{t('home.ecosystem_title')}</h2>
          <p className="text-lg text-text-muted max-w-2xl">
            {t('home.ecosystem_desc')}
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {solutions.map((sol, i) => (
            <motion.div key={i} variants={fadeIn} className="glass p-8 rounded-3xl group border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                {sol.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-main">{sol.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{sol.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* App Availability */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
        className="glass rounded-[3rem] p-16 flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <h2 className="text-3xl font-bold mb-10 z-10 text-text-main">{t('home.available_title')}</h2>
        <div className="flex flex-col sm:flex-row gap-6 z-10">
          <button className="flex items-center gap-4 bg-text-main text-bg-main px-8 py-4 rounded-2xl hover:scale-105 transition-transform active:scale-95 ltr:flex-row rtl:flex-row-reverse rtl:text-right">
            <svg viewBox="0 0 384 512" className="w-8 h-8 fill-current"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
            <div className="text-left rtl:text-right">
              <div className="text-xs font-semibold opacity-70">{t('home.download_apple')}</div>
              <div className="text-xl font-bold -mt-1">App Store</div>
            </div>
          </button>
          <button className="flex items-center gap-4 bg-bg-card border border-border-subtle text-text-main px-8 py-4 rounded-2xl hover:scale-105 hover:bg-white/20 transition-all active:scale-95 ltr:flex-row rtl:flex-row-reverse rtl:text-right">
            <svg viewBox="0 0 512 512" className="w-8 h-8 fill-primary"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" /></svg>
            <div className="text-left rtl:text-right">
              <div className="text-xs font-semibold opacity-70">{t('home.get_google')}</div>
              <div className="text-xl font-bold -mt-1">Google Play</div>
            </div>
          </button>
        </div>
      </motion.section>

      </div>
    </div>
  );
};

export default Home;