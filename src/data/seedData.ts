import {
  AttendanceStatus,
  CameraStatus,
  DailyLog,
  GroupPresentationNoteMap,
  HomeworkStatus,
  Member,
  UserAccount,
  WeekConfig,
} from '../types';

export const SEED_ACCOUNTS: UserAccount[] = [
  {
    id: 'acc-admin',
    username: 'admin',
    password: '123456',
    displayName: 'Admin (Trưởng Ban Học Tập)',
    role: 'admin',
    assignedGroup: null,
  },
  {
    id: 'acc-bht',
    username: 'banhoctap',
    password: '123456',
    displayName: 'Ban Học Tập',
    role: 'banhoctap',
    assignedGroup: null,
  },
  {
    id: 'acc-g1',
    username: 'nhom1',
    password: '123456',
    displayName: 'Cán sự Nhóm 1',
    role: 'group',
    assignedGroup: 'G1',
    groupId: 1,
  },
  {
    id: 'acc-g2',
    username: 'nhom2',
    password: '123456',
    displayName: 'Cán sự Nhóm 2',
    role: 'group',
    assignedGroup: 'G2',
    groupId: 2,
  },
  {
    id: 'acc-g3',
    username: 'nhom3',
    password: '123456',
    displayName: 'Cán sự Nhóm 3',
    role: 'group',
    assignedGroup: 'G3',
    groupId: 3,
  },
  {
    id: 'acc-g4',
    username: 'nhom4',
    password: '123456',
    displayName: 'Cán sự Nhóm 4',
    role: 'group',
    assignedGroup: 'G4',
    groupId: 4,
  },
];

export const SEED_MEMBERS: Member[] = [
  // Nhóm 1 (G1)
  {
    id: 'm-01',
    stt: 1,
    fullName: 'Nguyễn Thị Minh Châu',
    group: 'G1',
    role: 'Trưởng ban học tập',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-02',
    stt: 2,
    fullName: 'Trần Văn Hùng',
    group: 'G1',
    role: 'Trưởng nhóm',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-03',
    stt: 3,
    fullName: 'Lê Hoàng Thảo Nguyên',
    group: 'G1',
    role: 'Phó nhóm',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-04',
    stt: 4,
    fullName: 'Phạm Quốc Bảo',
    group: 'G1',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-05',
    stt: 5,
    fullName: 'Đặng Thị Tuyết Mai',
    group: 'G1',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    // Ví dụ học viên nghỉ giữa chừng từ đầu Tuần 2 (giữ nguyên lịch sử Tuần 1)
    id: 'm-06',
    stt: 6,
    fullName: 'Võ Minh Khang',
    group: 'G1',
    role: 'Thành viên',
    status: 'inactive',
    joinedDate: '2026-11-02',
    inactiveDate: '2026-11-09',
  },

  // Nhóm 2 (G2)
  {
    id: 'm-07',
    stt: 7,
    fullName: 'Hoàng Thị Lan Anh',
    group: 'G2',
    role: 'Ban học tập',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-08',
    stt: 8,
    fullName: 'Ngô Đức Thịnh',
    group: 'G2',
    role: 'Trưởng nhóm',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-09',
    stt: 9,
    fullName: 'Bùi Thị Kim Phượng',
    group: 'G2',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-10',
    stt: 10,
    fullName: 'Vũ Thanh Tùng',
    group: 'G2',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-11',
    stt: 11,
    fullName: 'Trịnh Ngọc Hân',
    group: 'G2',
    role: 'Phó nhóm',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-12',
    stt: 12,
    fullName: 'Lý Văn Thành',
    group: 'G2',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },

  // Nhóm 3 (G3)
  {
    id: 'm-13',
    stt: 13,
    fullName: 'Phan Thị Thanh Hà',
    group: 'G3',
    role: 'Ban học tập',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-14',
    stt: 14,
    fullName: 'Đỗ Quang Huy',
    group: 'G3',
    role: 'Trưởng nhóm',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-15',
    stt: 15,
    fullName: 'Nguyễn Ngọc Quỳnh Anh',
    group: 'G3',
    role: 'Phó nhóm',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-16',
    stt: 16,
    fullName: 'Huỳnh Tấn Phát',
    group: 'G3',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-17',
    stt: 17,
    fullName: 'Trương Thị Bích Ngọc',
    group: 'G3',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-18',
    stt: 18,
    fullName: 'Lương Thế Vinh',
    group: 'G3',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },

  // Nhóm 4 (G4)
  {
    id: 'm-19',
    stt: 19,
    fullName: 'Cao Thị Thu Thảo',
    group: 'G4',
    role: 'Ban học tập',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-20',
    stt: 20,
    fullName: 'Mai Xuân Trường',
    group: 'G4',
    role: 'Trưởng nhóm',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-21',
    stt: 21,
    fullName: 'Đinh Phương Linh',
    group: 'G4',
    role: 'Phó nhóm',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-22',
    stt: 22,
    fullName: 'Tạ Minh Đức',
    group: 'G4',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    id: 'm-23',
    stt: 23,
    fullName: 'Dương Thị Hồng Nhung',
    group: 'G4',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-02',
  },
  {
    // Ví dụ thành viên mới vào giữa Tuần 2 (từ Thứ 5 ngày 12/11/2026)
    id: 'm-24',
    stt: 24,
    fullName: 'Kiều Văn Sơn',
    group: 'G4',
    role: 'Thành viên',
    status: 'active',
    joinedDate: '2026-11-12',
  },
];

