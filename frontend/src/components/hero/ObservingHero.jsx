import React from "react";
import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";
import AppButton from "../ui/AppButton";

export default function ObservingHero() {
  return (
    <GlassPanel variant="hero">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <StatusBadge label="GOOD" variant="good" />
          <div style={{ fontSize: 'var(--font-2)', color: 'var(--text-sub)' }}>Tonight · Best observing window</div>
        </div>

        <h1 style={{ margin: 0, fontSize: 'var(--font-6)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-main)' }}>Tonight’s Observing Plan</h1>

        <p style={{ margin: 0, fontSize: 'var(--font-3)', color: 'var(--text-sub)' }}>
          Clearer conditions early in the evening. Start with the highest-confidence targets first.
        </p>

        <div>
          <AppButton>Start Observing</AppButton>
        </div>
      </div>
    </GlassPanel>
  );
}
