export interface Project {
  id: string; // generated ID to act as key
  tt: string; // STT in sheet
  name: string; // Project Name
  category: string; // Grouping (I, II, III, etc.)
  cumulative: string; // Lũy kế kết quả thực hiện đến nay
  weekly: string; // Nội dung thực hiện trong tuần
  upcoming: string; // Nhiệm vụ thời gian tới, đề xuất
  evaluation: string; // Đánh giá
}

export interface ProjectHistory {
  date: string; // Ngày báo cáo
  cumulative: string; // Lũy kế kết quả ...
  weekly: string; // Nội dung thực hiện ...
  upcoming: string; // Nhiệm vụ ...
}
