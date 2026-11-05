/** Metro resolves `.db` files as assets (default asset extension); `require()` yields the numeric asset id. */
declare module "*.db" {
  const assetId: number;
  export default assetId;
}
