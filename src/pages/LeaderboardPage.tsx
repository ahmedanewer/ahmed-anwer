import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { api } from '../services/api';
import { socketClient, SocketMessage } from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Clock,
  Sparkles,
  Radio,
  HelpCircle,
  Award
} from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalCompetitors, setTotalCompetitors] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTieBreakerTooltip, setShowTieBreakerTooltip] = useState(false);

  const fetchLeaderboard = () => {
    api
      .getLeaderboard()
      .then((res) => {
        setLeaderboard(res.leaderboard || []);
        setTotalCompetitors(res.totalCompetitors || 0);
      })
      .catch((err) => console.error('Failed to load leaderboard:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();

    // Listen to real-time updates
    const unsubscribe = socketClient.subscribe((msg: SocketMessage) => {
      if (msg.type === 'LEADERBOARD_UPDATE') {
        fetchLeaderboard();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const restTop10 = leaderboard.slice(3, 10);

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="text-center mb-10 relative">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#E9D5FF] text-xs font-bold mb-3">
          <Radio className="w-3.5 h-3.5 text-[#2DD4BF] animate-pulse" />
          <span>تحديث فوري وتنافس مباشر في الوقت الفعلي</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-wide">
          لوحة الشرف العالمية{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2DD4BF] via-white to-[#FB7185]">
            TOP 10
          </span>
        </h1>

        <p className="text-sm text-[#94A3B8] max-w-xl mx-auto mt-2">
          يتم احتساب نقطة واحدة (+1) لكل إجابة صحيحة في أي اختبار مباشر.
        </p>

        {/* Tie-breaker rule notice */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#2DD4BF]" />
          <span>قاعدة كسر التعادل: المتنافس الذي حقق النقاط في توقيت زمني أسبق يحتل المركز الأعلى.</span>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-[#94A3B8]">جاري تحميل قائمة المتصدرين...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-lg mx-auto">
          <Trophy className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">لوحة الصدارة تنتظر الأبطال!</h3>
          <p className="text-xs text-[#94A3B8]">
            لم تُسجل أي نتائج حتى الآن. شارك في أول اختبار مباشر لتحجز مركزك الأول في التاريخ!
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* TOP 3 PODIUM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-8">
            {/* Rank #2 Silver */}
            {top2 && (
              <div className="order-2 md:order-1 bg-gradient-to-b from-[#111827] to-[#0B1020] border border-slate-400/30 rounded-3xl p-6 text-center shadow-xl relative group hover:border-slate-300 transition-all">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-300 text-[#0B1020] font-black text-sm flex items-center justify-center shadow-lg">
                  #2
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 p-[2px] mx-auto mt-2 mb-3">
                  <div className="w-full h-full bg-[#111827] rounded-[14px] flex items-center justify-center font-black text-white text-base">
                    {top2.fullName.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <h3 className="text-base font-bold text-white truncate">{top2.fullName}</h3>
                <span className="text-[10px] text-[#94A3B8] block mb-2">{top2.email}</span>

                <div className="bg-[#0B1020] p-3 rounded-2xl border border-white/5 mt-3">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black text-[#2DD4BF] font-mono-numbers">
                      {top2.totalPoints}
                    </span>
                    <span className="text-xs text-[#94A3B8]">نقطة</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] block mt-1">
                    أنجز {top2.examsCompleted} اختبارات
                  </span>
                </div>
              </div>
            )}

            {/* Rank #1 Gold (Trophy Center) */}
            {top1 && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-[#1E1B4B]/80 to-[#111827] border-2 border-amber-400/60 rounded-3xl p-8 text-center shadow-2xl relative group hover:border-amber-400 transition-all transform md:-translate-y-4">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <Crown className="w-9 h-9 text-amber-400 animate-bounce" />
                </div>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 p-[3px] mx-auto mt-2 mb-3 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                  <div className="w-full h-full bg-[#111827] rounded-[13px] flex items-center justify-center font-black text-amber-300 text-xl">
                    {top1.fullName.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>متصدر الساحة العالمية #1</span>
                </div>

                <h3 className="text-lg font-black text-white truncate">{top1.fullName}</h3>
                <span className="text-xs text-[#94A3B8] block mb-3">{top1.email}</span>

                <div className="bg-[#0B1020] p-4 rounded-2xl border border-amber-400/20 shadow-inner">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-[#2DD4BF] font-mono-numbers">
                      {top1.totalPoints}
                    </span>
                    <span className="text-xs text-white font-bold">نقطة</span>
                  </div>
                  <span className="text-[11px] text-[#94A3B8] block mt-1">
                    أنجز {top1.examsCompleted} اختبارات &bull; توقيت الصدارة: {formatTimestamp(top1.lastPointEarnedAt)}
                  </span>
                </div>
              </div>
            )}

            {/* Rank #3 Bronze */}
            {top3 && (
              <div className="order-3 md:order-3 bg-gradient-to-b from-[#111827] to-[#0B1020] border border-amber-700/30 rounded-3xl p-6 text-center shadow-xl relative group hover:border-amber-600 transition-all">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-lg">
                  #3
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 p-[2px] mx-auto mt-2 mb-3">
                  <div className="w-full h-full bg-[#111827] rounded-[14px] flex items-center justify-center font-black text-white text-base">
                    {top3.fullName.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <h3 className="text-base font-bold text-white truncate">{top3.fullName}</h3>
                <span className="text-[10px] text-[#94A3B8] block mb-2">{top3.email}</span>

                <div className="bg-[#0B1020] p-3 rounded-2xl border border-white/5 mt-3">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black text-[#2DD4BF] font-mono-numbers">
                      {top3.totalPoints}
                    </span>
                    <span className="text-xs text-[#94A3B8]">نقطة</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] block mt-1">
                    أنجز {top3.examsCompleted} اختبارات
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RANKS 4 TO 10 TABLE */}
          {restTop10.length > 0 && (
            <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Medal className="w-5 h-5 text-[#2DD4BF]" />
                  <h3 className="text-base font-black text-white">
                    نخبة المتنافسين (المراكز 4 إلى 10)
                  </h3>
                </div>
                <span className="text-xs text-[#94A3B8]">
                  إجمالي المسجلين في المنافسة: {totalCompetitors}
                </span>
              </div>

              <div className="space-y-2.5">
                {restTop10.map((entry) => {
                  const isMe = entry.userId === user?.id;

                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isMe
                          ? 'bg-[#7C3AED]/20 border-[#7C3AED]/50 text-white shadow-lg'
                          : 'bg-[#0B1020]/70 border-white/5 hover:border-white/10 text-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-mono-numbers font-black text-xs text-[#94A3B8]">
                          #{entry.rank}
                        </span>

                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#2DD4BF] p-[1.5px] shrink-0">
                          <div className="w-full h-full bg-[#111827] rounded-[10px] flex items-center justify-center font-bold text-xs text-white">
                            {entry.fullName.substring(0, 2).toUpperCase()}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {entry.fullName}
                            </span>
                            {isMe && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2DD4BF] text-[#0B1020]">
                                أنت
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#64748B]">
                            أنجز {entry.examsCompleted} اختبارات &bull; توقيت النقاط:{' '}
                            {formatTimestamp(entry.lastPointEarnedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-xl font-black text-[#2DD4BF] font-mono-numbers">
                            {entry.totalPoints}
                          </span>
                          <span className="text-[10px] text-[#94A3B8]">نقطة</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
