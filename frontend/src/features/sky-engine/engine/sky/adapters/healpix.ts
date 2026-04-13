const UTAB = [
  0x0000, 0x0001, 0x0004, 0x0005, 0x0010, 0x0011, 0x0014, 0x0015,
  0x0040, 0x0041, 0x0044, 0x0045, 0x0050, 0x0051, 0x0054, 0x0055,
  0x0100, 0x0101, 0x0104, 0x0105, 0x0110, 0x0111, 0x0114, 0x0115,
  0x0140, 0x0141, 0x0144, 0x0145, 0x0150, 0x0151, 0x0154, 0x0155,
  0x0400, 0x0401, 0x0404, 0x0405, 0x0410, 0x0411, 0x0414, 0x0415,
  0x0440, 0x0441, 0x0444, 0x0445, 0x0450, 0x0451, 0x0454, 0x0455,
  0x0500, 0x0501, 0x0504, 0x0505, 0x0510, 0x0511, 0x0514, 0x0515,
  0x0540, 0x0541, 0x0544, 0x0545, 0x0550, 0x0551, 0x0554, 0x0555,
  0x1000, 0x1001, 0x1004, 0x1005, 0x1010, 0x1011, 0x1014, 0x1015,
  0x1040, 0x1041, 0x1044, 0x1045, 0x1050, 0x1051, 0x1054, 0x1055,
  0x1100, 0x1101, 0x1104, 0x1105, 0x1110, 0x1111, 0x1114, 0x1115,
  0x1140, 0x1141, 0x1144, 0x1145, 0x1150, 0x1151, 0x1154, 0x1155,
  0x1400, 0x1401, 0x1404, 0x1405, 0x1410, 0x1411, 0x1414, 0x1415,
  0x1440, 0x1441, 0x1444, 0x1445, 0x1450, 0x1451, 0x1454, 0x1455,
  0x1500, 0x1501, 0x1504, 0x1505, 0x1510, 0x1511, 0x1514, 0x1515,
  0x1540, 0x1541, 0x1544, 0x1545, 0x1550, 0x1551, 0x1554, 0x1555,
  0x4000, 0x4001, 0x4004, 0x4005, 0x4010, 0x4011, 0x4014, 0x4015,
  0x4040, 0x4041, 0x4044, 0x4045, 0x4050, 0x4051, 0x4054, 0x4055,
  0x4100, 0x4101, 0x4104, 0x4105, 0x4110, 0x4111, 0x4114, 0x4115,
  0x4140, 0x4141, 0x4144, 0x4145, 0x4150, 0x4151, 0x4154, 0x4155,
  0x4400, 0x4401, 0x4404, 0x4405, 0x4410, 0x4411, 0x4414, 0x4415,
  0x4440, 0x4441, 0x4444, 0x4445, 0x4450, 0x4451, 0x4454, 0x4455,
  0x4500, 0x4501, 0x4504, 0x4505, 0x4510, 0x4511, 0x4514, 0x4515,
  0x4540, 0x4541, 0x4544, 0x4545, 0x4550, 0x4551, 0x4554, 0x4555,
  0x5000, 0x5001, 0x5004, 0x5005, 0x5010, 0x5011, 0x5014, 0x5015,
  0x5040, 0x5041, 0x5044, 0x5045, 0x5050, 0x5051, 0x5054, 0x5055,
  0x5100, 0x5101, 0x5104, 0x5105, 0x5110, 0x5111, 0x5114, 0x5115,
  0x5140, 0x5141, 0x5144, 0x5145, 0x5150, 0x5151, 0x5154, 0x5155,
  0x5400, 0x5401, 0x5404, 0x5405, 0x5410, 0x5411, 0x5414, 0x5415,
  0x5440, 0x5441, 0x5444, 0x5445, 0x5450, 0x5451, 0x5454, 0x5455,
  0x5500, 0x5501, 0x5504, 0x5505, 0x5510, 0x5511, 0x5514, 0x5515,
  0x5540, 0x5541, 0x5544, 0x5545, 0x5550, 0x5551, 0x5554, 0x5555,
]

const CTAB = [
  0, 1, 256, 257, 2, 3, 258, 259, 8, 9, 264, 265, 10, 11, 266, 267,
  4, 5, 260, 261, 6, 7, 262, 263, 12, 13, 268, 269, 14, 15, 270, 271,
  512, 513, 768, 769, 514, 515, 770, 771, 520, 521, 776, 777, 522, 523, 778, 779,
  516, 517, 772, 773, 518, 519, 774, 775, 524, 525, 780, 781, 526, 527, 782, 783,
  16, 17, 272, 273, 18, 19, 274, 275, 24, 25, 280, 281, 26, 27, 282, 283,
  20, 21, 276, 277, 22, 23, 278, 279, 28, 29, 284, 285, 30, 31, 286, 287,
  528, 529, 784, 785, 530, 531, 786, 787, 536, 537, 792, 793, 538, 539, 794, 795,
  532, 533, 788, 789, 534, 535, 790, 791, 540, 541, 796, 797, 542, 543, 798, 799,
  1024, 1025, 1280, 1281, 1026, 1027, 1282, 1283, 1032, 1033, 1288, 1289, 1034, 1035, 1290, 1291,
  1028, 1029, 1284, 1285, 1030, 1031, 1286, 1287, 1036, 1037, 1292, 1293, 1038, 1039, 1294, 1295,
  1536, 1537, 1792, 1793, 1538, 1539, 1794, 1795, 1544, 1545, 1800, 1801, 1546, 1547, 1802, 1803,
  1540, 1541, 1796, 1797, 1542, 1543, 1798, 1799, 1548, 1549, 1804, 1805, 1550, 1551, 1806, 1807,
  1040, 1041, 1296, 1297, 1042, 1043, 1298, 1299, 1048, 1049, 1304, 1305, 1050, 1051, 1306, 1307,
  1044, 1045, 1300, 1301, 1046, 1047, 1302, 1303, 1052, 1053, 1308, 1309, 1054, 1055, 1310, 1311,
  1552, 1553, 1808, 1809, 1554, 1555, 1810, 1811, 1560, 1561, 1816, 1817, 1562, 1563, 1818, 1819,
  1556, 1557, 1812, 1813, 1558, 1559, 1814, 1815, 1564, 1565, 1820, 1821, 1566, 1567, 1822, 1823,
]

