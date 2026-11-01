"use client";

import { useEffect, useRef, useState } from "react";

export interface KeywordWithWeight {
  keyword: string;
  weight: number;
}

export interface EvaluationDetails {
  totalKeywordsCount: number;
  matchedCount: number;
  missingCount: number;
  earnedScore: number;
  maxScore: number;
  confidencePercentage: number;
  matchedKeywordsWithWeights: KeywordWithWeight[];
  missingKeywordsWithWeights: KeywordWithWeight[];
}

interface ScoreDetailsPopoverProps {
  score: number;
  confidence: number;
  evaluation?: EvaluationDetails;
}

export default function ScoreDetailsPopover({
  score,
  confidence,
  evaluation,
}: ScoreDetailsPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click (for mobile touch toggle)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    }
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-semibold cursor-pointer focus:outline-none"
      >
        <span>{score} pts</span>
        <span className="text-gray-400 font-normal">|</span>
        <span className="text-indigo-600">{confidence}%</span>
        <svg className="w-3.5 h-3.5 text-indigo-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isVisible && evaluation && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150 text-left">
          {/* Header Summary */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-900">Score Evaluation</p>
              <p className="text-[11px] text-gray-500">Keyword matching breakdown</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
              {evaluation.confidencePercentage}% Match
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 my-3 text-center">
            <div className="p-2 bg-gray-50 rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Score Earned</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {evaluation.earnedScore} <span className="text-xs font-normal text-gray-400">/ {evaluation.maxScore} pts</span>
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Keywords</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {evaluation.matchedCount} <span className="text-xs font-normal text-gray-400">/ {evaluation.totalKeywordsCount} matched</span>
              </p>
            </div>
          </div>

          {/* Matched Keywords */}
          <div className="space-y-1.5 mb-3">
            <p className="text-[11px] font-semibold text-green-800 flex items-center gap-1">
              <span>✅ Matched Keywords</span>
              <span className="text-gray-400 font-normal">({evaluation.matchedCount})</span>
            </p>
            {evaluation.matchedKeywordsWithWeights.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">No matching keywords found.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {evaluation.matchedKeywordsWithWeights.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-md text-[11px] font-medium"
                  >
                    <span>{kw.keyword}</span>
                    <span className="text-[10px] text-green-600 font-semibold">(+{kw.weight})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Missing Keywords */}
          {evaluation.missingKeywordsWithWeights.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
                <span>❌ Missing Keywords</span>
                <span className="text-gray-400 font-normal">({evaluation.missingCount})</span>
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {evaluation.missingKeywordsWithWeights.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-[11px]"
                  >
                    <span>{kw.keyword}</span>
                    <span className="text-[10px] text-red-500 font-medium">({kw.weight})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
