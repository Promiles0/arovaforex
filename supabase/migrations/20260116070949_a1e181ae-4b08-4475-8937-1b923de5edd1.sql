-- Add subscription tier to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free' 
CHECK (subscription_tier IN ('free', 'premium', 'professional'));

-- Create AI Knowledge Base table
CREATE TABLE ai_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intent VARCHAR(100) NOT NULL,
  keywords TEXT[] NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('platform', 'trading', 'general')),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for efficient searching
CREATE INDEX idx_knowledge_keywords ON ai_knowledge_base USING GIN(keywords);
CREATE INDEX idx_knowledge_active ON ai_knowledge_base(active) WHERE active = true;
CREATE INDEX idx_knowledge_category ON ai_knowledge_base(category);

-- Create Chat Sessions table (for Professional users)
CREATE TABLE assistant_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0
);

CREATE INDEX idx_sessions_user ON assistant_chat_sessions(user_id);

-- Create Chat Messages table
CREATE TABLE assistant_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES assistant_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  sender VARCHAR(20) CHECK (sender IN ('user', 'assistant')) NOT NULL,
  matched_intent VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON assistant_chat_messages(session_id);
CREATE INDEX idx_messages_user ON assistant_chat_messages(user_id);

-- Enable RLS
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_chat_messages ENABLE ROW LEVEL SECURITY;

-- Knowledge Base Policies
CREATE POLICY "Admins manage knowledge base"
  ON ai_knowledge_base FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view active entries"
  ON ai_knowledge_base FOR SELECT
  USING (active = true);

-- Chat Sessions Policies
CREATE POLICY "Users manage own sessions"
  ON assistant_chat_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Users manage own messages"
  ON assistant_chat_messages FOR ALL
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON ai_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial knowledge base entries
INSERT INTO ai_knowledge_base (intent, keywords, answer, category, priority, active) VALUES

-- PLATFORM HELP
('wallet_balance', 
 ARRAY['wallet', 'balance', 'funds', 'money', 'deposit', 'how much', 'account balance'],
 'To check your wallet balance, go to the "My Wallet" page from the sidebar. There you''ll see your available balance, equity, and margin details. You can deposit funds by clicking the "Deposit" button.',
 'platform', 5, true),

('calculator_usage',
 ARRAY['calculator', 'lot size', 'position size', 'pips', 'calculate', 'pip calculator'],
 'Our Trading Calculator helps you calculate position sizes, pip values, profit/loss, and risk/reward ratios. Access it from the sidebar under "Calculator". Enter your account balance, risk percentage, and stop loss distance to get the optimal lot size.',
 'platform', 5, true),

('live_room_access',
 ARRAY['live', 'session', 'watch', 'stream', 'trading room', 'live trading', 'live stream'],
 'You can join live trading sessions in the "Live Room" page. When a stream is active, you''ll see a 🔴 LIVE badge. Click to watch the stream and participate in the live chat with other traders.',
 'platform', 5, true),

('premium_signals',
 ARRAY['signals', 'premium', 'upgrade', 'subscription', 'unlock', 'trade signals'],
 'Premium Trading Signals provide exclusive trade setups with entry points, stop loss, and take profit levels. Check out the "Premium Signals" page to learn more about our signal service and subscription options.',
 'platform', 4, true),

('academy_courses',
 ARRAY['academy', 'learn', 'course', 'education', 'training', 'tutorial', 'lessons'],
 'The Academy offers comprehensive trading courses from beginner to advanced levels. Access it from "Join Academy" in the sidebar to start learning forex trading fundamentals, technical analysis, and advanced strategies.',
 'platform', 4, true),

('forecasts_page',
 ARRAY['forecast', 'forecasts', 'analysis', 'market analysis', 'predictions', 'outlook'],
 'Check out the "Forecasts" page to see market analysis and trade ideas. You can view forecasts from Arova analysts as well as community members. Like, comment, and bookmark forecasts that interest you!',
 'platform', 4, true),

('journal_feature',
 ARRAY['journal', 'trade journal', 'log trades', 'track trades', 'trading log', 'record trades'],
 'Use the "Journal" page to log and track all your trades. Record entry/exit prices, P&L, screenshots, and notes. The analytics section shows your win rate, profit charts, and performance insights over time.',
 'platform', 5, true),

('calendar_events',
 ARRAY['calendar', 'events', 'news', 'economic', 'forex news', 'market events'],
 'The "Calendar" page shows upcoming economic events and news releases that can impact the forex market. Stay informed about NFP, interest rate decisions, GDP releases, and more.',
 'platform', 4, true),

-- TRADING EDUCATION
('risk_management',
 ARRAY['risk', 'risk management', 'how much risk', 'safe', 'lose', 'protect capital'],
 'Proper risk management is crucial! Never risk more than 1-2% of your account per trade. Use stop losses on every trade. The 2% rule means if you have $1000, you should risk max $20 per trade. This protects your capital from large drawdowns.',
 'trading', 8, true),

