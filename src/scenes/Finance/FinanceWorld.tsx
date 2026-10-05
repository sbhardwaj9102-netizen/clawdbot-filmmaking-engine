"use client";

import { useMemo } from "react";

import { Hotspot } from "@/components/InteractiveObject/Hotspot";
import { M } from "@/components/World/materials";
import { GlassWall, Sign, Skyline } from "@/components/World/props/Architecture";
import { Binder, Chair, Doc, Lamp, Table, UIScreen } from "@/components/World/props/Furniture";
import { Assemble } from "@/components/World/WorldContext";
import { profile } from "@/data/profile";
import { canvasTexture, chartTexture, FONT } from "@/lib/canvasTextures";
import { useStory } from "@/systems/StoryEngine/store";
import { QUALITY } from "@/systems/Quality/quality";

/**
 * FINANCE IT — a creative idea also needs an economic engine. A glass room
 * among night towers: budgets and research on the table, analysis on the
 * screens. Entertainment economics, not a trading floor.
 */
export function FinanceWorld() {
  const tier = useStory((s) => s.tier);
  const model = useMemo(() => chartTexture(29, "#8fb5ff", "GLOBAL FINANCE — ANALYSIS"), []);
  const model2 = useMemo(() => chartTexture(31, "#e2a25e", "SCENARIOS"), []);
  const tools = useMemo(
    () =>
      canvasTexture("tools-screen", 1024, 640, (ctx, w, h) => {
        ctx.fillStyle = "#0a1220";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#8fb5ff";
        ctx.fillRect(60, 70, 60, 4);
        ctx.fillStyle = "#ece6da";
        ctx.font = `500 26px ${FONT.mono}`;
        ctx.fillText("TOOLKIT", 60, 56);
        profile.tools.forEach((t, i) => {
          const y = 150 + i * 118;
          ctx.fillStyle = "#ece6da";
          ctx.font = `400 56px ${FONT.serif}`;
          ctx.fillText(t.name, 60, y);
          ctx.fillStyle = "rgba(236,230,218,.55)";
          ctx.font = `400 22px ${FONT.mono}`;
          ctx.fillText(t.note.toUpperCase(), 62, y + 38);
        });
      }),
    [],
  );

  return (
    <group>
      <Skyline count={QUALITY[tier].city} inner={26} outer={150} center={[0, 0, -10]} seed={5} />
      <Assemble>
        {/* glass pavilion */}
        {[-7, 7].map((x) => (
          <group key={x}>
            <GlassWall w={19.5} h={6} panes={8} position={[x, 0, -7.75]} rotation={[0, Math.PI / 2, 0]} />
            <GlassWall w={2.5} h={6} panes={1} position={[x, 0, -22.75]} rotation={[0, Math.PI / 2, 0]} />
          </group>
        ))}
        <GlassWall w={14} h={6} panes={5} gapAt={2} position={[0, 0, -24]} />
        <mesh material={M.matteBlack()} position={[0, 6.05, -11]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[14.2, 26]} />
        </mesh>
        {[-4, -10, -16, -21].map((z) => (
          <mesh key={z} material={M.bulb("#dfe8ff", 0.7)} position={[0, 5.98, z]}>
            <boxGeometry args={[8, 0.03, 0.08]} />
          </mesh>
        ))}
        <Sign text="FINANCE IT" font="serif" width={4.4} size={170} tracking={0.08} position={[0, 3.3, -3.2]} opacity={0.7} />
      </Assemble>

      {/* the table: budgets, research, contracts */}
      <Assemble delay={0.2}>
        <Table w={6.4} d={1.5} height={0.82} material="walnut" position={[2.75, 0, -10.8]} rotation={[0, Math.PI / 2, 0]} />
        {[-12.8, -10.8, -8.8].map((z) => (
          <Chair key={z} position={[4.1, 0, z]} rotation={[0, -Math.PI / 2, 0]} />
        ))}
        <Lamp position={[2.75, 4.2, -10.8]} drop={1.8} color="#ffdcb0" shaftLength={3.2} />
        <Hotspot id="fin-budget" labelOffset={0.4}>
          <Binder kind="Production budget" title="Top sheet" position={[2.75, 0.82, -9.3]} rotation={[0, Math.PI / 2, 0]} />
        </Hotspot>
        <Hotspot id="fin-research" labelOffset={0.4}>
          <Binder kind="Industry research" title="IBR" color="#2a1a12" position={[2.75, 0.82, -12.2]} rotation={[0, Math.PI / 2, 0]} />
        </Hotspot>
        <Doc kind="Agreement" title="Draft" position={[2.4, 0.82, -10.7]} rotation={[0, Math.PI / 2 + 0.2, 0]} scale={1.1} seed={71} stack={8} />
        <Doc kind="Cash flow" title="Production" position={[3.1, 0.82, -13.4]} rotation={[0, Math.PI / 2 - 0.15, 0]} scale={1.1} columns seed={72} />
      </Assemble>

      {/* analysis screens */}
      <Assemble delay={0.35}>
        <Hotspot id="fin-model">
          <group position={[-4.3, 0, -11]} rotation-y={Math.PI / 2}>
            <UIScreen map={model} w={3.0} h={1.69} position={[0, 1.15, 0]} stand={false} intensity={1.1} />
            <UIScreen map={model2} w={1.4} h={0.79} position={[-2.35, 1.6, 0.25]} rotation={[0, 0.25, 0]} stand={false} />
            <mesh material={M.blackMetal()} position={[0, 0.58, -0.05]}>
              <boxGeometry args={[0.1, 1.16, 0.1]} />
            </mesh>
          </group>
        </Hotspot>
        <Hotspot id="fin-tools">
          <group position={[-4.3, 0, -16.4]} rotation-y={Math.PI / 2}>
            <UIScreen map={tools} w={1.9} h={1.19} position={[0, 1.1, 0]} stand={false} />
            <mesh material={M.blackMetal()} position={[0, 0.55, -0.05]}>
              <boxGeometry args={[0.08, 1.1, 0.08]} />
            </mesh>
          </group>
        </Hotspot>
      </Assemble>
    </group>
  );
}
