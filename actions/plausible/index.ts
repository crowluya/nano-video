"use server"

interface PlausibleApiResponse {
  results: {
    metrics: number[]
    dimensions: unknown[]
  }[]
}

const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY
const PLAUSIBLE_SITE_ID = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
const PLAUSIBLE_URL = process.env.PLAUSIBLE_URL

async function fetchPlausibleMetric(
  metric: "visitors" | "pageviews",
  date_range: string | [string, string],
  revalidate: number,
  errorContext: string,
): Promise<number | null> {
  if (!PLAUSIBLE_API_KEY) {
    // console.error("Plausible API key (PLAUSIBLE_API_KEY) is not configured.")
    return null
  }
  if (!PLAUSIBLE_SITE_ID) {
    // console.error(
    //   "Plausible Site ID (PLAUSIBLE_SITE_ID) for server-side API calls is not configured.",
    // )
    return null
  }

  try {
    const response = await fetch(`${PLAUSIBLE_URL}/api/v2/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_id: PLAUSIBLE_SITE_ID,
        metrics: [metric],
        date_range: date_range,
      }),
      next: { revalidate },
    })

    if (!response.ok) {
      console.error(
        `Error fetching Plausible stats (${errorContext}): ${response.status} ${response.statusText}`,
        await response.text(),
      )
      return null
    }

    const data = (await response.json()) as PlausibleApiResponse

    if (
      Array.isArray(data.results) &&
      data.results.length > 0 &&
      data.results[0].metrics &&
      Array.isArray(data.results[0].metrics) &&
      typeof data.results[0].metrics[0] === "number"
    ) {
      return data.results[0].metrics[0]
    }

    console.error(
      `Unexpected Plausible API response structure for ${errorContext}:`,
      JSON.stringify(data, null, 2),
    )
    return null
  } catch (error) {
    console.error(`Error connecting to Plausible API (${errorContext}):`, error)
    return null
  }
}

export async function getLast24hVisitors(): Promise<number | null> {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const date_range: [string, string] = [
    yesterday.toISOString(),
    now.toISOString(),
  ]
  return fetchPlausibleMetric("visitors", date_range, 600, "24h visitors") // 10 min cache
}

export async function getLast7DaysVisitors(): Promise<number | null> {
  return fetchPlausibleMetric("visitors", "7d", 3600, "7 days visitors") // 1 hour cache
}

export async function getLast30DaysVisitors(): Promise<number | null> {
  return fetchPlausibleMetric("visitors", "30d", 21600, "30 days visitors") // 6 hours cache
}

export async function getLast30DaysPageviews(): Promise<number | null> {
  return fetchPlausibleMetric("pageviews", "30d", 21600, "30 days pageviews") // 6 hours cache
}
