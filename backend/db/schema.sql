-- ============================================================
-- UniShare Database Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id                        TEXT PRIMARY KEY,
  name                      TEXT NOT NULL,
  email                     TEXT UNIQUE NOT NULL,
  password_hash             TEXT NOT NULL DEFAULT '',
  role                      TEXT NOT NULL DEFAULT 'user',
  avatar                    TEXT,
  phone                     TEXT,
  address                   TEXT,
  bio                       TEXT,
  university                TEXT,
  major                     TEXT,
  graduation_year           TEXT,
  uiu_email                 TEXT,
  uiu_id_number             TEXT,
  uiu_id_image              TEXT,
  verification_status       TEXT NOT NULL DEFAULT 'unverified',
  verification_note         TEXT,
  verification_submitted_at TEXT,
  verification_reviewed_at  TEXT,
  joined_date               TEXT,
  created_at                TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS marketplace_items (
  id          TEXT PRIMARY KEY,
  seller_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('sell','share','barter')),
  price       REAL DEFAULT 0,
  exchange_for TEXT,
  condition   TEXT,
  category    TEXT,
  description TEXT,
  image_url   TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscription_groups (
  id             TEXT PRIMARY KEY,
  owner_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service        TEXT NOT NULL,
  type           TEXT NOT NULL CHECK(type IN ('share','sublet')),
  total_price    REAL NOT NULL,
  total_spots    INTEGER NOT NULL DEFAULT 1,
  description    TEXT,
  duration_months INTEGER,
  icon           TEXT DEFAULT 'Users',
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS group_members (
  id         TEXT PRIMARY KEY,
  group_id   TEXT NOT NULL REFERENCES subscription_groups(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id   TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  added_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY,
  buyer_id     TEXT NOT NULL REFERENCES users(id),
  total_amount REAL NOT NULL,
  fee          REAL NOT NULL,
  status       TEXT NOT NULL DEFAULT 'processing',
  ssl_status   TEXT,
  val_id       TEXT,
  tran_id      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id                TEXT PRIMARY KEY,
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id           TEXT NOT NULL REFERENCES marketplace_items(id),
  price_at_purchase REAL NOT NULL,
  status            TEXT NOT NULL DEFAULT 'processing',
  seller_note       TEXT
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id  TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  sender_id   TEXT NOT NULL REFERENCES users(id),
  receiver_id TEXT NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  reply_to    TEXT REFERENCES messages(id),
  read        INTEGER NOT NULL DEFAULT 0,
  edited_at   TEXT,
  deleted_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id          TEXT PRIMARY KEY,
  message_id  TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS notifications (
  id           TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  read         INTEGER NOT NULL DEFAULT 0,
  link_url     TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uiu_email      TEXT,
  uiu_id_number  TEXT,
  uiu_id_image   TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  admin_note     TEXT,
  submitted_at   TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at    TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  seller_id   TEXT NOT NULL REFERENCES users(id),
  item_id     TEXT REFERENCES marketplace_items(id),
  rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS borrow_requests (
  id          TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','borrowed','returned')),
  message     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS trade_proposals (
  id          TEXT PRIMARY KEY,
  proposer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  offer_description TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','completed')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

-- ============================================================
-- Campus Community feed
-- ============================================================

CREATE TABLE IF NOT EXISTS community_posts (
  id          TEXT PRIMARY KEY,
  author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT,
  category    TEXT NOT NULL DEFAULT 'general'
              CHECK(category IN ('general','help','lost_found','event','study','housing')),
  is_urgent   INTEGER NOT NULL DEFAULT 0,
  is_resolved INTEGER NOT NULL DEFAULT 0,
  location    TEXT,
  media_url   TEXT,
  media_type  TEXT CHECK(media_type IN ('image','video')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS community_comments (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);

CREATE TABLE IF NOT EXISTS community_likes (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, user_id)
);

-- ============================================================
-- Community post reports
-- ============================================================

CREATE TABLE IF NOT EXISTS community_reports (
  id           TEXT PRIMARY KEY,
  post_id      TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL CHECK(reason IN ('spam','harassment','misinformation','inappropriate_content','other')),
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','banned','restricted','dismissed')),
  reviewed_by  TEXT REFERENCES users(id),
  reviewed_at  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);

-- ============================================================
-- Password reset tokens (hashed; single-use; time-limited)
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_hash ON password_reset_tokens(token_hash);
