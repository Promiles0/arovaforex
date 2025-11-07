import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronRight, PlayCircle } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  duration: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessonCount: number;
  durationHours: number;
  lessons: Lesson[];
}

const modules: Module[] = [
  {
    id: "1",
    title: "Forex Fundamentals",
    description: "Master the basics of forex trading, including currency pairs, market structure, and trading sessions.",
    lessonCount: 12,
    durationHours: 8,
    lessons: [
      { id: "1-1", title: "What is Forex Trading?", duration: 15 },
      { id: "1-2", title: "Understanding Currency Pairs", duration: 20 },
      { id: "1-3", title: "Market Structure & Sessions", duration: 25 },
      { id: "1-4", title: "Reading Forex Quotes", duration: 18 },
    ]
  },
  {
    id: "2",
    title: "Technical Analysis",
    description: "Learn chart patterns, indicators, and how to analyze price action like a professional trader.",
    lessonCount: 20,
    durationHours: 15,
    lessons: [
      { id: "2-1", title: "Candlestick Patterns", duration: 30 },
      { id: "2-2", title: "Support & Resistance", duration: 25 },
      { id: "2-3", title: "Trend Analysis", duration: 28 },
      { id: "2-4", title: "Technical Indicators", duration: 35 },
    ]
  },
  {
    id: "3",
    title: "Risk Management",
    description: "Protect your capital with proven risk management strategies and position sizing techniques.",
    lessonCount: 15,
    durationHours: 10,
    lessons: [
      { id: "3-1", title: "Position Sizing", duration: 22 },
      { id: "3-2", title: "Stop Loss Strategies", duration: 20 },
      { id: "3-3", title: "Risk-Reward Ratio", duration: 25 },
      { id: "3-4", title: "Bankroll Management", duration: 28 },
    ]
  },
  {
    id: "4",
    title: "Trading Psychology",
    description: "Develop the mental discipline required for consistent trading success.",
    lessonCount: 10,
    durationHours: 6,
    lessons: [
      { id: "4-1", title: "Emotional Control", duration: 18 },
      { id: "4-2", title: "Trading Discipline", duration: 20 },
      { id: "4-3", title: "Dealing with Losses", duration: 22 },
      { id: "4-4", title: "Building Confidence", duration: 25 },
    ]
  }
];

export const CourseCurriculum = () => {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Course Curriculum</h2>
          <p className="text-muted-foreground text-lg">Everything you need to become a profitable trader</p>
        </div>

        <div className="space-y-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <motion.div
                          animate={{ rotate: expandedModule === module.id ? 90 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </motion.div>
                        <h3 className="text-xl font-semibold">
                          Module {index + 1}: {module.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground ml-8">{module.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                      <span>{module.lessonCount} lessons</span>
                      <span>{module.durationHours}h</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedModule === module.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t"
                    >
                      <div className="p-6 bg-accent/20">
                        <ul className="space-y-3">
                          {module.lessons.map((lesson, i) => (
                            <motion.li
                              key={lesson.id}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-background/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <PlayCircle className="w-4 h-4 text-primary" />
                                <span>{lesson.title}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {lesson.duration} min
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
