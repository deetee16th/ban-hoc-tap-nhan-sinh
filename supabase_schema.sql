-- ============================================================================
-- LỚP NHÂN SINH - SUPABASE POSTGRESQL SCHEMA & SEED DATA
-- Sẵn sàng triển khai Production (Vercel + Supabase)
-- Chạy toàn bộ file này trong Supabase SQL Editor (Idempotent / Chạy lại an toàn)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. BẢNG THÀNH VIÊN LỚP HỌC (members)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  stt INTEGER NOT NULL CHECK (stt > 0),
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) > 0),
  group_code TEXT NOT NULL CHECK (group_code IN ('G1', 'G2', 'G3', 'G4')),
  role TEXT NOT NULL DEFAULT 'Thành viên' CHECK (
    role IN ('Trưởng ban học tập', 'Ban học tập', 'Trưởng nhóm', 'Phó nhóm', 'Thành viên')
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inactive_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_group_stt
  ON public.members (group_code, stt);

-- ============================================================================
-- 2. BẢNG TUẦN HỌC (weeks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.weeks (
  week_number INTEGER PRIMARY KEY CHECK (week_number > 0),
  label TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  study_dates DATE[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. BẢNG NHẬT KÝ HỌC TẬP HÀNG NGÀY (daily_logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id TEXT PRIMARY KEY,
  log_date DATE NOT NULL,
  week_number INTEGER NOT NULL REFERENCES public.weeks (week_number) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  attendance TEXT NOT NULL DEFAULT 'Chưa chấm' CHECK (
    attendance IN ('Đúng giờ', 'Muộn', 'Vắng CP', 'Vắng', 'Chưa chấm')
  ),
  homework TEXT NOT NULL DEFAULT 'Chưa chấm' CHECK (
    homework IN ('Đúng hạn', 'Muộn', 'Muộn CP', 'Chưa nộp', 'Không nộp', 'Chưa chấm')
  ),
  camera TEXT NOT NULL DEFAULT 'Chưa chấm' CHECK (
    camera IN ('Có', 'Không', 'Chưa chấm')
  ),
  morning_note TEXT NOT NULL DEFAULT '',
  homework_feedback TEXT NOT NULL DEFAULT '',
  general_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_daily_logs_date_member UNIQUE (log_date, member_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_week_member
  ON public.daily_logs (week_number, member_id);

CREATE INDEX IF NOT EXISTS idx_daily_logs_date
  ON public.daily_logs (log_date);

-- ============================================================================
-- 4. BẢNG CẤU HÌNH GIAO DIỆN & HIỂN THỊ (app_settings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  app_name TEXT NOT NULL DEFAULT 'Lớp Nhân Sinh',
  app_subtitle TEXT NOT NULL DEFAULT 'Quản lý học tập & rèn luyện',
  group_names JSONB NOT NULL DEFAULT '{"G1":"Nhóm 1","G2":"Nhóm 2","G3":"Nhóm 3","G4":"Nhóm 4"}'::JSONB,
  show_group_summary BOOLEAN NOT NULL DEFAULT true,
  show_percentage BOOLEAN NOT NULL DEFAULT false,
  allow_group_officer_view_other_groups BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. BẢNG GHI CHÚ TRÌNH BÀY NHÓM THEO TUẦN (group_notes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.group_notes (
  week_number INTEGER NOT NULL REFERENCES public.weeks (week_number) ON DELETE CASCADE,
  group_code TEXT NOT NULL CHECK (group_code IN ('G1', 'G2', 'G3', 'G4')),
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (week_number, group_code)
);

-- ============================================================================
-- 6. BẢNG TÀI KHOẢN CÁN SỰ NỘI BỘ (accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'banhoctap', 'group_officer')),
  assigned_group TEXT CHECK (
    assigned_group IS NULL OR assigned_group IN ('G1', 'G2', 'G3', 'G4')
  ),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. TRIGGER TỰ ĐỘNG CẬP NHẬT updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_members_updated_at ON public.members;
CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_weeks_updated_at ON public.weeks;
CREATE TRIGGER trg_weeks_updated_at
  BEFORE UPDATE ON public.weeks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER trg_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_group_notes_updated_at ON public.group_notes;
CREATE TRIGGER trg_group_notes_updated_at
  BEFORE UPDATE ON public.group_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON public.accounts;
CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 8. TẮT RLS & MỞ POLICY CHO ỨNG DỤNG NỘI BỘ LỚP HỌC (ANON + AUTHENTICATED)
-- ============================================================================
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;

-- Khai báo sẵn Policy mở cho cả anon & authenticated phòng trường hợp bật RLS trên Dashboard
DROP POLICY IF EXISTS "Allow all access to members" ON public.members;
CREATE POLICY "Allow all access to members"
  ON public.members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to weeks" ON public.weeks;
CREATE POLICY "Allow all access to weeks"
  ON public.weeks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to daily_logs" ON public.daily_logs;
CREATE POLICY "Allow all access to daily_logs"
  ON public.daily_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;
CREATE POLICY "Allow all access to app_settings"
  ON public.app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to group_notes" ON public.group_notes;
CREATE POLICY "Allow all access to group_notes"
  ON public.group_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to accounts" ON public.accounts;
CREATE POLICY "Allow all access to accounts"
  ON public.accounts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Kích hoạt Realtime cho các bảng chính (bỏ qua nếu đã được thêm từ trước)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.weeks;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_logs;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.group_notes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ============================================================================
-- 9. DỮ LIỆU KHỞI TẠO (SEED DATA)
-- ============================================================================

-- 9.1. Seed Cấu hình giao diện mặc định
INSERT INTO public.app_settings (
  id, app_name, app_subtitle, group_names, show_group_summary, show_percentage, allow_group_officer_view_other_groups
)
VALUES (
  'default',
  'Lớp Nhân Sinh',
  'Quản lý học tập & rèn luyện',
  '{"G1":"Nhóm 1","G2":"Nhóm 2","G3":"Nhóm 3","G4":"Nhóm 4"}'::JSONB,
  true,
  false,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 9.2. Seed Tài khoản cán sự nội bộ
INSERT INTO public.accounts (id, username, password, display_name, role, assigned_group)
VALUES
  ('acc-admin', 'admin', '123456', 'Admin (Trưởng Ban Học Tập)', 'admin', NULL),
  ('acc-bht', 'banhoctap', '123456', 'Ban Học Tập', 'banhoctap', NULL),
  ('acc-g1', 'nhom1', '123456', 'Cán sự Nhóm 1', 'group_officer', 'G1'),
  ('acc-g2', 'nhom2', '123456', 'Cán sự Nhóm 2', 'group_officer', 'G2'),
  ('acc-g3', 'nhom3', '123456', 'Cán sự Nhóm 3', 'group_officer', 'G3'),
  ('acc-g4', 'nhom4', '123456', 'Cán sự Nhóm 4', 'group_officer', 'G4')
ON CONFLICT (id) DO NOTHING;

-- 9.3. Seed Danh sách 24 Thành viên (4 Nhóm)
INSERT INTO public.members (id, stt, full_name, group_code, role, status, joined_date, inactive_date)
VALUES
  ('m-01', 1, 'Nguyễn Thị Minh Châu', 'G1', 'Trưởng ban học tập', 'active', '2026-11-02', NULL),
  ('m-02', 2, 'Trần Văn Hùng', 'G1', 'Trưởng nhóm', 'active', '2026-11-02', NULL),
  ('m-03', 3, 'Lê Hoàng Thảo Nguyên', 'G1', 'Phó nhóm', 'active', '2026-11-02', NULL),
  ('m-04', 4, 'Phạm Quốc Bảo', 'G1', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-05', 5, 'Đặng Thị Tuyết Mai', 'G1', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-06', 6, 'Võ Minh Khang', 'G1', 'Thành viên', 'inactive', '2026-11-02', '2026-11-09'),
  ('m-07', 7, 'Hoàng Thị Lan Anh', 'G2', 'Ban học tập', 'active', '2026-11-02', NULL),
  ('m-08', 8, 'Ngô Đức Thịnh', 'G2', 'Trưởng nhóm', 'active', '2026-11-02', NULL),
  ('m-09', 9, 'Bùi Thị Kim Phượng', 'G2', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-10', 10, 'Vũ Thanh Tùng', 'G2', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-11', 11, 'Trịnh Ngọc Hân', 'G2', 'Phó nhóm', 'active', '2026-11-02', NULL),
  ('m-12', 12, 'Lý Văn Thành', 'G2', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-13', 13, 'Phan Thị Thanh Hà', 'G3', 'Ban học tập', 'active', '2026-11-02', NULL),
  ('m-14', 14, 'Đỗ Quang Huy', 'G3', 'Trưởng nhóm', 'active', '2026-11-02', NULL),
  ('m-15', 15, 'Nguyễn Ngọc Quỳnh Anh', 'G3', 'Phó nhóm', 'active', '2026-11-02', NULL),
  ('m-16', 16, 'Huỳnh Tấn Phát', 'G3', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-17', 17, 'Trương Thị Bích Ngọc', 'G3', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-18', 18, 'Lương Thế Vinh', 'G3', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-19', 19, 'Cao Thị Thu Thảo', 'G4', 'Ban học tập', 'active', '2026-11-02', NULL),
  ('m-20', 20, 'Mai Xuân Trường', 'G4', 'Trưởng nhóm', 'active', '2026-11-02', NULL),
  ('m-21', 21, 'Đinh Phương Linh', 'G4', 'Phó nhóm', 'active', '2026-11-02', NULL),
  ('m-22', 22, 'Tạ Minh Đức', 'G4', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-23', 23, 'Dương Thị Hồng Nhung', 'G4', 'Thành viên', 'active', '2026-11-02', NULL),
  ('m-24', 24, 'Kiều Văn Sơn', 'G4', 'Thành viên', 'active', '2026-11-12', NULL)
ON CONFLICT (id) DO NOTHING;

-- 9.4. Seed Tuần học (Tuần 1 & Tuần 2)
INSERT INTO public.weeks (week_number, label, topic, start_date, end_date, study_dates)
VALUES
  (
    1,
    'Tuần 1',
    'Khơi nguồn Tâm Thế & Kỷ Luật Nội Tâm',
    '2026-11-02',
    '2026-11-06',
    ARRAY['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06']::DATE[]
  ),
  (
    2,
    'Tuần 2',
    'Hiện Diện Trọn Vẹn & Ứng Dụng Đời Sống',
    '2026-11-09',
    '2026-11-13',
    ARRAY['2026-11-09', '2026-11-10', '2026-11-12', '2026-11-13']::DATE[]
  )
ON CONFLICT (week_number) DO NOTHING;

-- 9.5. Seed Ghi chú trình bày nhóm (group_notes)
INSERT INTO public.group_notes (week_number, group_code, content)
VALUES
  (
    2,
    'G1',
    'Nhóm 1 duy trì nền nếp rất đều. Anh Bảo có 1 buổi họp giao ban muộn 10 phút nhưng đã báo trước và nộp bài sớm. Bạn Minh Khang xin bảo lưu từ đầu Tuần 2 để hoàn thành đồ án tốt nghiệp.'
  ),
  (
    2,
    'G2',
    'Chị Phượng quay lại đầy năng lượng sau khi cháu nhỏ khỏe lại. Cần nhắc nhẹ bạn Thanh Tùng sắp xếp thời gian di chuyển về sớm hơn 10 phút và hỗ trợ chú Thành cập nhật sẵn Zoom trước giờ học.'
  ),
  (
    2,
    'G3',
    'Nhóm 3 đạt 100% đúng giờ và mở camera suốt tuần nhờ lịch nhắc nhẹ mỗi sáng. Chú Vinh chỉ trễ nộp bài 1 buổi do đón cháu và đã có xin phép.'
  ),
  (
    2,
    'G4',
    'Chào đón chú Văn Sơn mới tham gia từ Thứ 5 (12/11) và bắt nhịp rất tốt ngay hai buổi đầu. Cần hỏi thăm thêm bạn Minh Đức sau đợt cảm sốt để hỗ trợ bài đúc kết tuần tới.'
  )
ON CONFLICT (week_number, group_code) DO NOTHING;

-- 9.6. Seed Nhật ký học tập hàng ngày (daily_logs) cho toàn bộ các buổi học Tuần 1 & Tuần 2
-- Bước 1: Tạo mặc định Đúng giờ / Đúng hạn / Có camera cho mọi thành viên đủ điều kiện trong ngày học
INSERT INTO public.daily_logs (
  id, log_date, week_number, member_id, attendance, homework, camera, morning_note, homework_feedback, general_note
)
SELECT
  'log-' || to_char(d.study_date, 'YYYY-MM-DD') || '-' || m.id AS id,
  d.study_date AS log_date,
  w.week_number,
  m.id AS member_id,
  'Đúng giờ' AS attendance,
  'Đúng hạn' AS homework,
  'Có' AS camera,
  '' AS morning_note,
  '' AS homework_feedback,
  '' AS general_note
FROM public.weeks w
CROSS JOIN LATERAL unnest(w.study_dates) AS d(study_date)
CROSS JOIN public.members m
WHERE d.study_date >= m.joined_date
  AND NOT (m.status = 'inactive' AND (m.inactive_date IS NULL OR d.study_date >= m.inactive_date))
ON CONFLICT (log_date, member_id) DO NOTHING;

-- Bước 2: Cập nhật các lượt Điểm sáng, Đi muộn, Vắng, Tắt cam & Ghi chú thực tế
INSERT INTO public.daily_logs (
  id, log_date, week_number, member_id, attendance, homework, camera, morning_note, homework_feedback, general_note
)
VALUES
  -- TUẦN 1: 2026-11-02
  ('log-2026-11-02-m-01', '2026-11-02', 1, 'm-01', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Cô Minh Châu viết bài đúc kết rất sâu sắc và ấm áp, lan tỏa sự trân trọng biết ơn tới toàn lớp ngay buổi đầu tuần.', ''),
  ('log-2026-11-02-m-03', '2026-11-02', 1, 'm-03', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Bài viết liên hệ rất chạm về cách lắng nghe ba mẹ bằng sự kiên nhẫn và bao dung trong bữa cơm tối.', ''),
  ('log-2026-11-02-m-06', '2026-11-02', 1, 'm-06', 'Vắng CP', 'Chưa nộp', 'Không', 'Xin phép vắng sáng vì bảo vệ đồ án tốt nghiệp tại trường.', '', 'Trưởng nhóm đã gửi link ghi hình buổi học qua Zalo để xem bù.'),
  ('log-2026-11-02-m-07', '2026-11-02', 1, 'm-07', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Chị Lan Anh chia sẻ góc nhìn sáng rõ về việc giữ tâm bình an khi xử lý công việc dồn dập đầu tuần.', ''),
  ('log-2026-11-02-m-10', '2026-11-02', 1, 'm-10', 'Muộn', 'Đúng hạn', 'Có', 'Muộn 10 phút do tan ca làm thêm siêu thị trễ.', '', ''),
  ('log-2026-11-02-m-12', '2026-11-02', 1, 'm-12', 'Muộn', 'Đúng hạn', 'Không', 'Chú Thành mới làm quen Zoom trên điện thoại nên vào chậm 8 phút và chưa bấm mở được camera.', '', ''),
  ('log-2026-11-02-m-13', '2026-11-02', 1, 'm-13', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Cô Hà tóm tắt bài học bằng sơ đồ tay rất rõ ràng, giúp các cô chú cùng nhóm dễ nhớ ý chính.', ''),
  ('log-2026-11-02-m-18', '2026-11-02', 1, 'm-18', 'Muộn', 'Muộn CP', 'Có', 'Chú Vinh đi khám sức khỏe định kỳ về trễ 12 phút.', '', 'Đã nhắn trưởng nhóm xin phép gửi bài vào buổi chiều.'),
  ('log-2026-11-02-m-22', '2026-11-02', 1, 'm-22', 'Vắng', 'Chưa nộp', 'Không', 'Quên đặt báo thức buổi sáng; trưởng nhóm đã gọi điện hỏi thăm.', '', ''),
  ('log-2026-11-02-m-23', '2026-11-02', 1, 'm-23', 'Đúng giờ', 'Muộn CP', 'Có', '', '', 'Cô Hồng Nhung viết tay ra sổ rồi chờ con gái chụp gửi nên trễ hơn hạn 30 phút.'),

  -- TUẦN 1: 2026-11-03
  ('log-2026-11-03-m-02', '2026-11-03', 1, 'm-02', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Anh Hùng kể lại trải nghiệm dùng lời nói nhẹ nhàng trong cuộc họp công ty khiến không khí dịu lại rõ rệt.', ''),
  ('log-2026-11-03-m-04', '2026-11-03', 1, 'm-04', 'Muộn', 'Muộn CP', 'Có', 'Muộn 15 phút do vừa đi công tác tỉnh về tới nhà.', '', 'Xin phép nộp bài đúc kết cuối ngày và đã hoàn thành đầy đủ.'),
  ('log-2026-11-03-m-05', '2026-11-03', 1, 'm-05', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Cô Tuyết Mai 63 tuổi nhưng tự gõ trọn vẹn bài đúc kết rất chân thành, truyền cảm hứng mạnh mẽ cho các bạn trẻ.', ''),
  ('log-2026-11-03-m-09', '2026-11-03', 1, 'm-09', 'Vắng CP', 'Muộn CP', 'Không', 'Chị Phượng xin phép nghỉ sáng vì cháu nhỏ sốt phải đưa đi khám.', '', 'Đã xem lại video và nộp bài bù trong tối cùng ngày.'),
  ('log-2026-11-03-m-16', '2026-11-03', 1, 'm-16', 'Đúng giờ', 'Muộn CP', 'Có', '', '', 'Nộp trễ 20 phút do lỗi tải ảnh đính kèm, đã gửi lại qua Zalo.'),
  ('log-2026-11-03-m-19', '2026-11-03', 1, 'm-19', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Chị Thu Thảo viết cảm nhận đầy ấm áp và luôn chủ động động viên các cô chú lớn tuổi trong nhóm.', ''),
  ('log-2026-11-03-m-21', '2026-11-03', 1, 'm-21', 'Muộn', 'Đúng hạn', 'Có', 'Muộn 6 phút do kẹt xe giờ cao điểm.', '', ''),
  ('log-2026-11-03-m-23', '2026-11-03', 1, 'm-23', 'Đúng giờ', 'Muộn', 'Có', '', '', 'Gửi bài hơi trễ, đã hướng dẫn thêm cách tự đăng bài trực tiếp.'),

  -- TUẦN 1: 2026-11-05
  ('log-2026-11-05-m-06', '2026-11-05', 1, 'm-06', 'Muộn', 'Đúng hạn', 'Không', 'Wifi ký túc xá chập chờn nên vào chậm 7 phút và tắt cam để nghe rõ.', '', ''),
  ('log-2026-11-05-m-08', '2026-11-05', 1, 'm-08', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Anh Thịnh chia sẻ thói quen viết 3 điều biết ơn mỗi tối cùng vợ con giúp gia đình thêm gắn kết.', ''),
  ('log-2026-11-05-m-10', '2026-11-05', 1, 'm-10', 'Đúng giờ', 'Chưa nộp', 'Có', '', '', 'Tăng ca chạy tiến độ dự án ở công ty, hẹn bổ sung bài vào cuối tuần.'),
  ('log-2026-11-05-m-11', '2026-11-05', 1, 'm-11', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Ngọc Hân viết bài rất mạch lạc và giàu cảm xúc về sự lắng nghe trong phòng Zoom nhóm nhỏ.', ''),
  ('log-2026-11-05-m-15', '2026-11-05', 1, 'm-15', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Quỳnh Anh chia sẻ hành trình bỏ thói quen trì hoãn, dậy từ 5h30 đọc sách và hoàn thành bài ngay buổi sáng.', ''),
  ('log-2026-11-05-m-22', '2026-11-05', 1, 'm-22', 'Đúng giờ', 'Không nộp', 'Không', 'Ngại mở cam buổi sáng vì phòng đông người.', '', 'Trưởng nhóm đã nhắn hỏi thăm và đồng hành riêng 1-1.'),

  -- TUẦN 1: 2026-11-06
  ('log-2026-11-06-m-01', '2026-11-06', 1, 'm-01', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Bài tổng kết cuối tuần của cô Minh Châu đọng lại nhiều cảm xúc chân thành về tinh thần đồng hành của cả lớp.', ''),
  ('log-2026-11-06-m-10', '2026-11-06', 1, 'm-10', 'Đúng giờ', 'Muộn CP', 'Không', 'Đang trực ca tại cửa hàng nên xin phép nghe tai nghe, không bật cam.', '', 'Xin nộp bài muộn có phép sau khi hết ca.'),
  ('log-2026-11-06-m-12', '2026-11-06', 1, 'm-12', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Sau buổi đầu bỡ ngỡ, chú Thành đã bật cam rạng rỡ suốt buổi và tự tay gõ trọn vẹn bài đúc kết cuối tuần.', ''),
  ('log-2026-11-06-m-18', '2026-11-06', 1, 'm-18', 'Đúng giờ', 'Muộn', 'Có', '', '', 'Chú Vinh đã làm chủ thao tác gửi bài, chỉ chậm hơn giờ chốt 15 phút.'),
  ('log-2026-11-06-m-22', '2026-11-06', 1, 'm-22', 'Muộn', 'Đúng hạn', 'Có', 'Vào muộn 5 phút nhưng đã mạnh dạn mở cam và nộp bài đúng hạn.', '', ''),

  -- TUẦN 2: 2026-11-09
  ('log-2026-11-09-m-01', '2026-11-09', 2, 'm-01', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Cô Minh Châu chia sẻ câu chuyện hiện diện trọn vẹn với gia đình khiến cả nhóm rất xúc động.', ''),
  ('log-2026-11-09-m-05', '2026-11-09', 2, 'm-05', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Cô Tuyết Mai viết rất mộc mạc về niềm vui chăm sóc khu vườn và trò chuyện kiên nhẫn cùng cháu nội.', ''),
  ('log-2026-11-09-m-09', '2026-11-09', 2, 'm-09', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Bé đã khỏe lại, chị Phượng quay lại đầy ấm áp và viết bài đúc kết chạm tới trái tim mọi người trong nhóm.', ''),
  ('log-2026-11-09-m-10', '2026-11-09', 2, 'm-10', 'Đúng giờ', 'Muộn CP', 'Không', 'Đang trên xe buýt đi làm nên xin phép tạm tắt camera.', '', 'Báo trước xin nộp bài vào buổi tối sau giờ tan làm.'),
  ('log-2026-11-09-m-14', '2026-11-09', 2, 'm-14', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Anh Quang Huy chia sẻ kinh nghiệm thực hành sự tỉnh thức trong những phút đầu ngày rất dễ áp dụng.', ''),
  ('log-2026-11-09-m-21', '2026-11-09', 2, 'm-21', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Phương Linh viết bài đúc kết đầy chân thành về sự kết nối giữa các thế hệ trong lớp học.', ''),
  ('log-2026-11-09-m-22', '2026-11-09', 2, 'm-22', 'Vắng CP', 'Chưa nộp', 'Không', 'Xin phép nghỉ buổi sáng do bị cảm sốt nhẹ.', '', 'Nhóm trưởng đã gửi tài liệu tóm tắt để bạn đọc lại khi khỏe.'),
  ('log-2026-11-09-m-23', '2026-11-09', 2, 'm-23', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Cô Hồng Nhung đã tự chụp và đăng bài rất thành thạo, chia sẻ sâu sắc về sự kiên nhẫn với chính mình.', ''),

  -- TUẦN 2: 2026-11-10
  ('log-2026-11-10-m-04', '2026-11-10', 2, 'm-04', 'Muộn', 'Đúng hạn', 'Có', 'Muộn 10 phút do họp giao ban đầu tuần ở công ty kéo dài.', '', ''),
  ('log-2026-11-10-m-07', '2026-11-10', 2, 'm-07', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Chị Lan Anh kể câu chuyện thực hành lắng nghe không phán xét với đồng nghiệp trẻ rất ý nghĩa.', ''),
  ('log-2026-11-10-m-12', '2026-11-10', 2, 'm-12', 'Muộn', 'Đúng hạn', 'Có', 'Muộn 5 phút do điện thoại tự cập nhật ứng dụng Zoom.', '', ''),
  ('log-2026-11-10-m-15', '2026-11-10', 2, 'm-15', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Quỳnh Anh sáng tác bài thơ lục bát đúc kết nội dung buổi học rất mộc mạc và gần gũi.', ''),
  ('log-2026-11-10-m-18', '2026-11-10', 2, 'm-18', 'Đúng giờ', 'Muộn CP', 'Có', '', '', 'Chú Vinh đi đón cháu tan học nên xin phép gửi bài trễ 25 phút.'),

  -- TUẦN 2: 2026-11-12
  ('log-2026-11-12-m-03', '2026-11-12', 2, 'm-03', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Thảo Nguyên chia sẻ cảm xúc ấm lòng khi chủ động gọi điện hỏi thăm thầy giáo cũ sau bài học.', ''),
  ('log-2026-11-12-m-08', '2026-11-12', 2, 'm-08', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Anh Thịnh duy trì 2 phút chia sẻ biết ơn đầu giờ giúp không khí Nhóm 2 luôn nhẹ nhàng, vui vẻ.', ''),
  ('log-2026-11-12-m-10', '2026-11-12', 2, 'm-10', 'Muộn', 'Đúng hạn', 'Có', 'Muộn 7 phút do trời mưa lớn về nhà trễ.', '', ''),
  ('log-2026-11-12-m-17', '2026-11-12', 2, 'm-17', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Cô Bích Ngọc chia sẻ cách giữ sự điềm tĩnh khi hướng dẫn nhân viên mới ở cửa hàng rất thực tế.', ''),
  ('log-2026-11-12-m-22', '2026-11-12', 2, 'm-22', 'Đúng giờ', 'Muộn', 'Có', '', '', 'Đã khỏe lại và vào lớp đúng giờ; bài đúc kết gửi trễ 20 phút.'),
  ('log-2026-11-12-m-24', '2026-11-12', 2, 'm-24', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Buổi đầu tiên tham gia lớp, chú Văn Sơn rất hào hứng, vào sớm bật cam rõ nét và viết bài đúc kết đầy đủ.', ''),

  -- TUẦN 2: 2026-11-13
  ('log-2026-11-13-m-11', '2026-11-13', 2, 'm-11', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Ngọc Hân giữ trọn 2 tuần đều đặn và còn hướng dẫn thêm cho 2 cô chú trong nhóm cách chỉnh ảnh gửi bài.', ''),
  ('log-2026-11-13-m-16', '2026-11-13', 2, 'm-16', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Tấn Phát chia sẻ sự thay đổi tích cực từ việc nộp bài sát giờ sang luôn chủ động hoàn thành từ sớm.', ''),
  ('log-2026-11-13-m-23', '2026-11-13', 2, 'm-23', 'Đúng giờ', 'Đúng hạn', 'Có', '', 'Cô Hồng Nhung hoàn thành trọn vẹn cả 4 buổi Tuần 2 với tâm thế vui vẻ, là động lực lớn cho cả Nhóm 4.', '')
ON CONFLICT (log_date, member_id) DO UPDATE SET
  attendance = EXCLUDED.attendance,
  homework = EXCLUDED.homework,
  camera = EXCLUDED.camera,
  morning_note = EXCLUDED.morning_note,
  homework_feedback = EXCLUDED.homework_feedback,
  general_note = EXCLUDED.general_note;
