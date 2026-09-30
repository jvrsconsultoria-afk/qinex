"use client";

import { useEffect, useState } from "react";

export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  return ready;
}
