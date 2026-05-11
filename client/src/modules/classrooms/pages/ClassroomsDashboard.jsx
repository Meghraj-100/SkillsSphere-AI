import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Users, ArrowRight, MonitorPlay } from "lucide-react";

export default function ClassroomsDashboard() {
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartSession = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/classrooms/create", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.roomId) {
        navigate(`/classrooms/${data.roomId}`);
      }
    } catch (err) {
      console.error("Failed to create room", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      navigate(`/classrooms/${joinRoomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-2xl mb-6">
            <MonitorPlay size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-900 to-purple-900 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Live Interactive Classrooms
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Host live tutoring sessions, collaborate with peers, and share your screen in real-time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Start a Session */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800 transition-colors">
            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-400 mb-6">
              <Video size={24} />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Start a New Session</h2>
            <p className="text-slate-400 mb-8">
              Create a secure live room as a Tutor or Host. You will get a unique link to share with your students.
            </p>
            <button
              onClick={handleStartSession}
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Creating Session...</span>
              ) : (
                <>
                  <span>Start Classroom</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Join a Session */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800 transition-colors">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center text-purple-900 dark:bg-purple-500/20 dark:text-purple-400 mb-6">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Join a Session</h2>
            <p className="text-slate-400 mb-8">
              Enter the unique Room ID provided by your Tutor to join an ongoing classroom session.
            </p>
            <form onSubmit={handleJoinSession} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. 123e4567-e89b-12d3..."
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
              >
                <span>Join Classroom</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
