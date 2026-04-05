## ROLE OF THIS DOCUMENT

This document defines styling validation rules.

It applies only to visual and UI correctness.

It does NOT:

* define system behavior
* affect backend validation
* override SYSTEM_VALIDATION_SPEC.md

# 🌌 ASTRONOMY HUB — STYLING AUDIT (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **How to evaluate, detect, and correct styling issues in Astronomy Hub**

It ensures:

* the UI follows `styling_decision.md`
* all 5 visual modes are correctly implemented
* no visual drift occurs over time
* inconsistencies are identified and corrected

---

# 1. 🧠 CORE RULE

```text id="q8k3m1"
Styling must be verified, not assumed.

If it is not audited, it is not correct.
```

---

# 2. 🎯 AUDIT OBJECTIVES

Every audit must verify:

* visual mode system integrity
* token usage compliance
* component consistency
* hierarchy clarity
* accessibility compliance
* red mode safety

---

# 3. 🔍 AUDIT CATEGORIES

---

## 3.1 Mode System Audit

Verify:

* all 5 modes exist:

  * Light
  * Light High Contrast
  * Dark
  * Dark High Contrast
  * Red Mode

---

### Must Pass

* mode switching works instantly
* no visual glitches during switch
* all UI regions update correctly

---

### Failure if:

* any mode missing
* partial mode implementation
* inconsistent rendering across modes

---

---

## 3.2 Token System Audit

---

### Verify

* all colors use semantic tokens
* no hardcoded colors
* tokens are consistently applied

---

### Must Pass

* components use:

  * `--background`
  * `--surface`
  * `--text-primary`
  * `--accent`
  * etc.

---

### Failure if:

```text id="k9x2v7"
Any hardcoded color value exists
```

---

---

## 3.3 Layout Consistency Audit

---

### Verify

* layout does NOT change between modes
* spacing is consistent
* hierarchy is preserved

---

### Must Pass

* same layout in all modes
* same component positioning

---

### Failure if:

* layout shifts between modes
* spacing changes
* panels move or resize incorrectly

---

---

## 3.4 Component Consistency Audit

---

### Verify

* components behave identically across modes
* states are consistent:

  * default
  * hover
  * active
  * selected

---

### Must Pass

* interaction is predictable
* no mode-specific behavior differences

---

### Failure if:

* button behaves differently per mode
* interaction states missing

---

---

## 3.5 Hierarchy Audit

---

### Verify

* scene is dominant
* selected object is clear
* panels are secondary

---

### Must Pass

* visual priority is consistent
* important elements stand out

---

### Failure if:

* panels compete with scene
* user cannot identify focus

---

---

## 3.6 Readability Audit

---

### Verify

* text is readable in all modes
* contrast is appropriate

---

### Must Pass

* no low-contrast text
* no blending into background

---

### Failure if:

* text becomes hard to read
* contrast too weak or too harsh

---

---

## 3.7 Red Mode Audit (CRITICAL)

---

### Verify

* only red tones used
* no blue light
* no white light

---

### Must Pass

* usable in real dark environment
* low brightness
* no eye strain

---

### Automatic Failure if:

```text id="r3p9x2"
ANY white, blue, or bright light appears
```

---

---

## 3.8 Accessibility Audit

---

### Verify

* high contrast modes improve readability
* UI supports visual impairments

---

### Must Pass

* text is clear
* controls are distinguishable

---

### Failure if:

* high contrast modes ineffective
* accessibility degraded

---

---

## 3.9 Motion Audit (Phase C+)

---

### Verify

* motion supports clarity
* transitions are smooth

---

### Must Pass

* no distracting animations
* no performance issues

---

### Failure if:

* motion causes confusion
* animation feels excessive

---

---

# 4. 🧪 AUDIT PROCESS

---

## Step-by-Step

```text id="m7p4k1"
1. Load application
2. Switch through all 5 modes
3. Inspect each UI region:
   - command bar
   - scene
   - panels
   - detail view
4. Interact with components
5. Check for token violations
6. Test readability
7. Test red mode in dark environment
```

---

# 5. 📊 AUDIT REPORT FORMAT

Each audit must produce:

---

## Summary

* Pass / Fail
* number of issues

---

## Issues List

For each issue:

* location
* description
* severity
* recommended fix

---

## Severity Levels

* Critical → breaks system (must fix immediately)
* Major → degrades usability
* Minor → cosmetic

---

# 6. 🚫 AUTOMATIC FAILURE CONDITIONS

---

System automatically FAILS audit if:

* any mode missing
* hardcoded colors exist
* red mode compromised
* layout inconsistent across modes
* unreadable text present

---

# 7. 🔄 CONTINUOUS AUDIT RULE

```text id="t2q9x4"
Styling audit must be performed:
- after major UI changes
- before phase completion
```

---

# 8. 🎯 FIX PRIORITY RULE

---

## Fix Order

1. Critical issues
2. Major issues
3. Minor issues

---

## Rule

```text id="v6k3p8"
Do not introduce new features before fixing audit failures
```

---

# 9. 🔥 FINAL STATEMENT

```text id="c8m2q7"
If styling is not audited,
the UI will drift.

If the UI drifts,
the system fails.
```

---

