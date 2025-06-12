
-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_class_id uuid REFERENCES public.user_classes(id),
ADD COLUMN access_profile_id uuid REFERENCES public.access_profiles(id),
ADD COLUMN manager_id uuid REFERENCES public.profiles(id);
