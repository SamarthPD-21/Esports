/** A file in public/, with the site's base path (next/link adds it; plain <a> doesn't). */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
