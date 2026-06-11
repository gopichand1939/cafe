ALTER TABLE IF EXISTS addons_eligible_for_items
  DROP COLUMN IF EXISTS min_selection,
  DROP COLUMN IF EXISTS max_selection;

ALTER TABLE IF EXISTS item_addons
  DROP COLUMN IF EXISTS min_select,
  DROP COLUMN IF EXISTS max_select;
