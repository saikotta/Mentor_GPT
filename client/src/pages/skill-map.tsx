import * as React from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Brain,
  Info,
  Link2,
  Sparkles,
  Target,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { DEFAULT_SKILLS, useMentorStore } from "@/store/useMentorStore";
import { ROLE_SKILL_GRAPH } from "@shared/roles";

type SkillId = string;

type SkillNode = {
  id: SkillId;
  label: string;
  prerequisites: SkillId[];
};

function masteryTone(mastery: number) {
  if (mastery < 40) {
    return {
      ring: "border-rose-500/20",
      bg: "bg-rose-100",
      text: "text-rose-800",
      dot: "bg-rose-500",
      label: "Needs focus",
    };
  }
  if (mastery < 70) {
    return {
      ring: "border-amber-500/20",
      bg: "bg-amber-100",
      text: "text-amber-800",
      dot: "bg-amber-500",
      label: "Building",
    };
  }
  return {
    ring: "border-blue-500/20",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500",
    label: "Strong",
  };
}

function normalizeSkillLabel(label: string): string {
  return label.toLowerCase().replace(/ /g, "-").replace(/&/g, "and");
}

function whySkillMatters(args: {
  skill: string;
  role: string;
  mastery: number;
  prerequisites: string[];
}) {
  const { skill, role, mastery, prerequisites } = args;

  const base = `${skill} shows up constantly in ${role} workflows.`;
  const prereq = prerequisites.length
    ? `It also unlocks: ${prerequisites.join(", ")}.`
    : `It’s a foundational skill with few prerequisites.`;

  const masteryLine =
    mastery < 40
      ? `Your mastery is low right now, so improving it will quickly boost readiness.`
      : mastery < 70
        ? `You’re close—targeted practice here creates outsized gains.`
        : `You’re strong here; we’ll maintain it while pushing the next dependencies.`;

  return `${base} ${prereq} ${masteryLine}`;
}

function buildEdges(nodes: SkillNode[]) {
  const edges: { from: SkillId; to: SkillId }[] = [];
  nodes.forEach((n) => {
    n.prerequisites.forEach((p) => edges.push({ from: p, to: n.id }));
  });
  return edges;
}

function getMastery(skillLabel: string, lookup: Record<string, number>) {
  const normalized = normalizeSkillLabel(skillLabel);
  return lookup[normalized] ?? lookup[skillLabel] ?? 0;
}

