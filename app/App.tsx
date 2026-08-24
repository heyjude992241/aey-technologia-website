import ContactUs from "./ContactUs";
import RocketLaunch from "./RocketLaunch";
import SectionSnap from "./SectionSnap";
import WhatWeDo from "./WhatWeDo";

export default function App() {
  return (
    <main className="space-journey">
      <SectionSnap />
      <RocketLaunch />
      <WhatWeDo />
      <ContactUs />
    </main>
  );
}
