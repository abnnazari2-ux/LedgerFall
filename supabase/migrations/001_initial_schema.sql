-- ============================================================
-- LedgerFall Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    firm_name TEXT,
    user_type TEXT NOT NULL DEFAULT 'student' CHECK (user_type IN ('student', 'professional')),
    avatar_config JSONB DEFAULT '{}',
    linkedin_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    google_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- ============================================================
-- TABLE: player_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS player_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_level_title TEXT NOT NULL DEFAULT 'Graduate Trainee',
    current_world INTEGER NOT NULL DEFAULT 1,
    current_level INTEGER NOT NULL DEFAULT 1,
    coins INTEGER NOT NULL DEFAULT 0,
    lives INTEGER NOT NULL DEFAULT 3,
    lives_last_depleted TIMESTAMPTZ,
    focus_segments INTEGER NOT NULL DEFAULT 5,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_streak_date DATE,
    notes_collected INTEGER NOT NULL DEFAULT 0,
    total_tasks_completed INTEGER NOT NULL DEFAULT 0,
    total_fraud_flags INTEGER NOT NULL DEFAULT 0,
    hints_used_total INTEGER NOT NULL DEFAULT 0,
    badges JSONB NOT NULL DEFAULT '[]',
    completed_worlds JSONB NOT NULL DEFAULT '[]',
    certificate_earned BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_progress_user_id ON player_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_player_progress_total_xp ON player_progress(total_xp DESC);

-- ============================================================
-- TABLE: level_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS level_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    world_number INTEGER NOT NULL,
    level_number INTEGER NOT NULL,
    stars_earned INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    speed_star BOOLEAN NOT NULL DEFAULT FALSE,
    accuracy_star BOOLEAN NOT NULL DEFAULT FALSE,
    detective_star BOOLEAN NOT NULL DEFAULT FALSE,
    hints_used INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, world_number, level_number)
);

CREATE INDEX IF NOT EXISTS idx_level_progress_user_id ON level_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_level_progress_world ON level_progress(world_number, level_number);

-- ============================================================
-- TABLE: game_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    world_number INTEGER NOT NULL,
    level_number INTEGER NOT NULL,
    task_type TEXT NOT NULL DEFAULT 'standard',
    score INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    coins_earned INTEGER NOT NULL DEFAULT 0,
    lives_lost INTEGER NOT NULL DEFAULT 0,
    hints_used INTEGER NOT NULL DEFAULT 0,
    fraud_detected BOOLEAN NOT NULL DEFAULT FALSE,
    false_positives INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    dataset_seed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_world ON game_sessions(world_number, level_number);

