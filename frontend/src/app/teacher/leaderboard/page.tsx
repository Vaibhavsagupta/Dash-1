'use client';

import Leaderboard from '@/components/Leaderboard';
import { Trophy } from 'lucide-react';

export default function TeacherLeaderboardPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] p-8 text-slate-200">
            <div className="max-w-5xl mx-auto">
                <div className="mb-12 text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/20 blur-[100px] rounded-full"></div>
                    <h1 className="relative text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-600 mb-4 flex items-center justify-center gap-4">
                        <Trophy size={48} className="text-amber-400" />
                        Class Leaderboard
                    </h1>
                    <p className="relative text-slate-400 text-lg">
                        Celebrating top performers and academic excellence
                    </p>
                </div>

                <Leaderboard />
            </div>
        </div>
    );
}
