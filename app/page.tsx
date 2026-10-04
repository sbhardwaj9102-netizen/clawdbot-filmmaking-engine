import { About } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";
import { Events } from "@/components/home/Events";
import { Hero } from "@/components/home/Hero";
import { Production } from "@/components/home/Production";
import { SelectedWork } from "@/components/home/SelectedWork";
import { Toolkit } from "@/components/home/Toolkit";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <SelectedWork />
      <Production />
      <Events />
      <About />
      <Toolkit />
      <Contact />
    </main>
  );
}