function SkillPill({
  node,
  mastery,
  selected,
  onSelect,
}: {
  node: SkillNode;
  mastery: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = masteryTone(mastery);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full rounded-2xl border p-4 text-left transition duration-200 shadow-sm",
        selected
          ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20"
          : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-md",
      )}
      data-testid={`button-skill-${node.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={cn("h-2 w-2 rounded-full", tone.dot)}
              data-testid={`dot-mastery-${node.id}`}
            />
            <div className={cn(
              "font-semibold text-sm transition-colors",
              selected ? "text-blue-900" : "text-slate-900"
            )} data-testid={`text-skill-label-${node.id}`}>
              {node.label}
            </div>
          </div>
          <div
            className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500"
            data-testid={`text-skill-prereq-${node.id}`}
          >
            {node.prerequisites.length
              ? `Prereqs: ${node.prerequisites.join(", ")}`
              : "No prerequisites"}
          </div>
        </div>
        <Badge
          className={cn("rounded-full border shadow-none text-[10px] px-2 py-0.5", tone.ring, tone.bg, tone.text)}
          data-testid={`badge-skill-tier-${node.id}`}
        >
          {tone.label}
        </Badge>
      </div>

      <div className="mt-3">
        <Progress value={mastery} data-testid={`progress-skill-${node.id}`} />
      </div>
      <div
        className={cn("mt-2 text-xs", tone.text)}
        data-testid={`text-skill-mastery-${node.id}`}
      >
        {mastery}% mastery
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {node.prerequisites.map((p) => (
          <Badge
            key={p}
            variant="secondary"
            className="rounded-full"
            data-testid={`badge-prereq-${node.id}-${p}`}
          >
            {p}
          </Badge>
        ))}
      </div>
    </button>
  );
}

export default function SkillMapPage() {
  const [, setLocation] = useLocation();
  const profile = useMentorStore((s) => s.userProfile);
  const skills = useMentorStore((s) => s.skills);

  React.useEffect(() => {
    if (!profile) setLocation("/onboarding");
  }, [profile, setLocation]);

  const role = profile?.targetRole ?? "Data Analyst";

  const GRAPH = React.useMemo(() => {
    return ROLE_SKILL_GRAPH[role] || ROLE_SKILL_GRAPH["Data Analyst"];
  }, [role]);

  const EDGES = React.useMemo(() => buildEdges(GRAPH), [GRAPH]);

  const masteryLookup = React.useMemo(() => {
    const m: Record<string, number> = {};
    skills.forEach((s) => {
      m[s.skill] = Math.round(s.masteryScore);
    });
    return m;
  }, [skills]);

  const [selected, setSelected] = React.useState<SkillId>("");

  React.useEffect(() => {
    if (GRAPH.length > 0 && !selected) {
      setSelected(GRAPH[0].id);
    }
  }, [GRAPH]);

  const selectedNode = React.useMemo(
    () => GRAPH.find((n) => n.id === selected) ?? GRAPH[0],
    [selected, GRAPH],
  );

  const selectedMastery = getMastery(selectedNode.label, masteryLookup);
  const tone = masteryTone(selectedMastery);

  const dependents = React.useMemo(() => {
    return GRAPH.filter((n) => n.prerequisites.includes(selectedNode.id)).map(
      (n) => n.id,
    );
  }, [selectedNode.id, GRAPH]);

  const connections = React.useMemo(() => {
    const relatedEdges = EDGES.filter(
      (e) => e.from === selectedNode.id || e.to === selectedNode.id,
    );
    return relatedEdges;
  }, [selectedNode.id, EDGES]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl opacity-50" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-600 shadow-lg shadow-blue-900/20">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div
                    className="text-2xl font-semibold tracking-tight text-slate-900"
                    data-testid="text-skillmap-title"
                  >
                    Skill Map
                  </div>
                  <div
                    className="text-sm text-slate-600"
                    data-testid="text-skillmap-subtitle"
                  >
                    Explore dependencies and why each skill matters for{" "}
                    <span className="font-semibold text-blue-900">{role}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div
                    className="text-sm text-slate-500"
                    data-testid="text-graph-label"
                  >
                    Dependency Graph
                  </div>
                  <div
                    className="mt-1 text-xl font-semibold text-slate-900"
                    data-testid="text-graph-title"
                  >
                    Connected Skill Architecture
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-slate-100 text-[10px] text-slate-500 px-3 py-1 shadow-none border-none"
                  data-testid="badge-graph-legend"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> &lt;40
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> 40–70
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> &gt;70
                  </span>
                </Badge>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {GRAPH.map((node) => {
                  const mastery = getMastery(node.id, masteryLookup);
                  const isSelected = node.id === selected;
                  return (
                    <SkillPill
                      key={node.id}
                      node={node}
                      mastery={mastery}
                      selected={isSelected}
                      onSelect={() => setSelected(node.id)}
                    />
                  );
                })}
              </div>

              <div
                className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                data-testid="card-edges"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-slate-400" />
                  <div className="font-semibold text-slate-900" data-testid="text-edges-title">
                    Connections: <span className="text-blue-900">{selectedNode.label}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {connections.length ? (
                    connections.map((e, i) => (
                      <div
                        key={`${e.from}-${e.to}-${i}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                        data-testid={`row-edge-${i}`}
                      >
                        <div className="text-sm text-slate-700" data-testid={`text-edge-${i}`}>
                          <span className="font-semibold text-slate-900">{e.from}</span>
                          <span className="text-slate-400 font-bold mx-2">→</span>
                          <span className="font-semibold text-slate-900">{e.to}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-blue-50 text-[10px] uppercase font-bold text-blue-800 border-blue-100"
                          data-testid={`badge-edge-type-${i}`}
                        >
                          prerequisite
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div
                      className="text-sm text-slate-500 italic py-2"
                      data-testid="text-edges-empty"
                    >
                      No explicit prerequisites found for this node.
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className="text-sm text-slate-500"
                      data-testid="text-details-label"
                    >
                      Skill Details
                    </div>
                    <div
                      className="mt-1 text-2xl font-bold text-slate-900 tracking-tight"
                      data-testid="text-details-title"
                    >
                      {selectedNode.label}
                    </div>
                  </div>

                  <Badge
                    className={cn("rounded-full border shadow-none px-3 py-1", tone.ring, tone.bg, tone.text)}
                    data-testid="badge-details-tier"
                  >
                    {tone.label}
                  </Badge>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Level of Mastery</span>
                    <span className={cn("text-sm font-bold", tone.text)} data-testid="text-details-mastery">
                      {selectedMastery}%
                    </span>
                  </div>
                  <Progress value={selectedMastery} className="h-2" data-testid="progress-details" />
                </div>

                <Separator className="my-6 bg-slate-100" />

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-900 grid place-items-center shadow-sm">
                        <Info className="h-4 w-4" />
                      </div>
                      <div
                        className="text-sm font-bold text-slate-900"
                        data-testid="text-why-title"
                      >
                        Role Context
                      </div>
                    </div>
                    <div
                      className="mt-3 text-sm text-slate-600 leading-relaxed"
                      data-testid="text-why-body"
                    >
                      {whySkillMatters({
                        skill: selectedNode.label,
                        role,
                        mastery: selectedMastery,
                        prerequisites: selectedNode.prerequisites,
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-900 grid place-items-center shadow-sm">
                          <Link2 className="h-4 w-4" />
                        </div>
                        <div
                          className="text-sm font-bold text-slate-900"
                          data-testid="text-prereq-title"
                        >
                          Unlocks
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-white text-slate-700 border-slate-100 shadow-sm"
                        data-testid="badge-dependents-count"
                      >
                        {dependents.length}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {dependents.length ? (
                        dependents.map((d) => (
                          <Badge
                            key={d}
                            variant="secondary"
                            className="rounded-xl bg-white border-slate-100 text-slate-700 shadow-sm px-3 py-1"
                            data-testid={`badge-details-dependent-${d}`}
                          >
                            {d}
                          </Badge>
                        ))
                      ) : (
                        <div
                          className="text-xs text-slate-500 italic"
                          data-testid="text-dependents-empty"
                        >
                          End of current dependency chain.
                        </div>
                      )}
                    </div>
                  </div>

                  <Card className="rounded-2xl border-none bg-blue-900 p-5 text-white shadow-lg shadow-blue-900/10">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-blue-300" />
                      <div
                        className="text-sm font-bold"
                        data-testid="text-next-action-title"
                      >
                        MentorGPT Logic
                      </div>
                    </div>
                    <div
                      className="mt-2 text-xs text-blue-100 leading-relaxed"
                      data-testid="text-next-action-body"
                    >
                      Because this is a {selectedMastery < 40 ? "priority gap" : "foundation skill"}, we recommend focusing on {selectedNode.label} to unlock complex workflows in {role}.
                    </div>
                  </Card>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
