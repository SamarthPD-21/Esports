import { revalidateTag } from "next/cache";
import { SHEET_TAG } from "@/lib/data";

// Force an immediate refresh from the Google Sheet instead of waiting up to a minute.
//   curl -X POST "https://<site>/api/revalidate?secret=$REVALIDATE_SECRET"
export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag(SHEET_TAG, { expire: 0 });
  return Response.json({ ok: true, revalidated: SHEET_TAG });
}
