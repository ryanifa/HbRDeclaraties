// GitHub-als-database: db/db.json in deze repo wordt gelezen én geschreven
// via de GitHub Contents API. Lezen kan zonder token (publieke repo);
// schrijven vereist een fine-grained token met Contents: read/write.

export const GH = {
  owner: 'ryanifa',
  repo: 'HbRDeclaraties',
  branch: 'main',
  path: 'db/db.json',
}

export const TOKEN_KEY = 'hbr-declaraties-gh-token'

const apiUrl = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.path}`

function headers(token, accept) {
  return {
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function loadDb(token) {
  const res = await fetch(`${apiUrl}?ref=${GH.branch}&cb=${Date.now()}`, {
    cache: 'no-store',
    headers: headers(token, 'application/vnd.github.raw+json'),
  })
  if (!res.ok) throw new Error(`GitHub-database laden mislukt (HTTP ${res.status})`)
  return res.json()
}

async function currentSha(token) {
  const res = await fetch(`${apiUrl}?ref=${GH.branch}&cb=${Date.now()}`, {
    cache: 'no-store',
    headers: headers(token, 'application/vnd.github+json'),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`SHA ophalen mislukt (HTTP ${res.status})`)
  return (await res.json()).sha
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return btoa(bin)
}

export async function saveDb(data, token, message = 'db: update vanuit demo-app') {
  const sha = await currentSha(token)
  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: headers(token, 'application/vnd.github+json'),
    body: JSON.stringify({
      message,
      branch: GH.branch,
      content: toBase64(JSON.stringify(data, null, 2) + '\n'),
      ...(sha ? { sha } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Opslaan naar GitHub mislukt (HTTP ${res.status})`)
  return res.json()
}
