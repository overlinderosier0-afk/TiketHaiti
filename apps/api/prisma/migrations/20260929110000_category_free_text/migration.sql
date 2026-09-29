-- Catégorie en texte libre : la table Category est supprimée, la catégorie
-- devient une colonne texte sur Event, remplie par l'admin (aucune liste imposée).
-- Les catégories existantes sont recopiées depuis l'ancienne table.

ALTER TABLE "events" ADD COLUMN "category" TEXT;

UPDATE "events" e SET "category" = c."name"
FROM "Category" c
WHERE e."category_id" = c."id";

ALTER TABLE "events" DROP CONSTRAINT "events_category_id_fkey";

ALTER TABLE "events" DROP COLUMN "category_id";

DROP TABLE "Category";
