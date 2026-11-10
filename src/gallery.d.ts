declare module "virtual:gallery" {
  const items: { type: "image" | "video"; src: string; alt: string }[];
  export default items;
}