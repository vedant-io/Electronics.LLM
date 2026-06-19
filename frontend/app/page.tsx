"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import {
  Zap, MessageSquare, Code2, Cpu, CircuitBoard, ArrowRight, Brain,
  Layers, BookOpen, Sparkles, Terminal, Wifi, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { Arduino3DViewer } from "@/components/ui/arduino-3d-viewer";
import { ParticleBackground } from "@/components/ui/particle-background";
import { TextScramble } from "@/components/ui/text-scramble";

/* ─── Feature data ─── */
const features = [
  {
    icon: Brain,
    title: "AI Tutor Agent",
    description: "Context-aware AI that understands your project & guides you through circuits, debugging, and electronics theory.",
    color: "primary",
  },
  {
    icon: Code2,
    title: "Code Generator",
    description: "Generate production-ready Arduino code from natural language descriptions. Compile & flash from the browser.",
    color: "accent",
  },
  {
    icon: CircuitBoard,
    title: "Wiring Planner",
    description: "AI-generated wiring diagrams with pin-by-pin connection guides. Never wire wrong again.",
    color: "primary",
  },
  {
    icon: Layers,
    title: "Adaptive Learning",
    description: "Two learning paths — structured Basic modules for beginners, and AI-Adaptive agent that personalizes to your pace.",
    color: "accent",
  },
];

const agents = [
  { name: "Name Agent", desc: "Identifies project from vague descriptions", icon: Sparkles },
  { name: "Code Agent", desc: "Generates C++/Arduino code", icon: Terminal },
  { name: "QA Agent", desc: "Troubleshoots hardware & software issues", icon: MessageSquare },
  { name: "Wiring Agent", desc: "Plans component connections", icon: Wifi },
];