export const SEED_WEEKS: WeekConfig[] = [
  {
    weekNumber: 1,
    label: 'Tuần 1',
    topic: 'Khơi nguồn Tâm Thế & Kỷ Luật Nội Tâm',
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    studyDates: ['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06'],
  },
  {
    weekNumber: 2,
    label: 'Tuần 2',
    topic: 'Hiện Diện Trọn Vẹn & Ứng Dụng Đời Sống',
    startDate: '2026-11-09',
    endDate: '2026-11-13',
    studyDates: ['2026-11-09', '2026-11-10', '2026-11-12', '2026-11-13'],
  },
];

export const SEED_GROUP_NOTES: GroupPresentationNoteMap = {
  '2::G1':
    'Nhóm 1 duy trì nền nếp rất đều. Anh Bảo có 1 buổi họp giao ban muộn 10 phút nhưng đã báo trước và nộp bài sớm. Bạn Minh Khang xin bảo lưu từ đầu Tuần 2 để hoàn thành đồ án tốt nghiệp.',
  '2::G2':
    'Chị Phượng quay lại đầy năng lượng sau khi cháu nhỏ khỏe lại. Cần nhắc nhẹ bạn Thanh Tùng sắp xếp thời gian di chuyển về sớm hơn 10 phút và hỗ trợ chú Thành cập nhật sẵn Zoom trước giờ học.',
  '2::G3':
    'Nhóm 3 đạt 100% đúng giờ và mở camera suốt tuần nhờ lịch nhắc nhẹ mỗi sáng. Chú Vinh chỉ trễ nộp bài 1 buổi do đón cháu và đã có xin phép.',
  '2::G4':
    'Chào đón chú Văn Sơn mới tham gia từ Thứ 5 (12/11) và bắt nhịp rất tốt ngay hai buổi đầu. Cần hỏi thăm thêm bạn Minh Đức sau đợt cảm sốt để hỗ trợ bài đúc kết tuần tới.',
};

interface LogOverride {
  attendance?: AttendanceStatus;
  homework?: HomeworkStatus;
  camera?: CameraStatus;
  morningNote?: string;
  homeworkFeedback?: string;
  generalNote?: string;
}

