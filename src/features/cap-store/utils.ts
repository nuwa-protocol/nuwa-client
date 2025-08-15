import { type Cap, CapSchema } from '@/shared/types/cap';
import type { RemoteCap } from './types';

// Cap type guards and utility functions
export function validateCapContent(content: unknown): content is Cap {
  try {
    CapSchema.parse(content);
    return true;
  } catch {
    return false;
  }
}

export function parseCapContent(content: unknown): Cap {
  return CapSchema.parse(content);
}

/**
 *  sort the caps by metadata, prioritize the caps with complete metadata, then sort by the newness
 */
export function sortCapsByMetadata(
  caps: (Cap | RemoteCap)[],
): (Cap | RemoteCap)[] {
  return [...caps].sort((a, b) => {
    // 1. prioritize the caps with complete metadata
    const aCompleteness = getCapCompleteness(a);
    const bCompleteness = getCapCompleteness(b);

    if (aCompleteness !== bCompleteness) {
      return bCompleteness - aCompleteness; // the caps with complete metadata are sorted first
    }

    // 2. if the completeness is the same, sort by the newness (newer caps are sorted first)
    const aTimestamp = getCapTimestamp(a);
    const bTimestamp = getCapTimestamp(b);

    return bTimestamp - aTimestamp; // the caps with newer timestamp are sorted first
  });
}

/**
 * calculate the completeness score of the cap
 * the higher the score, the more complete the cap is
 */
function getCapCompleteness(cap: Cap | RemoteCap): number {
  let score = 0;

  // the basic information completeness
  if (cap.metadata.description) score += cap.metadata.displayName.length / 20;
  if (cap.metadata.thumbnail) score += 20;
  if (cap.metadata.tags && cap.metadata.tags.length > 0) score += 10;
  if (cap.metadata.displayName.includes('test')) score -= 20;
  if (cap.metadata.description.includes('test')) score -= 20;

  return score;
}

/**
 * get the timestamp of the cap for sorting
 * prioritize the last used time, then the submitted time
 */
function getCapTimestamp(cap: Cap | RemoteCap): number {
  // check if the cap is an InstalledCap (has lastUsedAt property)
  if ('lastUsedAt' in cap && typeof cap.lastUsedAt === 'number') {
    return cap.lastUsedAt;
  }

  // use the submitted time (all caps have this property)
  if (cap.metadata.submittedAt) {
    return cap.metadata.submittedAt;
  }

  // return 0 by default (to ensure stable sorting)
  return 0;
}
