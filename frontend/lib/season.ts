import type { Season } from "@/constants/theme";

export function getCurrentSeason(date = new Date()): Season {
    //Gets the months of the year
    const month = date.getMonth();

    if(month === 11 || month === 0 || month === 1) return 'summer';
    if(month >= 2 && month <= 4) return 'autumn';
    if(month >= 5 && month <= 7) return 'winter';
    return 'spring'
}