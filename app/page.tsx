"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Github,
  Loader2,
  Twitter,
  Linkedin,
  Share2,
} from "lucide-react";
import WrappedSlides from "./components/github-wrapped/WrappedSlides";
import { useRouter } from "next/navigation";
import Socials from "./components/Socials";

export default function GitHubWrapped() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Validate the username first
      const response = await fetch(`/api/github-wrapped?username=${username}`);
      if (response.ok) {
        router.push(`/${username}`);
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-black">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="relative container mx-auto px-4">
        <div className="min-h-screen flex flex-col">
          <div className="text-center pt-16 mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="mb-4 text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                GitHub Wrapped 2024
              </h1>
              <p className="text-xl text-gray-300">
                Get your GitHub Year end stats wrapped in a nice package
              </p>
            </motion.div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-md  -mt-20"
            >
              <form
                onSubmit={handleSubmit}
                className="rounded-xl bg-white/10 backdrop-blur-md p-8 shadow-2xl border border-white/20"
              >
                <div className="mb-6 flex items-center gap-2">
                  <Github className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">
                    Enter Your GitHub Username
                  </h2>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., octocat"
                    className="w-full rounded-lg bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10 transition-all duration-200"
                    required
                  />
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-6 w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-medium transition-all duration-200 hover:from-purple-500 hover:to-blue-500 transform hover:scale-[1.02] active:scale-[0.98] ${
                    loading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating Your Wrapped...
                    </span>
                  ) : (
                    "Generate My Wrapped"
                  )}
                </button>
              </form>
            </motion.div>{" "}
          </div>{" "}
          <Socials />
        </div>
      </div>
    </div>
  );
}
