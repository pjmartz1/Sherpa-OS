export function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TKT-${timestamp}-${random}`.toUpperCase();
}

export function generateEpicId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `EPC-${timestamp}-${random}`.toUpperCase();
}

export function generateStoryId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `STY-${timestamp}-${random}`.toUpperCase();
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] || '';
}