-- ============================================================
-- TABLE: leaderboard_global
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard_global (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    firm_name TEXT,
    user_type TEXT NOT NULL DEFAULT 'student',
    total_xp INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    weekly_xp INTEGER NOT NULL DEFAULT 0,
    monthly_xp INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_global_total_xp ON leaderboard_global(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_weekly_xp ON leaderboard_global(weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_monthly_xp ON leaderboard_global(monthly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_user_type ON leaderboard_global(user_type);

-- ============================================================
-- TABLE: firm_leaderboard
-- ============================================================
CREATE TABLE IF NOT EXISTS firm_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_name TEXT UNIQUE NOT NULL,
    total_xp INTEGER NOT NULL DEFAULT 0,
    member_count INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firm_leaderboard_total_xp ON firm_leaderboard(total_xp DESC);

-- ============================================================
-- TABLE: challenges
-- ============================================================
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenger_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    world_number INTEGER NOT NULL,
    level_number INTEGER NOT NULL,
    dataset_seed INTEGER NOT NULL,
    share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
    whatsapp_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_share_token ON challenges(share_token);
CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON challenges(expires_at);

-- ============================================================
-- TABLE: challenge_results
-- ============================================================
CREATE TABLE IF NOT EXISTS challenge_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    accuracy_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_results_challenge_id ON challenge_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_results_user_id ON challenge_results(user_id);

-- ============================================================
-- TABLE: daily_challenge
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_challenge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_date DATE UNIQUE NOT NULL,
    world_number INTEGER NOT NULL,
    level_number INTEGER NOT NULL,
    dataset_seed INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_challenge_date ON daily_challenge(challenge_date DESC);

-- ============================================================
-- TABLE: daily_challenge_results
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_challenge_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES daily_challenge(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_challenge_results_challenge ON daily_challenge_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_results_user ON daily_challenge_results(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_results_score ON daily_challenge_results(challenge_id, score DESC);

-- ============================================================
-- TABLE: race_rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS race_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT UNIQUE NOT NULL,
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    world_number INTEGER NOT NULL,
    level_number INTEGER NOT NULL,
    dataset_seed INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    max_players INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_race_rooms_room_code ON race_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_race_rooms_status ON race_rooms(status);
CREATE INDEX IF NOT EXISTS idx_race_rooms_host ON race_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_race_rooms_created_at ON race_rooms(created_at DESC);

-- ============================================================
-- TABLE: race_participants
-- ============================================================
CREATE TABLE IF NOT EXISTS race_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES race_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    finished BOOLEAN NOT NULL DEFAULT FALSE,
    finish_time TIMESTAMPTZ,
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_race_participants_room_id ON race_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_race_participants_user_id ON race_participants(user_id);

-- ============================================================
-- TABLE: glossary
-- ============================================================
CREATE TABLE IF NOT EXISTS glossary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    isa_reference TEXT,
    cia_reference TEXT,
    example TEXT,
    world_relevance INTEGER[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_glossary_term ON glossary(term);
CREATE INDEX IF NOT EXISTS idx_glossary_world_relevance ON glossary USING GIN(world_relevance);

-- ============================================================
-- TABLE: admin_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user ON admin_logs(target_user_id) WHERE target_user_id IS NOT NULL;

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypass (used by server with service key)
-- All policies below use auth.uid() for client-side access.
-- The server uses the service role key which bypasses RLS entirely.

-- users: users can read their own record; public can't read others
CREATE POLICY "users_own_read" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_update" ON users FOR UPDATE USING (auth.uid() = id);

-- player_progress: users can read/update their own
CREATE POLICY "progress_own_read" ON player_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_own_update" ON player_progress FOR UPDATE USING (auth.uid() = user_id);

-- level_progress: users can read/write their own
CREATE POLICY "level_progress_own" ON level_progress FOR ALL USING (auth.uid() = user_id);

-- game_sessions: users can read their own
CREATE POLICY "sessions_own_read" ON game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_own_insert" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- leaderboard_global: public read
CREATE POLICY "leaderboard_public_read" ON leaderboard_global FOR SELECT USING (true);

-- firm_leaderboard: public read
CREATE POLICY "firm_leaderboard_public_read" ON firm_leaderboard FOR SELECT USING (true);

-- challenges: public read (by share token), own insert
CREATE POLICY "challenges_public_read" ON challenges FOR SELECT USING (true);
CREATE POLICY "challenges_own_insert" ON challenges FOR INSERT WITH CHECK (auth.uid() = challenger_user_id);

-- challenge_results: public read of results, own insert
CREATE POLICY "challenge_results_public_read" ON challenge_results FOR SELECT USING (true);
CREATE POLICY "challenge_results_own_insert" ON challenge_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- daily_challenge: public read
CREATE POLICY "daily_challenge_public_read" ON daily_challenge FOR SELECT USING (true);

-- daily_challenge_results: public read, own insert/update
CREATE POLICY "daily_results_public_read" ON daily_challenge_results FOR SELECT USING (true);
CREATE POLICY "daily_results_own_insert" ON daily_challenge_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_results_own_update" ON daily_challenge_results FOR UPDATE USING (auth.uid() = user_id);

-- race_rooms: public read, authenticated insert
CREATE POLICY "race_rooms_public_read" ON race_rooms FOR SELECT USING (true);
CREATE POLICY "race_rooms_auth_insert" ON race_rooms FOR INSERT WITH CHECK (auth.uid() = host_user_id);

-- race_participants: public read, own insert
CREATE POLICY "race_participants_public_read" ON race_participants FOR SELECT USING (true);
CREATE POLICY "race_participants_own_insert" ON race_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "race_participants_own_update" ON race_participants FOR UPDATE USING (auth.uid() = user_id);

-- glossary: public read, no client writes (admin only via service key)
CREATE POLICY "glossary_public_read" ON glossary FOR SELECT USING (true);

-- admin_logs: no client access (admin only via service key)
CREATE POLICY "admin_logs_no_client_access" ON admin_logs FOR SELECT USING (false);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed Alliance Associates into firm_leaderboard
INSERT INTO firm_leaderboard (firm_name, total_xp, member_count, rank)
VALUES ('Alliance Associates', 0, 0, 1)
ON CONFLICT (firm_name) DO NOTHING;

-- ============================================================
-- GLOSSARY SEED DATA (80+ terms)
-- ============================================================

INSERT INTO glossary (term, definition, isa_reference, cia_reference, example, world_relevance) VALUES

-- AUDIT EVIDENCE & PROCEDURES
('Audit Evidence', 'Information used by the auditor to draw conclusions on which the audit opinion is based. Includes both information in accounting records and other information obtained during the audit.', 'ISA 500', NULL, 'Bank statements, invoices, contracts, and management representations all constitute audit evidence.', ARRAY[1,2,3,4,5,6]),

('Vouching', 'An audit procedure that tests the occurrence/existence assertion by tracing recorded transactions back to source documents.', 'ISA 500', NULL, 'Selecting a sample of recorded sales and checking back to the original sales invoices and delivery notes.', ARRAY[1,2,3]),

('Tracing', 'An audit procedure that tests the completeness assertion by starting from source documents and tracing forward to the accounting records.', 'ISA 500', NULL, 'Starting from a sample of goods received notes and tracing forward to purchase ledger entries.', ARRAY[1,2,3]),

('Walk-through Test', 'A procedure where the auditor traces one or a few transactions through the entire accounting system to understand how controls operate in practice.', 'ISA 315', NULL, 'Following a single purchase transaction from requisition through to payment to understand the purchase cycle.', ARRAY[1,2,3,4,5,6]),

('Analytical Procedures', 'Evaluations of financial information through analysis of plausible relationships among both financial and non-financial data.', 'ISA 520', NULL, 'Comparing gross profit margin this year versus last year and investigating any significant unexplained variance.', ARRAY[1,2,3,4,5,6]),

('Substantive Analytical Procedure', 'An analytical procedure performed as a substantive test to obtain audit evidence about the reasonableness of account balances.', 'ISA 520', NULL, 'Using payroll headcount data and average salary to estimate total payroll cost and comparing to recorded amount.', ARRAY[3,4,5]),

('External Confirmation', 'Audit evidence obtained as a direct written response to the auditor from a third party in paper or electronic form.', 'ISA 505', NULL, 'Sending confirmation letters to customers to verify outstanding receivable balances at year end.', ARRAY[2,3]),

('Circularisation', 'The process of sending confirmation requests directly to debtors or creditors to verify balances independently.', 'ISA 505', NULL, 'Sending debtor circularisation letters to a sample of trade debtors to confirm amounts owed.', ARRAY[2,3]),

('Letter of Representation', 'A written statement by management provided to the auditor to confirm certain matters or to support other audit evidence.', 'ISA 580', NULL, 'Management signs a representation letter confirming that all known instances of fraud have been disclosed to the auditor.', ARRAY[1,2,3,4,5,6]),

('Subsequent Events', 'Events occurring between the date of the financial statements and the date of the auditor''s report, or facts discovered after the date of the auditor''s report.', 'ISA 560', NULL, 'A major customer going bankrupt after year end but before signing of the audit report — this is an adjusting event.', ARRAY[3,4,5,6]),

-- FINANCIAL STATEMENT ASSERTIONS
('Completeness', 'All transactions and events that should have been recorded have been recorded, and all related disclosures have been included.', 'ISA 315', NULL, 'Testing that all purchases made during the year are recorded by tracing goods received notes to purchase ledger.', ARRAY[1,2,3,4,5,6]),

('Existence', 'Assets, liabilities, and equity interests exist at a given date, and recorded transactions and events have occurred.', 'ISA 315', NULL, 'Attending a physical inventory count to verify that recorded inventory actually exists.', ARRAY[1,2,3,4,5,6]),

('Accuracy', 'Amounts and other data relating to recorded transactions and events have been recorded appropriately.', 'ISA 315', NULL, 'Recalculating depreciation to verify that the correct amount has been charged to the income statement.', ARRAY[1,2,3,4,5,6]),

('Cut-off', 'Transactions and events have been recorded in the correct accounting period.', 'ISA 315', NULL, 'Checking that goods received just before year end are included in inventory and that the corresponding purchase is accrued.', ARRAY[1,2,3,4,5]),

('Classification', 'Transactions and events have been recorded in the proper accounts.', 'ISA 315', NULL, 'Verifying that repair costs have not been incorrectly capitalised as fixed assets.', ARRAY[1,2,3,4,5,6]),

('Valuation', 'Assets, liabilities, and equity interests are included in the financial statements at appropriate amounts.', 'ISA 540', NULL, 'Assessing whether trade receivables are stated at net realisable value after considering doubtful debts.', ARRAY[1,2,3,4,5,6]),

('Rights and Obligations', 'The entity holds or controls the rights to assets, and liabilities are the obligations of the entity.', 'ISA 315', NULL, 'Checking title documents to verify the entity legally owns the property it has recorded as a fixed asset.', ARRAY[2,3,4,5,6]),

('Presentation and Disclosure', 'Financial information is appropriately presented and described, and disclosures are clearly expressed.', 'ISA 315', NULL, 'Checking that the directors'' remuneration disclosure is complete and correctly presented.', ARRAY[1,2,3,4,5,6]),

-- FRAUD & IRREGULARITIES
('Fraud Triangle', 'A model that identifies three factors present in most fraud cases: incentive/pressure, opportunity, and rationalisation.', 'ISA 240', NULL, 'A finance manager under pressure to meet targets (incentive), with access to override controls (opportunity), who convinces themselves it''s temporary (rationalisation).', ARRAY[1,2,3,4,5,6]),

('Teeming and Lading', 'A fraud where cash receipts from one customer are used to cover a previous theft, with the shortfall being covered by subsequent receipts.', 'ISA 240', NULL, 'A cashier steals a payment from Customer A, then covers it using Customer B''s payment, then Customer C''s, and so on.', ARRAY[2,3]),

('Lapping', 'Another term for teeming and lading — misappropriating cash or cheques and concealing by applying later receipts to earlier accounts.', 'ISA 240', NULL, 'Receiving a cheque from customer Jones, posting it to Smith''s account to cover a previous theft, then covering Smith with Brown''s next payment.', ARRAY[2,3]),

('Ghost Vendor', 'A fictitious supplier set up in the accounts payable system to process fraudulent payments.', 'ISA 240', NULL, 'An employee creates a fake vendor with their personal bank account details and processes invoices to this vendor for services never rendered.', ARRAY[1,4]),

('Ghost Employee', 'A fictitious person added to the payroll who does not exist or no longer works for the organisation.', 'ISA 240', NULL, 'A payroll manager keeps a terminated employee on the system and diverts their salary payments to their own account.', ARRAY[4,5]),

('Window Dressing', 'Manipulation of financial statements to present a more favourable position than actually exists, often around period end.', 'ISA 240', NULL, 'Delaying the banking of cheques received just before year end to inflate the cash balance; or paying down an overdraft temporarily.', ARRAY[3,4,5,6]),

('Management Override', 'When senior management circumvents normal controls to manipulate financial results; a key fraud risk in all audits.', 'ISA 240', NULL, 'The CFO instructing the accounts team to reverse legitimate accruals at year end to inflate reported profit.', ARRAY[1,2,3,4,5,6]),

('Journal Entry Testing', 'Examining manual journal entries for unusual items that may indicate manipulation or fraud.', 'ISA 240', NULL, 'Reviewing all manual journals posted directly to revenue accounts near year end, especially those with round numbers or unusual descriptions.', ARRAY[1,2,3,4,5,6]),

-- RISK & MATERIALITY
('Audit Risk Model', 'The framework that states Audit Risk = Inherent Risk × Control Risk × Detection Risk.', 'ISA 315', NULL, 'If inherent and control risk are both high, the auditor must set detection risk very low by performing extensive substantive procedures.', ARRAY[1,2,3,4,5,6]),

('Inherent Risk', 'The susceptibility of an assertion to a misstatement that could be material, assuming no related controls.', 'ISA 315', NULL, 'Inventory valuation carries high inherent risk due to the complexity of the NRV calculation and management judgement involved.', ARRAY[1,2,3,4,5,6]),

('Control Risk', 'The risk that a material misstatement will not be prevented or detected by the entity''s internal control system.', 'ISA 315', NULL, 'If there are no controls over the authorisation of journal entries, control risk for that area is assessed as high.', ARRAY[1,2,3,4,5,6]),

('Detection Risk', 'The risk that the auditor''s procedures will not detect a misstatement that exists and could be material.', 'ISA 315', NULL, 'By increasing sample sizes and performing more detailed testing, the auditor can reduce detection risk.', ARRAY[1,2,3,4,5,6]),

('Materiality', 'The threshold above which misstatements, individually or in aggregate, could reasonably influence the economic decisions of users.', 'ISA 320', NULL, 'Planning materiality is often set at 5% of profit before tax or 1% of total assets, whichever is more appropriate.', ARRAY[1,2,3,4,5,6]),

('Performance Materiality', 'An amount set below overall materiality to reduce the probability that the aggregate of uncorrected misstatements exceeds overall materiality.', 'ISA 320', NULL, 'If planning materiality is £100,000, performance materiality might be set at £70,000 to provide a buffer.', ARRAY[1,2,3,4,5,6]),

('Tolerable Misstatement', 'The maximum error in a population that the auditor is willing to accept; used in audit sampling.', 'ISA 530', NULL, 'When sampling trade payables, the auditor might set tolerable misstatement at 75% of performance materiality.', ARRAY[1,2,3,4,5,6]),

-- INTERNAL CONTROL
('Segregation of Duties', 'The separation of incompatible functions so that no single person can perpetrate and conceal errors or fraud.', 'ISA 315', 'IIA IPPF', 'Separating the functions of ordering, receiving, recording, and paying for goods so different people perform each step.', ARRAY[1,2,3,4,5,6]),

('Dual Authorization', 'Requiring two authorised individuals to approve a transaction before it can proceed, reducing the risk of fraud or error.', 'ISA 315', NULL, 'Payments above £10,000 require approval from both the Finance Director and the CFO before being processed.', ARRAY[1,2,3,4,5]),

('Access Controls', 'Restrictions that prevent unauthorised users from accessing systems, data, or physical areas.', 'ISA 315', 'IIA IPPF', 'User access rights to the financial system are restricted based on job role, with quarterly access reviews performed.', ARRAY[1,2,3,4,5,6]),

('IT General Controls', 'Controls over the IT environment that apply to all systems, including access management, change management, and operations.', 'ISA 315', NULL, 'Controls over who can make changes to the payroll system program code; regular backup procedures; password complexity requirements.', ARRAY[1,2,3,4,5,6]),

('Application Controls', 'Automated controls within specific IT applications that ensure the completeness, accuracy, and validity of transactions.', 'ISA 315', NULL, 'An automatic three-way match in the purchase ledger system that matches purchase orders, goods received notes, and invoices before payment.', ARRAY[1,2,3,4,5]),

('Control Environment', 'The foundation of internal control, reflecting the overall attitude, awareness, and actions of management regarding internal control.', 'ISA 315', 'COSO', 'Tone at the top, ethical values, management philosophy, and the organisational structure all contribute to the control environment.', ARRAY[1,2,3,4,5,6]),

('Test of Controls', 'An audit procedure designed to evaluate the operating effectiveness of controls in preventing or detecting material misstatements.', 'ISA 330', NULL, 'Testing a sample of purchase orders to verify they all have proper authorisation signatures as required by the control.', ARRAY[1,2,3,4,5,6]),

('Substantive Procedures', 'Audit procedures designed to detect material misstatements at the assertion level, including tests of details and substantive analytical procedures.', 'ISA 330', NULL, 'Confirming bank balances directly with the bank and reconciling to the cash book are substantive procedures.', ARRAY[1,2,3,4,5,6]),

-- ACCOUNTING CONCEPTS
('Three-Way Match', 'The process of matching three documents — purchase order, goods received note, and supplier invoice — before authorising payment.', NULL, NULL, 'Before paying a supplier invoice, the accounts payable team checks the invoice against the original purchase order and the goods received note.', ARRAY[1,4]),

('NRV', 'Net Realisable Value — the estimated selling price in the ordinary course of business less the estimated costs of completion and selling expenses.', 'ISA 540', NULL, 'Inventory that cost £50,000 but can only be sold for £35,000 after £5,000 of selling costs must be written down to £30,000.', ARRAY[1,2]),

('Depreciation', 'The systematic allocation of the cost of a tangible asset over its useful economic life.', NULL, NULL, 'A machine costing £100,000 with a 10-year life and no residual value is depreciated at £10,000 per year on a straight-line basis.', ARRAY[5,6]),

('Capex vs Opex', 'The distinction between capital expenditure (creating an asset with future economic benefit) and operating expenditure (cost of running the business).', NULL, NULL, 'A new computer server is Capex; the annual software licence is Opex. Misclassifying Opex as Capex overstates assets and understates expenses.', ARRAY[5,6]),

('Bad Debt Provision', 'An allowance made against trade receivables that the entity does not expect to collect in full.', 'ISA 540', NULL, 'Based on aged debtor analysis, 50% provision is made against debts over 90 days and 100% against debts over 180 days.', ARRAY[2,3]),

('Aged Debtor', 'A report showing trade receivables classified by how long each debt has been outstanding.', NULL, NULL, 'The aged debtors report shows £50,000 current, £20,000 over 30 days, £10,000 over 60 days, and £5,000 over 90 days.', ARRAY[2,3]),

('Physical Count', 'A procedure where inventory items are physically counted and the count is compared to book records.', 'ISA 501', NULL, 'The year-end stocktake involves counting all items in the warehouse; the counts are reconciled to the stock system.', ARRAY[1,2]),

('Bank Reconciliation', 'The process of matching transactions in the cash book with those on the bank statement to identify any differences.', NULL, NULL, 'Outstanding cheques, deposits in transit, and bank charges are typical reconciling items in a bank reconciliation.', ARRAY[1,3]),

('Supplier Statement Reconciliation', 'Comparing a supplier''s statement of account with the entity''s purchase ledger records to identify differences.', NULL, NULL, 'The purchase ledger shows £15,000 owed to Supplier X but their statement shows £18,000 — investigation reveals an unrecorded invoice.', ARRAY[1,4]),

-- AUDIT REPORTS & OPINIONS
('Going Concern', 'The assumption that an entity will continue in operation for the foreseeable future and has neither the intention nor necessity to liquidate.', 'ISA 570', NULL, 'Significant recurring losses, negative working capital, and loan covenant breaches raise doubts about going concern.', ARRAY[3,4,5,6]),

('Modified Opinion', 'An audit opinion that is qualified, adverse, or a disclaimer of opinion, issued when the auditor cannot give a clean opinion.', 'ISA 705', NULL, 'A qualified opinion is issued when there is a material but not pervasive misstatement that management refuses to correct.', ARRAY[3,4,5,6]),

('Qualified Opinion', 'An audit opinion stating "except for" the effects of a specific matter, the financial statements give a true and fair view.', 'ISA 705', NULL, 'The auditor issues a qualified opinion because the company has not complied with IFRS 16 on lease accounting.', ARRAY[3,4,5,6]),

('Adverse Opinion', 'An opinion that the financial statements do not give a true and fair view due to a material and pervasive misstatement.', 'ISA 705', NULL, 'If management refuses to consolidate a material subsidiary, an adverse opinion may be required.', ARRAY[3,4,5,6]),

('Disclaimer of Opinion', 'The auditor''s statement that they are unable to form an opinion on the financial statements due to a limitation of scope.', 'ISA 705', NULL, 'If the auditor is appointed after year end and cannot perform sufficient inventory procedures, they may disclaim an opinion on inventory.', ARRAY[3,4,5,6]),

('Emphasis of Matter', 'A paragraph in the auditor''s report that refers to a matter appropriately presented in the financial statements that is fundamental to users'' understanding.', 'ISA 706', NULL, 'A going concern uncertainty is often highlighted in an emphasis of matter paragraph even when a clean opinion is given.', ARRAY[3,4,5,6]),

-- ISA STANDARDS
('ISA 240', 'The International Standard on Auditing dealing with the auditor''s responsibilities relating to fraud in an audit of financial statements.', 'ISA 240', NULL, 'ISA 240 requires auditors to specifically consider the risk of management override of controls and revenue recognition fraud.', ARRAY[1,2,3,4,5,6]),

('ISA 315', 'The ISA on identifying and assessing the risks of material misstatement through understanding the entity and its environment, including internal controls.', 'ISA 315', NULL, 'ISA 315 requires the auditor to perform risk assessment procedures including walkthroughs and inquiries of management.', ARRAY[1,2,3,4,5,6]),

('ISA 500', 'The ISA on audit evidence, establishing requirements for what constitutes sufficient and appropriate evidence.', 'ISA 500', NULL, 'ISA 500 states that the auditor must design and perform procedures to obtain sufficient appropriate audit evidence.', ARRAY[1,2,3,4,5,6]),

('ISA 505', 'The ISA on external confirmations — obtaining audit evidence by obtaining direct written responses from third parties.', 'ISA 505', NULL, 'ISA 505 sets out the procedures for sending, controlling, and evaluating bank confirmation letters and debtor circularisation.', ARRAY[2,3]),

('ISA 540', 'The ISA addressing the audit of accounting estimates, including fair value accounting estimates and related disclosures.', 'ISA 540', NULL, 'ISA 540 requires auditors to evaluate whether management''s methods for making estimates are appropriate.', ARRAY[2,3,4,5,6]),

('ISA 550', 'The ISA on related parties — requiring the auditor to understand the entity''s related party relationships and transactions.', 'ISA 550', NULL, 'ISA 550 requires auditors to inspect contracts and agreements with related parties and consider whether transactions are at arm''s length.', ARRAY[3,4,5,6]),

('ISA 560', 'The ISA on subsequent events — events after the reporting period through to the date of the auditor''s report.', 'ISA 560', NULL, 'ISA 560 distinguishes between adjusting events (require amendment) and non-adjusting events (require disclosure only).', ARRAY[3,4,5,6]),

-- INTERNAL AUDIT & GOVERNANCE
('IPPF', 'The International Professional Practices Framework — the authoritative guidance issued by the IIA for internal audit globally.', NULL, 'IIA IPPF', 'The IPPF includes the Core Principles, Definition of Internal Auditing, Code of Ethics, and Standards.', ARRAY[1,2,3,4,5,6]),

('Internal Audit Charter', 'A formal document that defines the internal audit activity''s purpose, authority, and responsibility within the organisation.', NULL, 'IIA IPPF', 'The internal audit charter is approved by the board or audit committee and grants internal audit access to all records and personnel.', ARRAY[1,2,3,4,5,6]),

('Three Lines of Defense', 'A governance model distinguishing between operational management (1st line), risk and compliance functions (2nd line), and internal audit (3rd line).', NULL, 'IIA IPPF', 'The finance team controls (1st line), the risk management function monitors (2nd line), and internal audit provides independent assurance (3rd line).', ARRAY[1,2,3,4,5,6]),

('COSO', 'The Committee of Sponsoring Organisations — a framework for internal control comprising Control Environment, Risk Assessment, Control Activities, Information & Communication, and Monitoring.', NULL, 'COSO', 'The COSO framework''s five components provide a comprehensive structure for evaluating the effectiveness of internal controls.', ARRAY[1,2,3,4,5,6]),

('Control Activities', 'The actions established through policies and procedures that help ensure that management''s directives to mitigate risks are carried out.', 'ISA 315', 'COSO', 'Authorisation controls, reconciliations, physical controls, and segregation of duties are all examples of control activities.', ARRAY[1,2,3,4,5,6]),

('Monitoring', 'The process of assessing the quality of internal control performance over time through ongoing evaluations or separate evaluations.', 'ISA 315', 'COSO', 'Management review of monthly exception reports and internal audit''s periodic testing of controls are both monitoring activities.', ARRAY[1,2,3,4,5,6]),

('Information and Communication', 'The COSO component addressing the need for relevant and quality information to be identified, captured, and communicated.', 'ISA 315', 'COSO', 'A well-designed accounting information system that captures all transactions is an example of effective information and communication.', ARRAY[1,2,3,4,5,6]),

('Risk Assessment', 'The process of identifying and analysing risks relevant to the achievement of objectives.', 'ISA 315', 'COSO', 'Management''s annual risk assessment process identifies key risks to financial reporting and operations.', ARRAY[1,2,3,4,5,6]),

('Entity-Level Controls', 'Controls that operate across the entire organisation rather than being specific to individual processes.', 'ISA 315', NULL, 'The code of ethics, board oversight, and centralised IT security policies are entity-level controls.', ARRAY[1,2,3,4,5,6]),

-- MANAGEMENT ACCOUNTING & REPORTING
('Management Accounts', 'Internal financial reports prepared for management use, typically monthly or quarterly, showing actual versus budget performance.', NULL, NULL, 'The monthly management accounts include an income statement, balance sheet, cash flow forecast, and variance analysis.', ARRAY[3,4,5,6]),

('Budget Variance', 'The difference between budgeted and actual financial results; can be favourable or adverse.', NULL, NULL, 'An adverse sales variance of £200,000 indicates actual sales were £200,000 below budget.', ARRAY[3,4,5,6]),

('KPI', 'Key Performance Indicator — a measurable value that demonstrates how effectively an organisation is achieving key objectives.', NULL, NULL, 'Revenue per employee, customer acquisition cost, and staff turnover rate are common KPIs.', ARRAY[3,4,5,6]),

('Benchmarking', 'The process of comparing performance or processes against industry standards or best-in-class peers.', NULL, NULL, 'Comparing the entity''s gross profit margin of 35% against the industry average of 42% highlights a potential issue.', ARRAY[3,4,5,6]),

-- AUDIT TRAIL & SYSTEMS
('Audit Trail', 'A chronological record of all transactions and system activities that can be used to trace events back to their source.', 'ISA 315', NULL, 'A complete audit trail records who posted each journal entry, when, and from which terminal.', ARRAY[1,2,3,4,5,6]),

('Password Policy', 'Organisational rules governing the creation, use, and management of passwords to protect system access.', 'ISA 315', NULL, 'A strong password policy requires minimum 12 characters, complexity rules, 90-day rotation, and no reuse of last 10 passwords.', ARRAY[1,2,3,4,5,6]),

('Reconciliation', 'The process of comparing two sets of records to ensure they agree, investigating and resolving any differences.', 'ISA 500', NULL, 'Monthly reconciliation of the sales ledger control account to the total of individual customer balances detects errors promptly.', ARRAY[1,2,3,4,5,6]),

-- RELATED PARTY & SPECIAL TOPICS
('Related Party', 'A person or entity that is related to the entity being reported on, such as subsidiaries, directors, or significant shareholders.', 'ISA 550', NULL, 'A sale to a company owned by the managing director is a related party transaction that requires disclosure.', ARRAY[3,4,5,6]),

('Letter of Engagement', 'A written agreement between the auditor and the client setting out the terms of the audit engagement.', 'ISA 210', NULL, 'The engagement letter confirms the scope of work, fees, responsibilities of management and auditors, and basis of the opinion.', ARRAY[1,2,3,4,5,6]),

('Audit Committee', 'A committee of the board of directors responsible for overseeing financial reporting, internal controls, and the external audit process.', 'ISA 260', NULL, 'The audit committee meets with the external auditors without management present to discuss control weaknesses and other sensitive matters.', ARRAY[1,2,3,4,5,6]),

('Confirmation', 'Audit evidence obtained as a direct written response to the auditor from a third party confirming a particular matter.', 'ISA 505', NULL, 'Bank confirmation letters ask the bank to confirm all balances, loans, and security arrangements at the reporting date.', ARRAY[2,3,4,5]),

('Sampling', 'The application of audit procedures to less than 100% of items within an account balance or class of transactions.', 'ISA 530', NULL, 'Statistical sampling is used to select 50 invoices from 5,000 purchase invoices to test whether all were properly authorised.', ARRAY[1,2,3,4,5,6]),

('Audit Documentation', 'The record of audit procedures performed, relevant evidence obtained, and conclusions the auditor reached.', 'ISA 230', NULL, 'Working papers must be retained for at least five years and must be sufficient to enable an experienced auditor to understand what was done.', ARRAY[1,2,3,4,5,6]),

('Professional Scepticism', 'An attitude that includes a questioning mind, being alert to conditions which may indicate misstatement, and a critical assessment of audit evidence.', 'ISA 200', NULL, 'A sceptical auditor challenges management''s optimistic assumptions in a complex fair value estimate rather than accepting them without question.', ARRAY[1,2,3,4,5,6]),

('Independence', 'The state of mind and in appearance that allows an auditor to act with integrity and make objective judgements.', 'ISA 200', NULL, 'An auditor cannot own shares in the audit client or have a close family member employed in a senior position at the client.', ARRAY[1,2,3,4,5,6]),

('Engagement Quality Review', 'A process designed to provide an objective evaluation of significant judgements made by the engagement team.', 'ISA 220', NULL, 'The engagement quality reviewer scrutinises the documentation for high-risk estimates and management override concerns before the report is signed.', ARRAY[1,2,3,4,5,6])

ON CONFLICT DO NOTHING;

-- ============================================================
-- HELPER FUNCTION: increment_leaderboard_xp
-- ============================================================
CREATE OR REPLACE FUNCTION increment_leaderboard_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE leaderboard_global
    SET
        weekly_xp = weekly_xp + p_xp,
        monthly_xp = monthly_xp + p_xp,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: update_firm_xp
-- ============================================================
CREATE OR REPLACE FUNCTION update_firm_xp(p_firm_name TEXT, p_xp INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO firm_leaderboard (firm_name, total_xp, member_count, rank, updated_at)
    VALUES (p_firm_name, p_xp, 1, 0, NOW())
    ON CONFLICT (firm_name) DO UPDATE SET
        total_xp = firm_leaderboard.total_xp + p_xp,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_world ON game_sessions(user_id, world_number, level_number);
CREATE INDEX IF NOT EXISTS idx_level_progress_user_completed ON level_progress(user_id, completed) WHERE completed = TRUE;
CREATE INDEX IF NOT EXISTS idx_daily_results_score ON daily_challenge_results(challenge_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_race_rooms_code_status ON race_rooms(room_code, status);
