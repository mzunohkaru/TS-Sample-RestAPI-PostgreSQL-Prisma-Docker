SELECT
  p.id,
  u.name,
  p.title
FROM
  (
    users u
    JOIN posts p ON ((u.id = p."userId"))
  );