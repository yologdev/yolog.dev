// Serves /media/* with HTTP Range support. Static assets answer a Range
// request with the whole file, and Safari (iOS above all) will not play a
// video unless the server answers ranges with 206 Partial Content.
// Every other path is served straight from the static assets, without this code.

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") return env.ASSETS.fetch(request);
    const asset = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
    const headers = new Headers(asset.headers);
    headers.set("accept-ranges", "bytes");
    if (!asset.ok || !range || (range[1] === "" && range[2] === "")) {
      return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers });
    }
    const bytes = await asset.arrayBuffer();
    const size = bytes.byteLength;
    // "a-b", "a-" (to the end) or "-n" (the last n bytes).
    const start = range[1] === "" ? Math.max(0, size - Number(range[2])) : Number(range[1]);
    const end = range[1] === "" || range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}`, "accept-ranges": "bytes" } });
    }
    headers.set("content-range", `bytes ${start}-${end}/${size}`);
    headers.set("content-length", String(end - start + 1));
    return new Response(request.method === "HEAD" ? null : bytes.slice(start, end + 1), { status: 206, headers });
  },
};
