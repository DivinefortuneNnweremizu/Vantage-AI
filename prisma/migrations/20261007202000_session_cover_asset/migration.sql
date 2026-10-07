-- Replace the unused thumbnailPath text column with a reference to the cover asset.
-- Nothing wrote to thumbnailPath, so no data is lost.
ALTER TABLE "DesignSession" DROP COLUMN "thumbnailPath",
ADD COLUMN "coverAssetId" UUID;
