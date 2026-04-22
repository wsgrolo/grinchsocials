import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";
import type { Context } from "@netlify/functions";

const DEFAULT_VIDEO_ID = "jfKfPfyJRdk";
const OWNER_USER_ID = "69e817d536fadcaa1b1913c3";
const VIDEO_KEY = "current";
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const store = getStore({ name: "background-video", consistency: "strong" });

const extractVideoId = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();

  if (!trimmed) return null;
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);

    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (url.hostname.includes("youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId && YOUTUBE_ID_PATTERN.test(watchId)) return watchId;

      const pathParts = url.pathname.split("/").filter(Boolean);
      const embedOrShortsId = pathParts[1];
      if (
        (pathParts[0] === "embed" || pathParts[0] === "shorts") &&
        embedOrShortsId &&
        YOUTUBE_ID_PATTERN.test(embedOrShortsId)
      ) {
        return embedOrShortsId;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const readVideoId = async () => {
  const record = await store.get(VIDEO_KEY, { type: "json" });

  if (record && typeof record === "object" && "videoId" in record) {
    const maybeVideoId = extractVideoId((record as { videoId?: unknown }).videoId);
    if (maybeVideoId) return maybeVideoId;
  }

  return DEFAULT_VIDEO_ID;
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const [videoId, user] = await Promise.all([readVideoId(), getUser()]);
    return json({ videoId, canEdit: user?.id === OWNER_USER_ID });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, POST" },
    });
  }

  const user = await getUser();

  if (!user) {
    return json({ error: "Sign in is required." }, 401);
  }

  if (user.id !== OWNER_USER_ID) {
    return json({ error: "Only the site owner can update the background video." }, 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const nextVideoId = extractVideoId((body as { videoId?: unknown })?.videoId);

  if (!nextVideoId) {
    return json({ error: "Enter a valid YouTube URL or 11-character video ID." }, 400);
  }

  await store.setJSON(VIDEO_KEY, {
    videoId: nextVideoId,
    updatedAt: new Date().toISOString(),
    updatedBy: user.id,
  });

  return json({ videoId: nextVideoId, canEdit: true });
};
