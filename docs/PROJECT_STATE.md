# `PROJECT_STATE.md`

---

# PROJECT STATE (COMPATIBILITY ALIAS — NON-AUTHORITATIVE)

---

## PURPOSE

This file exists only for:

```text id="p8k4zn"
backward compatibility with legacy prompts and tooling
```

---

## CANONICAL SOURCE

The real project state is defined at:

```text id="m7x2qa"
docs/execution/PROJECT_STATE.md
```

---

## RULE (CRITICAL)

```text id="c3v9tm"
This file must NOT define or store active project state.
```

---

## USAGE

This file may be referenced only when:

* legacy prompts expect this path
* compatibility with older workflows is required

---

## FORBIDDEN

Do NOT:

* update state here
* track progress here
* define current feature here
* override execution state
* use this file in decision-making

---

## FAILURE CONDITION

If active state is stored here:

```text id="z6q2rx"
The execution system is invalid.
```

---

## FINAL RULE

```text id="r4n8kp"
All execution state lives in docs/execution/PROJECT_STATE.md
```

---