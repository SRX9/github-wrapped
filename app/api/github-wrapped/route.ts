import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Redis } from "@upstash/redis";

const GITHUB_API_BASE = "https://api.github.com";
const CACHE_DURATION = 240 * 60 * 60; // 24 hours in seconds

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface Contribution {
  date: string;
  count: number;
}

interface Repository {
  name: string;
  stars: number;
  forks: number;
  language: string;
}

interface Stats {
  totalContributions: number;
  topLanguages: [string, number][];
  mostActiveDay: {
    date: string;
    contributions: number;
  };
  mostActiveMonth: string;
  longestStreak: number;
  currentStreak: number;
  universalRank: string;
  starsEarned: number;
  powerLevel: string;
}

interface AnimeRank {
  title: string;
  description: string;
  level: string;
  image?: string;
}

interface EnhancedStats extends Stats {
  animeRank: AnimeRank;
  consistency: number;
  contributionQuality: string;
  preferredWorkDays: string[];
  workStyle: string;
  specialAchievements: string[];
  codingTimeDistribution: { [key: string]: number };
  teamCollaboration: string;
  challengeRating: number;
}

interface CrackedEngineerStats {
  level: string;
  description: string;
  percentile: number;
  intensity: string;
  focusScore: number;
}

interface YearlyStory {
  story: string;
  highlights: string[];
  theme: string;
}

async function fetchWithAuth(url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  return response.json();
}

async function getContributions(username: string): Promise<Contribution[]> {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection(from: "${startOfYear.toISOString()}", to: "${today.toISOString()}") {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = await response.json();
  const calendar = data.data.user.contributionsCollection.contributionCalendar;

  const contributions: Contribution[] = [];
  calendar.weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      contributions.push({
        date: day.date,
        count: day.contributionCount,
      });
    });
  });

  return contributions;
}

async function getTopRepositories(username: string): Promise<Repository[]> {
  const response = await fetchWithAuth(
    `${GITHUB_API_BASE}/users/${username}/repos?sort=stars&per_page=10`
  );

  return response.map((repo: any) => ({
    name: repo.name,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
  }));
}

