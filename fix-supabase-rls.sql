-- Enable RLS on all storage-related tables
ALTER TABLE public.active_storage_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_storage_blobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_storage_variant_records ENABLE ROW LEVEL SECURITY;

-- Create policies for active_storage_attachments
CREATE POLICY "Public read access" ON public.active_storage_attachments
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated uploads" ON public.active_storage_attachments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated updates" ON public.active_storage_attachments
    FOR UPDATE USING (true);

-- Create policies for active_storage_blobs  
CREATE POLICY "Public read access" ON public.active_storage_blobs
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated uploads" ON public.active_storage_blobs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated updates" ON public.active_storage_blobs
    FOR UPDATE USING (true);

-- Create policies for active_storage_variant_records
CREATE POLICY "Public read access" ON public.active_storage_variant_records
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated uploads" ON public.active_storage_variant_records
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated updates" ON public.active_storage_variant_records
    FOR UPDATE USING (true);