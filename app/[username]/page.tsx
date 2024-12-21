"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Twitter, Linkedin, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import WrappedSlides from "../components/github-wrapped/WrappedSlides";
import Socials from "../components/Socials";

export default function UserWrapped({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wrappedData, setWrappedData] = useState<any | null>(null);
  const router = useRouter();
  const { username } = use(params);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/github-wrapped?username=${username}`
        );
        if (response.ok) {
          const data = await response.json();
          setWrappedData(data);
        } else {
          const data = await response.json();
          setError(data.error || "Failed to fetch GitHub data");
        }
      } catch (error) {
        console.error("Error fetching GitHub data:", error);
        setError("Failed to fetch GitHub data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const handleShare = (platform: "twitter" | "linkedin") => {
    if (!wrappedData) return;

    const stats = wrappedData.stats;
    const shareText = `🚀 My GitHub Wrapped 2024:\n
🌟 ${stats.totalContributions} Contributions
⚡ ${stats.longestStreak} Day Streak
🎯 ${stats.animeRank.title} (${stats.animeRank.level})
💻 Top Language: ${stats.topLanguages[0]?.[0] || "N/A"}
https://your-github-wrapped-2024.vercel.app/`;

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        "https://your-github-wrapped-2024.vercel.app/"
      )}&summary=${encodeURIComponent(shareText)}`,
    };

    window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#300171] to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white">Loading GitHub Wrapped...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#300171] to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-gray-300 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#300171] to-gray-900">
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <WrappedSlides data={wrappedData} />
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/")}
                  className="text-gray-300 transition-colors hover:text-white"
                >
                  Try Another Username
                </motion.button>
              </div>

              <div className="flex items-center gap-4 mt-2 mb-4 sm:-mb-20">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare("twitter")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-all duration-200"
                >
                  <Twitter className="h-5 w-5" />
                  Share on Twitter
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare("linkedin")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-all duration-200"
                >
                  <Linkedin className="h-5 w-5" />
                  Share on LinkedIn
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
        <Socials />
      </div>
    </div>
  );
}
