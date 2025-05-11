DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_visibility AS ENUM ('public', 'logged_in', 'subscribers');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 1. Posts Table
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language VARCHAR(10) NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    description TEXT,
    -- URL to the featured image stored in R2/S3
    featured_image_url TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    status post_status NOT NULL DEFAULT 'draft',
    visibility post_visibility NOT NULL DEFAULT 'public',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT posts_language_slug_unique UNIQUE (language, slug)
);

CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_visibility ON public.posts(visibility);
CREATE INDEX idx_posts_published_at ON public.posts(published_at);
CREATE INDEX idx_posts_language_status ON public.posts(language, status);
CREATE INDEX idx_posts_is_pinned ON public.posts(is_pinned) WHERE is_pinned = true;

CREATE OR REPLACE FUNCTION public.handle_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
        NEW.published_at = now();
    ELSIF NEW.status != 'published' THEN
        NEW.published_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_published_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_published_at();

CREATE TRIGGER insert_posts_published_at
BEFORE INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_published_at();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 2. Tags Table
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT tags_name_unique UNIQUE (name)
);

CREATE INDEX idx_tags_name ON public.tags(name);


-- 3. Post_Tags Linking Table (Many-to-Many)
CREATE TABLE public.post_tags (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,

    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_tag_id ON public.post_tags(tag_id);
CREATE INDEX idx_post_tags_post_id ON public.post_tags(post_id);


-- Enable RLS for the tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published, public posts
CREATE POLICY "Allow public read access to published posts" ON public.posts
    FOR SELECT USING (status = 'published' AND visibility = 'public');

-- Allow logged-in users read access to published, logged_in posts
CREATE POLICY "Allow logged-in users read access" ON public.posts
    FOR SELECT USING (status = 'published' AND visibility = 'logged_in' AND auth.role() = 'authenticated');

-- Allow authors to read their own posts regardless of status/visibility
CREATE POLICY "Allow authors to read their own posts" ON public.posts
    FOR SELECT USING (auth.uid() = author_id);

-- Allow authors to manage their own drafts (adjust permissions as needed)
CREATE POLICY "Allow authors to update their own drafts" ON public.posts
    FOR UPDATE USING (auth.uid() = author_id AND status = 'draft')
    WITH CHECK (auth.uid() = author_id);

-- Allow authors to delete their own drafts
CREATE POLICY "Allow authors to delete their own drafts" ON public.posts
    FOR DELETE USING (auth.uid() = author_id AND status = 'draft');


-- Tags & Post_Tags Policies
-- Allow public read access to tags
CREATE POLICY "Allow public read access to tags" ON public.tags
    FOR SELECT USING (true);

-- Allow public read access to post_tags links
CREATE POLICY "Allow public read access to post_tags" ON public.post_tags
    FOR SELECT USING (true);
