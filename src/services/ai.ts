import { GoogleGenAI } from '@google/genai';
import { Project, ProjectHistory } from '../types';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function evaluateProjectProgress(project: Project, history: ProjectHistory[]): Promise<string> {
  const prompt = `Bạn là một chuyên gia quản lý dự án đầu tư công với nhiều năm kinh nghiệm. 
Tôi có dữ liệu tiến độ của một dự án. Hãy phân tích và đánh giá chi tiết tình hình thực hiện dự án này.

**Tên dự án:** ${project.name}
**Nhóm dự án:** ${project.category}

**Tình hình cập nhật mới nhất (Tổng hợp):**
- Lũy kế kết quả: ${project.cumulative}
- Thực hiện tuần này: ${project.weekly}
- Dự kiến/Đề xuất: ${project.upcoming}

**Lịch sử tiến độ các tuần gần đây (từ mới đến cũ):**
${history.map(h => `- Tuần (Báo cáo ngày ${h.date}):
   + Lũy kế: ${h.cumulative}
   + Thực hiện: ${h.weekly}
   + Dự kiến: ${h.upcoming}`).join('\n\n')}

**Yêu cầu chuyên gia thực hiện:**
1. **Đánh giá tổng quan tiến độ:** Dự án đang triển khai nhanh, chậm hay đúng tiến độ? Tại sao?
2. **Phân tích vướng mắc/Rủi ro:** Dựa vào dữ liệu, chỉ ra các "nút thắt" hoặc rủi ro tiềm ẩn (ví dụ: vướng GPMB, thủ tục chậm...).
3. **Hiệu suất công việc:** Nhận xét sự tiến triển qua các tuần. Công việc có được giải quyết dứt điểm không hay đang bị kéo dài?
4. **Đề xuất hành động:** Đưa ra 2-3 đề xuất hành động cụ thể, quyết liệt cho tuần tới để thúc đẩy dự án hoặc giải quyết vướng mắc.

Trình bày bằng ngôn ngữ rõ ràng, chuyên nghiệp, sử dụng định dạng Markdown (có in đậm, bullet points) cho dễ đọc. Trực tiếp đi vào đánh giá, không cần câu rào đón.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Không thể tạo đánh giá lúc này.";
  } catch (error) {
    console.error("AI Evaluation error:", error);
    throw new Error("Lỗi khi kết nối với AI. Vui lòng thử lại sau.");
  }
}
