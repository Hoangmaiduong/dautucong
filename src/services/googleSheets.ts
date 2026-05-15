import Papa from 'papaparse';
import { Project, ProjectHistory } from '../types';

const SHEET_ID = '15VpUpgwZDq2TOFoa_2AxyfoaKuBl1nbjXe-YOYLAl-o';

export async function fetchMainProgress(): Promise<Project[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=TH%20ti%E1%BA%BFn%20%C4%91%E1%BB%99`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không thể kết nối đến Google Sheets.");
  const csvText = await res.text();

  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(csvText, {
      header: false,
      complete: (results) => {
        const data = results.data;
        const projects: Project[] = [];
        let currentCategory = 'Các dự án khác';
        let headerFound = false;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 2) continue;
          
          const col0 = row[0]?.toString().trim() || '';
          const col1 = row[1]?.toString().trim() || '';

          if (!headerFound) {
            if (col0 === 'TT' || col1.includes('Danh mục')) {
              headerFound = true;
            }
            continue;
          }

          if (!col0 && !col1) continue;

          // Recognize category rows (Roman numerals)
          if (/^[IVX]+$/.test(col0) || (col0 === '' && col1 && !row[2])) {
            currentCategory = col1 || currentCategory;
            continue;
          }

          if (col0 && col1) {
            projects.push({
              id: `${i}-${col1}`,
              tt: col0,
              name: col1,
              category: currentCategory,
              cumulative: row[2] || '',
              weekly: row[3] || '',
              upcoming: row[4] || '',
              evaluation: row[5] || ''
            });
          }
        }
        resolve(projects);
      },
      error: (error) => {
        reject(new Error("Lỗi khi đọc file CSV tổng hợp: " + error.message));
      }
    });
  });
}

export async function fetchProjectHistory(projectName: string): Promise<ProjectHistory[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(projectName)}`;
  const res = await fetch(url);
  
  if (!res.ok) throw new Error("Không tìm thấy sheet của dự án.");
  const csvText = await res.text();
  
  // Google Sheets returns HTML for 400 errors (bad query, missing sheet)
  if (csvText.trim().toLowerCase().startsWith('<!doctype') || csvText.trim().toLowerCase().startsWith('<html')) {
     throw new Error(`Không tìm thấy sheet mang tên "${projectName}". Vui lòng đảm bảo tên sheet khớp chính xác với tên dự án.`);
  }

  return new Promise((resolve, reject) => {
     Papa.parse<string[]>(csvText, {
      header: false,
      complete: (results) => {
        const data = results.data;
        const history: ProjectHistory[] = [];
        let headerFound = false;
        
        let dateIdx = 0, cumIdx = 1, weekIdx = 2, upIdx = 3;

        for (const row of data) {
           if (!row || row.length < 2) continue;
           const col0 = row[0]?.toString().trim() || '';
           
           if (!headerFound) {
             if (col0 === 'Ngày báo cáo' || col0.toLowerCase().includes('ngày')) {
                headerFound = true;
                dateIdx = row.findIndex(c => c?.includes('Ngày')) || 0;
                cumIdx = row.findIndex(c => c?.includes('Lũy kế')) || 1;
                weekIdx = row.findIndex(c => c?.includes('trong tuần')) || 2;
                upIdx = row.findIndex(c => c?.includes('Nhiệm vụ')) || 3;
                
                // Fallbacks if perfectly identical strings ain't matched
                if(dateIdx===-1) dateIdx=0;
                if(cumIdx===-1) cumIdx=1;
                if(weekIdx===-1) weekIdx=2;
                if(upIdx===-1) upIdx=3;
             }
             continue;
           }

           // Assuming rows with mostly empty values are noise/bottom spaces
           if (row[dateIdx] && (row[cumIdx] || row[weekIdx] || row[upIdx])) {
              history.push({
                 date: row[dateIdx],
                 cumulative: row[cumIdx] || '',
                 weekly: row[weekIdx] || '',
                 upcoming: row[upIdx] || ''
              });
           }
        }
        resolve(history);
      },
      error: () => reject(new Error("Lỗi khi đọc file báo cáo chi tiết dự án."))
     });
  });
}
