"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap, Quote, Sparkles, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TimelineItem {
  id: number;
  title: string;
  subtitle?: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
  color?: string; // blue, emerald, amber, purple, rose, cyan
}

export interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  className?: string;
  slogan?: string;
  centerTitle?: string;
  centerSubtitle?: string;
  badgeLabel?: string;
}

export default function RadialOrbitalTimeline({
  timelineData,
  className,
  slogan,
  centerTitle = "Audit-OS",
  centerSubtitle = "ระบบตรวจสอบภายใน อปท.",
  badgeLabel = "AUDIT-OS ORBITAL"
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [viewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: any;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 215;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.45,
      Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-500/60";
      case "in-progress":
        return "text-blue-700 bg-blue-50 border-blue-200 dark:text-cyan-300 dark:bg-cyan-950/80 dark:border-cyan-500/60";
      case "pending":
        return "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/80 dark:border-slate-600";
      default:
        return "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/80 dark:border-slate-600";
    }
  };

  const getNodeColorConfig = (color?: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-600',
          border: 'border-emerald-300 dark:border-emerald-400',
          glow: 'rgba(16, 185, 129, 0.35)',
          text: 'text-emerald-700 dark:text-emerald-300',
          bar: 'from-emerald-500 to-teal-400'
        };
      case 'amber':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-300 dark:border-amber-400',
          glow: 'rgba(245, 158, 11, 0.35)',
          text: 'text-amber-700 dark:text-amber-300',
          bar: 'from-amber-500 to-yellow-400'
        };
      case 'purple':
      case 'indigo':
        return {
          bg: 'bg-indigo-600',
          border: 'border-indigo-300 dark:border-indigo-400',
          glow: 'rgba(99, 102, 241, 0.35)',
          text: 'text-indigo-700 dark:text-indigo-300',
          bar: 'from-indigo-500 to-purple-400'
        };
      case 'rose':
        return {
          bg: 'bg-rose-500',
          border: 'border-rose-300 dark:border-rose-400',
          glow: 'rgba(244, 63, 94, 0.35)',
          text: 'text-rose-700 dark:text-rose-300',
          bar: 'from-rose-500 to-pink-400'
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-600',
          border: 'border-cyan-300 dark:border-cyan-400',
          glow: 'rgba(6, 182, 212, 0.35)',
          text: 'text-cyan-700 dark:text-cyan-300',
          bar: 'from-cyan-500 to-blue-400'
        };
      case 'blue':
      default:
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-300 dark:border-blue-400',
          glow: 'rgba(37, 99, 235, 0.35)',
          text: 'text-blue-700 dark:text-blue-300',
          bar: 'from-blue-500 to-cyan-400'
        };
    }
  };

  return (
    <div
      className={
        className ||
        "w-full min-h-[640px] h-[680px] flex flex-col items-center justify-center bg-gradient-to-b from-[#f3f8fe] via-[#ebf3fc] to-[#f5f9ff] dark:from-[#071126] dark:via-[#0b1a3a] dark:to-[#071126] relative overflow-hidden rounded-3xl border border-blue-200/80 dark:border-blue-900/60 shadow-[0_15px_45px_-12px_rgba(37,99,235,0.12)]"
      }
      ref={containerRef}
      onClick={handleContainerClick}
    >
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#93c5fd_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-45 dark:opacity-25 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-sky-300/25 dark:bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Floating Slogan Ribbon (คำขวัญประจำท้องถิ่น) - Redesigned Civic Plaque */}
      {slogan && (
        <div className="absolute top-3.5 inset-x-2 sm:inset-x-6 z-30 flex justify-center pointer-events-none">
          <div className="group relative max-w-xl lg:max-w-2xl pointer-events-auto transition-all duration-300 hover:scale-[1.01]">
            {/* Ambient Aura Background */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400/30 via-blue-500/25 to-cyan-400/30 rounded-2xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            
            {/* Gradient Border Shell */}
            <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-amber-400/70 via-blue-400/50 to-cyan-400/70 dark:from-amber-400/50 dark:via-cyan-400/60 dark:to-blue-400/50 shadow-md shadow-blue-950/5 dark:shadow-cyan-950/30">
              {/* Inner Plaque Body */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-[15px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/50 dark:border-slate-800/80">
                {/* Civic Crest / Slogan Micro Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-amber-500/5 dark:from-amber-400/25 dark:to-amber-500/10 border border-amber-300/70 dark:border-amber-400/40 text-amber-800 dark:text-amber-300 shrink-0 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400 animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider font-['Prompt',sans-serif] whitespace-nowrap">
                    คำขวัญ
                  </span>
                </div>

                {/* Left Quote */}
                <Quote className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500/70 dark:text-cyan-400/70 shrink-0 transform scale-x-[-1]" />

                {/* Slogan Text: strictly font size unchanged as requested (text-xs sm:text-[13px]) */}
                <p className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-cyan-50 tracking-wide font-['Prompt',sans-serif] leading-tight text-center line-clamp-2">
                  {slogan}
                </p>

                {/* Right Quote */}
                <Quote className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500/70 dark:text-cyan-400/70 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Left Badge Indicator */}
      <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/40 backdrop-blur-md shadow-xs">
        <Sparkles className="w-3 h-3 text-blue-600 dark:text-cyan-300 animate-pulse" />
        <span className="text-[10px] font-bold text-blue-800 dark:text-cyan-200 tracking-wider uppercase font-mono">
          {badgeLabel}
        </span>
      </div>

      {/* Top Right Auto-Rotation Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/50 rounded-full px-2.5 py-1 text-[11px] text-slate-700 dark:text-cyan-200 backdrop-blur-md shadow-xs">
        <Compass className={`w-3 h-3 text-blue-600 dark:text-cyan-400 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAutoRotate((v) => !v);
          }}
          className="text-[10px] font-bold hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {autoRotate ? "หยุดหมุนชั่วคราว" : "หมุนอัตโนมัติ"}
        </button>
      </div>

      {/* 3D Orbital Canvas */}
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1100px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* Orbital Center Core Hub: Audit-OS Platform */}
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 animate-pulse flex flex-col items-center justify-center z-10 shadow-[0_0_35px_rgba(37,99,235,0.35)] border-2 border-white/60 dark:border-cyan-300/50">
            <div className="absolute w-24 h-24 rounded-full border border-blue-400/30 dark:border-cyan-400/35 animate-ping opacity-60"></div>
            <div
              className="absolute w-28 h-28 rounded-full border border-sky-300/30 dark:border-blue-400/25 animate-ping opacity-35"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-slate-900 shadow-md">
              <span className="text-[10px] tracking-tight leading-none font-bold text-slate-700">Audit</span>
              <span className="text-[11px] tracking-tight leading-none font-black text-blue-700">OS</span>
            </div>
            <span className="absolute -bottom-6 text-[10px] font-bold text-blue-900 dark:text-cyan-200 whitespace-nowrap bg-white/95 dark:bg-blue-950/90 px-2.5 py-0.5 rounded-full border border-blue-200/90 dark:border-cyan-500/40 backdrop-blur-xs shadow-xs">
              {centerSubtitle}
            </span>
          </div>

          {/* Electric Laser Orbit Tracks */}
          <div className="absolute w-[430px] h-[430px] rounded-full border border-blue-300/60 dark:border-cyan-400/20 shadow-[0_0_20px_rgba(59,130,246,0.12)] pointer-events-none"></div>
          <div className="absolute w-[470px] h-[470px] rounded-full border border-dashed border-blue-300/40 dark:border-blue-400/15 pointer-events-none"></div>

          {/* Orbit Nodes: 5 ส่วนราชการหลัก & งานบริการ */}
          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;
            const colorCfg = getNodeColorConfig(item.color);

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                {/* Radiant Aura Pulse around active node */}
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, ${colorCfg.glow} 0%, rgba(255,255,255,0) 70%)`,
                    width: `${item.energy * 0.5 + 46}px`,
                    height: `${item.energy * 0.5 + 46}px`,
                    left: `-${(item.energy * 0.5 + 46 - 44) / 2}px`,
                    top: `-${(item.energy * 0.5 + 46 - 44) / 2}px`,
                  }}
                ></div>

                {/* Node Orb with Department Colors */}
                <div
                  className={`
                  w-11 h-11 rounded-full flex items-center justify-center text-white
                  ${colorCfg.bg} border-2 ${colorCfg.border}
                  ${
                    isExpanded
                      ? "scale-135 shadow-[0_0_25px_rgba(37,99,235,0.4)] ring-4 ring-blue-400/60 dark:ring-cyan-300/50"
                      : isRelated
                      ? "ring-4 ring-blue-400/70 dark:ring-cyan-400/70 animate-pulse shadow-lg"
                      : "shadow-md hover:scale-115 hover:shadow-blue-400/40"
                  }
                  transition-all duration-300 transform
                `}
                >
                  <Icon size={18} className="drop-shadow-xs" />
                </div>

                {/* Node Title Label under Orb */}
                <div
                  className={`
                  absolute top-13 left-1/2 -translate-x-1/2 whitespace-nowrap
                  text-[11px] sm:text-xs tracking-wider text-center
                  transition-all duration-300 px-2 py-0.5 rounded-full backdrop-blur-xs
                  ${
                    isExpanded
                      ? `${colorCfg.text} scale-110 font-black bg-blue-50/90 dark:bg-slate-900/90 border border-blue-200 dark:border-cyan-400/40 shadow-sm`
                      : "text-slate-700 dark:text-slate-200 font-bold hover:text-blue-900 dark:hover:text-white bg-white/85 dark:bg-slate-900/65 border border-slate-200/70 dark:border-slate-800 shadow-2xs"
                  }
                `}
                >
                  {item.title}
                </div>

                {/* Expanded Interactive Card Popup */}
                {isExpanded && (
                  <Card className="absolute top-22 left-1/2 -translate-x-1/2 w-80 bg-white/98 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-blue-400/50 dark:border-cyan-400/40 shadow-[0_20px_50px_rgba(37,99,235,0.18)] dark:shadow-[0_20px_50px_rgba(2,132,199,0.35)] overflow-visible text-slate-800 dark:text-white z-50 rounded-2xl animate-fade-slide-in-1">
                    {/* Connecting Top Stem */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-0.5 h-3.5 bg-gradient-to-b from-blue-400 to-blue-600 dark:from-cyan-300 dark:to-cyan-500 shadow-xs"></div>

                    <CardHeader className="pb-2 pt-4 px-4 border-b border-slate-100 dark:border-white/10">
                      <div className="flex justify-between items-center gap-2">
                        <Badge
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status === "completed"
                            ? "✓ พร้อมให้บริการเต็มรูปแบบ"
                            : item.status === "in-progress"
                            ? "⚡ กำลังดำเนินงาน/บริการ"
                            : "รอดำเนินการ"}
                        </Badge>
                        <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-200/90 font-bold">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-2 leading-snug">
                        {item.title}
                      </CardTitle>
                      {item.subtitle && (
                        <div className="text-[11px] text-blue-600 dark:text-cyan-300/80 font-medium">
                          {item.subtitle}
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="text-xs text-slate-600 dark:text-slate-300 pb-4 px-4 space-y-3 pt-3">
                      <p className="leading-relaxed text-slate-700 dark:text-slate-200 text-xs">
                        {item.content}
                      </p>

                      {/* Energy / Service Efficiency Level */}
                      <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="flex items-center text-slate-600 dark:text-slate-300 font-medium">
                            <Zap size={12} className="mr-1 text-amber-500" />
                            ศักยภาพและความพร้อมการให้บริการ
                          </span>
                          <span className="font-mono text-blue-600 dark:text-cyan-300 font-black">{item.energy}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/70 dark:border-white/10">
                          <div
                            className={`h-full bg-gradient-to-r ${colorCfg.bar} rounded-full transition-all duration-700`}
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Connected Departments / Nodes */}
                      {item.relatedIds.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                          <div className="flex items-center mb-1.5">
                            <Link size={11} className="text-blue-500 dark:text-cyan-400 mr-1" />
                            <h4 className="text-[10px] uppercase tracking-wider font-bold text-blue-700 dark:text-cyan-300">
                              ส่วนราชการที่เชื่อมโยงในระบบ:
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find((i) => i.id === relatedId);
                              if (!relatedItem) return null;
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2.5 py-0 text-[11px] rounded-lg border-blue-200 dark:border-cyan-400/30 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-600/40 text-blue-700 hover:text-blue-900 dark:text-cyan-100 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem.title}
                                  <ArrowRight size={10} className="ml-1 text-blue-500 dark:text-cyan-300" />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Hint Strip */}
      <div className="absolute bottom-3 inset-x-4 z-20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 dark:text-cyan-200/70 pointer-events-none">
        <span className="hidden sm:inline">
          💡 คลิกที่โหนดส่วนราชการเพื่อเปิดรายละเอียด หรือคลิกพื้นที่ว่างเพื่อให้วงโคจรหมุนต่อ
        </span>
        <span className="font-mono text-blue-700 dark:text-cyan-300/80 font-bold bg-white/80 dark:bg-transparent px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-none shadow-2xs">
          {timelineData.length} ส่วนราชการและบริการหลักในวงโคจร
        </span>
      </div>
    </div>
  );
}