const LOG_OVERRIDES: Record<string, LogOverride> = {
  // ================= TUẦN 1 =================
  '2026-11-02:m-01': {
    homeworkFeedback:
      'Cô Minh Châu viết bài đúc kết rất sâu sắc và ấm áp, lan tỏa sự trân trọng biết ơn tới toàn lớp ngay buổi đầu tuần.',
  },
  '2026-11-02:m-03': {
    homeworkFeedback:
      'Bài viết liên hệ rất chạm về cách lắng nghe ba mẹ bằng sự kiên nhẫn và bao dung trong bữa cơm tối.',
  },
  '2026-11-02:m-06': {
    attendance: 'Vắng CP',
    homework: 'Chưa nộp',
    camera: 'Không',
    morningNote: 'Xin phép vắng sáng vì bảo vệ đồ án tốt nghiệp tại trường.',
    generalNote: 'Trưởng nhóm đã gửi link ghi hình buổi học qua Zalo để xem bù.',
  },
  '2026-11-02:m-07': {
    homeworkFeedback:
      'Chị Lan Anh chia sẻ góc nhìn sáng rõ về việc giữ tâm bình an khi xử lý công việc dồn dập đầu tuần.',
  },
  '2026-11-02:m-10': {
    attendance: 'Muộn',
    homework: 'Đúng hạn',
    camera: 'Có',
    morningNote: 'Muộn 10 phút do tan ca làm thêm siêu thị trễ.',
  },
  '2026-11-02:m-12': {
    attendance: 'Muộn',
    homework: 'Đúng hạn',
    camera: 'Không',
    morningNote:
      'Chú Thành mới làm quen Zoom trên điện thoại nên vào chậm 8 phút và chưa bấm mở được camera.',
  },
  '2026-11-02:m-13': {
    homeworkFeedback:
      'Cô Hà tóm tắt bài học bằng sơ đồ tay rất rõ ràng, giúp các cô chú cùng nhóm dễ nhớ ý chính.',
  },
  '2026-11-02:m-18': {
    attendance: 'Muộn',
    homework: 'Muộn CP',
    camera: 'Có',
    morningNote: 'Chú Vinh đi khám sức khỏe định kỳ về trễ 12 phút.',
    generalNote: 'Đã nhắn trưởng nhóm xin phép gửi bài vào buổi chiều.',
  },
  '2026-11-02:m-22': {
    attendance: 'Vắng',
    homework: 'Chưa nộp',
    camera: 'Không',
    morningNote: 'Quên đặt báo thức buổi sáng; trưởng nhóm đã gọi điện hỏi thăm.',
  },
  '2026-11-02:m-23': {
    attendance: 'Đúng giờ',
    homework: 'Muộn CP',
    camera: 'Có',
    generalNote:
      'Cô Hồng Nhung viết tay ra sổ rồi chờ con gái chụp gửi nên trễ hơn hạn 30 phút.',
  },

  // 2026-11-03
  '2026-11-03:m-02': {
    homeworkFeedback:
      'Anh Hùng kể lại trải nghiệm dùng lời nói nhẹ nhàng trong cuộc họp công ty khiến không khí dịu lại rõ rệt.',
  },
  '2026-11-03:m-04': {
    attendance: 'Muộn',
    homework: 'Muộn CP',
    camera: 'Có',
    morningNote: 'Muộn 15 phút do vừa đi công tác tỉnh về tới nhà.',
    generalNote: 'Xin phép nộp bài đúc kết cuối ngày và đã hoàn thành đầy đủ.',
  },
  '2026-11-03:m-05': {
    homeworkFeedback:
      'Cô Tuyết Mai 63 tuổi nhưng tự gõ trọn vẹn bài đúc kết rất chân thành, truyền cảm hứng mạnh mẽ cho các bạn trẻ.',
  },
  '2026-11-03:m-09': {
    attendance: 'Vắng CP',
    homework: 'Muộn CP',
    camera: 'Không',
    morningNote: 'Chị Phượng xin phép nghỉ sáng vì cháu nhỏ sốt phải đưa đi khám.',
    generalNote: 'Đã xem lại video và nộp bài bù trong tối cùng ngày.',
  },
  '2026-11-03:m-16': {
    attendance: 'Đúng giờ',
    homework: 'Muộn CP',
    camera: 'Có',
    generalNote: 'Nộp trễ 20 phút do lỗi tải ảnh đính kèm, đã gửi lại qua Zalo.',
  },
  '2026-11-03:m-19': {
    homeworkFeedback:
      'Chị Thu Thảo viết cảm nhận đầy ấm áp và luôn chủ động động viên các cô chú lớn tuổi trong nhóm.',
  },
  '2026-11-03:m-21': {
    attendance: 'Muộn',
    homework: 'Đúng hạn',
    camera: 'Có',
    morningNote: 'Muộn 6 phút do kẹt xe giờ cao điểm.',
  },
  '2026-11-03:m-23': {
    attendance: 'Đúng giờ',
    homework: 'Muộn',
    camera: 'Có',
    generalNote: 'Gửi bài hơi trễ, đã hướng dẫn thêm cách tự đăng bài trực tiếp.',
  },

  // 2026-11-05
  '2026-11-05:m-06': {
    attendance: 'Muộn',
    homework: 'Đúng hạn',
    camera: 'Không',
    morningNote: 'Wifi ký túc xá chập chờn nên vào chậm 7 phút và tắt cam để nghe rõ.',
  },
  '2026-11-05:m-08': {
    homeworkFeedback:
      'Anh Thịnh chia sẻ thói quen viết 3 điều biết ơn mỗi tối cùng vợ con giúp gia đình thêm gắn kết.',
  },
  '2026-11-05:m-10': {
    attendance: 'Đúng giờ',
    homework: 'Chưa nộp',
    camera: 'Có',
    generalNote: 'Tăng ca chạy tiến độ dự án ở công ty, hẹn bổ sung bài vào cuối tuần.',
  },
  '2026-11-05:m-11': {
    homeworkFeedback:
      'Ngọc Hân viết bài rất mạch lạc và giàu cảm xúc về sự lắng nghe trong phòng Zoom nhóm nhỏ.',
  },
  '2026-11-05:m-15': {
    homeworkFeedback:
      'Quỳnh Anh chia sẻ hành trình bỏ thói quen trì hoãn, dậy từ 5h30 đọc sách và hoàn thành bài ngay buổi sáng.',
  },
  '2026-11-05:m-22': {
    attendance: 'Đúng giờ',
    homework: 'Không nộp',
    camera: 'Không',
    morningNote: 'Ngại mở cam buổi sáng vì phòng đông người.',
    generalNote: 'Trưởng nhóm đã nhắn hỏi thăm và đồng hành riêng 1-1.',
  },

  // 2026-11-06
  '2026-11-06:m-01': {
    homeworkFeedback:
      'Bài tổng kết cuối tuần của cô Minh Châu đọng lại nhiều cảm xúc chân thành về tinh thần đồng hành của cả lớp.',
  },
  '2026-11-06:m-10': {
    attendance: 'Đúng giờ',
    homework: 'Muộn CP',
    camera: 'Không',
    morningNote: 'Đang trực ca tại cửa hàng nên xin phép nghe tai nghe, không bật cam.',
    generalNote: 'Xin nộp bài muộn có phép sau khi hết ca.',
  },
  '2026-11-06:m-12': {
    homeworkFeedback:
      'Sau buổi đầu bỡ ngỡ, chú Thành đã bật cam rạng rỡ suốt buổi và tự tay gõ trọn vẹn bài đúc kết cuối tuần.',
  },
  '2026-11-06:m-18': {
    attendance: 'Đúng giờ',
    homework: 'Muộn',
    camera: 'Có',
    generalNote: 'Chú Vinh đã làm chủ thao tác gửi bài, chỉ chậm hơn giờ chốt 15 phút.',
  },
  '2026-11-06:m-22': {
    attendance: 'Muộn',
    homework: 'Đúng hạn',
    camera: 'Có',
    morningNote: 'Vào muộn 5 phút nhưng đã mạnh dạn mở cam và nộp bài đúng hạn.',
  },

  // ================= TUẦN 2 =================
  // 2026-11-09
  '2026-11-09:m-01': {
    homeworkFeedback:
      'Cô Minh Châu chia sẻ câu chuyện hiện diện trọn vẹn với gia đình khiến cả nhóm rất xúc động.',
  },
  '2026-11-09:m-05': {
    homeworkFeedback:
      'Cô Tuyết Mai viết rất mộc mạc về niềm vui chăm sóc khu vườn và trò chuyện kiên nhẫn cùng cháu nội.',
  },
  '2026-11-09:m-09': {
    homeworkFeedback:
      'Bé đã khỏe lại, chị Phượng quay lại đầy ấm áp và viết bài đúc kết chạm tới trái tim mọi người trong nhóm.',
  },
  '2026-11-09:m-10': {
    attendance: 'Đúng giờ',
    homework: 'Muộn CP',
    camera: 'Không',
    morningNote: 'Đang trên xe buýt đi làm nên xin phép tạm tắt camera.',
    generalNote: 'Báo trước xin nộp bài vào buổi tối sau giờ tan làm.',
  },
  '2026-11-09:m-14': {
    homeworkFeedback:
      'Anh Quang Huy chia sẻ kinh nghiệm thực hành sự tỉnh thức trong những phút đầu ngày rất dễ áp dụng.',
  },
  '2026-11-09:m-21': {
    homeworkFeedback:
      'Phương Linh viết bài đúc kết đầy chân thành về sự kết nối giữa các thế hệ trong lớp học.',
  },
  '2026-11-09:m-22': {
    attendance: 'Vắng CP',
    homework: 'Chưa nộp',
    camera: 'Không',
    morningNote: 'Xin phép nghỉ buổi sáng do bị cảm sốt nhẹ.',
    generalNote: 'Nhóm trưởng đã gửi tài liệu tóm tắt để bạn đọc lại khi khỏe.',
  },
  '2026-11-09:m-23': {
    homeworkFeedback:
      'Cô Hồng Nhung đã tự chụp và đăng bài rất thành thạo, chia sẻ sâu sắc về sự kiên nhẫn với chính mình.',
  },

  // 2026-11-10
  '2026-11-10:m-04': {
    attendance: 'Muộn',
    homework: 'Đúng hạn',
    camera: 'Có',
    morningNote: 'Muộn 10 phút do họp giao ban đầu tuần ở công ty kéo dài.',
  },
  '2026-11-10:m-07': {
    homeworkFeedback:
      'Chị Lan Anh kể câu chuyện thực hành lắng nghe không phán xét với đồng nghiệp trẻ rất ý nghĩa.',
  },
  '2026-11-10:m-12': {
    attendance: 'Muộn',
    homework: 'Đúng hạn',
    camera: 'Có',
    morningNote: 'Muộn 5 phút do điện thoại tự cập nhật ứng dụng Zoom.',
  },
  '2026-11-10:m-15': {
    homeworkFeedback:
      'Quỳnh Anh sáng tác bài thơ lục bát đúc kết nội dung buổi học rất mộc mạc và gần gũi.',
  },
  '2026-11-10:m-18': {
    attendance: 'Đúng giờ',
    homework: 'Muộn CP',
    camera: 'Có',
    generalNote: 'Chú Vinh đi đón cháu tan học nên xin phép gửi bài trễ 25 phút.',
  },

  // 2026-11-12 (Chú Kiều Văn Sơn m-24 mới tham gia từ ngày này)
  '2026-11-12:m-03': {
    homeworkFeedback:
      'Thảo Nguyên chia sẻ cảm xúc ấm lòng khi chủ động gọi điện hỏi thăm thầy giáo cũ sau bài học.',
  },
  '2026-11-12:m-08': {
    homeworkFeedback:
      'Anh Thịnh duy trì 2 phút chia sẻ biết ơn đầu giờ giúp không khí Nhóm 2 luôn nhẹ nhàng, vui vẻ.',
  },
  '2026-11-12:m-10': {
    attendance: 'Muộn',
    homework: 'Đúng hạn',
    camera: 'Có',
    morningNote: 'Muộn 7 phút do trời mưa lớn về nhà trễ.',
  },
  '2026-11-12:m-17': {
    homeworkFeedback:
      'Cô Bích Ngọc chia sẻ cách giữ sự điềm tĩnh khi hướng dẫn nhân viên mới ở cửa hàng rất thực tế.',
  },
  '2026-11-12:m-22': {
    attendance: 'Đúng giờ',
    homework: 'Muộn',
    camera: 'Có',
    generalNote: 'Đã khỏe lại và vào lớp đúng giờ; bài đúc kết gửi trễ 20 phút.',
  },
  '2026-11-12:m-24': {
    homeworkFeedback:
      'Buổi đầu tiên tham gia lớp, chú Văn Sơn rất hào hứng, vào sớm bật cam rõ nét và viết bài đúc kết đầy đủ.',
  },

  // 2026-11-13
  '2026-11-13:m-11': {
    homeworkFeedback:
      'Ngọc Hân giữ trọn 2 tuần đều đặn và còn hướng dẫn thêm cho 2 cô chú trong nhóm cách chỉnh ảnh gửi bài.',
  },
  '2026-11-13:m-16': {
    homeworkFeedback:
      'Tấn Phát chia sẻ sự thay đổi tích cực từ việc nộp bài sát giờ sang luôn chủ động hoàn thành từ sớm.',
  },
  '2026-11-13:m-23': {
    homeworkFeedback:
      'Cô Hồng Nhung hoàn thành trọn vẹn cả 4 buổi Tuần 2 với tâm thế vui vẻ, là động lực lớn cho cả Nhóm 4.',
  },
};

function isEligibleForSeed(member: Member, date: string): boolean {
  if (member.joinedDate && date < member.joinedDate) return false;
  if (
    member.status === 'inactive' &&
    (!member.inactiveDate || date >= member.inactiveDate)
  ) {
    return false;
  }
  return true;
}

export function createSeedLogs(): DailyLog[] {
  const logs: DailyLog[] = [];

  for (const week of SEED_WEEKS) {
    for (const date of week.studyDates) {
      for (const member of SEED_MEMBERS) {
        if (!isEligibleForSeed(member, date)) {
          continue;
        }
        const override = LOG_OVERRIDES[`${date}:${member.id}`] ?? {};
        logs.push({
          id: `log-${date}-${member.id}`,
          date,
          weekNumber: week.weekNumber,
          memberId: member.id,
          attendance: override.attendance ?? 'Đúng giờ',
          homework: override.homework ?? 'Đúng hạn',
          camera: override.camera ?? 'Có',
          morningNote: override.morningNote ?? '',
          homeworkFeedback: override.homeworkFeedback ?? '',
          generalNote: override.generalNote ?? '',
        });
      }
    }
  }

  return logs;
}

export const SEED_LOGS: DailyLog[] = createSeedLogs();