/* ─── Animated section wrapper ─── */
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Landing Page ─── */
export default function Landing() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Smooth scroll progress
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });
  
  // Parallax layers
  const parallax1 = useTransform(smoothProgress, [0, 1], [0, -300]);
  const parallax2 = useTransform(smoothProgress, [0, 1], [0, -150]);
  const parallax3 = useTransform(smoothProgress, [0, 1], [0, -500]);

  // Hero text parallax
  const heroY = useTransform(smoothProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* PARTICLE BACKGROUND (fixed, always behind everything) */}
      <ParticleBackground />

      {/* ═══════ HEADER ═══════ */}
      <header className="absolute top-0 w-full z-50 border-b border-white/10 bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-white">Electronics.LLM</span>
          </div>
          <nav className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Sign In
            </Link>
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg px-4 hover:opacity-90 transition-opacity whitespace-nowrap" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Spotlight effect */}
        <Spotlight className="absolute top-0 left-0 md:left-1/4 -top-20 z-10" fill="white" />

        {/* Subtle colour orbs layered on top of particles */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(210 100% 50%), transparent)', y: parallax1 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.08] blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(173 80% 36%), transparent)', y: parallax2 }}
        />

        {/* Split layout — text left, Arduino right */}
        <div className="container mx-auto px-4 w-full max-w-7xl h-full min-h-[calc(100vh-4rem)] flex flex-col md:flex-row items-center relative z-10">

          {/* Left — text */}
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="flex-1 flex flex-col justify-center gap-6 py-20 md:py-0 md:pr-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 w-fit backdrop-blur-sm"
            >
              <Zap className="h-4 w-4" /> AI-Powered Embedded Systems Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9]"
            >
              <TextScramble
                as="span"
                duration={0.9}
                speed={0.03}
                characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
                className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50"
              >
                Electronics
              </TextScramble>
              <br />
              <TextScramble
                as="span"
                duration={1.2}
                speed={0.04}
                characterSet=".LMN01!#@$%"
                className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400"
              >
                .LLM
              </TextScramble>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-white/60 text-base md:text-lg max-w-md leading-relaxed"
            >
              From concept to circuit — AI agents that understand electronics.
              Generate projects, write code, troubleshoot, and learn through guided modules.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
            >
              <Button
                size="lg"
                className="h-12 px-8 font-bold gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/30"
                onClick={() => router.push('/login')}
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              {[
                { icon: Brain, label: 'AI Agents' },
                { icon: Cpu, label: 'Arduino' },
                { icon: Terminal, label: 'Live IDE' },
                { icon: Wifi, label: 'Wireless Comms' },
              ].map((s) => (
                <span
                  key={s.label}
                  className="flex items-center gap-1.5 text-xs font-medium text-white/40 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
                >
                  <s.icon className="h-3 w-3" /> {s.label}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Arduino 3D */}
          <div className="flex-1 w-full min-h-[400px] md:h-[calc(100vh-4rem)] relative">
            <Arduino3DViewer className="w-full h-full absolute inset-0" />
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs text-white/30 font-medium">Scroll to explore</span>
          <ChevronDown className="h-5 w-5 text-white/30" />
        </motion.div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Everything you need to
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">learn electronics</span>
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              A complete AI-powered platform — from idea to working hardware.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((f) => (
              <AnimatedSection key={f.title}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 transition-colors hover:border-blue-500/30"
                >
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                    f.color === "primary" ? "bg-blue-500/10" : "bg-teal-500/10"
                  }`}>
                    <f.icon className={`h-6 w-6 ${f.color === "primary" ? "text-blue-400" : "text-teal-400"}`} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">{f.title}</h3>
                  <p className="text-white/50 leading-relaxed">{f.description}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ AI AGENTS SHOWCASE ═══════ */}
      <section className="relative py-32 overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(173 80% 36%), transparent)", y: parallax3 }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-xs font-medium text-teal-400 mb-6">
              <Cpu className="h-3 w-3" />
              Powered by Multiple AI Agents
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Specialized <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">AI Agents</span>
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Each agent is an expert in its domain — working together to build your project.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {agents.map((agent) => (
              <AnimatedSection key={agent.name}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="group text-center p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-teal-500/20 transition-colors">
                    <agent.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white mb-1">{agent.name}</h3>
                  <p className="text-sm text-white/50">{agent.desc}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ LEARNING PATHS ═══════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Two ways to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">learn</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <AnimatedSection>
              <motion.div
                whileHover={{ y: -4 }}
                className="h-full rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent p-8"
              >
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <BookOpen className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Basic Modules</h3>
                <p className="text-white/50 mb-6 leading-relaxed">
                  Structured, step-by-step learning path. Pre-designed modules covering
                  fundamentals — LEDs, sensors, motors, communication protocols, and more.
                </p>
                <ul className="space-y-2 text-sm text-white/50">
                  {["Predefined curriculum", "Hands-on projects", "Progressive difficulty", "Self-paced"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection>
              <motion.div
                whileHover={{ y: -4 }}
                className="h-full rounded-2xl border border-teal-500/20 bg-gradient-to-b from-teal-500/5 to-transparent p-8"
              >
                <div className="h-14 w-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6">
                  <Brain className="h-7 w-7 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Adaptive Agent</h3>
                <p className="text-white/50 mb-6 leading-relaxed">
                  AI analyzes your skill level and generates personalized projects.
                  The difficulty and topics adapt in real-time as you learn.
                </p>
                <ul className="space-y-2 text-sm text-white/50">
                  {["AI-personalized path", "Dynamic difficulty", "Project generation", "Context-aware tutoring"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════ IDE PREVIEW ═══════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection>
            <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-teal-500/60" />
                <div className="h-3 w-3 rounded-full bg-blue-500/60" />
                <span className="ml-3 text-xs text-white/30 font-mono">Electronics.LLM — Online IDE</span>
              </div>
              <div className="grid md:grid-cols-2">
                <div className="p-6 border-r border-white/10">
                  <pre className="text-xs sm:text-sm font-mono text-white/40 leading-relaxed">
                    <code>
{`// Generated by Electronics.LLM
// Board: Arduino Uno

#include <Servo.h>

Servo myServo;
int sensorPin = A0;

void setup() {
  Serial.begin(9600);
  myServo.attach(9);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  int val = analogRead(sensorPin);
  int angle = map(val, 0, 1023, 0, 180);
  myServo.write(angle);
  delay(15);
}`}
                    </code>
                  </pre>
                </div>
                <div className="p-6 flex flex-col justify-center items-center text-center">
                  <Terminal className="h-12 w-12 text-blue-400/30 mb-4" />
                  <p className="text-sm text-white/40 mb-2">Compile & flash directly</p>
                  <p className="text-xs text-white/20">WebSerial API • Arduino CLI • Arduino Support</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6">
              Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">build</span>?
            </h2>
            <p className="text-lg text-white/50 max-w-lg mx-auto mb-10">
              Join the platform where AI meets hardware. Start your first embedded systems project in minutes.
            </p>
            <Button
              size="lg"
              className="h-14 px-12 text-base font-bold gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 hover:opacity-90 transition-opacity shadow-lg"
              onClick={() => router.push("/login")}
            >
              Start Learning
              <ArrowRight className="h-5 w-5" />
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-bold text-white">
              Electronics<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">.LLM</span>
            </span>
          </div>
          <p className="text-xs text-white/30">
            AI-Powered Embedded Systems Learning Platform — Open Source
          </p>
        </div>
      </footer>
    </div>
  );
}

