"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";

interface WrappedSlidesProps {
  data: {
    userInfo: {
      name: string;
      avatar: string;
      followers: number;
      following: number;
      publicRepos: number;
    };
    stats: {
      favoriteTime: string;
      nightOwl: boolean;
      pullRequests: number;
      issuesOpened: number;
      totalContributions: number;
      longestStreak: number;
      currentStreak?: number;
      mostActiveDay: {
        date: string;
        contributions: number;
      } | null;
      mostActiveMonth: string;
      starsEarned: number;
      powerLevel: string;
      animeRank: {
        title: string;
        level: string;
        description: string;
      };
      workStyle: string;
      consistency: number;
      specialAchievements: string[];
      topLanguages: [string, number][];
      crackedEngineer: {
        level: string;
        description: string;
        percentile: number;
        intensity: string;
        focusScore: number;
      };
      yearlyStory: {
        story: string;
        highlights: string[];
        theme: string;
      };
    };
    topRepositories: Array<{
      name: string;
      stars: number;
      forks: number;
      language: string;
    }>;
  };
}

const SLIDE_DURATION = 4000; // 4 seconds per slide

const GRADIENTS = {
  blue: "bg-gradient-to-br from-blue-500/20 to-purple-600/20",
  green: "bg-gradient-to-br from-green-500/20 to-emerald-600/20",
  orange: "bg-gradient-to-br from-orange-500/20 to-red-600/20",
  purple: "bg-gradient-to-br from-purple-500/20 to-pink-600/20",
  pink: "bg-gradient-to-br from-pink-500/20 to-rose-600/20",
  yellow: "bg-gradient-to-br from-yellow-500/20 to-orange-600/20",
};

// Add this utility component for scrollable content
function ScrollableContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 px-4">
      <div className="min-h-full flex items-center justify-center py-8">
        {children}
      </div>
    </div>
  );
}

