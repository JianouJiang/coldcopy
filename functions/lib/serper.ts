// Serper.dev search API helper
// Compatible with Cloudflare Workers

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchCompanies(
  query: string,
  apiKey: string,
  num: number = 20
): Promise<SearchResult[]> {
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num }),
    });

    if (!res.ok) {
      console.error(`Serper search failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const data: any = await res.json();
    const organic: any[] = data.organic || [];

    return organic.map((item) => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
    }));
  } catch (err) {
    console.error('Serper search error:', err);
    return [];
  }
}

export type { SearchResult };
