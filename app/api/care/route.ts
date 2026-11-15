import { CareError, getCareState } from "@/lib/care";
import { idSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
  const patient = new URL(request.url).searchParams.get("patient") ?? undefined;
  if (patient && !idSchema.safeParse(patient).success) return Response.json({ message: "Invalid care ID." }, { status: 400, headers });
  try { return Response.json(await getCareState(patient), { headers }); }
  catch (error) {
    return Response.json({ message: error instanceof CareError ? error.message : "Care records are temporarily unavailable." }, { status: error instanceof CareError ? error.status : 503, headers });
  }
}
