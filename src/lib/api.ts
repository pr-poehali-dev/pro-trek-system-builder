const URLS = {
  get_catalog:    'https://functions.poehali.dev/026ec31f-d990-4093-853c-a4e501035ffd',
  calculate_spec: 'https://functions.poehali.dev/8fa020e3-d338-49d4-876a-0f0853cdfda3',
  quotes_api:     'https://functions.poehali.dev/bca79fbc-c80c-4dab-b61f-d09e2ab0d23c',
  seed_demo:      'https://functions.poehali.dev/7349e236-2697-428f-bc85-04e593dcaa86',
};

export async function seedDemo() {
  const r = await fetch(URLS.seed_demo);
  return r.json();
}

export async function getCatalog(params: Record<string, string | number> = {}) {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const r = await fetch(`${URLS.get_catalog}?${q}`);
  return r.json();
}

export async function calculateSpec(body: object) {
  const r = await fetch(URLS.calculate_spec, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function getStatuses() {
  const r = await fetch(`${URLS.quotes_api}?statuses=1`);
  return r.json();
}

export async function getQuotes(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params);
  const r = await fetch(`${URLS.quotes_api}?${q}`);
  return r.json();
}

export async function createQuote(data: object) {
  const r = await fetch(URLS.quotes_api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateQuote(data: object) {
  const r = await fetch(URLS.quotes_api, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
