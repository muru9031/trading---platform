-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_type TEXT NOT NULL,
    phase_number INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

-- 2. Modules Table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

-- 3. Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    youtube_video_ids JSONB NOT NULL, -- Format: {"en": "id", "hi": "id", ...}
    order_index INTEGER NOT NULL
);

-- 4. Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL, -- 'A', 'B', 'C', or 'D'
    explanation_text TEXT NOT NULL
);

-- 5. User Learning Path Table
CREATE TABLE IF NOT EXISTS user_learning_path (
    user_id UUID NOT NULL, -- Can map to auth.users if needed
    language TEXT NOT NULL,
    market_type TEXT NOT NULL,
    current_phase INTEGER NOT NULL DEFAULT 1,
    unlocked_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    certified BOOLEAN DEFAULT false,
    certified_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, market_type)
);

-- 6. User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    video_completed BOOLEAN DEFAULT false,
    quiz_passed BOOLEAN DEFAULT false,
    quiz_score INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, lesson_id)
);

-- 7. AI Chat Usage Table
CREATE TABLE IF NOT EXISTS ai_chat_usage (
    user_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

-- Seed Data for "Beginner to Pro" Core Path
DO $$ 
DECLARE
    course_phase_1 UUID := gen_random_uuid();
    course_phase_2a UUID := gen_random_uuid();
    course_phase_2b UUID := gen_random_uuid();
    course_phase_3 UUID := gen_random_uuid();
    course_phase_4_5 UUID := gen_random_uuid();
    
    mod_p1_1 UUID := gen_random_uuid();
    mod_p1_2 UUID := gen_random_uuid();
    mod_p1_3 UUID := gen_random_uuid();
    mod_p2a_1 UUID := gen_random_uuid();
    mod_p2b_1 UUID := gen_random_uuid();
    mod_p3_1 UUID := gen_random_uuid();
    mod_p45_1 UUID := gen_random_uuid();

    les_p1 UUID := gen_random_uuid();
    les_p2a UUID := gen_random_uuid();
    les_p2b UUID := gen_random_uuid();
    les_p3 UUID := gen_random_uuid();
    les_p45 UUID := gen_random_uuid();
BEGIN
    -- Insert Courses
    INSERT INTO courses (id, market_type, phase_number, phase_name, order_index) VALUES 
    (course_phase_1, 'Stocks', 1, 'Foundation', 1),
    (course_phase_2a, 'Stocks', 2, 'Strategy (Price Action)', 2),
    (course_phase_2b, 'Stocks', 2, 'Strategy (SMC)', 3),
    (course_phase_3, 'Stocks', 3, 'Risk Management', 4),
    (course_phase_4_5, 'Stocks', 4, 'Psychology & Discipline', 5);

    -- Insert Modules
    INSERT INTO modules (id, course_id, title, order_index) VALUES
    (mod_p1_1, course_phase_1, 'Market & Instrument Basics', 1),
    (mod_p1_2, course_phase_1, 'Chart Reading & Candlesticks', 2),
    (mod_p1_3, course_phase_1, 'Order Types', 3),
    (mod_p2a_1, course_phase_2a, 'Price Action Concepts', 1),
    (mod_p2b_1, course_phase_2b, 'Smart Money Concepts', 1),
    (mod_p3_1, course_phase_3, 'Risk & Position Sizing', 1),
    (mod_p45_1, course_phase_4_5, 'Emotional Control', 1);

    -- Insert Lessons with JSONB YouTube IDs
    -- Phase 1
    INSERT INTO lessons (id, module_id, title, youtube_video_ids, order_index) VALUES
    (les_p1, mod_p1_1, 'What is Trading & Candlesticks', '{"English":"8oBDPx5K0bQ", "Hindi":"p7HKvqRI_Bo", "Tamil":"DoayqmWIOAI", "Telugu":"b_o3t4KXYKk", "Gujarati":"yO_c3d0m314"}'::jsonb, 1);
    
    -- Phase 2 Track A
    INSERT INTO lessons (id, module_id, title, youtube_video_ids, order_index) VALUES
    (les_p2a, mod_p2a_1, 'Market Structure & Support/Resistance', '{"English":"vbM2R2CM96Q", "Hindi":"S-v4M_CjI3I", "Tamil":"OPBFLhFCcy8", "Telugu":"7mS22Yd5L-M", "Gujarati":"Q7K6GZg44_E"}'::jsonb, 1);

    -- Phase 2 Track B
    INSERT INTO lessons (id, module_id, title, youtube_video_ids, order_index) VALUES
    (les_p2b, mod_p2b_1, 'Order Blocks & Liquidity', '{"English":"xemDoZmhGtU", "Hindi":"R_M_vDq6H4k", "Tamil":"2tiZ57DPKGQ", "Telugu":"J9-L4QG_YxE", "Gujarati":"R_M_vDq6H4k"}'::jsonb, 1);

    -- Phase 3
    INSERT INTO lessons (id, module_id, title, youtube_video_ids, order_index) VALUES
    (les_p3, mod_p3_1, 'Position Sizing & The 2% Rule', '{"English":"ab3aDz_gAfc", "Hindi":"M_Ym-B2wXQo", "Tamil":"9XuOfq6DBUs", "Telugu":"jEcxX2Yl5H8", "Gujarati":"Wz5N2ZgLq9Y"}'::jsonb, 1);

    -- Phase 4 & 5
    INSERT INTO lessons (id, module_id, title, youtube_video_ids, order_index) VALUES
    (les_p45, mod_p45_1, 'FOMO & Trading Psychology', '{"English":"9d-WnsxYU_0", "Hindi":"vJ2_Xk7U5_Q", "Tamil":"Rq7geDarFpw", "Telugu":"Z8b2V7xR8W4", "Gujarati":"L1n9X_T2A4c"}'::jsonb, 1);

    -- Insert Quiz Questions (Mock data for each lesson to test the engine)
    INSERT INTO quiz_questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_text) VALUES
    (les_p1, 'What does a bullish engulfing candle signify?', 'Downtrend continuation', 'Potential reversal upwards', 'No market movement', 'Market crash', 'B', 'A bullish engulfing candle occurs when a green candle completely engulfs the previous red candle, showing buyers have taken control.'),
    (les_p2a, 'What is the safest place to enter on a breakout?', 'Right as it breaks', 'Before it breaks', 'On the retest of the broken level', 'Never trade breakouts', 'C', 'Entering on the retest is safer as it confirms the broken resistance has now become support.'),
    (les_p2b, 'What is a Fair Value Gap (FVG)?', 'A gap over the weekend', 'An inefficiency in price delivery', 'A normal candlestick', 'When spread increases', 'B', 'An FVG represents an imbalance or inefficiency in price where the market moved too quickly, leaving a gap between wicks.'),
    (les_p3, 'According to the 2% rule, if your capital is 10,000 INR, what is your max risk per trade?', '200 INR', '2000 INR', '100 INR', '500 INR', 'A', '2% of 10,000 is 200. This is the maximum amount you should lose if your stop-loss hits.'),
    (les_p45, 'What is revenge trading?', 'Trading with a plan', 'Taking a break after a loss', 'Immediately entering a trade to win back a loss', 'Holding a trade overnight', 'C', 'Revenge trading is an emotional response to a loss, leading to impulsive trades that often violate risk management rules.');

END $$;
