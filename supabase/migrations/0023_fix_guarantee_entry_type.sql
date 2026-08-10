-- Fix guarantee_entry_type enum: add values used by application code
-- Code uses 'accrue' (적립) and 'payout' (충당) but DB enum only had
-- 'accrual', 'release', 'refund', 'newbie_guarantee'

ALTER TYPE guarantee_entry_type ADD VALUE IF NOT EXISTS 'accrue';
ALTER TYPE guarantee_entry_type ADD VALUE IF NOT EXISTS 'payout';