('lot_size_calculation',
 ARRAY['lot size', 'how many lots', 'position size', 'how much to trade', 'lot calculation'],
 'Lot size depends on your account balance, risk tolerance, and stop loss distance. Formula: Lot Size = (Account Balance × Risk %) / (Stop Loss in Pips × Pip Value). Use our Calculator tool in the sidebar for accurate calculations!',
 'trading', 7, true),

('risk_reward_ratio',
 ARRAY['risk reward', 'rr ratio', 'reward ratio', 'r:r', 'risk to reward'],
 'Risk/Reward ratio compares potential profit to potential loss. A 1:2 R:R means you risk $1 to potentially make $2. Always aim for at least 1:2 R:R. For example: Entry 1.0850, SL 1.0800 (50 pips risk), TP 1.0950 (100 pips reward) = 1:2 R:R.',
 'trading', 8, true),

('trading_psychology',
 ARRAY['psychology', 'emotions', 'discipline', 'mindset', 'mental', 'fear', 'greed', 'emotional'],
 'Trading psychology is 80% of success! Key principles: 1) Don''t trade emotionally, 2) Accept losses as part of the game, 3) Stick to your trading plan, 4) Don''t revenge trade after losses, 5) Take breaks after big wins or losses.',
 'trading', 7, true),

('gold_xauusd_basics',
 ARRAY['gold', 'xauusd', 'xau', 'trading gold', 'gold trading'],
 'XAUUSD (Gold vs US Dollar) is highly volatile. Key points: 1) Gold moves based on USD strength, inflation, and global uncertainty, 2) Typical pip value: $1/pip per 0.01 lot, 3) Use wider stop losses due to volatility, 4) Best trading times: London/New York sessions.',
 'trading', 6, true),

('stop_loss_importance',
 ARRAY['stop loss', 'sl', 'cut losses', 'protect trades', 'loss limit'],
 'ALWAYS use a stop loss! It protects your capital from unexpected moves. Place SL based on: 1) Technical levels (support/resistance), 2) Your risk tolerance (max 2% of account), 3) Market volatility. Never move SL to increase your loss!',
 'trading', 9, true),

('take_profit_strategy',
 ARRAY['take profit', 'tp', 'exit', 'close trade', 'profit target'],
 'Take Profit strategies: 1) Fixed R:R ratio (e.g., 1:2), 2) Technical levels (resistance/support), 3) Trailing stops to lock in profits. Consider partial profit-taking: Close 50% at TP1, let the rest run to TP2.',
 'trading', 6, true),

('trading_sessions',
 ARRAY['session', 'trading hours', 'best time', 'when to trade', 'market hours', 'london', 'new york', 'asian'],
 'Forex market is open 24/5. Key sessions: 1) Asian (Tokyo): 00:00-09:00 GMT - lower volatility, 2) London: 08:00-17:00 GMT - highest volatility, 3) New York: 13:00-22:00 GMT - high volatility. Best times: London-NY overlap (13:00-17:00 GMT).',
 'trading', 6, true),

-- GENERAL
('greeting',
 ARRAY['hi', 'hello', 'hey', 'good morning', 'good evening', 'yo', 'sup', 'whats up'],
 'Hello! 👋 I''m Arova Assistant, here to help you 24/7. I can assist with platform features, trading concepts, and general questions. What would you like to know?',
 'general', 10, true),

('help_options',
 ARRAY['help', 'what can you do', 'options', 'assist', 'support', 'guide'],
 'I can help you with:\n\n📊 **Platform Features**: Wallet, Calculator, Live Room, Signals, Academy, Journal, Calendar\n\n📚 **Trading Education**: Risk management, position sizing, psychology, technical analysis\n\n❓ **General Support**: Account questions, navigation help\n\nWhat would you like to know?',
 'general', 10, true),

('contact_support',
 ARRAY['contact', 'human', 'real person', 'speak to someone', 'support team', 'email'],
 'Need to reach our support team? Go to the "Support" page in the sidebar to submit a message. Our team typically responds within 24 hours. You can also check the status of your previous support requests there.',
 'general', 5, true),

('thank_you',
 ARRAY['thank', 'thanks', 'thank you', 'appreciate', 'helpful', 'great'],
 'You''re welcome! 😊 I''m always here to help. Feel free to ask me anything else about trading or using the platform. Happy trading!',
 'general', 3, true),

('goodbye',
 ARRAY['bye', 'goodbye', 'see you', 'later', 'gtg', 'gotta go'],
 'Goodbye! 👋 Good luck with your trading! Remember: Always manage your risk and stick to your plan. I''ll be here 24/7 if you need me again!',
 'general', 3, true);