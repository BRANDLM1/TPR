-- Studio-editable icon registry for dynamic map markers.
CREATE TABLE "Icon" (
  "id"   SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "url"  TEXT NOT NULL
);
CREATE UNIQUE INDEX "Icon_name_key" ON "Icon"("name");
