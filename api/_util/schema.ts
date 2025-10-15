export function validateSuggestions(json: any) {
  const ok = json && 
    json.headlines && Array.isArray(json.headlines) && 
    json.hooks && Array.isArray(json.hooks);
  return ok ? json : null;
}

export function validateTopics(json: any) {
  const ok = json && 
    json.topics && Array.isArray(json.topics) &&
    json.topics.every((t: any) => t.title && t.angle && t.hook);
  return ok ? json : null;
}

export function validatePricing(json: any) {
  const ok = json && 
    json.suggest_cents && typeof json.suggest_cents === 'number' &&
    json.reasoning && typeof json.reasoning === 'string';
  return ok ? json : null;
}
