# DATA CONTRACTS

---

## PURPOSE

Defines how data moves between system layers.

---

## ENGINE → HUB CONTRACT

```json
{
  "id": "",
  "type": "",
  "name": "",
  "altitude": number,
  "azimuth": number,
  "visible": boolean
}
```

---

## HUB OUTPUT CONTRACT

```json
{
  "id": "",
  "name": "",
  "score": number,
  "reason": ""
}
```

---

## DETAIL CONTRACT

```json
{
  "id": "",
  "name": "",
  "type": "",
  "data": {},
  "related": []
}
```

---

## SCENE CONTRACT

```json
{
  "objects": [],
  "focus": "object_id"
}
```

---

## CONDITIONS CONTRACT

```json
{
  "visibility_score": number,
  "cloud_cover": number,
  "light_pollution": number
}
```

---

## RULES

* Hub owns ranking
* Engines provide candidates
* No raw data passed to UI
* All contracts must be deterministic