async function getLanguageStats(username: string) {
  const repos = await fetchWithAuth(
    `${GITHUB_API_BASE}/users/${username}/repos`
  );

  const languageStats: { [key: string]: number } = {};

  for (const repo of repos) {
    if (!repo.language) continue;

    // Get language breakdown for each repo
    const languages = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${username}/${repo.name}/languages`
    );

    // Add weighted language contributions
    for (const [language, bytes] of Object.entries(languages)) {
      languageStats[language] = (languageStats[language] || 0) + Number(bytes);
    }
  }

  // Convert bytes to percentages
  const total = Object.values(languageStats).reduce((a, b) => a + b, 0);
  const percentages = Object.fromEntries(
    Object.entries(languageStats).map(([lang, bytes]) => [
      lang,
      Number(((bytes / total) * 100).toFixed(1)),
    ])
  );

  return percentages;
}

async function calculateStats(username: string, contributions: Contribution[]) {
  // Get repositories for stars count
  const repos = await fetchWithAuth(
    `${GITHUB_API_BASE}/users/${username}/repos`
  );

  // Calculate total stars
  const totalStars = repos.reduce(
    (sum: number, repo: any) => sum + repo.stargazers_count,
    0
  );

  // Find most active day (peak contributions)
  const peakDay = contributions.reduce(
    (max, current) => (current.count > (max?.count || 0) ? current : max),
    contributions[0]
  );

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  const sortedContributions = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate current streak going backwards from today
  for (const contribution of sortedContributions) {
    const contribDate = new Date(contribution.date);
    const diffDays = Math.floor(
      (today.getTime() - contribDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > currentStreak && contribution.count === 0) {
      break;
    }
    if (contribution.count > 0) {
      currentStreak++;
    }
  }

  // Calculate longest streak
  let tempStreak = 0;
  let longestStreak = 0;
  for (const contribution of contributions) {
    if (contribution.count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Calculate most active month
  const monthlyContributions = new Map<string, number>();
  contributions.forEach(({ date, count }) => {
    const month = new Date(date).toLocaleString("default", { month: "long" });
    monthlyContributions.set(
      month,
      (monthlyContributions.get(month) || 0) + count
    );
  });
  const mostActiveMonth = Array.from(monthlyContributions.entries()).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  // Calculate most active day of week
  const dayContributions = new Map<string, number>();
  contributions.forEach(({ date, count }) => {
    const day = new Date(date).toLocaleString("default", { weekday: "long" });
    dayContributions.set(day, (dayContributions.get(day) || 0) + count);
  });
  const mostActiveDay = Array.from(dayContributions.entries()).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  // Calculate total contributions
  const totalContributions = contributions.reduce(
    (sum, { count }) => sum + count,
    0
  );

  // Determine power level
  let powerLevel = "Novice";
  if (totalContributions > 1000) powerLevel = "Elite Class";
  if (totalContributions > 2000) powerLevel = "Sage Mode";
  if (totalContributions > 5000) powerLevel = "Legendary";

  // Determine universal rank
  let universalRank = "Top 10%";
  if (totalContributions > 1500) universalRank = "Top 2%";
  if (totalContributions > 2500) universalRank = "Top 1%";

  // Get language stats
  const languages = await getLanguageStats(username);
  const topLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) as [string, number][];

  return {
    totalContributions,
    mostActiveDay: {
      date: peakDay.date,
      contributions: peakDay.count,
    },
    mostActiveMonth,
    currentStreak,
    longestStreak,
    universalRank,
    starsEarned: totalStars,
    powerLevel,
    topLanguages,
  };
}

async function calculateEnhancedStats(
  username: string,
  contributions: Contribution[]
) {
  const baseStats = await calculateStats(username, contributions);

  // Calculate consistency (ratio of active days vs total days)
  const activeDays = contributions.filter((c) => c.count > 0).length;
  const consistency = (activeDays / contributions.length) * 100;

  // Determine work style based on contribution patterns
  const workStyle = determineWorkStyle(contributions);

  // Calculate preferred working days
  const preferredWorkDays = calculatePreferredDays(contributions);

  // Determine anime-inspired rank based on various factors
  const animeRank = determineAnimeRank(
    baseStats.totalContributions,
    consistency,
    baseStats.longestStreak
  );

  // Calculate special achievements
  const specialAchievements = await calculateSpecialAchievements(
    username,
    contributions
  );

  return {
    ...baseStats,
    consistency,
    workStyle,
    preferredWorkDays,
    animeRank,
    specialAchievements,
  };
}

function determineAnimeRank(
  contributions: number,
  consistency: number,
  streak: number
): AnimeRank {
  const totalScore = contributions * 0.4 + consistency * 0.3 + streak * 0.3;
  const isExceptional = contributions > 2000 && consistency > 90 && streak > 50;

  if (totalScore > 95 && isExceptional)
    return {
      title: "Hokage",
      level: "SSS",
      description:
        "A legendary shinobi who leads and inspires others. Only achieved by the top 1%",
    };
  if (totalScore > 90)
    return {
      title: "Special Grade Sorcerer",
      level: "SS",
      description: "Wielding extraordinary power in the coding realm",
    };
  if (totalScore > 80)
    return {
      title: "Elite Jonin",
      level: "S+",
      description: "Elite developer with exceptional skills",
    };
  if (totalScore > 70)
    return {
      title: "Jonin",
      level: "S",
      description: "Highly skilled developer with proven expertise",
    };
  if (totalScore > 60)
    return {
      title: "Chunin",
      level: "A",
      description: "Skilled developer with solid contributions",
    };
  if (totalScore > 40)
    return {
      title: "Genin",
      level: "B",
      description: "Growing developer with steady progress",
    };
  return {
    title: "Academy Student",
    level: "C",
    description: "Beginning the coding journey with determination",
  };
}

async function calculateSpecialAchievements(
  username: string,
  contributions: Contribution[]
) {
  const achievements = [];

  // Base achievements
  const totalContributions = contributions.reduce(
    (sum, { count }) => sum + count,
    0
  );
  const activeDays = contributions.filter((c) => c.count > 0).length;
  const consistency = (activeDays / contributions.length) * 100;

  // Contribution Rank Achievements (Anime-inspired)
  if (totalContributions > 2000) {
    achievements.push("🔮 Supreme Hokage Level (2000+ Contributions)");
  } else if (totalContributions > 1500) {
    achievements.push("⚡ Special Grade Sorcerer (1500+ Contributions)");
  } else if (totalContributions > 1000) {
    achievements.push("🎭 Elite Jonin Level (1000+ Contributions)");
  } else if (totalContributions > 500) {
    achievements.push("🌟 Skilled Chunin (500+ Contributions)");
  } else if (totalContributions > 250) {
    achievements.push("✨ Advanced Genin (250+ Contributions)");
  } else if (totalContributions > 100) {
    achievements.push("⭐ Academy Graduate (100+ Contributions)");
  } else {
    achievements.push("🌱 Academy Student (Starting Journey)");
  }

  // Streak-Based Titles
  const streak = calculateLongestStreak(contributions);
  if (streak > 50) {
    achievements.push("🔥 Sage of Six Paths (50+ Days Streak)");
  } else if (streak > 30) {
    achievements.push("🌌 Legendary Shinobi (30+ Days Streak)");
  } else if (streak > 14) {
    achievements.push("🎯 Elite Ninja (14+ Days Streak)");
  } else if (streak > 7) {
    achievements.push("🌊 Chakra Master (7+ Days Streak)");
  }

  // Consistency Titles
  if (consistency > 90) {
    achievements.push("💫 Supreme Oracle (90%+ Consistency)");
  } else if (consistency > 75) {
    achievements.push("🎭 Master Sorcerer (75%+ Consistency)");
  } else if (consistency > 60) {
    achievements.push("🌟 Skilled Mystic (60%+ Consistency)");
  } else if (consistency > 40) {
    achievements.push("🌟 Apprentice Mage (40%+ Consistency)");
  }

  // Special Time-Based Achievements
  const nightOwl = contributions.some((c) => {
    const hour = new Date(c.date).getHours();
    return c.count > 0 && (hour >= 22 || hour <= 4);
  });
  if (nightOwl) achievements.push("🦉 Shadow Assassin (Night Owl)");

  const earlyBird = contributions.some((c) => {
    const hour = new Date(c.date).getHours();
    return c.count > 0 && hour >= 5 && hour <= 9;
  });
  if (earlyBird) achievements.push("🌅 Dawn Warrior (Early Bird)");

  // Weekend Achievement
  const weekendWarrior =
    contributions.filter((c) => {
      const day = new Date(c.date).getDay();
      return c.count > 0 && (day === 0 || day === 6);
    }).length > 20;
  if (weekendWarrior) achievements.push("⚔️ Weekend Warrior Jutsu Master");

  // Heavy Contribution Days
  const heavyDays = contributions.filter((c) => c.count >= 10).length;
  if (heavyDays > 20) {
    achievements.push("💪 Titan Shifter (20+ Heavy Contribution Days)");
  } else if (heavyDays > 10) {
    achievements.push("🔥 Cursed Technique User (10+ Heavy Contribution Days)");
  } else if (heavyDays > 5) {
    achievements.push("⚡ Thunder Breathing User (5+ Heavy Contribution Days)");
  }

  // Perfectionist Pattern
  const hasConsistentPattern =
    contributions.filter((c) => c.count > 0).length >
    contributions.length * 0.7;
  if (hasConsistentPattern) {
    achievements.push("💎 Domain Expansion: Perfect Code");
  }

  // Special Combined Achievements
  if (consistency > 70 && streak > 20 && totalContributions > 1000) {
    achievements.push("🌌 Unlimited Code Works: Supreme Developer");
  }

  if (nightOwl && earlyBird && weekendWarrior) {
    achievements.push("🎭 All-Realm Coding Sage: Master of Time");
  }

  return achievements;
}

function calculateLongestStreak(contributions: Contribution[]): number {
  let currentStreak = 0;
  let longestStreak = 0;

  contributions.forEach(({ count }) => {
    if (count > 0) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return longestStreak;
}

function determineWorkStyle(contributions: Contribution[]) {
  const patterns = contributions.map((c) => c.count);
  const average = patterns.reduce((a, b) => a + b, 0) / patterns.length;
  const variance =
    patterns.reduce((a, b) => a + Math.pow(b - average, 2), 0) /
    patterns.length;

  if (variance > 10) return "Burst Coder";
  if (average > 5) return "Consistent Shinobi";
  return "Balanced Developer";
}

function calculatePreferredDays(contributions: Contribution[]) {
  const dayStats = new Map<string, number>();
  contributions.forEach(({ date, count }) => {
    const day = new Date(date).toLocaleString("default", { weekday: "long" });
    dayStats.set(day, (dayStats.get(day) || 0) + count);
  });

  return Array.from(dayStats.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([day]) => day);
}

function calculateCrackedEngineerStats(
  contributions: Contribution[],
  stats: Stats
): CrackedEngineerStats {
  const intensityScore = contributions.reduce(
    (sum, { count }) => sum + (count > 5 ? 1 : 0),
    0
  );
  const focusScore = (stats.longestStreak / 365) * 100;
  const totalContributions = stats.totalContributions;
  const consistency =
    (contributions.filter((c) => c.count > 0).length / contributions.length) *
    100;

  let level = "Code Artisan";
  let description = "Crafting code with growing expertise";
  let percentile = 80;
  let intensity = "Steady";

  // More granular levels based on multiple factors
  if (intensityScore > 150 && focusScore > 80 && totalContributions > 2000) {
    level = "Tech Grandmaster";
    description =
      "A legendary force in the coding universe, inspiring generations!";
    percentile = 99;
    intensity = "Mythical";
  } else if (
    intensityScore > 120 &&
    focusScore > 70 &&
    totalContributions > 1500
  ) {
    level = "Code Virtuoso";
    description = "Mastering the art of code with extraordinary skill!";
    percentile = 97;
    intensity = "Legendary";
  } else if (
    intensityScore > 100 &&
    focusScore > 60 &&
    totalContributions > 1200
  ) {
    level = "Elite Architect";
    description = "Designing the future of technology with masterful precision";
    percentile = 95;
    intensity = "Exceptional";
  } else if (
    intensityScore > 80 &&
    focusScore > 50 &&
    totalContributions > 1000
  ) {
    level = "Innovation Sage";
    description = "Pioneering new frontiers in software development";
    percentile = 90;
    intensity = "Intense";
  } else if (
    intensityScore > 60 &&
    focusScore > 40 &&
    totalContributions > 500
  ) {
    level = "Code Maestro";
    description = "Orchestrating complex solutions with elegant code";
    percentile = 85;
    intensity = "High";
  } else if (consistency < 80) {
    level = "Rookie";
    description = "Beginning an exciting journey in code";
    percentile = 50;
    intensity = "Learning";
  }

  return {
    level,
    description,
    percentile,
    intensity,
    focusScore,
  };
}

async function generateYearlyStory(
  stats: Stats,
  contributions: Contribution[],
  achievements: string[]
): Promise<YearlyStory> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const prompt = `
    Create an inspiring and fun story about a developer's GitHub journey this year. Here are the key details:
    - Total Contributions: ${stats.totalContributions}
    - Longest Streak: ${stats.longestStreak} days
    - Power Level: ${stats.powerLevel}
    - Most Active Month: ${stats.mostActiveMonth}
    - Stars Earned: ${stats.starsEarned}
    - Notable Achievements: ${achievements.slice(0, 3).join(", ")}
    - Top Languages: ${stats.topLanguages
      .slice(0, 3)
      .map(([lang]) => lang)
      .join(", ")}

    Make it personal, motivating, and include anime/gaming references. Keep it under 200 words and make it sound epic!
    Focus on their growth, dedication, and impact. Include specific numbers but write them in a narrative way.
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-specdec",
      temperature: 0.7,
      max_tokens: 300,
      top_p: 1,
      stream: false,
      stop: null,
    });

    const generatedStory = completion.choices[0]?.message?.content || "";

    return {
      story: generatedStory,
      highlights: [
        `${stats.totalContributions} Total Contributions`,
        `${stats.longestStreak} Days Longest Streak`,
        `${stats.starsEarned} Stars Earned`,
      ],
      theme: determineYearlyTheme(stats, contributions),
    };
  } catch (error) {
    console.error("Error generating story:", error);
    return {
      story: "",
      highlights: [],
      theme: "Growth",
    };
  }
}