const FACES: readonly [number, number][] = [
  [1, 0], [3, 0], [5, 0], [7, 0],
  [0, -1], [2, -1], [4, -1], [6, -1],
  [1, -2], [3, -2], [5, -2], [7, -2],
]

function fmodulo(value: number, divisor: number) {
  if (value >= 0) {
    return value < divisor ? value : value % divisor
  }

  const wrapped = (value % divisor) + divisor
  return wrapped === divisor ? 0 : wrapped
}

function spreadBits(value: number) {
  return UTAB[value & 0xff] | (UTAB[(value >> 8) & 0xff] << 16)
}

function healpixNestToXYF(nside: number, pix: number) {
  const pixelsPerFace = nside * nside
  const face = Math.floor(pix / pixelsPerFace)
  const facePixel = pix & (pixelsPerFace - 1)
  const rawX = (facePixel & 0x5555) | ((facePixel & 0x55550000) >> 15)
  const rawY = ((facePixel >> 1) & 0x5555) | (((facePixel >> 1) & 0x55550000) >> 15)
  const ix = CTAB[rawX & 0xff] | (CTAB[rawX >> 8] << 4)
  const iy = CTAB[rawY & 0xff] | (CTAB[rawY >> 8] << 4)

  return { face, ix, iy }
}

function healpixXYToZPhi(x: number, y: number) {
  if (Math.abs(y) > Math.PI / 4) {
    const sigma = 2 - Math.abs((y * 4) / Math.PI)
    const z = Math.sign(y) * (1 - (sigma * sigma) / 3)
    const xc = -Math.PI + (2 * Math.floor(((x + Math.PI) * 4) / (2 * Math.PI)) + 1) * (Math.PI / 4)
    const phi = sigma ? xc + (x - xc) / sigma : x
    return { z, phi }
  }

  return {
    phi: x,
    z: (y * 8) / (Math.PI * 3),
  }
}

function healpixXYToAngles(x: number, y: number) {
  const { z, phi } = healpixXYToZPhi(x, y)

  return {
    theta: Math.acos(z),
    phi,
  }
}

function ang2pixNestZPhi(nside: number, z: number, phi: number) {
  const za = Math.abs(z)
  const tt = fmodulo(phi, 2 * Math.PI) * (2 / Math.PI)
  let face = 0
  let ix = 0
  let iy = 0

  if (za <= 2 / 3) {
    const temp1 = nside * (0.5 + tt)
    const temp2 = nside * (z * 0.75)
    const jp = Math.trunc(temp1 - temp2)
    const jm = Math.trunc(temp1 + temp2)
    const ifp = Math.trunc(jp / nside)
    const ifm = Math.trunc(jm / nside)
    face = ifp === ifm ? (ifp | 4) : (ifp < ifm ? ifp : ifm + 8)
    ix = jm & (nside - 1)
    iy = nside - (jp & (nside - 1)) - 1
  } else {
    let ntt = Math.trunc(tt)
    if (ntt >= 4) {
      ntt = 3
    }

    const tp = tt - ntt
    const tmp = nside * Math.sqrt(3 * (1 - za))
    let jp = Math.trunc(tp * tmp)
    let jm = Math.trunc((1 - tp) * tmp)

    if (jp >= nside) {
      jp = nside - 1
    }

    if (jm >= nside) {
      jm = nside - 1
    }

    if (z >= 0) {
      face = ntt
      ix = nside - jm - 1
      iy = nside - jp - 1
    } else {
      face = ntt + 8
      ix = jp
      iy = jm
    }
  }

  return face * nside * nside + spreadBits(ix) + (spreadBits(iy) << 1)
}

export function healpixPixToRaDec(order: number, pix: number) {
  const nside = 1 << order
  const { face, ix, iy } = healpixNestToXYF(nside, pix)
  const x = (FACES[face][0] + (ix - iy) / nside) * (Math.PI / 4)
  const y = (FACES[face][1] + (ix + iy + 1) / nside) * (Math.PI / 4)
  const { theta, phi } = healpixXYToAngles(x, y)
  const raDeg = ((((phi * 180) / Math.PI) % 360) + 360) % 360
  const decDeg = 90 - (theta * 180) / Math.PI

  return { raDeg, decDeg }
}

export function healpixAngToPix(order: number, raDeg: number, decDeg: number) {
  const nside = 1 << order
  const theta = ((90 - decDeg) * Math.PI) / 180
  const phi = ((((raDeg % 360) + 360) % 360) * Math.PI) / 180

  return ang2pixNestZPhi(nside, Math.cos(theta), phi)
}
