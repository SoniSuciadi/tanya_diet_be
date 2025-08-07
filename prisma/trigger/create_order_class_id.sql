CREATE OR REPLACE FUNCTION generate_order_class_id()
RETURNS TRIGGER AS $$
DECLARE
    max_order_id integer;
BEGIN
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(order_id, '^\D*(\d+)$', '\1') AS integer)), 0)
    INTO max_order_id
    FROM order_class;

    NEW.order_id := 'OR-DIE-CLS-' || (max_order_id + 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_id
BEFORE INSERT ON order_class
FOR EACH ROW
EXECUTE FUNCTION generate_order_class_id();
