import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function Home() {
  const [health, setHealth] = useState<{ status: string } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error("Failed to fetch health:", err));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Welcome to Your App
        </h1>
        <p className="text-lg text-slate-600">
          This is a full-stack React application with Express and Gemini AI integration.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${health ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className="font-mono text-sm">
            API Connection: {health ? "Connected" : "Connecting..."}
          </span>
        </div>
        {health && (
          <pre className="mt-4 p-4 bg-slate-50 rounded-lg text-xs font-mono text-slate-500">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </div>
    </motion.div>
  );
}