export default function WrappedSlides({ data }: WrappedSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const slides = [
    {
      id: "intro",
      content: () => (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="flex h-full flex-col items-center justify-center space-y-8 px-5 text-center"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-6xl font-bold text-transparent">
              {data.userInfo.name}
            </h2>
            <p className="text-2xl text-gray-300">Your GitHub Year in Review</p>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "contributions",
      content: () => (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-full flex-col items-center justify-center space-y-8 px-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-8xl font-bold text-green-400"
          >
            {data.stats.totalContributions}
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl text-gray-300"
          >
            Total Contributions
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "languages",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-6 px-5">
          <h3 className="text-3xl font-bold">Top Languages</h3>
          <div className="w-full max-w-md space-y-4 overflow-y-auto max-h-[70vh] pr-2">
            {data.stats.topLanguages
              .slice(0, 10)
              .map(([lang, percentage], index) => (
                <motion.div
                  key={lang}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-lg font-semibold">{lang}</span>
                    <span className="text-gray-400">{percentage}%</span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </motion.div>
              ))}
          </div>
        </motion.div>
      ),
    },
    {
      id: "repos",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid grid-cols-2 gap-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="space-y-2 text-center"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl font-bold text-blue-400"
              >
                {data.userInfo.publicRepos}
              </motion.div>
              <p className="text-xl text-gray-300">Repositories</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="space-y-2 text-center"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-6xl font-bold text-purple-400"
              >
                {data.stats.starsEarned}
              </motion.div>
              <p className="text-xl text-gray-300">Stars</p>
            </motion.div>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "achievements",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-6">
          <h3 className="mb-4 text-3xl font-bold">Special Achievements</h3>
          <div className="w-full max-w-md space-y-4">
            {data.stats.specialAchievements
              .slice(0, 3)
              .map((achievement, index) => (
                <motion.div
                  key={achievement}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="rounded-lg bg-gray-800/50 p-4"
                >
                  <div className="text-lg">{achievement}</div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      ),
    },
    {
      id: "anime-rank",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-8 px-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="space-y-4 text-center"
          >
            <div className="text-7xl font-bold text-yellow-400">
              {data.stats.animeRank.title}
            </div>
            <div className="text-2xl text-gray-300">
              Rank: {data.stats.animeRank.level}
            </div>
            <div className="max-w-md text-lg text-gray-400">
              {data.stats.animeRank.description}
            </div>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "streak",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-8 px-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="space-y-4 text-center"
          >
            <div className="text-7xl font-bold text-orange-400">
              {data.stats.currentStreak || 0}
            </div>
            <div className="text-2xl text-gray-300">Day Streak 🔥</div>
            <div className="text-lg text-gray-400">
              Longest Streak: {data.stats.longestStreak || 0} days
            </div>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "peak-activity",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-8 px-5">
          <h3 className="text-3xl font-bold">Peak Activity</h3>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-6 text-center"
          >
            <div className="text-5xl font-bold text-purple-400">
              {data.stats.mostActiveDay?.date || "No data"}
            </div>
            <div className="text-2xl text-gray-300">
              {data.stats.mostActiveDay?.contributions || 0} contributions
            </div>
            <div className="text-lg text-gray-400">
              Most active day this year
            </div>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "top-repos",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-6">
          <h3 className="mb-4 text-3xl font-bold">Most Popular Repos</h3>
          <div className="w-full max-w-md space-y-4">
            {(data.topRepositories || [])
              .slice(0, 3)
              .map((repo: any, index: number) => (
                <motion.div
                  key={repo.name}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="rounded-lg bg-gray-800/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{repo.name}</span>
                    <span className="flex items-center text-yellow-400">
                      ⭐ {repo.stars}
                    </span>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      ),
    },
    {
      id: "commit-times",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-6">
          <h3 className="text-3xl font-bold">Commit Patterns</h3>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4 text-center"
          >
            <div className="text-4xl font-bold text-blue-400">
              {data.stats.favoriteTime || "3 PM"}
            </div>
            <div className="text-xl text-gray-300">Most Active Hour</div>
            <div className="text-lg text-gray-400">
              {data.stats.nightOwl ? "🦉 Night Owl" : "🌅 Early Bird"}
            </div>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "collaborations",
      content: () => (
        <motion.div className="flex h-full flex-col items-center justify-center space-y-8 px-5">
          <h3 className="text-3xl font-bold">Collaborations</h3>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid grid-cols-2 gap-8"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">
                {data.stats.pullRequests || 0}
              </div>
              <div className="text-gray-300">Pull Requests</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-400">
                {data.stats.issuesOpened || 0}
              </div>
              <div className="text-gray-300">Issues Opened</div>
            </div>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "yearly-story",
      content: () => (
        <motion.div
          className={`relative h-full ${GRADIENTS.purple} rounded-lg`}
        >
          <ScrollableContent>
            <div className="flex flex-col items-center justify-center space-y-6 p-6">
              <h3 className="text-3xl font-bold">Your GitHub Story</h3>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center"
              >
                <div className="text-lg leading-relaxed text-gray-200">
                  {data.stats.yearlyStory.story}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {data.stats.yearlyStory.highlights.map((highlight, index) => (
                    <motion.span
                      key={highlight}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm"
                    >
                      {highlight}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </ScrollableContent>
        </motion.div>
      ),
    },
    {
      id: "work-style",
      content: () => (
        <motion.div
          className={`flex h-full flex-col items-center justify-center space-y-8 px-5 ${GRADIENTS.green} rounded-lg p-6`}
        >
          <h3 className="text-3xl font-bold">Your Coding Style</h3>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6 text-center"
          >
            <div className="text-5xl font-bold text-green-400">
              {data.stats.workStyle}
            </div>
            <div className="text-xl text-gray-300">
              Consistency Score: {Math.round(data.stats.consistency)}%
            </div>
            <div className="text-lg text-gray-400">
              {data.stats.workStyle === "Burst Coder"
                ? "You prefer intense coding sessions!"
                : data.stats.workStyle === "Consistent Shinobi"
                ? "You maintain a steady coding rhythm!"
                : "You balance your coding time well!"}
            </div>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "achievements-showcase",
      content: () => (
        <motion.div
          className={`relative h-full ${GRADIENTS.yellow} rounded-lg`}
        >
          <ScrollableContent>
            <div className="flex flex-col items-center justify-center space-y-6 p-6">
              <h3 className="text-3xl font-bold sticky top-0 bg-gradient-to-b from-gray-900 to-transparent pb-4">
                Achievement Showcase
              </h3>
              <div className="w-full max-w-md space-y-4">
                {data.stats.specialAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg bg-white/10 p-4 backdrop-blur-sm"
                  >
                    <div className="text-lg">{achievement}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollableContent>
        </motion.div>
      ),
    },
    {
      id: "finale",
      content: () => (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-full flex-col items-center justify-center space-y-8 px-5 text-center"
          onAnimationComplete={() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold">
              Keep Building Amazing Things!
            </h2>
            <p className="text-xl text-gray-300">See you next year! 🚀</p>
          </motion.div>
        </motion.div>
      ),
    },
  ];

  const filteredSlides = slides.filter(
    (slide) => slide.id !== "cracked-engineer"
  );

  const handleSlideNavigation = (direction: "left" | "right") => {
    if (direction === "right") {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  useEffect(() => {
    // Start progress bar
    startTimeRef.current = Date.now();
    const updateProgress = () => {
      if (isPaused) return;

      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = (elapsed / SLIDE_DURATION) * 100;

      if (newProgress >= 100) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setProgress(0);
        startTimeRef.current = Date.now();
      } else {
        setProgress(newProgress);
        progressRef.current = setTimeout(updateProgress, 16); // ~60fps
      }
    };

    progressRef.current = setTimeout(updateProgress, 16);

    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
    };
  }, [currentSlide, slides.length, isPaused]);

  const handleSlideInteraction = (pause: boolean) => {
    setIsPaused(pause);
    if (!pause) {
      // Reset the start time when unpausing to continue from current progress
      startTimeRef.current = Date.now() - (progress / 100) * SLIDE_DURATION;
    }
  };

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-md overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-black shadow-2xl">
      {/* Progress bars */}
      <div className="absolute inset-x-0 top-0 z-50 flex gap-1 p-2">
        {slides.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 overflow-hidden rounded-full bg-gray-700/50 backdrop-blur-sm"
          >
            <div
              className={`h-full bg-white ${
                isPaused ? "" : "transition-all duration-200"
              }`}
              style={{
                width: `${
                  index === currentSlide
                    ? progress
                    : index < currentSlide
                    ? 100
                    : 0
                }%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation overlays */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/4 z-40 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleSlideNavigation("left");
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1/4 z-40 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleSlideNavigation("right");
        }}
      />

      {/* Slides container */}
      <div
        className="h-full w-full"
        onMouseDown={() => handleSlideInteraction(true)}
        onMouseUp={() => handleSlideInteraction(false)}
        onMouseLeave={() => handleSlideInteraction(false)}
        onTouchStart={() => handleSlideInteraction(true)}
        onTouchEnd={() => handleSlideInteraction(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            {slides[currentSlide].content()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
