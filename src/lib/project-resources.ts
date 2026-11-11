const CHECKLIST_PREFIX = 'CHECKLIST::';
const RESOURCES_PREFIX = 'RESOURCES::';
const RESOURCES_SEPARATOR = `::${CHECKLIST_PREFIX}`;

export interface SplitProjectResources {
  resources: string;
  checklistJson: string | null;
  checklist: unknown | null;
}

function parseChecklist(json: string | null): unknown | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * The projects collection has no dedicated checklist column, so the checklist
 * lives inside `resources`. Older rows use `CHECKLIST::<json>`. Newer rows use
 * `RESOURCES::<base64(resources)>::CHECKLIST::<json>` so editing a project no
 * longer overwrites its checklist.
 */
export function splitProjectResources(raw: unknown): SplitProjectResources {
  if (typeof raw !== 'string' || raw.length === 0) {
    return { resources: '', checklistJson: null, checklist: null };
  }

  if (raw.startsWith(RESOURCES_PREFIX)) {
    const rest = raw.slice(RESOURCES_PREFIX.length);
    const marker = rest.indexOf(RESOURCES_SEPARATOR);
    const encoded = marker >= 0 ? rest.slice(0, marker) : rest;
    const checklistJson =
      marker >= 0
        ? rest.slice(marker + RESOURCES_SEPARATOR.length)
        : null;

    let resources = '';
    if (encoded) {
      try {
        resources = Buffer.from(encoded, 'base64').toString('utf8');
      } catch {
        resources = '';
      }
    }

    return {
      resources,
      checklistJson,
      checklist: parseChecklist(checklistJson),
    };
  }

  if (raw.startsWith(CHECKLIST_PREFIX)) {
    const checklistJson = raw.slice(CHECKLIST_PREFIX.length);
    return {
      resources: '',
      checklistJson,
      checklist: parseChecklist(checklistJson),
    };
  }

  return { resources: raw, checklistJson: null, checklist: null };
}

export function joinProjectResources(
  resources: string,
  checklistJson: string | null
): string {
  if (checklistJson) {
    if (!resources) {
      return `${CHECKLIST_PREFIX}${checklistJson}`;
    }
    const encoded = Buffer.from(resources, 'utf8').toString('base64');
    return `${RESOURCES_PREFIX}${encoded}${RESOURCES_SEPARATOR}${checklistJson}`;
  }

  return resources;
}
