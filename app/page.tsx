"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { CraftClient, type CraftBlock, type CraftTextBlock } from "@/lib/craft-api";
import { DashboardManager, DashboardData } from "@/lib/dashboard-manager";
import ResponsiveWordCloud from "@/components/WordCloud";
import { getSettings } from "@/lib/storage";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<{
    totalEntries: number;
    streak: number;
    avgMood: number;
    dominantEmotion: string;
    themes: { name: string; count: number }[];
  }>({
    totalEntries: 0,
    streak: 0,
    avgMood: 0,
    dominantEmotion: "N/A",
    themes: []
  });
  const [moodData, setMoodData] = useState<any[]>([]);
  const [recentThemes, setRecentThemes] = useState<{name: string, count: number, impact: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const settings = getSettings();
      if (!settings?.craftToken) {
        setLoading(false);
        return;
      }

      try {
        const client = new CraftClient(settings.craftToken);
        
        // 1. Find "Journals" document
        const docs = await client.listDocuments();
        const journalsDoc = docs.find(d => d.title === "Journals" && !d.isDeleted);
        
        if (!journalsDoc) {
          setLoading(false);
          return;
        }

        // 2. Fetch all children (entries) with maxDepth=5 to get content
        const journalBlock = await client.getBlock(journalsDoc.id, 5);
        
        if (!journalBlock.content) {
          setLoading(false);
          return;
        }

        // 3. Fetch Dashboard Data
        const dashboardManager = new DashboardManager(client, journalsDoc.id);
        const dashboardData = await dashboardManager.getDashboardData();

        if (dashboardData) {
            setStats({
                totalEntries: dashboardData.totalEntries,
                avgMood: Number(dashboardData.avgMood),
                streak: dashboardData.streak,
                dominantEmotion: dashboardData.themes.length > 0 ? dashboardData.themes[0].name : "N/A",
                themes: dashboardData.themes
            });
            
            // Transform dailyMoods for chart
            const chartData = dashboardData.dailyMoods.map(m => ({
                date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                mood: m.mood
            }));
            // Sort by date
            chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setMoodData(chartData);
            
            // Recent themes
            setRecentThemes(dashboardData.themes.slice(0, 5).map(t => ({
                name: t.name,
                count: t.count,
                impact: t.count > 5 ? "High" : t.count > 2 ? "Medium" : "Low"
            })));

        } else {
             setStats({
                totalEntries: 0,
                avgMood: 0,
                streak: 0,
                dominantEmotion: "N/A",
                themes: []
            });
            setMoodData([]);
            setRecentThemes([]);
        }
        
        setLoading(false);

        setLoading(false);
      } catch (err) {
        console.error("Failed to load dashboard", err);
        setError("Failed to load dashboard data. Please check your API token.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Loading your memory capsule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your emotional journey and journaling insights.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/journal">
            <Button>
              Process Today's Entry
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Entries
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <p className="text-xs text-muted-foreground">
              Processed journals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Streak
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak} Days</div>
            <p className="text-xs text-muted-foreground">
              {stats.streak > 0 ? "Keep it up!" : "Start writing today!"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Mood
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgMood}</div>
            <p className="text-xs text-muted-foreground">
              / 10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dominant Theme
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={stats.dominantEmotion}>{stats.dominantEmotion}</div>
            <p className="text-xs text-muted-foreground">
              Most frequent topic
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Mood Over Time</CardTitle>
            <CardDescription>
              Your emotional trends for the past 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] w-full">
              {moodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--primary)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No mood data available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Themes Word Cloud</CardTitle>
              <CardDescription>
                Topics you've been writing about.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveWordCloud 
                words={stats.themes.map(t => ({ text: t.name, value: t.count }))} 
              />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
