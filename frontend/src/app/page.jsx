'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';

export default function Home() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`min-h-screen ${theme.bg.primary} overflow-hidden relative`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient mesh */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: theme.isDark
              ? 'radial-gradient(circle at 20% 50%, rgba(255, 56, 56, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(147, 51, 234, 0.06) 0%, transparent 50%)'
          }}
        />

        {/* Animated grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: theme.isDark
              ? 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)'
              : 'linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            animation: 'gridMove 20s linear infinite',
          }}
        />

        {/* Floating orbs */}
        <div className={`absolute w-96 h-96 rounded-full blur-3xl ${mounted ? 'animate-float' : ''}`}
          style={{
            top: '10%',
            left: '10%',
            background: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)',
            animationDelay: '0s',
            animationDuration: '15s'
          }}
        />
        <div className={`absolute w-96 h-96 rounded-full blur-3xl ${mounted ? 'animate-float' : ''}`}
          style={{
            top: '60%',
            right: '15%',
            background: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)',
            animationDelay: '5s',
            animationDuration: '18s'
          }}
        />
        <div className={`absolute w-80 h-80 rounded-full blur-3xl ${mounted ? 'animate-float' : ''}`}
          style={{
            bottom: '10%',
            left: '50%',
            background: theme.isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.05)',
            animationDelay: '10s',
            animationDuration: '20s'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className={`text-center mb-20 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <h1
            className={`text-6xl md:text-8xl font-black mb-6 ${theme.text.primary} tracking-tight`}
            style={{
              fontFamily: '"JetBrains Mono", "Courier New", monospace',
              textShadow: theme.isDark ? '0 0 40px rgba(255, 255, 255, 0.1)' : 'none'
            }}
          >
            Discer<span className="text-red-500">.</span>io
          </h1>

          <p
            className={`text-2xl md:text-3xl mb-4 font-bold ${theme.text.primary}`}
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              animationDelay: '0.2s'
            }}
          >
            Learn AI Agents Through Play
          </p>

          <p
            className={`text-lg md:text-xl max-w-3xl mx-auto ${theme.text.secondary} leading-relaxed`}
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              animationDelay: '0.4s'
            }}
          >
            Think Scratch, but for agentic AI systems. Design, orchestrate, and deploy
            intelligent agents using drag-and-drop blocks. No code required.
          </p>
        </div>

        {/* Feature Cards */}
        <div className={`grid md:grid-cols-3 gap-8 mb-16 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}
          style={{ animationDelay: '0.6s' }}
        >
          {/* Card 1: Learn */}
          <div className={`group relative ${theme.bg.secondary} backdrop-blur-sm border ${theme.border.primary} rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
            style={{
              boxShadow: theme.isDark ? '0 10px 40px rgba(0, 0, 0, 0.3)' : '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 mb-6 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme.text.primary}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                Guided Lessons
              </h3>
              <p className={`${theme.text.secondary} leading-relaxed`}>
                Master AI agent concepts through interactive tutorials. From basic building blocks to complex multi-agent systems.
              </p>
            </div>
          </div>

          {/* Card 2: Build */}
          <div className={`group relative ${theme.bg.secondary} backdrop-blur-sm border ${theme.border.primary} rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
            style={{
              boxShadow: theme.isDark ? '0 10px 40px rgba(0, 0, 0, 0.3)' : '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 mb-6 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme.text.primary}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                Visual Builder
              </h3>
              <p className={`${theme.text.secondary} leading-relaxed`}>
                Design workflows with intuitive drag-and-drop. Connect reasoning steps, tools, and decision nodes in a sandbox environment.
              </p>
            </div>
          </div>

          {/* Card 3: Play */}
          <div className={`group relative ${theme.bg.secondary} backdrop-blur-sm border ${theme.border.primary} rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
            style={{
              boxShadow: theme.isDark ? '0 10px 40px rgba(0, 0, 0, 0.3)' : '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 mb-6 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme.text.primary}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                MMO Sandbox
              </h3>
              <p className={`${theme.text.secondary} leading-relaxed`}>
                Deploy agents in a live multiplayer game. Watch them interact, compete, and evolve in real-time battles.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`text-center ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}
          style={{ animationDelay: '0.8s' }}
        >
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/builder"
              className="group relative px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              <span className="relative z-10 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Building
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>

            <Link
              href="/lessons"
              className={`group px-10 py-5 ${theme.bg.secondary} ${theme.text.primary} font-bold text-lg rounded-xl border-2 ${theme.border.primary} hover:border-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              <span className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Explore Lessons
              </span>
            </Link>
          </div>

          <p className={`mt-8 ${theme.text.tertiary} text-sm`}>
            No installation required • Works in your browser • Free to start
          </p>
        </div>

        {/* Bottom tagline */}
        <div className={`mt-24 text-center ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}
          style={{ animationDelay: '1s' }}
        >
          <p className={`text-xl ${theme.text.secondary} font-medium`} style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
            Bridge the gap between curiosity and capability
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes gridMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 60px 60px;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-float {
          animation: float var(--duration, 15s) ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

