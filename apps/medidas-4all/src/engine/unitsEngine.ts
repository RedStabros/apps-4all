export type Category =
  | "length"
  | "weight"
  | "temp"
  | "volume"
  | "speed"
  | "area"
  | "digital"
  | "time"
  | "pressure"
  | "energy";

export interface Unit {
  id: string;
  nameKey: string;
  symbol: string;
  category: Category;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

// BASE UNITS (100% offline math):
// Length: meters (m)
// Weight: grams (g)
// Temp: Celsius (°C)
// Volume: liters (L)
// Speed: m/s
// Area: square meters (m²)
// Digital: bytes (B)
// Time: seconds (s)
// Pressure: Pascals (Pa)
// Energy: Joules (J)

export const UNITS: Record<Category, Unit[]> = {
  length: [
    { id: "m", nameKey: "meter", symbol: "m", category: "length", toBase: (v) => v, fromBase: (v) => v },
    { id: "km", nameKey: "kilometer", symbol: "km", category: "length", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "cm", nameKey: "centimeter", symbol: "cm", category: "length", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { id: "mm", nameKey: "millimeter", symbol: "mm", category: "length", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: "mi", nameKey: "mile", symbol: "mi", category: "length", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    { id: "yd", nameKey: "yard", symbol: "yd", category: "length", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    { id: "ft", nameKey: "foot", symbol: "ft", category: "length", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { id: "in", nameKey: "inch", symbol: "in", category: "length", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  ],
  weight: [
    { id: "g", nameKey: "gram", symbol: "g", category: "weight", toBase: (v) => v, fromBase: (v) => v },
    { id: "kg", nameKey: "kilogram", symbol: "kg", category: "weight", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "mg", nameKey: "milligram", symbol: "mg", category: "weight", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: "lb", nameKey: "pound", symbol: "lb", category: "weight", toBase: (v) => v * 453.59237, fromBase: (v) => v / 453.59237 },
    { id: "oz", nameKey: "ounce", symbol: "oz", category: "weight", toBase: (v) => v * 28.34952, fromBase: (v) => v / 28.34952 },
    { id: "t", nameKey: "ton", symbol: "t", category: "weight", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
  ],
  temp: [
    { id: "c", nameKey: "celsius", symbol: "°C", category: "temp", toBase: (v) => v, fromBase: (v) => v },
    { id: "f", nameKey: "fahrenheit", symbol: "°F", category: "temp", toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
    { id: "k", nameKey: "kelvin", symbol: "K", category: "temp", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  volume: [
    { id: "l", nameKey: "liter", symbol: "L", category: "volume", toBase: (v) => v, fromBase: (v) => v },
    { id: "ml", nameKey: "milliliter", symbol: "ml", category: "volume", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: "gal", nameKey: "gallon", symbol: "gal", category: "volume", toBase: (v) => v * 3.785411784, fromBase: (v) => v / 3.785411784 },
    { id: "floz", nameKey: "fluid_ounce", symbol: "fl oz", category: "volume", toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    { id: "cup", nameKey: "cup", symbol: "cup", category: "volume", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
    { id: "pt", nameKey: "pint", symbol: "pt", category: "volume", toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
  ],
  speed: [
    { id: "kmh", nameKey: "km_per_hour", symbol: "km/h", category: "speed", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    { id: "mph", nameKey: "miles_per_hour", symbol: "mph", category: "speed", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    { id: "ms", nameKey: "meter_per_sec", symbol: "m/s", category: "speed", toBase: (v) => v, fromBase: (v) => v },
    { id: "kn", nameKey: "knot", symbol: "kn", category: "speed", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
  ],
  area: [
    { id: "m2", nameKey: "square_meter", symbol: "m²", category: "area", toBase: (v) => v, fromBase: (v) => v },
    { id: "km2", nameKey: "square_km", symbol: "km²", category: "area", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    { id: "ha", nameKey: "hectare", symbol: "ha", category: "area", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    { id: "acre", nameKey: "acre", symbol: "ac", category: "area", toBase: (v) => v * 4046.856, fromBase: (v) => v / 4046.856 },
    { id: "ft2", nameKey: "square_foot", symbol: "ft²", category: "area", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    { id: "in2", nameKey: "square_inch", symbol: "in²", category: "area", toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
  ],
  digital: [
    { id: "b", nameKey: "byte", symbol: "B", category: "digital", toBase: (v) => v, fromBase: (v) => v },
    { id: "kb", nameKey: "kilobyte", symbol: "KB", category: "digital", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    { id: "mb", nameKey: "megabyte", symbol: "MB", category: "digital", toBase: (v) => v * 1024 ** 2, fromBase: (v) => v / 1024 ** 2 },
    { id: "gb", nameKey: "gigabyte", symbol: "GB", category: "digital", toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
    { id: "tb", nameKey: "terabyte", symbol: "TB", category: "digital", toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 },
    { id: "pb", nameKey: "petabyte", symbol: "PB", category: "digital", toBase: (v) => v * 1024 ** 5, fromBase: (v) => v / 1024 ** 5 },
  ],
  time: [
    { id: "s", nameKey: "second", symbol: "s", category: "time", toBase: (v) => v, fromBase: (v) => v },
    { id: "min", nameKey: "minute", symbol: "min", category: "time", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    { id: "h", nameKey: "hour", symbol: "h", category: "time", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    { id: "d", nameKey: "day", symbol: "d", category: "time", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    { id: "wk", nameKey: "week", symbol: "wk", category: "time", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
  ],
  pressure: [
    { id: "psi", nameKey: "psi", symbol: "PSI", category: "pressure", toBase: (v) => v * 6894.757, fromBase: (v) => v / 6894.757 },
    { id: "bar", nameKey: "bar", symbol: "bar", category: "pressure", toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
    { id: "kpa", nameKey: "kilopascal", symbol: "kPa", category: "pressure", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "pa", nameKey: "pascal", symbol: "Pa", category: "pressure", toBase: (v) => v, fromBase: (v) => v },
    { id: "atm", nameKey: "atmosphere", symbol: "atm", category: "pressure", toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
  ],
  energy: [
    { id: "kcal", nameKey: "kilocalorie", symbol: "kcal", category: "energy", toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
    { id: "cal", nameKey: "calorie", symbol: "cal", category: "energy", toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
    { id: "kj", nameKey: "kilojoule", symbol: "kJ", category: "energy", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: "j", nameKey: "joule", symbol: "J", category: "energy", toBase: (v) => v, fromBase: (v) => v },
    { id: "kwh", nameKey: "kilowatt_hour", symbol: "kWh", category: "energy", toBase: (v) => v * 3600000, fromBase: (v) => v / 3600000 },
  ],
};

export const convert = (
  val: number,
  fromId: string,
  toId: string,
  category: Category,
): number => {
  const cats = UNITS[category];
  const fromUnit = cats.find((u) => u.id === fromId);
  const toUnit = cats.find((u) => u.id === toId);
  if (!fromUnit || !toUnit) return 0;

  const baseVal = fromUnit.toBase(val);
  return toUnit.fromBase(baseVal);
};
