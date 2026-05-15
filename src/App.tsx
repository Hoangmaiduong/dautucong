import React, { useEffect, useState } from 'react';
import { fetchMainProgress, fetchProjectHistory } from './services/googleSheets';
import { evaluateProjectProgress } from './services/ai';
import { Project, ProjectHistory } from './types';
import { AlertCircle, ArrowLeft, Bot, Calendar, CalendarDays, CheckCircle2, ChevronRight, Clock, FolderKanban, HardHat, LayoutDashboard, Loader2, Play } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectHistory, setProjectHistory] = useState<ProjectHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadMainData();
  }, []);

  const loadMainData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMainProgress();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (p: Project) => {
    setSelectedProject(p);
    setAiEvaluation(null);
    try {
      setLoadingHistory(true);
      setHistoryError(null);
      const history = await fetchProjectHistory(p.name);
      setProjectHistory(history);
    } catch (err: any) {
      setHistoryError(err.message || 'Lỗi khi tải lịch sử tiến độ.');
      setProjectHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedProject || projectHistory.length === 0) return;
    try {
      setEvaluating(true);
      const result = await evaluateProjectProgress(selectedProject, projectHistory);
      setAiEvaluation(result);
    } catch (err: any) {
      setAiEvaluation(`**Lỗi:** ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // Group projects by category
  const groupedProjects = projects.reduce((acc, project) => {
    if (!acc[project.category]) acc[project.category] = [];
    acc[project.category].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg font-medium">Đang tải dữ liệu tiến độ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center max-w-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button onClick={loadMainData} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center sticky top-0 z-10">
          <button 
            onClick={() => setSelectedProject(null)}
            className="flex items-center text-slate-500 hover:text-blue-600 transition p-2 -ml-2 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-semibold">Quay lại Bảng điểu khiển</span>
          </button>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 flex flex-col gap-6">
             {/* Project Info Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full mb-4">
                {selectedProject.category}
              </div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">
                {selectedProject.name}
              </h1>
              <p className="text-sm text-slate-500 font-medium mb-6">Mã TT: {selectedProject.tt}</p>
              
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" /> Tình trạng hiện tại (Tuần mới nhất)
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedProject.weekly || "Chưa có thông tin cập nhật tuần này."}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Action Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Bot className="w-24 h-24 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-indigo-900 mb-2 relative z-10 flex items-center">
                  <Bot className="w-5 h-5 mr-2" /> Cố vấn AI
                </h2>
                <p className="text-sm text-indigo-700 mb-6 relative z-10 leading-relaxed">
                  Phân tích thông minh dựa trên lịch sử tiến độ để phát hiện điểm nghẽn và đưa ra đề xuất.
                </p>
                <button
                  onClick={handleEvaluate}
                  disabled={evaluating || loadingHistory || projectHistory.length === 0}
                  className="w-full relative z-10 flex items-center justify-center p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-sm"
                >
                  {evaluating ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang phân tích...</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Phân tích dự án này</>
                  )}
                </button>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
             {/* AI Evaluation Result */}
             {aiEvaluation && (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-indigo-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold border-b border-indigo-100 pb-4 mb-6 text-indigo-900 flex items-center">
                  <Bot className="w-6 h-6 mr-3 text-indigo-600" /> Báo cáo Đánh giá từ AI
                </h3>
                <div className="prose prose-slate prose-indigo max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-li:marker:text-indigo-400">
                  <Markdown>{aiEvaluation}</Markdown>
                </div>
              </div>
            )}

            {/* History Timeline */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
              <h2 className="text-lg font-bold mb-6 flex items-center text-slate-800">
                <CalendarDays className="w-5 h-5 mr-2 text-slate-400" /> Lịch sử Cập nhật
              </h2>

              {loadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                   <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                   <p>Đang tải dữ liệu từ Google Sheets...</p>
                </div>
              ) : historyError ? (
                <div className="py-8 px-6 bg-amber-50 rounded-xl text-amber-800 border border-amber-200 flex items-start">
                   <AlertCircle className="w-6 h-6 mr-3 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="font-bold mb-1">Không thể lấy dữ liệu lịch sử</h4>
                     <p className="text-sm">{historyError}</p>
                   </div>
                </div>
              ) : projectHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  <p>Dự án này chưa có lịch sử báo cáo nào.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 py-2">
                  {projectHistory.map((hist, idx) => (
                    <div key={idx} className="relative pl-8">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />
                      <div className="mb-1 flex items-center">
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mr-3">
                          {hist.date}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 mt-3">
                        {hist.cumulative && (
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Lũy kế</span>
                            <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{hist.cumulative}</p>
                          </div>
                        )}
                         {hist.weekly && (
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Thực hiện trong tuần</span>
                            <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{hist.weekly}</p>
                          </div>
                        )}
                         {hist.upcoming && (
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Đề xuất / Kế hoạch</span>
                            <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{hist.upcoming}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-3 text-blue-600" />
            Tổng hợp Tiến độ Đầu tư công
          </h1>
          <div className="text-sm font-medium text-slate-500">
             {projects.length} dự án đang theo dõi
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-12">
        {Object.entries(groupedProjects).map(([category, projs]) => (
          <section key={category}>
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg mr-3">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 leading-none pb-0">
                {category}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projs.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className="group text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md mb-2">
                       Dự án #{project.tt}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 mb-3 group-hover:text-blue-700 transition">
                    {project.name}
                  </h3>
                  
                  <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                    {project.weekly || project.cumulative || "Chưa có thông tin tiến độ."}
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-semibold text-sm">
                    Xem chi tiết tiến độ
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
