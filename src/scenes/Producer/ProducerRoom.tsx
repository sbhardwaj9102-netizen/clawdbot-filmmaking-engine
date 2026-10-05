"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  type Group,
  Line,
  LineBasicMaterial,
  type Mesh,
  MeshBasicMaterial,
} from "three";

import { Clickable } from "@/components/InteractiveObject/Hotspot";
import { M } from "@/components/World/materials";
import { CinemaCamera, DirectorChair, FilmLight, Monitor, Tripod } from "@/components/World/props/Film";
import { Desk } from "@/components/World/props/Furniture";
import { Photo } from "@/components/World/props/Photo";
import { Fire, RoundTable, StringLights } from "@/components/World/props/Live";
import { Truss } from "@/components/World/props/Architecture";
import { T, themedInk } from "@/components/World/themed";
import { profile } from "@/data/profile";
import { radialTexture, stripboardTexture, textTexture } from "@/lib/canvasTextures";
import { clamp, damp, yawOf } from "@/lib/math";
import { ASTER_PINS, routeMapTexture } from "@/lib/storyTextures";
import { useTex } from "@/lib/textureCache";
import { STAGE } from "@/systems/Experience/choreography";
import { rt } from "@/systems/Experience/runtime";
import { useExperience } from "@/systems/Experience/store";
import { goExplore } from "@/systems/Experience/tour";

import { useEnvRef } from "../envRef";

/**
 * ROOM 1 — THE PRODUCER
 * A film studio: a cyclorama with a projection screen, the video village
 * where Satyam watches the monitors, a camera on the House of Purple set, a
 * hut fire burning on cue behind a safety line, the ASTER wall (seven pins on
 * a location map, four days on a stripboard), the film monitors rack, and
 * festoon lights that turn the set into an event when the story needs it.
 */
type V3 = [number, number, number];

export function ProducerRoom() {
  const work = useExperience((s) => (s.mode === "explore" && s.section === "work" ? s.work : null));
  const about = useExperience((s) => s.mode === "explore" && s.section === "about");
  const rackBoost = () => rt.env.rack;
  return (
    <group>
      <Shell />
      <KeyArtScreen />

      <Clickable id="aster" label="ASTER" verb="View" active={work === "aster"} labelAt={[-8.9, 4.1, -1.2]} onSelect={() => goExplore("work", "aster")}>
        <AsterWall />
      </Clickable>

      <Clickable id="purple" label="Death at the House of Purple" verb="View" active={work === "purple"} labelAt={[3.6, 4.4, -5.4]} onSelect={() => goExplore("work", "purple")}>
        <PurpleSet />
      </Clickable>

      <Clickable id="village" label="Satyam" verb="About" active={about} labelAt={[-2.2, 2.2, 0.9]} onSelect={() => goExplore("about")}>
        <VideoVillage />
      </Clickable>

      <Clickable id="rack" label="RANA · GLUTTONY" verb="View" active={work === "more"} boost={rackBoost} labelAt={[STAGE.rack.x, 2.4, STAGE.rack.z]} onSelect={() => goExplore("work", "more")}>
        <FilmRack />
      </Clickable>

      <EventDressing />

      {/* the camera on the set (off to the side of the fire, out of our line of sight), and the lights */}
      <group position={[4.1, 0, -1.3]} rotation-y={yawOf(STAGE.fire.x - 4.1, STAGE.fire.z + 1.3)}>
        <Tripod height={1.35}>
          <CinemaCamera />
        </Tripod>
      </group>
      <FilmLight position={[-0.6, 0, -3.4]} rotation={[0, yawOf(4.2, -2), 0]} tilt={0.35} color="#ffd8b0" shaftLength={5} />
      <FilmLight position={[6.6, 0, -2.4]} rotation={[0, yawOf(-3, -3), 0]} tilt={0.3} color="#c9b5ff" shaftLength={5} />
      <FilmLight position={[-6.8, 0, 3.4]} rotation={[0, yawOf(-2.4, -4.6), 0]} tilt={0.3} color="#ffe2bf" shaftLength={5.5} />
    </group>
  );
}

