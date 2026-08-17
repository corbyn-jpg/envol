// EXIF timestamps look like "2026:08:17 06:42:11" — colons in the date portion, which Date can't parse, so they have to become dashes first.
export function parseExifDate(exif: any): Date | null {
  const raw = exif?.DateTimeOriginal ?? exif?.DateTime;
  if (typeof raw !== 'string') return null;

  const [datePart, timePart] = raw.split(' ');
  if (!datePart || !timePart) return null;

  const parsed = new Date(`${datePart.replace(/:/g, '-')}T${timePart}`);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function wasTakenToday(takenAt: Date): boolean {
  const now = new Date();
  return (
    takenAt.getDate() === now.getDate() &&
    takenAt.getMonth() === now.getMonth() &&
    takenAt.getFullYear() === now.getFullYear()
  );
}