function determineYearlyTheme(
  stats: Stats,
  contributions: Contribution[]
): string {
  const themes = {
    "Legendary Grind": stats.longestStreak > 30,
    "Open Source Hero": stats.starsEarned > 100,
    "Consistent Champion":
      contributions.filter((c) => c.count > 0).length > 300,
    "Language Master": stats.topLanguages.length > 5,
    "Rising Phoenix": stats.totalContributions > stats.totalContributions * 0.8, // Most contributions in recent months
  };

  return (
    Object.entries(themes).find(([, condition]) => condition)?.[0] ||
    "Coding Explorer"
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    console.log("Checking Redis cache for username:", username);

    // Check Redis cache first
    const cachedData = await redis.get(`github-wrapped:${username}`);
    if (cachedData) {
      console.log("Cache hit for username:", username);
      return NextResponse.json(cachedData);
    }

    console.log("Cache miss, fetching data for username:", username);

    // Fetch basic user info
    const userInfo = await fetchWithAuth(
      `${GITHUB_API_BASE}/users/${username}`
    );
    console.log("User Info:", userInfo);

    // Fetch all the data concurrently
    const [contributions, topRepos, languages] = await Promise.all([
      getContributions(username),
      getTopRepositories(username),
      getLanguageStats(username),
    ]);

    console.log("Contributions:", contributions);
    console.log("Top Repos:", topRepos);
    console.log("Languages:", languages);

    const stats = await calculateStats(username, contributions);
    console.log("Calculated Stats:", stats);

    // Calculate special achievements
    const specialAchievements = await calculateSpecialAchievements(
      username,
      contributions
    );
    console.log("Special Achievements:", specialAchievements);

    const crackedEngineerStats = calculateCrackedEngineerStats(
      contributions,
      stats
    );
    console.log("Cracked Engineer Stats:", crackedEngineerStats);

    const yearlyStory = await generateYearlyStory(
      stats,
      contributions,
      specialAchievements
    );
    console.log("Yearly Story:", yearlyStory);

    // Process and return the wrapped data
    const wrappedData = {
      userInfo: {
        name: userInfo.name || username,
        avatar: userInfo.avatar_url,
        followers: userInfo.followers,
        following: userInfo.following,
        publicRepos: userInfo.public_repos,
      },
      stats: {
        ...stats,
        animeRank: determineAnimeRank(
          stats.totalContributions,
          stats.longestStreak,
          Object.keys(languages).length
        ),
        workStyle: determineWorkStyle(contributions),
        consistency:
          (contributions.filter((c) => c.count > 0).length /
            contributions.length) *
          100,
        specialAchievements,
        topLanguages: Object.entries(languages)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10),
        crackedEngineer: crackedEngineerStats,
        yearlyStory,
        favoriteTime: calculateFavoriteTime(contributions),
        nightOwl: isNightOwl(contributions),
        pullRequests: await getPullRequestCount(username),
        issuesOpened: await getIssuesCount(username),
      },
      topRepositories: topRepos,
      contributionTimeline: contributions,
    };

    // Cache the result in Redis with 24-hour expiration
    await redis.setex(
      `github-wrapped:${username}`,
      CACHE_DURATION,
      wrappedData
    );
    console.log("Cached data in Redis for username:", username);

    return NextResponse.json(wrappedData);
  } catch (error) {
    console.error("Error processing GitHub data:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}

// Add these helper functions
async function getPullRequestCount(username: string): Promise<number> {
  try {
    const response = await fetchWithAuth(
      `${GITHUB_API_BASE}/search/issues?q=author:${username}+type:pr+created:2024`
    );
    return response.total_count || 0;
  } catch (error) {
    console.error("Error fetching PR count:", error);
    return 0;
  }
}

async function getIssuesCount(username: string): Promise<number> {
  try {
    const response = await fetchWithAuth(
      `${GITHUB_API_BASE}/search/issues?q=author:${username}+type:issue+created:2024`
    );
    return response.total_count || 0;
  } catch (error) {
    console.error("Error fetching issues count:", error);
    return 0;
  }
}

function calculateFavoriteTime(contributions: Contribution[]): string {
  // This is a placeholder - you'll need to implement actual time tracking
  return "3 PM";
}

function isNightOwl(contributions: Contribution[]): boolean {
  // This is a placeholder - you'll need to implement actual time tracking
  return true;
}