/** Cyclorama, side wall, lighting grid, the room's name. */
function Shell() {
  const cove = useMemo(() => new CylinderGeometry(1.4, 1.4, 17.2, 24, 1, true, Math.PI, Math.PI / 2).rotateZ(Math.PI / 2), []);
  const coveMat = useMemo(() => {
    const m = T.cyc();
    const c = m.clone();
    c.side = DoubleSide;
    return c;
  }, []);
  useFrame(() => coveMat.color.copy(T.cyc().color));
  const sign = useMemo(() => textTexture("THE PRODUCER", { font: "mono", size: 120, tracking: 0.3, w: 2048, h: 256, color: "#ffffff" }), []);
  return (
    <group>
      {/* the cyc: back wall with a curved cove into the floor */}
      <mesh material={T.cyc()} position={[-2.2, 1.4 + 6.5, -9.15]} receiveShadow>
        <planeGeometry args={[17.2, 13]} />
      </mesh>
      <mesh geometry={cove} material={coveMat} position={[-2.2, 1.4, -7.75]} receiveShadow />
      {/* side wall */}
      <mesh material={T.wall()} position={[-10.8, 7, -1]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[17, 14]} />
      </mesh>
      <mesh material={themedInk(sign, "#ece6da", "#2a241b", 0.55)} position={[-10.75, 6.6, 3]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[5.4, 0.675]} />
      </mesh>
      {/* lighting grid */}
      <Truss length={17} position={[-2.2, 7.4, -3]} />
      <Truss length={17} position={[-2.2, 7.4, 2.6]} />
      <Truss length={6} position={[-8.4, 7.4, -0.2]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

/** The projection screen on the cyc: key art for whatever the story is about. */
function KeyArtScreen() {
  const maps = {
    hero: useTex("/assets/site/hero.jpg"),
    aster: useTex("/assets/aster/cover.jpg"),
    purple: useTex("/assets/purple/cover.jpg"),
    live: useTex("/assets/events/venue-live.jpg"),
  };
  const back = useMemo(() => new MeshBasicMaterial({ map: maps.hero, toneMapped: false }), [maps.hero]);
  const front = useMemo(() => new MeshBasicMaterial({ map: maps.hero, toneMapped: false, transparent: true, opacity: 0 }), [maps.hero]);
  const st = useRef({ shown: "hero" as keyof typeof maps, fade: 1 });
  useEffect(
    () => () => {
      back.dispose();
      front.dispose();
    },
    [back, front],
  );
  useFrame((_, dt) => {
    const want = rt.env.screen;
    const s = st.current;
    if (want !== s.shown && s.fade >= 1) {
      // start a dissolve: the current image goes to the back, the new one fades in front
      back.map = maps[s.shown];
      front.map = maps[want];
      back.needsUpdate = front.needsUpdate = true;
      s.shown = want;
      s.fade = 0;
    }
    s.fade = Math.min(1, s.fade + Math.min(dt, 0.05) / 1.1);
    front.opacity = s.fade;
    const level = 0.35 + 0.55 * rt.rooms.producer;
    back.color.setScalar(level);
    front.color.setScalar(level);
  });
  return (
    <group position={[STAGE.screen.x, 3.75, STAGE.screen.z]}>
      <mesh material={M.matteBlack()} position={[0, 0, -0.06]}>
        <boxGeometry args={[7.5, 4.3, 0.08]} />
      </mesh>
      <mesh material={back}>
        <planeGeometry args={[7.2, 4.05]} />
      </mesh>
      <mesh material={front} position={[0, 0, 0.005]}>
        <planeGeometry args={[7.2, 4.05]} />
      </mesh>
    </group>
  );
}

/** ASTER: the key art, seven locations on a map, four days on a stripboard. */
function AsterWall() {
  const map = useMemo(() => routeMapTexture(), []);
  const strip = useMemo(() => stripboardTexture(4, 5), []);
  const mapMat = useMemo(() => new MeshBasicMaterial({ map, toneMapped: false }), [map]);
  const stripMat = useMemo(() => new MeshBasicMaterial({ map: strip, toneMapped: false }), [strip]);
  const ink = (text: string, size = 92) => textTexture(text, { font: "mono", size, tracking: 0.22, w: 2048, h: 256, color: "#ffffff" });
  const titleTex = useMemo(() => textTexture("ASTER", { font: "serif", size: 210, tracking: 0.04, w: 2048, h: 400, color: "#ffffff" }), []);
  const labels = useMemo(() => ({ sub: ink("SHORT FILM · PRODUCER"), loc: ink("07 LOCATIONS"), days: ink("04 SHOOT DAYS") }), []);

  const MW = 1.8;
  const MH = 1.35;
  const pins = useRef<(Mesh | null)[]>([]);
  const pinMats = useMemo(() => ASTER_PINS.map(() => new MeshBasicMaterial({ color: new Color("#e2a25e"), toneMapped: false })), []);
  const halo = useMemo(
    () =>
      new MeshBasicMaterial({
        map: radialTexture("rgba(255,190,110,0.9)", "rgba(255,190,110,0)"),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  const route = useMemo(() => {
    const g = new BufferGeometry();
    const pts = ASTER_PINS.flatMap(([u, v]) => [(u - 0.5) * MW, (v - 0.5) * MH, 0.012]);
    g.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
    return g;
  }, []);
  const routeMat = useMemo(() => new LineBasicMaterial({ color: new Color("#f0b46e").multiplyScalar(1.6), toneMapped: false }), []);
  const routeLine = useMemo(() => new Line(route, routeMat), [route, routeMat]);
  const dayMats = useMemo(
    () => [0, 1, 2, 3].map(() => new MeshBasicMaterial({ color: "#ffcf8a", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false })),
    [],
  );
  useEffect(
    () => () => {
      [mapMat, stripMat, halo, routeMat, ...pinMats, ...dayMats].forEach((m) => m.dispose());
      route.dispose();
    },
    [mapMat, stripMat, halo, routeMat, pinMats, dayMats, route],
  );

  const dim = useMemo(() => new Color(0.25, 0.2, 0.15), []);
  const amber = useMemo(() => new Color(1, 0.72, 0.42), []);
  useFrame(() => {
    const lit = rt.env.pins;
    const level = 0.45 + 0.5 * rt.rooms.producer;
    mapMat.color.setScalar(level);
    stripMat.color.setScalar(level);
    pins.current.forEach((m, i) => {
      if (!m) return;
      const k = clamp(lit - i, 0, 1);
      m.scale.setScalar(0.35 + 0.65 * k);
      pinMats[i].color.copy(dim).lerp(amber, k).multiplyScalar(0.6 + 1.6 * k);
    });
    halo.opacity = clamp(lit, 0, 1) * 0.5;
    route.setDrawRange(0, Math.max(0, Math.floor(lit)));
    dayMats.forEach((m, d) => (m.opacity = clamp(rt.env.days - d, 0, 1) * 0.28));
  });

  // stripboard: day columns in UV (see stripboardTexture: 40 columns, 10 per day)
  const dayU = (d: number) => [(40 + d * 236) / 1024, (40 + d * 236 + 226) / 1024];
  const SW = 2.1;
  const SH = 1.05;

  return (
    <group position={[STAGE.asterWall.x, 0, STAGE.asterWall.z]} rotation-y={Math.PI / 2}>
      <mesh material={T.trim()} position={[0, 2.05, -0.06]}>
        <boxGeometry args={[7, 3.7, 0.06]} />
      </mesh>
      <mesh material={T.canvas()} position={[0, 2.05, -0.025]}>
        <planeGeometry args={[6.8, 3.5]} />
      </mesh>
      {/* key art */}
      <Photo src="/assets/aster/cover.jpg" w={2.6} position={[-1.95, 2.15, 0.01]} frame="black" />
      <mesh material={themedInk(titleTex)} position={[-1.95, 3.42, 0.01]}>
        <planeGeometry args={[2.2, 0.43]} />
      </mesh>
      <mesh material={themedInk(labels.sub, "#ece6da", "#2a241b", 0.75)} position={[-1.95, 1.2, 0.01]}>
        <planeGeometry args={[2.2, 0.275]} />
      </mesh>
      {/* the map */}
      <group position={[0.75, 2.2, 0.01]}>
        <mesh material={mapMat}>
          <planeGeometry args={[MW, MH]} />
        </mesh>
        <primitive object={routeLine} />
        {ASTER_PINS.map(([u, v], i) => (
          <group key={i} position={[(u - 0.5) * MW, (v - 0.5) * MH, 0.02]}>
            <mesh ref={(el) => void (pins.current[i] = el)} material={pinMats[i]}>
              <sphereGeometry args={[0.04, 14, 10]} />
            </mesh>
            <mesh material={halo} position={[0, 0, -0.005]}>
              <planeGeometry args={[0.22, 0.22]} />
            </mesh>
          </group>
        ))}
        <mesh material={themedInk(labels.loc)} position={[0, MH / 2 + 0.24, 0]}>
          <planeGeometry args={[1.8, 0.225]} />
        </mesh>
      </group>
      {/* the stripboard */}
      <group position={[2.55, 2.2, 0.01]}>
        <mesh material={stripMat}>
          <planeGeometry args={[SW, SH]} />
        </mesh>
        {[0, 1, 2, 3].map((d) => {
          const [u0, u1] = dayU(d);
          return (
            <mesh key={d} material={dayMats[d]} position={[((u0 + u1) / 2 - 0.5) * SW, -0.02 * SH, 0.006]}>
              <planeGeometry args={[(u1 - u0) * SW, SH * 0.8]} />
            </mesh>
          );
        })}
        <mesh material={themedInk(labels.days)} position={[0, SH / 2 + 0.39, 0]}>
          <planeGeometry args={[1.8, 0.225]} />
        </mesh>
      </group>
      {/* two location prints */}
      <Photo src="/assets/aster/location-02.jpg" w={0.62} position={[0.3, 0.92, 0.01]} />
      <Photo src="/assets/aster/location-03.jpg" w={0.62} position={[1.2, 0.92, 0.01]} />
      <Photo src="/assets/aster/production.jpg" w={0.62} position={[2.1, 0.92, 0.01]} />
      <Photo src="/assets/aster/scheduling.jpg" w={0.62} position={[3.0, 0.92, 0.01]} />
    </group>
  );
}

/** DEATH AT THE HOUSE OF PURPLE: a constructed set, and a hut fire behind a safety line. */
function PurpleSet() {
  const fire = useEnvRef("fire");
  const window_ = useMemo(() => new MeshBasicMaterial({ color: new Color("#b89cff").multiplyScalar(1.6), toneMapped: false }), []);
  const door = useMemo(() => new MeshBasicMaterial({ color: new Color("#ffcf8a").multiplyScalar(1.5), toneMapped: false }), []);
  const glow = useMemo(
    () =>
      new MeshBasicMaterial({
        map: radialTexture("rgba(255,120,40,0.85)", "rgba(255,120,40,0)"),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  const header = useMemo(() => textTexture("DEATH AT THE HOUSE OF PURPLE", { font: "mono", size: 76, tracking: 0.2, w: 2048, h: 256, color: "#ffffff" }), []);
  const safety = useMemo(() => textTexture("SAFETY LINE — FIRE EFFECT", { font: "mono", size: 64, tracking: 0.2, w: 2048, h: 256, color: "#ffffff" }), []);
  const roof = useRef<Group>(null);
  useEffect(
    () => () => {
      window_.dispose();
      door.dispose();
      glow.dispose();
    },
    [window_, door, glow],
  );
  useFrame(() => {
    const level = 0.35 + 0.65 * rt.rooms.producer;
    window_.color.setRGB(0.72, 0.61, 1).multiplyScalar(1.6 * level);
    door.color.setRGB(1, 0.81, 0.54).multiplyScalar(1.4 * level);
    glow.opacity = fire.current * (0.75 + 0.25 * Math.sin(rt.time * 9) * Math.sin(rt.time * 5.3));
  });

  const hut: V3 = [STAGE.fire.x - STAGE.purpleSet.x, 0, STAGE.fire.z - STAGE.purpleSet.z];
  return (
    <group position={[STAGE.purpleSet.x, 0, STAGE.purpleSet.z]}>
      {/* riser and flats */}
      <mesh material={M.darkWood()} position={[0, 0.08, -0.1]} receiveShadow>
        <boxGeometry args={[5.4, 0.16, 2.9]} />
      </mesh>
      <mesh material={T.flat()} position={[0, 1.86, -1.5]} receiveShadow castShadow>
        <boxGeometry args={[5.4, 3.4, 0.12]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={T.flat()} position={[s * 2.66, 1.86, -0.2]} receiveShadow>
          <boxGeometry args={[0.12, 3.4, 2.6]} />
        </mesh>
      ))}
      <mesh material={T.flatTrim()} position={[0, 0.3, -1.43]}>
        <boxGeometry args={[5.3, 0.22, 0.04]} />
      </mesh>
      {/* window and doorway, lit from behind */}
      <group position={[-1.25, 2.25, -1.43]}>
        <mesh material={window_}>
          <planeGeometry args={[1.05, 1.3]} />
        </mesh>
        <mesh material={T.flatTrim()} position={[0, 0, 0.01]}>
          <boxGeometry args={[0.05, 1.3, 0.03]} />
        </mesh>
        <mesh material={T.flatTrim()} position={[0, 0, 0.01]}>
          <boxGeometry args={[1.05, 0.05, 0.03]} />
        </mesh>
      </group>
      <group position={[1.3, 1.22, -1.43]}>
        <mesh material={door}>
          <planeGeometry args={[0.95, 2.1]} />
        </mesh>
        <mesh material={T.flatTrim()} position={[0, 1.08, 0.02]}>
          <boxGeometry args={[1.1, 0.08, 0.05]} />
        </mesh>
      </group>
      {/* a standard lamp inside the set */}
      <group position={[-2.1, 0.16, -0.9]}>
        <mesh material={M.blackMetal()} position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.4, 6]} />
        </mesh>
        <mesh material={M.bulb("#ffcf8a", 1.8)} position={[0, 1.45, 0]}>
          <cylinderGeometry args={[0.13, 0.18, 0.22, 16, 1, true]} />
        </mesh>
      </group>
      <mesh material={themedInk(header, "#ece6da", "#2a241b", 0.7)} position={[0, 3.95, -1.43]}>
        <planeGeometry args={[4.2, 0.525]} />
      </mesh>

      {/* the hut and its fire */}
      <group position={hut}>
        {[
          [-0.75, -0.55],
          [0.75, -0.55],
          [-0.75, 0.55],
          [0.75, 0.55],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} material={M.darkWood()} position={[x, 0.75, z]}>
            <cylinderGeometry args={[0.045, 0.055, 1.5, 6]} />
          </mesh>
        ))}
        <group ref={roof} position={[0, 1.5, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} material={M.tinted("#2b2016", 1, 0)} position={[0, 0.28, s * 0.42]} rotation-x={s * 0.75}>
              <boxGeometry args={[1.8, 0.05, 1.05]} />
            </mesh>
          ))}
        </group>
        <Fire position={[0, 0.02, 0]} width={1.25} height={1.05} intensity={fire} />
        <mesh material={glow} position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[4.2, 4.2]} />
        </mesh>
        {/* safety line, extinguishers */}
        <mesh material={M.tinted("#e8c547", 0.6, 0)} position={[0, 0.006, 1.45]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[4.4, 0.08]} />
        </mesh>
        <mesh material={themedInk(safety, "#e8c547", "#6a5410", 0.85)} position={[0, 0.008, 1.62]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.8, 0.225]} />
        </mesh>
        {[-1.7, 1.7].map((x) => (
          <group key={x} position={[x, 0, 1.2]}>
            <mesh material={M.tinted("#b3221b", 0.4, 0.2)} position={[0, 0.27, 0]} castShadow>
              <cylinderGeometry args={[0.085, 0.085, 0.54, 14]} />
            </mesh>
            <mesh material={M.blackMetal()} position={[0, 0.58, 0]}>
              <cylinderGeometry args={[0.03, 0.04, 0.08, 8]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Where Satyam watches the take. */
function VideoVillage() {
  const chair = useMemo(() => profile.title.split(" · ")[0].toUpperCase(), []);
  return (
    <group>
      <Desk position={[STAGE.desk.x, 0, STAGE.desk.z]} w={1.9} d={0.7} />
      <Monitor src="/assets/aster/frame-02.jpg" w={0.78} h={0.44} stand={false} position={[STAGE.desk.x - 0.46, 0.76, STAGE.desk.z - 0.12]} rotation={[0, 0.1, 0]} />
      <Monitor src="/assets/aster/frame-05.jpg" w={0.78} h={0.44} stand={false} position={[STAGE.desk.x + 0.46, 0.76, STAGE.desk.z - 0.12]} rotation={[0, -0.1, 0]} />
      <DirectorChair position={[STAGE.desk.x - 1.35, 0, STAGE.desk.z + 0.85]} rotation={[0, Math.PI + 0.35, 0]} label={chair} />
    </group>
  );
}

/** The four films, on a monitors cart. */
function FilmRack() {
  const films: { src: string; title: string }[] = [
    { src: "/assets/aster/cover.jpg", title: "ASTER" },
    { src: "/assets/purple/cover.jpg", title: "HOUSE OF PURPLE" },
    { src: "/assets/rana/cover.jpg", title: "RANA" },
    { src: "/assets/gluttony/cover.jpg", title: "GLUTTONY" },
  ];
  return (
    <group position={[STAGE.rack.x, 0, STAGE.rack.z]} rotation-y={0.5}>
      {/* the cart */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={M.blackMetal()} position={[s * 0.82, 0.9, 0]}>
          <boxGeometry args={[0.04, 1.8, 0.04]} />
        </mesh>
      ))}
      {[0.12, 1.82].map((y) => (
        <mesh key={y} material={M.blackMetal()} position={[0, y, 0]}>
          <boxGeometry args={[1.7, 0.04, 0.5]} />
        </mesh>
      ))}
      {films.map((f, i) => (
        <Monitor
          key={f.title}
          src={f.src}
          title={f.title}
          w={0.72}
          h={0.405}
          stand={false}
          position={[(i % 2 ? 0.39 : -0.39), i < 2 ? 1.2 : 0.55, 0.05]}
        />
      ))}
    </group>
  );
}

/** Festoon lights and banquet tables: the set becomes an event venue for a moment. */
function EventDressing() {
  const on = useEnvRef("strings");
  const tables = useRef<Group>(null);
  const strands = useMemo<[V3, V3][]>(
    () => [
      [
        [-8.5, 5.8, -5.5],
        [5.5, 5.8, -5.5],
      ],
      [
        [-8.5, 5.8, -1.8],
        [5.5, 5.8, -1.8],
      ],
      [
        [-8.5, 5.8, 1.9],
        [5.5, 5.8, 1.9],
      ],
      [
        [-6, 6, -6],
        [4, 5.6, 4.5],
      ],
    ],
    [],
  );
  const st = useRef(0);
  const lights = useRef<Group>(null);
  useFrame((_, dt) => {
    st.current = damp(st.current, on.current, 3, Math.min(dt, 0.25));
    if (lights.current) lights.current.visible = on.current > 0.02;
    const g = tables.current;
    if (!g) return;
    g.visible = st.current > 0.02;
    g.scale.set(1, Math.max(0.001, st.current), 1);
  });
  return (
    <>
      <group ref={lights}>
        <StringLights strands={strands} on={on} per={30} />
      </group>
      <group ref={tables}>
        <RoundTable position={[5, 0, 4.6]} candle={on} />
        <RoundTable position={[1.6, 0, 5.2]} candle={on} />
      </group>
    </>
  );
}
