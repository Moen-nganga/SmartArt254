import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, getUserId, verifyToken } from "./_session.js";

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_PICTURE_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const PICTURE_TYPES = ALLOWED_TYPES.filter((t) => t.startsWith("image/"));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await handleUpload({
      request: req,
      body: req.body as HandleUploadBody,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const userId = getUserId(req) ?? (clientPayload ? verifyToken(clientPayload) : null);
        if (!userId) throw new Error("Please sign in.");
        const isChat = pathname.startsWith(`chat/${userId}/`);
        const isHighlight = pathname.startsWith(`highlights/${userId}/`);
        if (!isChat && !isHighlight) throw new Error("Invalid upload path.");
        return {
          allowedContentTypes: isHighlight ? PICTURE_TYPES : ALLOWED_TYPES,
          maximumSizeInBytes: isHighlight ? MAX_PICTURE_BYTES : MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : "Upload failed." });
  }
}