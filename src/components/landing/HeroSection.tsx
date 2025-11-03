import { Button } from "@/components/ui/button";
import { Zap, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [text, setText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const phrases = [
    "Master the Markets with AI-Powered Analysis",
    "Trade Smarter, Not Harder",
    "Join 10,000+ Successful Traders"
  ];

  useEffect(() => {
    const phrase = phrases[currentPhraseIndex];
    let currentIndex = 0;
    let isDeleting = false;

    const typeInterval = setInterval(() => {
      if (!isDeleting && currentIndex < phrase.length) {
        setText(phrase.slice(0, currentIndex + 1));
        currentIndex++;
      } else if (isDeleting && currentIndex > 0) {
        setText(phrase.slice(0, currentIndex - 1));
        currentIndex--;
      } else if (!isDeleting && currentIndex === phrase.length) {
        setTimeout(() => {
          isDeleting = true;
        }, 2000);
      } else if (isDeleting && currentIndex === 0) {
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        isDeleting = false;
      }
    }, isDeleting ? 50 : 100);

    return () => clearInterval(typeInterval);
  }, [currentPhraseIndex]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background animate-gradient-shift" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 50,
              opacity: 0
            }}
            animate={{
              y: -50,
              opacity: [0, 1, 1, 0],
              x: Math.random() * window.innerWidth
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center mb-6"
        >
          <img
            src="https://raw.githubusercontent.com/Promiles0/assets/main/apple-touch-icon.png"
            alt="ArovaForex Logo"
            className="w-16 h-16 rounded-xl object-contain"
          />
        </motion.div>

        {/* Main Title with Gradient Animation */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-primary via-success to-primary bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_auto]">
            Professional Forex Trading
          </span>
        </motion.h1>

        {/* Typewriter Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="h-16 mb-8"
        >
          <p className="text-2xl md:text-3xl text-muted-foreground">
            {text}
            <span className="animate-pulse">|</span>
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span>14-Day Free Trial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span>Cancel Anytime</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                className="relative overflow-hidden group bg-gradient-to-r from-primary to-success hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {isAuthenticated ? "Go to Dashboard" : "Start Trading Free"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-success to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </motion.div>
          </Link>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 relative"
        >
          <div className="relative rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm p-4 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="aspect-video bg-gradient-to-br from-primary/10 via-success/5 to-background rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Animated Chart Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200">
                <motion.path
                  d="M0 100 Q100 50 200 100 T400 100"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-primary"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </svg>
              
              {/* Floating Stat Cards */}
              <motion.div
                className="absolute top-8 left-8 bg-success/20 backdrop-blur-md px-4 py-2 rounded-lg border border-success/30"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="text-success text-sm font-semibold">+$1,234.56 ↑</div>
              </motion.div>
              
              <motion.div
                className="absolute bottom-8 right-8 bg-primary/20 backdrop-blur-md px-4 py-2 rounded-lg border border-primary/30"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              >
                <div className="text-primary text-sm font-semibold">73.5% Win Rate</div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
