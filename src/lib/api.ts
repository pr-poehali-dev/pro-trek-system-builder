const URLS = {
  parse_catalog:   'https://functions.poehali.dev/5ecc5959-6a15-4d77-bee7-1b2089b154e7',
  get_catalog:     'https://functions.poehali.dev/026ec31f-d990-4093-853c-a4e501035ffd',
  calculate_spec:  'https://functions.poehali.dev/8fa020e3-d338-49d4-876a-0f0853cdfda3',
  projects_api:    'https://functions.poehali.dev/615d3407-9de2-40aa-b687-b75863edaf66',
};

export async function parseCatalog(supplierCode = 'arlight', limit = 0) {
  const url = `${URLS.parse_catalog}?supplier_code=${supplierCode}&limit=${limit}`;
  const r = await fetch(url);
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

export async function getProject(sessionId: string) {
  const r = await fetch(`${URLS.projects_api}?session_id=${sessionId}`);
  return r.json();
}

export async function saveProject(data: object) {
  const r = await fetch(URLS.projects_api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateProject(data: object) {
  const r = await fetch(URLS.projects_api, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
