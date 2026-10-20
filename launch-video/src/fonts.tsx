import React, { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

import "@fontsource/open-sauce-two/400.css";
import "@fontsource/open-sauce-two/600.css";
import "@fontsource/open-sauce-two/700.css";
import "@fontsource/open-sauce-two/800.css";

/** Holds every frame back until the brand font is ready, so no frame is ever drawn in a fallback font. */
export function FontGate({ children }: { children: React.ReactNode }) {
  const [handle] = useState(() => delayRender("Loading the brand font"));
  useEffect(() => {
    Promise.all(["400", "600", "700", "800"].map((weight) => document.fonts.load(`${weight} 40px "Open Sauce Two"`)))
      .then(() => continueRender(handle))
      .catch((error) => cancelRender(error));
  }, [handle]);
  return <>{children}</>;
}
