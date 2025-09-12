-- Add new columns to journal_entries table for enhanced trading journal functionality

-- Execution & Metrics
ALTER TABLE public.journal_entries 
ADD COLUMN commission NUMERIC,
ADD COLUMN swap NUMERIC,
ADD COLUMN hold_time_minutes INTEGER,
ADD COLUMN execution_method TEXT,

-- Trader Psychology  
ADD COLUMN confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
ADD COLUMN emotional_state TEXT,
ADD COLUMN stress_level TEXT,

-- Post-Trade Reflection
ADD COLUMN what_went_well TEXT,
ADD COLUMN what_to_improve TEXT,
ADD COLUMN post_screenshots_urls TEXT[],
ADD COLUMN trade_rating INTEGER CHECK (trade_rating >= 1 AND trade_rating <= 5),

-- Advanced Tagging
ADD COLUMN market_volatility TEXT,

-- Automation & Review
ADD COLUMN auto_review_enabled BOOLEAN DEFAULT false,
ADD COLUMN review_date DATE,
ADD COLUMN related_entry_ids UUID[];