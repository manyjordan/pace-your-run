-- Add onboarding-related columns to profiles table
alter table profiles
  add column if not exists onboarding_completed boolean default false,
  add column if not exists gender text,
  add column if not exists date_of_birth date,
  add column if not exists first_name text;
