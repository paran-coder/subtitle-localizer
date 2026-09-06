import part00 from "@/lib/og-image/part-00";
import part01 from "@/lib/og-image/part-01";
import part02 from "@/lib/og-image/part-02";
import part03 from "@/lib/og-image/part-03";
import part04 from "@/lib/og-image/part-04";
import part05 from "@/lib/og-image/part-05";

const OG_IMAGE = Buffer.from([part00, part01, part02, part03, part04, part05].join(""), "base64");

export async function GET() {
  return new Response(OG_IMAGE, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(OG_IMAGE.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
