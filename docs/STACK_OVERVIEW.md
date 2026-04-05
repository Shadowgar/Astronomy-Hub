# `STACK_OVERVIEW.md`

---

# STACK OVERVIEW (COMPATIBILITY ALIAS — NON-AUTHORITATIVE)

---

## PURPOSE

This file exists only for:

```text id="g7x2rm"
backward compatibility with legacy prompts and tooling
```

---

## CANONICAL SOURCE

The real stack definition is located at:

```text id="t8k4np"
docs/execution/STACK_OVERVIEW.md
```

---

## RULE (CRITICAL)

```text id="m3v9zc"
This file must NOT define, modify, or override stack behavior.
```

---

## USAGE

This file may be referenced only when:

* legacy prompts expect this path
* compatibility with older workflows is required

---

## FORBIDDEN

Do NOT:

* update stack details here
* use this file as a source of truth
* reference this file in execution logic
* duplicate stack definitions

---

## FAILURE CONDITION

If stack information is maintained here:

```text id="c9p6wb"
The documentation system is in an invalid state.
```

---

## FINAL RULE

```text id="n2q5kx"
All stack truth lives in docs/execution/STACK_OVERVIEW.md
```

---