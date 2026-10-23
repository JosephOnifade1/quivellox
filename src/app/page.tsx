'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Search,
  ArrowRight,
  Play,
  Check,
  Brain,
  ShieldCheck,
  Lock,
  Zap,
  FileText,
  MessageSquare,
  FileCode,
  FileSpreadsheet,
  CornerDownRight,
  Send,
  Eye,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'features' | 'how' | 'pricing' | 'about'>('features');

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F3] dark:bg-[#141713] text-[#1E221B] dark:text-[#F3F4EE] transition-colors selection:bg-[#D8F36A] selection:text-[#181D12]">
      {/* ─── NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-50 bg-[#F9F8F3]/90 dark:bg-[#141713]/90 backdrop-blur-md border-b border-[#E7E5DC] dark:border-[#272B23]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#EFECE1] dark:bg-[#22271E] border border-[#DDD8C8] dark:border-[#333A2D] flex items-center justify-center relative overflow-hidden group-hover:border-[#B8D838] transition-colors">
              <div className="w-4 h-4 rounded-full border-2 border-[#1E221B] dark:border-[#F3F4EE] flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D8F36A] absolute -bottom-0.5 -right-0.5" />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight text-[#1E221B] dark:text-[#F3F4EE]">
              Quellivox
            </span>
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#656A5F] dark:text-[#9DA396]">
            <a href="#features" className="hover:text-[#1E221B] dark:hover:text-[#F3F4EE] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#1E221B] dark:hover:text-[#F3F4EE] transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-[#1E221B] dark:hover:text-[#F3F4EE] transition-colors">
              Pricing
            </a>
            <a href="#about" className="hover:text-[#1E221B] dark:hover:text-[#F3F4EE] transition-colors">
              About
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle className="mr-1" />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-full border border-[#D5D2C5] dark:border-[#383E32] text-xs font-semibold text-[#1E221B] dark:text-[#F3F4EE] hover:bg-[#EFECE1] dark:hover:bg-[#22271E] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#D8F36A] text-[#1B2211] text-xs font-bold hover:bg-[#c9e755] active:scale-95 transition-all shadow-xs"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="pt-12 md:pt-20 pb-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Messaging */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tag Badge */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#EDECE3] dark:bg-[#252920] border border-[#DDD9CD] dark:border-[#363B2F] text-[11px] font-mono tracking-wider font-semibold text-[#666B5F] dark:text-[#9DA396] uppercase">
              AI that reads your documents
            </div>

            {/* Headline with Editorial Font */}
            <h1 className="font-editorial text-5xl sm:text-6xl lg:text-[64px] font-normal tracking-tight text-[#171A13] dark:text-[#FAFAF6] leading-[1.08]">
              Your Knowledge. <br />
              Finally, in One Place.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#656A5F] dark:text-[#A0A699] leading-relaxed max-w-md font-normal">
              Quellivox turns your documents into a powerful AI assistant. Upload your files, ask questions, and get accurate answers with real citations &mdash; no more searching, no more guessing.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#D8F36A] text-[#1B2211] text-sm font-bold hover:bg-[#c9e755] active:scale-95 transition-all shadow-xs"
              >
                <span>Start for Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/app"
                className="inline-flex items-center gap-2.5 h-12 px-6 rounded-full border border-[#D5D2C5] dark:border-[#383E32] text-sm font-semibold text-[#1E221B] dark:text-[#F3F4EE] hover:bg-[#EFECE1] dark:hover:bg-[#22271E] transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[#1E221B] dark:bg-[#F3F4EE] text-[#F9F8F3] dark:text-[#141713] flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </Link>
            </div>

            {/* Feature Checklist */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 pt-4 text-xs font-medium text-[#656A5F] dark:text-[#9DA396]">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1E221B] dark:text-[#F3F4EE] stroke-[2.5]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1E221B] dark:text-[#F3F4EE] stroke-[2.5]" />
                <span>Private & secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1E221B] dark:text-[#F3F4EE] stroke-[2.5]" />
                <span>Works with PDF, TXT & Markdown</span>
              </div>
            </div>
          </div>

          {/* Right Column: Layered Interactive Realistic Software Mockup */}
          <div className="lg:col-span-7 relative">
            {/* Subtle decorative pencil/accent lines */}
            <div className="absolute -top-6 right-16 w-8 h-1 rounded-full bg-[#D8F36A] rotate-45 opacity-70 pointer-events-none hidden sm:block" />
            <div className="absolute top-4 right-10 w-2 h-2 rounded-full bg-[#D8F36A] opacity-70 pointer-events-none hidden sm:block" />
            <div className="absolute -bottom-8 right-32 w-12 h-1 rounded-full bg-[#D8F36A] -rotate-12 opacity-70 pointer-events-none hidden sm:block" />

            {/* BASE CARD: Knowledge Dashboard UI */}
            <div className="rounded-2xl border border-[#DEDACD] dark:border-[#353B2E] bg-[#FFFFFF] dark:bg-[#1B1F18] shadow-xl overflow-hidden">
              {/* Window Title Bar */}
              <div className="px-5 py-3 border-b border-[#EAE7DC] dark:border-[#2C3225] flex items-center justify-between bg-[#FAF9F5] dark:bg-[#1E231B]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E0DCCF] dark:bg-[#3D4535]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E0DCCF] dark:bg-[#3D4535]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E0DCCF] dark:bg-[#3D4535]" />
                  <span className="text-[11px] font-mono text-[#8C9184] dark:text-[#808678] ml-2 font-medium">
                    quellivox.app / knowledge
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-[#656A5F] dark:text-[#9DA396]">
                  <div className="w-5 h-5 rounded-full bg-[#D8F36A] text-[#1E221B] flex items-center justify-center font-bold text-[10px]">
                    AC
                  </div>
                  <span>Alex Carter · Pro Plan</span>
                </div>
              </div>

              {/* Inner Workspace Grid */}
              <div className="grid grid-cols-12 min-h-[360px]">
                {/* Left Mini Sidebar */}
                <div className="col-span-3 border-r border-[#EAE7DC] dark:border-[#2C3225] p-3 space-y-1 bg-[#FAF9F5]/70 dark:bg-[#1E231B]/70 hidden sm:block text-[11px] font-medium text-[#656A5F] dark:text-[#9DA396]">
                  <div className="px-2.5 py-1.5 rounded-md hover:bg-[#EAE7DC]/60 dark:hover:bg-[#2C3225]">Home</div>
                  <div className="px-2.5 py-1.5 rounded-md bg-[#EDEAE0] dark:bg-[#2C3225] text-[#1E221B] dark:text-[#F3F4EE] font-semibold flex items-center justify-between">
                    <span>Knowledge</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D8F36A]" />
                  </div>
                  <div className="px-2.5 py-1.5 rounded-md hover:bg-[#EAE7DC]/60 dark:hover:bg-[#2C3225]">Ask</div>
                  <div className="px-2.5 py-1.5 rounded-md hover:bg-[#EAE7DC]/60 dark:hover:bg-[#2C3225]">Conversations</div>
                  <div className="px-2.5 py-1.5 rounded-md hover:bg-[#EAE7DC]/60 dark:hover:bg-[#2C3225]">Settings</div>
                </div>

                {/* Right Document Catalog */}
                <div className="col-span-12 sm:col-span-9 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#1E221B] dark:text-[#F3F4EE]">Knowledge</h4>
                      <p className="text-[10px] text-[#8C9184] dark:text-[#808678]">
                        Manage your documents and build your knowledge base.
                      </p>
                    </div>
                    <button className="h-7 px-3 rounded-md bg-[#1E221B] dark:bg-[#F3F4EE] text-[#F9F8F3] dark:text-[#141713] text-[10px] font-semibold flex items-center gap-1 shadow-xs shrink-0">
                      <span>+ Upload Document</span>
                    </button>
                  </div>

                  {/* Document Rows */}
                  <div className="space-y-2">
                    {[
                      { name: 'Product Requirements.pdf', size: '2.4 MB · 12 pages', status: 'Processed', date: 'Apr 28, 2025', color: 'text-red-500' },
                      { name: 'API Documentation.pdf', size: '1.8 MB · 45 pages', status: 'Processed', date: 'Apr 27, 2025', color: 'text-red-500' },
                      { name: 'Business Policy.docx', size: '980 KB · 12 pages', status: 'Processing…', date: 'Apr 27, 2025', color: 'text-blue-500' },
                      { name: 'Research Notes.md', size: '324 KB · 8 pages', status: 'Processed', date: 'Apr 26, 2025', color: 'text-emerald-500' },
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-[#EDEAE0] dark:border-[#2C3225] bg-[#FAF9F5]/40 dark:bg-[#1E231B]/40 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FileText className={`w-4 h-4 ${doc.color} shrink-0`} />
                          <div className="min-w-0">
                            <div className="font-medium text-[#1E221B] dark:text-[#F3F4EE] text-[11px] truncate">
                              {doc.name}
                            </div>
                            <div className="text-[9px] font-mono text-[#8C9184] dark:text-[#808678]">
                              {doc.size}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono">
                          <span className={doc.status === 'Processed' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                            {doc.status}
                          </span>
                          <span className="text-[#8C9184] dark:text-[#808678] hidden sm:inline">
                            {doc.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* OVERLAPPING CARD 1: Chat Q&A Interaction with Sources */}
            <div className="absolute left-4 sm:-left-4 md:-left-8 top-28 sm:top-36 w-[88%] sm:w-[360px] rounded-2xl border border-[#D5D0C0] dark:border-[#383E31] bg-[#FFFFFF] dark:bg-[#1C2018] shadow-2xl p-4 space-y-3 z-20">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-xl bg-[#F0EDE3] dark:bg-[#282D23] text-[11px] font-medium text-[#1E221B] dark:text-[#F3F4EE] leading-relaxed">
                  What are the authentication requirements in the API documentation?
                </div>
              </div>

              {/* AI Answer with Citation Badges */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#1E221B] dark:bg-[#F3F4EE] text-[#D8F36A] dark:text-[#1B2211] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                    Q
                  </div>
                  <div className="text-[11px] text-[#24291F] dark:text-[#E8EAE2] leading-relaxed">
                    The API requires <strong>JWT-based authentication</strong> with a valid token, and the token must be included in the Authorization header for all requests.
                  </div>
                </div>

                {/* Retrieved Sources List */}
                <div className="space-y-1.5 pl-7">
                  <div className="p-2 rounded-lg bg-[#F8F7F2] dark:bg-[#23271E] border border-[#EBE7DC] dark:border-[#2F3527] flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CornerDownRight className="w-3 h-3 text-[#8C9184] shrink-0" />
                      <span className="font-semibold text-[#1E221B] dark:text-[#F3F4EE] truncate">
                        Source 1: API Documentation.pdf
                      </span>
                    </div>
                    <span className="font-mono text-[#8C9184] text-[9px] shrink-0 ml-1">Page 12</span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#F8F7F2] dark:bg-[#23271E] border border-[#EBE7DC] dark:border-[#2F3527] flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CornerDownRight className="w-3 h-3 text-[#8C9184] shrink-0" />
                      <span className="font-semibold text-[#1E221B] dark:text-[#F3F4EE] truncate">
                        Source 2: API Documentation.pdf
                      </span>
                    </div>
                    <span className="font-mono text-[#8C9184] text-[9px] shrink-0 ml-1">Page 18</span>
                  </div>
                </div>
              </div>

              {/* Mini Composer */}
              <div className="pt-1">
                <div className="h-8 px-2.5 rounded-lg border border-[#DDD8C8] dark:border-[#383E31] bg-[#FAF9F5] dark:bg-[#1E231B] flex items-center justify-between text-[11px] text-[#8C9184]">
                  <span>Ask a question about your documents…</span>
                  <div className="w-5 h-5 rounded-md bg-[#1E221B] dark:bg-[#F3F4EE] text-[#F9F8F3] dark:text-[#141713] flex items-center justify-center">
                    <Send className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* OVERLAPPING CARD 2: Document Source Citation & Highlight Preview */}
            <div className="absolute right-0 sm:-right-4 top-56 sm:top-64 w-[85%] sm:w-[300px] rounded-xl border border-[#D5D0C0] dark:border-[#383E31] bg-[#FFFFFF] dark:bg-[#1C2018] shadow-2xl p-4 space-y-2.5 z-30">
              <div className="flex items-center justify-between border-b border-[#EAE7DC] dark:border-[#2C3225] pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#1E221B] dark:bg-[#F3F4EE] text-[#F9F8F3] dark:text-[#141713] text-[9px] font-mono font-bold">
                    DOC
                  </span>
                  <span className="text-[10px] font-medium text-[#1E221B] dark:text-[#F3F4EE] truncate max-w-[140px]">
                    API Documentation.pdf
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8C9184]">Page 12</span>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#1E221B] dark:text-[#F3F4EE]">
                  Authentication
                </div>
                <p className="text-[11px] text-[#55594F] dark:text-[#A6AAA0] leading-relaxed">
                  The API requires{' '}
                  <span className="bg-[#E7F6A8] dark:bg-[#435017] text-[#1B2211] dark:text-[#E7F6A8] font-semibold px-1 py-0.5 rounded">
                    JWT-based authentication with a valid token
                  </span>
                  , and the token must be included in the Authorization header for all requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION (4-COLUMN GRID) ─── */}
      <section id="features" className="py-20 border-t border-[#E7E5DC] dark:border-[#272B23] bg-[#FAF9F5] dark:bg-[#161914] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-full bg-[#EAE8DD] dark:bg-[#252A20] flex items-center justify-center text-[#1E221B] dark:text-[#D8F36A]">
                <Brain className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-[#1E221B] dark:text-[#F3F4EE]">
                AI-Powered Search
              </h3>
              <p className="text-xs sm:text-sm text-[#666B5F] dark:text-[#9EA496] leading-relaxed">
                Ask questions in natural language and get precise answers from your documents.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-full bg-[#EAE8DD] dark:bg-[#252A20] flex items-center justify-center text-[#1E221B] dark:text-[#D8F36A]">
                <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-[#1E221B] dark:text-[#F3F4EE]">
                Real Citations
              </h3>
              <p className="text-xs sm:text-sm text-[#666B5F] dark:text-[#9EA496] leading-relaxed">
                See exactly where the information comes from, with clickable sources and page references.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-full bg-[#EAE8DD] dark:bg-[#252A20] flex items-center justify-center text-[#1E221B] dark:text-[#D8F36A]">
                <Lock className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-[#1E221B] dark:text-[#F3F4EE]">
                Your Data, Your Control
              </h3>
              <p className="text-xs sm:text-sm text-[#666B5F] dark:text-[#9EA496] leading-relaxed">
                Your documents are private and secure. Only you can access your knowledge base.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-full bg-[#EAE8DD] dark:bg-[#252A20] flex items-center justify-center text-[#1E221B] dark:text-[#D8F36A]">
                <Zap className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-[#1E221B] dark:text-[#F3F4EE]">
                Supports Multiple Formats
              </h3>
              <p className="text-xs sm:text-sm text-[#666B5F] dark:text-[#9EA496] leading-relaxed">
                Upload PDFs, TXT, and Markdown files. We handle the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (3-STEP EDITORIAL WORKFLOW) ─── */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Heading & Pitch */}
          <div className="lg:col-span-4 space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#EDECE3] dark:bg-[#252920] border border-[#DDD9CD] dark:border-[#363B2F] text-[10px] font-mono tracking-wider font-semibold text-[#666B5F] dark:text-[#9DA396] uppercase">
              How it works
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl font-normal tracking-tight text-[#171A13] dark:text-[#FAFAF6] leading-tight">
              From Documents <br />
              to Answers in <br />
              3 Simple Steps
            </h2>
            <p className="text-sm text-[#656A5F] dark:text-[#A0A699] leading-relaxed pt-1">
              Quellivox makes it easy to turn your files into a personal AI assistant. No technical skills needed.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E221B] dark:text-[#F3F4EE] hover:text-[#7C9B14] dark:hover:text-[#D8F36A] transition-colors"
              >
                <span>Learn more</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Step Cards */}
          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold text-[#8C9184] dark:text-[#808678]">
                1
              </div>
              <div className="h-36 rounded-xl border border-[#E2DFD3] dark:border-[#303529] bg-[#FFFFFF] dark:bg-[#1C2018] p-4 flex flex-col items-center justify-center gap-3 shadow-xs">
                <span className="text-[11px] font-medium text-[#8C9184]">Upload your files</span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-8 rounded bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center justify-center text-[9px] font-bold text-red-600">
                    PDF
                  </div>
                  <div className="w-7 h-8 rounded bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-[9px] font-bold text-blue-600">
                    DOC
                  </div>
                  <div className="w-7 h-8 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-[9px] font-bold text-emerald-600">
                    TXT
                  </div>
                </div>
              </div>
              <h4 className="text-sm font-bold text-[#1E221B] dark:text-[#F3F4EE]">
                Add Your Knowledge
              </h4>
              <p className="text-xs text-[#666B5F] dark:text-[#9EA496] leading-relaxed">
                Upload your documents and let us extract the important information.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold text-[#8C9184] dark:text-[#808678]">
                2
              </div>
              <div className="h-36 rounded-xl border border-[#E2DFD3] dark:border-[#303529] bg-[#FFFFFF] dark:bg-[#1C2018] p-4 flex flex-col justify-center gap-2 shadow-xs">
                <div className="w-3/4 h-5 rounded-md bg-[#F0EDE3] dark:bg-[#282D23] ml-auto" />
                <div className="w-4/5 h-6 rounded-md bg-[#FAF9F5] dark:bg-[#22271D] border border-[#EDEAE0] dark:border-[#2F3428]" />
              </div>
              <h4 className="text-sm font-bold text-[#1E221B] dark:text-[#F3F4EE]">
                Ask Anything
              </h4>
              <p className="text-xs text-[#666B5F] dark:text-[#9EA496] leading-relaxed">
                Ask questions in plain language and get accurate, context-aware answers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold text-[#8C9184] dark:text-[#808678]">
                3
              </div>
              <div className="h-36 rounded-xl border border-[#E2DFD3] dark:border-[#303529] bg-[#FFFFFF] dark:bg-[#1C2018] p-4 flex flex-col justify-center gap-2 shadow-xs">
                <div className="w-full h-2.5 rounded bg-[#EAE7DC] dark:bg-[#2C3225]" />
                <div className="w-full h-3 rounded bg-[#D8F36A]/40 dark:bg-[#D8F36A]/20" />
                <div className="w-2/3 h-2.5 rounded bg-[#EAE7DC] dark:bg-[#2C3225]" />
              </div>
              <h4 className="text-sm font-bold text-[#1E221B] dark:text-[#F3F4EE]">
                Verify with Sources
              </h4>
              <p className="text-xs text-[#666B5F] dark:text-[#9EA496] leading-relaxed">
                Click on citations to see the exact passages from your documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DARK FOREST FOOTER BANNER: TESTIMONIAL & FINAL CTA ─── */}
      <section className="bg-[#122218] text-[#F3F4EE] px-6 py-20 relative overflow-hidden">
        {/* Subtle contour topography SVG background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <path d="M 0,100 C 300,50 600,200 1000,100 L 1000,600 L 0,600 Z" fill="none" stroke="#D8F36A" strokeWidth="1.5" />
            <path d="M 0,250 C 350,150 700,350 1000,200" fill="none" stroke="#D8F36A" strokeWidth="1" />
            <path d="M 0,400 C 400,300 800,500 1000,350" fill="none" stroke="#D8F36A" strokeWidth="0.8" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Side: Testimonial */}
          <div className="lg:col-span-5 space-y-6">
            <p className="font-editorial text-2xl sm:text-3xl text-[#FAFAF6] leading-snug italic font-normal">
              &ldquo;Quellivox has completely changed how I work with my research documents. It&rsquo;s like having a knowledgeable assistant who actually reads your files.&rdquo;
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-[#20392A] border border-[#2E4E3B] flex items-center justify-center font-bold text-xs text-[#D8F36A]">
                SM
              </div>
              <div>
                <div className="text-sm font-bold text-[#FAFAF6]">Sarah Mitchell</div>
                <div className="text-xs text-[#9EBAAA]">Product Manager</div>
              </div>
            </div>
          </div>

          {/* Middle: Floating Multi-Document Synthesis Proof Card */}
          <div className="lg:col-span-3 space-y-2">
            <div className="p-3 rounded-xl bg-[#1A2E21] border border-[#2B4734] space-y-2 shadow-lg">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[#253E2D] text-[9px] font-mono text-[#D8F36A]">
                  Project Brief.pdf
                </span>
                <span className="px-2 py-0.5 rounded bg-[#253E2D] text-[9px] font-mono text-[#A8C9B4]">
                  Strategy.docx
                </span>
                <span className="px-2 py-0.5 rounded bg-[#253E2D] text-[9px] font-mono text-[#A8C9B4]">
                  Notes.md
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14261B] text-[11px] text-[#D8E6DC] leading-relaxed">
                Based on the documents, the key focus areas are product-market fit, user acquisition, and revenue growth…
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#9EBAAA] pt-0.5">
                <span className="text-[#D8F36A] font-semibold">3 sources</span>
                <span>Verified Evidence</span>
              </div>
            </div>
          </div>

          {/* Right Side: Final CTA */}
          <div className="lg:col-span-4 space-y-5 lg:pl-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#2E4E3B] bg-[#1A2E21] text-[10px] font-mono tracking-wider font-semibold text-[#D8F36A] uppercase">
              Ready to get started?
            </div>

            <h3 className="font-editorial text-3xl sm:text-4xl text-[#FAFAF6] font-normal leading-tight">
              Your documents are more powerful with Quellivox.
            </h3>

            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#D8F36A] text-[#162719] text-sm font-bold hover:bg-[#c9e755] active:scale-95 transition-all shadow-md"
              >
                <span>Create Your Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="text-xs text-[#9EBAAA] flex items-center gap-3">
              <span>No credit card required</span>
              <span>·</span>
              <span>Set up in minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPACT BOTTOM COPYRIGHT FOOTER ─── */}
      <footer className="bg-[#0C1710] text-[#718579] py-8 px-6 text-xs border-t border-[#1D3224]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="font-bold text-[#F3F4EE]">QUELLIVOX</span>
            <span>·</span>
            <span>The Evidence Desk</span>
          </div>
          <div className="text-center sm:text-right font-mono text-[11px]">
            Grounded Retrieval-Augmented Generation (RAG) Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
