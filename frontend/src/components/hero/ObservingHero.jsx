import React from "react";
import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";
import AppButton from "../ui/AppButton";

export default function ObservingHero() {
  return (
    <GlassPanel variant="hero">
      <div className="observing-hero-stack">
        <div className="observing-hero-topline">
          <StatusBadge label="GOOD" variant="good" />
          <div className="observing-hero-kicker">Tonight · Best observing window</div>
        </div>

        <h1 className="observing-hero-title">Tonight’s Observing Plan</h1>

        <p className="observing-hero-summary">
          Clearer conditions early in the evening. Start with the highest-confidence targets first.
        </p>

        <div>
          <AppButton>Start Observing</AppButton>
        </div>
      </div>
    </GlassPanel>
  );
}
