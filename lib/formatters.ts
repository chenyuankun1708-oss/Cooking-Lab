const usable = (value: number, complete: boolean) => complete && Number.isFinite(value) && value >= 0;

export const formatCalories = (value: number, complete = true) => usable(value, complete) ? `约 ${Math.round(value)} kcal` : "估算不完整";
export const formatProtein = (value: number, complete = true) => usable(value, complete) ? `约 ${value.toFixed(1)} g` : "估算不完整";
export const formatMacro = (value: number, complete = true) => usable(value, complete) ? `约 ${value.toFixed(1)} g` : "估算不完整";
export const formatSodium = (value: number, complete = true) => usable(value, complete) ? `约 ${Math.round(value)} mg` : "估算不完整";
export const formatCost = (value: number, complete = true) => usable(value, complete) ? `预计 ¥${value.toFixed(1)}` : "估算不完整";
export const formatTime = (minutes: number) => usable(minutes, true) ? `${minutes} 分钟` : "时间未知";
export const formatMass = (grams: number) => usable(grams, true) ? `${Number.isInteger(grams) ? grams : grams.toFixed(1)} 克` : "用量未知";
export const formatGrams = (grams: number) => usable(grams, true) ? `${grams.toFixed(1)} g` : "用量未知";
