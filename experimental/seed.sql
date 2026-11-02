INSERT INTO article (heading, subheading, content)
VALUES (
    'Introduction to Biology',
    'Understanding Living Organisms',
    '# Introduction to Biology\n\nBiology is the scientific study of life and living organisms.'
);

INSERT INTO article (heading, subheading, content)
VALUES (
    'Cellular Biology',
    'The Building Blocks of Life',
    '# Cellular Biology\n\nCells are the fundamental structural and functional units of all living organisms.'
);

INSERT INTO article (heading, subheading, content)
VALUES (
    'Genetics and Heredity',
    'Understanding DNA',
    '# Genetics and Heredity\n\nGenetics explores how traits are inherited through DNA and passed from one generation to another.'
);
INSERT INTO tag (name, kind) VALUES
    ('Biology', 'topic'),
    ('Cell Biology', 'topic'),
    ('Genetics', 'topic'),
    ('Exam 2026', 'exam'),
    ('Chemistry', 'topic'),
    ('Physics', 'topic');

INSERT INTO relation_article_tag (article_id, tag_id)
SELECT article.id, tag.id
FROM article, tag
WHERE
    (article.heading = 'Introduction to Biology' AND tag.name IN ('Biology', 'Exam 2026'))
    OR (article.heading = 'Cellular Biology' AND tag.name IN ('Biology', 'Cell Biology'))
    OR (article.heading = 'Genetics and Heredity' AND tag.name IN ('Biology', 'Genetics', 'Exam 2026'));
