'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { SecureCache } from '@/lib/cache';

interface StudentFullInfo {
  $id: string;
  email: string;
  studentId: string;
  chineseName: string;
  englishName: string;
  classNameCn: string;
  classNameEn: string;
  classCode: string;
  groupLevel: string;
  level: string;
  phone: string;
  instagram: string;
  group: string;
  position: string;
  notes: string;
  role: string;
  requirePasswordChange: boolean;
  createdAt: string;
  attendanceStats: {
    total: number;
    present: number;
    late: number;
    absent: number;
  };
  projects: Array<{
    projectId: string;
    title: string;
    teamName: string;
    role: string;
    status: string;
  }>;
}

interface ImportPreview {
  headers: string[];
  rows: string[][];
  mapping: Record<string, string>;
  students: Array<{
    studentId: string;
    chineseName: string;
    englishName: string;
    classNameCn: string;
    classNameEn: string;
    classCode: string;
    groupLevel: string;
    level: string;
    phone: string;
    instagram: string;
    group: string;
    position: string;
    notes: string;
  }>;
}

const CACHE_KEY = 'admin_students_list';
const CACHE_TTL = 5 * 60 * 1000;

const importFields = [
  { key: 'studentId', label: '学号 *' },
  { key: 'chineseName', label: '中文姓名 *' },
  { key: 'englishName', label: '英文姓名' },
  { key: 'classNameCn', label: '班级 (中文)' },
  { key: 'classNameEn', label: '班级 (英文)' },
  { key: 'classCode', label: '班级代号' },
  { key: 'groupLevel', label: '高级组 / 初级组' },
  { key: 'level', label: '级别' },
  { key: 'phone', label: '电话号码' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'group', label: '分组' },
  { key: 'position', label: '职位' },
  { key: 'notes', label: '备注' },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentFullInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentFullInfo | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetMsg, setPasswordResetMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      if (!forceRefresh) {
        const cached = SecureCache.get<StudentFullInfo[]>(CACHE_KEY, {
          ttl: CACHE_TTL,
          encrypt: false,
        });
        if (cached && cached.length > 0) {
          setStudents(cached);
          setLoading(false);
          return;
        }
      }
      const response = await fetch('/api/admin/students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
        SecureCache.set(CACHE_KEY, data.students, { ttl: CACHE_TTL, encrypt: false });
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const detectColumnMapping = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const patterns: Record<string, string[]> = {
      studentId: ['学号', 'student id', 'id', '编号'],
      chineseName: ['中文姓名', '中文名', '姓名', 'chinese name', '名字'],
      englishName: ['英文姓名', '英文名', 'english name', 'name'],
      classNameCn: ['班级(中文)', '班级（中文）', '班级中文', 'class cn'],
      classNameEn: ['班级(英文)', '班级（英文）', '班级英文', 'class en', 'class'],
      classCode: ['班级代号', 'class code', '代号'],
      groupLevel: ['高级组/初级组', '学点&服务', '学点', '组别', 'group level'],
      level: ['级别', '课程&课室', '课程', 'level'],
      phone: ['电话号码', '电话', 'phone', '手机', '联系电话'],
      instagram: ['instagram', 'ig', 'ins', 'instagram (如有)', 'instagram(如有)'],
      group: ['分组', 'group', '小组'],
      position: ['职位', 'position', '职务', '岗位'],
      notes: ['备注', 'notes', 'remark', '说明'],
    };

    headers.forEach((header) => {
      const lowerHeader = header.toLowerCase().trim();
      for (const [field, fieldPatterns] of Object.entries(patterns)) {
        if (
          fieldPatterns.some(
            (p) => lowerHeader.includes(p.toLowerCase()) || lowerHeader === p.toLowerCase()
          )
        ) {
          if (!mapping[field]) {
            mapping[field] = header;
          }
          break;
        }
      }
    });
    return mapping;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        if (jsonData.length < 2) {
          alert('Excel 文件至少需要包含标题行和一行数据');
          return;
        }
        const headers = jsonData[0].map((h) => String(h || '').trim());
        const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell));
        const mapping = detectColumnMapping(headers);
        const parsedStudents = rows
          .map((row) => {
            const getCell = (colName: string) => {
              const headerName = mapping[colName];
              if (!headerName) return '';
              const idx = headers.indexOf(headerName);
              return idx >= 0 ? String(row[idx] || '').trim() : '';
            };
            return {
              studentId: getCell('studentId'),
              chineseName: getCell('chineseName'),
              englishName: getCell('englishName'),
              classNameCn: getCell('classNameCn'),
              classNameEn: getCell('classNameEn'),
              classCode: getCell('classCode'),
              groupLevel: getCell('groupLevel'),
              level: getCell('level'),
              phone: getCell('phone'),
              instagram: getCell('instagram'),
              group: getCell('group'),
              position: getCell('position'),
              notes: getCell('notes'),
            };
          })
          .filter((s) => s.studentId && s.chineseName);
        setImportPreview({
          headers,
          rows,
          mapping,
          students: parsedStudents,
        });
        setShowImportModal(true);
      } catch (error) {
        console.error('解析 Excel 失败:', error);
        alert('解析 Excel 文件失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateMapping = (field: string, headerName: string) => {
    if (!importPreview) return;
    const newMapping = { ...importPreview.mapping, [field]: headerName };
    const parsedStudents = importPreview.rows
      .map((row) => {
        const getCell = (colName: string) => {
          const hName = newMapping[colName];
          if (!hName) return '';
          const idx = importPreview.headers.indexOf(hName);
          return idx >= 0 ? String(row[idx] || '').trim() : '';
        };
        return {
          studentId: getCell('studentId'),
          chineseName: getCell('chineseName'),
          englishName: getCell('englishName'),
          classNameCn: getCell('classNameCn'),
          classNameEn: getCell('classNameEn'),
          classCode: getCell('classCode'),
          groupLevel: getCell('groupLevel'),
          level: getCell('level'),
          phone: getCell('phone'),
          instagram: getCell('instagram'),
          group: getCell('group'),
          position: getCell('position'),
          notes: getCell('notes'),
        };
      })
      .filter((s) => s.studentId && s.chineseName);
    setImportPreview({
      ...importPreview,
      mapping: newMapping,
      students: parsedStudents,
    });
  };

  const handleImport = async () => {
    if (!importPreview || importPreview.students.length === 0) {
      alert('没有有效的学生数据可导入');
      return;
    }
    setImporting(true);
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: importPreview.students,
        }),
      });
      const result = await response.json();
      setImportResult(result);
      if (result.success > 0) {
        SecureCache.remove(CACHE_KEY);
        fetchStudents(true);
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== '确认删除所有学生') {
      alert('请输入确认文本');
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch('/api/admin/students', {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        alert(`已删除 ${result.deleted} 名学生`);
        setShowDeleteAllModal(false);
        setDeleteConfirmText('');
        SecureCache.remove(CACHE_KEY);
        fetchStudents(true);
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('确定要删除这名学生吗？')) return;
    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        SecureCache.remove(CACHE_KEY);
        fetchStudents(true);
        if (selectedStudent?.$id === studentId) {
          setShowDetailModal(false);
          setSelectedStudent(null);
        }
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStudent || !newPassword) return;
    if (newPassword.length < 6) {
      setPasswordResetMsg({ type: 'error', text: '密码至少需要 6 位' });
      return;
    }
    setPasswordResetLoading(true);
    setPasswordResetMsg(null);
    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.$id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, requirePasswordChange: false }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordResetMsg({ type: 'success', text: '密码已成功重置' });
        setNewPassword('');
        setShowPasswordReset(false);
        setSelectedStudent({ ...selectedStudent, requirePasswordChange: false });
        setStudents((prev) =>
          prev.map((s) =>
            s.$id === selectedStudent.$id ? { ...s, requirePasswordChange: false } : s
          )
        );
        SecureCache.remove(CACHE_KEY);
      } else {
        setPasswordResetMsg({ type: 'error', text: data.error || '重置失败' });
      }
    } catch {
      setPasswordResetMsg({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedStudent(null);
    setShowPasswordReset(false);
    setNewPassword('');
    setPasswordResetMsg(null);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.chineseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.includes(searchTerm) ||
      s.classNameCn.includes(searchTerm) ||
      s.classNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.classCode.includes(searchTerm) ||
      s.group.includes(searchTerm) ||
      s.position.includes(searchTerm)
  );

  const totalPresent = students.reduce((sum, s) => sum + s.attendanceStats.present, 0);
  const totalProjects = students.reduce((sum, s) => sum + s.projects.length, 0);

  return (
    <AdminLayout>
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="eyebrow">Student Roster · 学生名册</div>
          <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-[34px]">
            学生名单管理
          </h1>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--text-secondary)]">
            管理所有学生账户，查看出勤记录与项目参与情况。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/students/create"
            className="inline-flex h-9 items-center gap-2 rounded-[3px] bg-[var(--primary)] px-3.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <span className="text-[14px] leading-none">+</span>
            创建学生
          </Link>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--rule-strong)] hover:bg-[var(--surface-hover)]"
          >
            <span className="material-symbols-outlined text-[15px] text-[var(--text-tertiary)]">
              upload_file
            </span>
            导入 Excel
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteAllModal(true)}
            disabled={students.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-[var(--error)]/40 px-3.5 text-[12px] font-semibold text-[var(--error)] transition-colors hover:bg-[var(--error-light)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
            删除全部
          </button>
        </div>
      </div>

      <section className="mb-5 border border-[var(--rule-strong)]">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {[
            { label: '学生总数', note: 'STUDENTS', value: students.length },
            { label: '累计出席', note: 'PRESENT', value: totalPresent },
            { label: '项目参与', note: 'PROJECTS', value: totalProjects },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`px-5 py-5 ${
                index === 0
                  ? 'border-b border-[var(--border)] sm:border-b-0 sm:border-r'
                  : index === 1
                    ? 'border-b border-[var(--border)] sm:border-b-0 sm:border-r'
                    : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="mono-label">{stat.label}</span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] sm:block">
                  {stat.note}
                </span>
              </div>
              <div className="mt-3 font-display text-[30px] font-bold leading-none tracking-[-0.04em] text-[var(--foreground)]">
                {loading ? '—' : stat.value}
              </div>
              <div className="mt-2 h-px w-8 bg-[var(--primary)]" />
            </div>
          ))}
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索姓名、邮箱、学号、班级或分组…"
          leftIcon="search"
          containerClassName="w-full max-w-[380px]"
        />
        <div className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          {filteredStudents.length} / {students.length} 条记录
        </div>
      </div>

      <section className="border border-[var(--rule-strong)]">
        {loading ? (
          <div className="flex items-center gap-3 px-5 py-12">
            <span className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Loading roster
            </span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={searchTerm ? 'person_search' : 'group'}
              title={searchTerm ? '没有找到匹配的学生' : '暂无学生数据'}
              description={
                searchTerm
                  ? '尝试更换关键词，或清空搜索条件后重新查看。'
                  : '通过 Excel 批量导入，或手动创建第一位学生账户。'
              }
              actionText={searchTerm ? undefined : '导入 Excel'}
              onAction={searchTerm ? undefined : () => fileInputRef.current?.click()}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                  {['学号', '中文姓名', '英文姓名', '班级', '分组'].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 font-mono text-[12px] font-normal uppercase tracking-[0.12em] text-[var(--text-tertiary)]"
                    >
                      {label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-mono text-[12px] font-normal uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                    出勤
                  </th>
                  <th className="px-4 py-3 text-center font-mono text-[12px] font-normal uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                    项目
                  </th>
                  <th className="px-4 py-3 text-center font-mono text-[12px] font-normal uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.$id}
                    className="cursor-pointer border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--primary-light)]"
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowDetailModal(true);
                    }}
                  >
                    <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-[var(--primary)]">
                      {student.studentId}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] font-semibold text-[var(--foreground)]">
                      {student.chineseName}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[var(--text-secondary)]">
                      {student.englishName || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[var(--text-secondary)]">
                      <div>{student.classNameCn || '—'}</div>
                      {student.classCode && (
                        <div className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                          {student.classCode}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[var(--text-secondary)]">
                      <div>{student.group || '—'}</div>
                      {student.position && (
                        <div className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--warning)]">
                          {student.position}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-center gap-1">
                        <span
                          title="出席"
                          className="inline-flex min-w-[26px] justify-center border border-[var(--primary)]/40 bg-[var(--primary-light)] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[var(--primary)]"
                        >
                          {student.attendanceStats.present}
                        </span>
                        <span
                          title="迟到"
                          className="inline-flex min-w-[26px] justify-center border border-[var(--warning)]/40 bg-[var(--warning-light)] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[var(--warning)]"
                        >
                          {student.attendanceStats.late}
                        </span>
                        <span
                          title="缺席"
                          className="inline-flex min-w-[26px] justify-center border border-[var(--error)]/40 bg-[var(--error-light)] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[var(--error)]"
                        >
                          {student.attendanceStats.absent}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[12px] ${
                          student.projects.length > 0
                            ? 'border-[var(--warning)]/40 text-[var(--warning)]'
                            : 'border-[var(--border)] text-[var(--text-tertiary)]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">folder</span>
                        {student.projects.length}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                            setShowDetailModal(true);
                          }}
                          className="border border-[var(--border)] p-1.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          title="查看详情"
                          aria-label={`查看 ${student.chineseName} 的详情`}
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                        </button>
                        <Link
                          href={`/admin/students/${student.$id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="border border-[var(--border)] p-1.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          title="编辑"
                          aria-label={`编辑 ${student.chineseName}`}
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudent(student.$id);
                          }}
                          className="border border-[var(--border)] p-1.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)]"
                          title="删除"
                          aria-label={`删除 ${student.chineseName}`}
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showImportModal && importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-[900px] flex-col border border-[var(--rule-strong)] bg-[var(--surface)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
              <div>
                <div className="mono-label">Import · Excel</div>
                <h2 className="mt-1 font-display text-[20px] font-bold text-[var(--foreground)]">
                  导入预览
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreview(null);
                  setImportResult(null);
                }}
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)]"
                aria-label="关闭导入预览"
              >
                <span className="material-symbols-outlined text-[19px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {importResult ? (
                <div>
                  <div className="border border-[var(--rule-strong)] px-5 py-8 text-center">
                    <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Import complete
                    </div>
                    <div className="mt-3 font-display text-[28px] font-bold text-[var(--foreground)]">
                      导入完成
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-6">
                      <div>
                        <div className="font-display text-[24px] font-bold text-[var(--primary)]">
                          {importResult.success}
                        </div>
                        <div className="mono-label mt-1">成功</div>
                      </div>
                      <div className="h-8 w-px bg-[var(--border)]" />
                      <div>
                        <div className="font-display text-[24px] font-bold text-[var(--error)]">
                          {importResult.failed}
                        </div>
                        <div className="mono-label mt-1">失败</div>
                      </div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-5 border border-[var(--error)]/40">
                      <div className="border-b border-[var(--error)]/30 px-4 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--error)]">
                        导入失败的记录
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {importResult.errors.map((err, idx) => (
                          <div
                            key={idx}
                            className="border-b border-[var(--border)] px-4 py-2.5 text-[12px] text-[var(--error)] last:border-b-0"
                          >
                            <strong className="font-semibold">{err.email}</strong>
                            <span className="text-[var(--text-secondary)]"> · {err.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="font-display text-[16px] font-bold text-[var(--foreground)]">
                        字段映射
                      </h3>
                      <span className="mono-label">自动识别 · 可手动调整</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {importFields.map(({ key, label }) => (
                        <div key={key}>
                          <label className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                            {label}
                          </label>
                          <select
                            value={importPreview.mapping[key] || ''}
                            onChange={(e) => updateMapping(key, e.target.value)}
                            className="w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-2.5 py-2 text-[12px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                          >
                            <option value="">未选择</option>
                            {importPreview.headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-[var(--rule-strong)] px-4 py-3.5">
                    <div className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--primary)]">
                      凭据规则
                    </div>
                    <div className="mt-2 space-y-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      <p>· 系统将自动使用学生的学号作为初始密码</p>
                      <p>· 学生首次登录时将被强制修改密码</p>
                      <p>· 新密码不能与学号或默认密码相同</p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-[16px] font-bold text-[var(--foreground)]">
                        数据预览
                      </h3>
                      <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                        共 {importPreview.students.length} 条有效记录
                      </span>
                    </div>
                    <div className="max-h-[300px] overflow-auto border border-[var(--border)]">
                      <table className="w-full min-w-[620px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                            {['#', '学号', '中文姓名', '英文姓名', '班级', '分组'].map((label) => (
                              <th
                                key={label}
                                className="sticky top-0 bg-[var(--surface-hover)] px-3 py-2.5 font-mono text-[12px] font-normal uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
                              >
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.students.slice(0, 50).map((s, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-[var(--border)] last:border-b-0"
                            >
                              <td className="px-3 py-2 font-mono text-[12px] text-[var(--text-tertiary)]">
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td className="px-3 py-2 font-mono text-[12px] text-[var(--primary)]">
                                {s.studentId}
                              </td>
                              <td className="px-3 py-2 text-[12px] text-[var(--foreground)]">
                                {s.chineseName}
                              </td>
                              <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                                {s.englishName || '—'}
                              </td>
                              <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                                {s.classNameCn || s.classNameEn || '—'}
                              </td>
                              <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                                {s.group || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importPreview.students.length > 50 && (
                        <div className="border-t border-[var(--border)] px-3 py-2.5 text-center font-mono text-[12px] text-[var(--text-tertiary)]">
                          还有 {importPreview.students.length - 50} 条记录未显示
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreview(null);
                  setImportResult(null);
                }}
              >
                {importResult ? '关闭' : '取消'}
              </Button>
              {!importResult && (
                <Button
                  variant="primary"
                  onClick={handleImport}
                  isLoading={importing}
                  disabled={
                    importing ||
                    importPreview.students.length === 0 ||
                    !importPreview.mapping.studentId ||
                    !importPreview.mapping.chineseName
                  }
                >
                  确认导入 {importPreview.students.length} 名学生
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[440px] border border-[var(--rule-strong)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--error)]">
                Danger zone
              </div>
              <h2 className="mt-1 font-display text-[20px] font-bold text-[var(--foreground)]">
                删除全部学生
              </h2>
            </div>
            <div className="px-5 py-5">
              <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                此操作将永久删除全部{' '}
                <strong className="font-semibold text-[var(--error)]">{students.length}</strong>{' '}
                名学生账户，且无法恢复。
              </p>
              <div className="mt-4">
                <Input
                  label="输入「确认删除所有学生」以继续"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="确认删除所有学生"
                />
              </div>
            </div>
            <div className="flex gap-2 border-t border-[var(--border)] px-5 py-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeleteConfirmText('');
                }}
              >
                取消
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteAll}
                isLoading={deleting}
                disabled={deleting || deleteConfirmText !== '确认删除所有学生'}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-[720px] flex-col border border-[var(--rule-strong)] bg-[var(--surface)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
              <div className="min-w-0">
                <div className="mono-label">Student record · 学生档案</div>
                <h2 className="mt-1 truncate font-display text-[22px] font-bold leading-tight text-[var(--foreground)]">
                  {selectedStudent.chineseName}
                </h2>
                <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  {selectedStudent.englishName || selectedStudent.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)]"
                aria-label="关闭学生详情"
              >
                <span className="material-symbols-outlined text-[19px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <span className="mono-label">基本资料</span>
                  <span className="font-mono text-[12px] text-[var(--primary)]">
                    #{selectedStudent.studentId}
                  </span>
                </div>
                <div className="grid grid-cols-2 border-l border-t border-[var(--border)] sm:grid-cols-3">
                  {[
                    ['学号', selectedStudent.studentId, 'mono'],
                    ['班级 (中文)', selectedStudent.classNameCn || '未设置'],
                    ['班级 (英文)', selectedStudent.classNameEn || '未设置'],
                    ['班级代号', selectedStudent.classCode || '未设置'],
                    ['分组', selectedStudent.group || '未设置'],
                    ['职位', selectedStudent.position || '未设置'],
                    ['高级组 / 初级组', selectedStudent.groupLevel || '未设置'],
                    ['级别', selectedStudent.level || '未设置'],
                    ['电话', selectedStudent.phone || '未设置'],
                    ['Instagram', selectedStudent.instagram || '未设置'],
                    ['登录邮箱', selectedStudent.email, 'mono'],
                  ].map(([label, value, mono]) => (
                    <div
                      key={label}
                      className="min-w-0 border-b border-r border-[var(--border)] px-3 py-2.5"
                    >
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                        {label}
                      </div>
                      <div
                        className={`mt-1 break-all text-[12px] ${
                          mono
                            ? 'font-mono text-[var(--primary)]'
                            : 'text-[var(--foreground)]'
                        }`}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                  <div className="col-span-2 border-b border-r border-[var(--border)] px-3 py-2.5 sm:col-span-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                      备注
                    </div>
                    <div className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {selectedStudent.notes || '无'}
                    </div>
                  </div>
                  <div className="col-span-2 border-b border-r border-[var(--border)] px-3 py-2.5 sm:col-span-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                      密码状态
                    </div>
                    {selectedStudent.requirePasswordChange ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="border border-[var(--warning)]/40 px-1.5 py-0.5 font-mono text-[12px] text-[var(--warning)]">
                          初始密码
                        </span>
                        <span className="font-mono text-[12px] text-[var(--text-secondary)]">
                          {selectedStudent.studentId} · 未更改
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--primary)]">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        已自行修改密码
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-b border-[var(--border)] px-5 py-4">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <span className="mono-label">出勤统计</span>
                  <span className="font-mono text-[12px] text-[var(--text-tertiary)]">
                    {selectedStudent.attendanceStats.total} 次记录
                  </span>
                </div>
                <div className="grid grid-cols-4 border border-[var(--border)]">
                  {[
                    {
                      label: '总计',
                      value: selectedStudent.attendanceStats.total,
                      className: 'text-[var(--foreground)]',
                    },
                    {
                      label: '出席',
                      value: selectedStudent.attendanceStats.present,
                      className: 'text-[var(--primary)]',
                    },
                    {
                      label: '迟到',
                      value: selectedStudent.attendanceStats.late,
                      className: 'text-[var(--warning)]',
                    },
                    {
                      label: '缺席',
                      value: selectedStudent.attendanceStats.absent,
                      className: 'text-[var(--error)]',
                    },
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`px-3 py-3 ${
                        index < 3 ? 'border-r border-[var(--border)]' : ''
                      }`}
                    >
                      <div
                        className={`font-display text-[22px] font-bold leading-none ${stat.className}`}
                      >
                        {stat.value}
                      </div>
                      <div className="mono-label mt-1.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <span className="mono-label">项目参与</span>
                  <span className="font-mono text-[12px] text-[var(--text-tertiary)]">
                    {selectedStudent.projects.length} 个项目
                  </span>
                </div>
                {selectedStudent.projects.length > 0 ? (
                  <div className="border border-[var(--border)]">
                    {selectedStudent.projects.map((project, idx) => (
                      <div
                        key={`${project.projectId}-${idx}`}
                        className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-3.5 py-3 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold text-[var(--foreground)]">
                            {project.title}
                          </div>
                          <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                            团队 {project.teamName || '—'} · 角色 {project.role || '—'}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 border px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.06em] ${
                            project.status === 'approved'
                              ? 'border-[var(--primary)]/40 bg-[var(--primary-light)] text-[var(--primary)]'
                              : 'border-[var(--warning)]/40 text-[var(--warning)]'
                          }`}
                        >
                          {project.status === 'approved'
                            ? '已批准'
                            : project.status === 'pending'
                              ? '待审核'
                              : project.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="border border-dashed border-[var(--border)] px-4 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
                    暂无项目参与
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4">
              {showPasswordReset && (
                <div className="mb-3 border border-[var(--warning)]/40 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--warning)]">
                      重置学生密码
                    </span>
                    {passwordResetMsg && (
                      <span
                        className={`font-mono text-[12px] ${
                          passwordResetMsg.type === 'success'
                            ? 'text-[var(--primary)]'
                            : 'text-[var(--error)]'
                        }`}
                      >
                        {passwordResetMsg.text}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] flex-1">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="输入新密码（至少 6 位）"
                        onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                        autoFocus
                        className="w-full rounded-[3px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 pr-10 text-[12px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--input-placeholder)] focus:border-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--foreground)]"
                        aria-label={showNewPassword ? '隐藏密码' : '显示密码'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showNewPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleResetPassword}
                      isLoading={passwordResetLoading}
                      disabled={passwordResetLoading || !newPassword}
                    >
                      确认
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setNewPassword('');
                        setPasswordResetMsg(null);
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteStudent(selectedStudent.$id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-[var(--error)]/40 px-3 text-[12px] font-semibold text-[var(--error)] transition-colors hover:bg-[var(--error-light)]"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  删除学生
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/students/${selectedStudent.$id}/edit`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-[var(--primary)] px-3 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    编辑信息
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset((v) => !v);
                      setPasswordResetMsg(null);
                      setNewPassword('');
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-[var(--warning)]/40 px-3 text-[12px] font-semibold text-[var(--warning)] transition-colors hover:bg-[var(--warning-light)]"
                  >
                    <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                    重置密码
                  </button>
                  <Button size="sm" variant="secondary" onClick={closeDetail}>
                    关闭
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
