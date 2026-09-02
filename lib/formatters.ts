export const formatCalories = (value: number, complete = true) => complete ? `约 ${Math.round(value)} kcal` : "估算不完整";
export const formatProtein = (value: number, complete = true) => complete ? `约 ${value.toFixed(1)} g` : "估算不完整";
export const formatCost = (value: number, complete = true) => complete ? `预计 ¥${value.toFixed(1)}` : "估算不完整";
export const formatTime = (minutes: number) => `${minutes} 分钟`;
