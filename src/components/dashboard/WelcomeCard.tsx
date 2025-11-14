import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { UserDisplayName } from "@/components/common/UserDisplayName";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const WelcomeCard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name, telegram_handle, email')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "☀️";
    if (hour < 18) return "🌤️";
    return "🌙";
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-8 md:p-12 mb-6 border border-border/50 backdrop-blur-sm"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--accent) / 0.1) 50%, hsl(var(--primary) / 0.05) 100%)"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: "hsl(var(--primary))",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full -top-48 -right-24 blur-[80px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent)"
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full -bottom-48 -left-24 blur-[80px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.3), transparent)"
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
        <div className="flex items-start gap-4 lg:gap-6 flex-1">
          <motion.div
            className="text-4xl md:text-5xl"
            animate={{
              rotate: [0, 14, -8, 14, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            style={{
              filter: "drop-shadow(0 4px 12px hsl(var(--primary) / 0.3))"
            }}
          >
            {getTimeIcon()}
          </motion.div>
          
          <div className="flex-1">
            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Good {getGreeting()}, <UserDisplayName profile={profile} userId={user?.id} className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-extrabold" />!
            </motion.h1>
            
            <motion.p
              className="text-muted-foreground text-sm md:text-base"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              Ready to analyze the markets? Check out the latest forecasts and insights.
            </motion.p>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full lg:w-auto"
        >
          <Link to="/dashboard/forecasts">
            <motion.button
              className="w-full lg:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrendingUp className="w-5 h-5" />
              <span>View Market Forecasts</span>
              <motion.span
                className="text-xl"
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                →
              </motion.span>
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Decorative sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "20%", right: "15%", delay: 0 },
          { top: "60%", right: "25%", delay: 0.5 },
          { bottom: "30%", left: "20%", delay: 1 }
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute text-primary"
            style={pos}
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              delay: pos.delay
            }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default WelcomeCard;
