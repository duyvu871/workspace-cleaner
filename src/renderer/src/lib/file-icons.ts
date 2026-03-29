import {
  File,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileJson,
  FileSpreadsheet,
  FileTerminal,
  Archive,
  Database,
  type LucideIcon,
} from 'lucide-react'

function extname(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot <= 0) return ''
  return filename.slice(dot)
}

type Category = 'image' | 'video' | 'audio' | 'code' | 'text' | 'data' | 'spreadsheet' | 'archive' | 'database' | 'executable' | 'other'

interface FileTypeInfo {
  icon: LucideIcon
  category: Category
  color: string
}

const EXT_MAP: Record<string, FileTypeInfo> = {
  // Images
  jpg:  { icon: FileImage, category: 'image', color: 'text-pink-400' },
  jpeg: { icon: FileImage, category: 'image', color: 'text-pink-400' },
  png:  { icon: FileImage, category: 'image', color: 'text-pink-400' },
  gif:  { icon: FileImage, category: 'image', color: 'text-pink-400' },
  webp: { icon: FileImage, category: 'image', color: 'text-pink-400' },
  svg:  { icon: FileImage, category: 'image', color: 'text-pink-400' },
  ico:  { icon: FileImage, category: 'image', color: 'text-pink-400' },
  bmp:  { icon: FileImage, category: 'image', color: 'text-pink-400' },
  tiff: { icon: FileImage, category: 'image', color: 'text-pink-400' },
  tif:  { icon: FileImage, category: 'image', color: 'text-pink-400' },
  heic: { icon: FileImage, category: 'image', color: 'text-pink-400' },
  avif: { icon: FileImage, category: 'image', color: 'text-pink-400' },
  raw:  { icon: FileImage, category: 'image', color: 'text-pink-400' },
  cr2:  { icon: FileImage, category: 'image', color: 'text-pink-400' },

  // Videos
  mp4:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  avi:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  mov:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  mkv:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  wmv:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  flv:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  webm: { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  m4v:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  ts:   { icon: FileVideo, category: 'video', color: 'text-violet-400' }, // transport stream (override code below)
  mts:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  m2ts: { icon: FileVideo, category: 'video', color: 'text-violet-400' },
  vob:  { icon: FileVideo, category: 'video', color: 'text-violet-400' },

  // Audio
  mp3:  { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },
  wav:  { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },
  flac: { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },
  aac:  { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },
  ogg:  { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },
  m4a:  { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },
  opus: { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },
  wma:  { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },
  aiff: { icon: FileAudio, category: 'audio', color: 'text-cyan-400' },

  // Code / Source
  js:     { icon: FileCode, category: 'code', color: 'text-yellow-400' },
  jsx:    { icon: FileCode, category: 'code', color: 'text-yellow-400' },
  tsx:    { icon: FileCode, category: 'code', color: 'text-blue-400' },
  py:     { icon: FileCode, category: 'code', color: 'text-yellow-400' },
  java:   { icon: FileCode, category: 'code', color: 'text-orange-400' },
  cpp:    { icon: FileCode, category: 'code', color: 'text-blue-400' },
  cc:     { icon: FileCode, category: 'code', color: 'text-blue-400' },
  c:      { icon: FileCode, category: 'code', color: 'text-blue-400' },
  h:      { icon: FileCode, category: 'code', color: 'text-blue-400' },
  hpp:    { icon: FileCode, category: 'code', color: 'text-blue-400' },
  rs:     { icon: FileCode, category: 'code', color: 'text-orange-400' },
  go:     { icon: FileCode, category: 'code', color: 'text-cyan-400' },
  rb:     { icon: FileCode, category: 'code', color: 'text-red-400' },
  php:    { icon: FileCode, category: 'code', color: 'text-purple-400' },
  cs:     { icon: FileCode, category: 'code', color: 'text-green-400' },
  swift:  { icon: FileCode, category: 'code', color: 'text-orange-400' },
  kt:     { icon: FileCode, category: 'code', color: 'text-purple-400' },
  kts:    { icon: FileCode, category: 'code', color: 'text-purple-400' },
  vue:    { icon: FileCode, category: 'code', color: 'text-green-400' },
  svelte: { icon: FileCode, category: 'code', color: 'text-orange-400' },
  dart:   { icon: FileCode, category: 'code', color: 'text-blue-400' },
  lua:    { icon: FileCode, category: 'code', color: 'text-blue-400' },
  html:   { icon: FileCode, category: 'code', color: 'text-orange-400' },
  htm:    { icon: FileCode, category: 'code', color: 'text-orange-400' },
  css:    { icon: FileCode, category: 'code', color: 'text-blue-400' },
  scss:   { icon: FileCode, category: 'code', color: 'text-pink-400' },
  sass:   { icon: FileCode, category: 'code', color: 'text-pink-400' },
  less:   { icon: FileCode, category: 'code', color: 'text-blue-400' },

  // Shell / Executable
  sh:       { icon: FileTerminal, category: 'executable', color: 'text-green-400' },
  bash:     { icon: FileTerminal, category: 'executable', color: 'text-green-400' },
  zsh:      { icon: FileTerminal, category: 'executable', color: 'text-green-400' },
  fish:     { icon: FileTerminal, category: 'executable', color: 'text-green-400' },
  exe:      { icon: FileTerminal, category: 'executable', color: 'text-slate-400' },
  appimage: { icon: FileTerminal, category: 'executable', color: 'text-slate-400' },
  deb:      { icon: FileTerminal, category: 'executable', color: 'text-slate-400' },
  rpm:      { icon: FileTerminal, category: 'executable', color: 'text-slate-400' },
  msi:      { icon: FileTerminal, category: 'executable', color: 'text-slate-400' },
  dmg:      { icon: FileTerminal, category: 'executable', color: 'text-slate-400' },
  apk:      { icon: FileTerminal, category: 'executable', color: 'text-slate-400' },

  // Text / Docs
  txt:      { icon: FileText, category: 'text', color: 'text-slate-400' },
  md:       { icon: FileText, category: 'text', color: 'text-slate-300' },
  markdown: { icon: FileText, category: 'text', color: 'text-slate-300' },
  log:      { icon: FileText, category: 'text', color: 'text-slate-400' },
  pdf:      { icon: FileText, category: 'text', color: 'text-red-400' },
  doc:      { icon: FileText, category: 'text', color: 'text-blue-400' },
  docx:     { icon: FileText, category: 'text', color: 'text-blue-400' },
  ppt:      { icon: FileText, category: 'text', color: 'text-orange-400' },
  pptx:     { icon: FileText, category: 'text', color: 'text-orange-400' },
  odt:      { icon: FileText, category: 'text', color: 'text-blue-400' },
  rtf:      { icon: FileText, category: 'text', color: 'text-slate-400' },

  // Data
  json:  { icon: FileJson, category: 'data', color: 'text-yellow-400' },
  jsonl: { icon: FileJson, category: 'data', color: 'text-yellow-400' },
  xml:   { icon: FileCode, category: 'data', color: 'text-orange-400' },
  yaml:  { icon: FileCode, category: 'data', color: 'text-red-400' },
  yml:   { icon: FileCode, category: 'data', color: 'text-red-400' },
  toml:  { icon: FileCode, category: 'data', color: 'text-orange-400' },
  ini:   { icon: FileCode, category: 'data', color: 'text-slate-400' },
  env:   { icon: FileCode, category: 'data', color: 'text-yellow-400' },

  // Spreadsheet
  csv:  { icon: FileSpreadsheet, category: 'spreadsheet', color: 'text-green-400' },
  xlsx: { icon: FileSpreadsheet, category: 'spreadsheet', color: 'text-green-400' },
  xls:  { icon: FileSpreadsheet, category: 'spreadsheet', color: 'text-green-400' },
  ods:  { icon: FileSpreadsheet, category: 'spreadsheet', color: 'text-green-400' },

  // Archive
  zip: { icon: Archive, category: 'archive', color: 'text-amber-400' },
  tar: { icon: Archive, category: 'archive', color: 'text-amber-400' },
  gz:  { icon: Archive, category: 'archive', color: 'text-amber-400' },
  bz2: { icon: Archive, category: 'archive', color: 'text-amber-400' },
  xz:  { icon: Archive, category: 'archive', color: 'text-amber-400' },
  '7z':{ icon: Archive, category: 'archive', color: 'text-amber-400' },
  rar: { icon: Archive, category: 'archive', color: 'text-amber-400' },
  zst: { icon: Archive, category: 'archive', color: 'text-amber-400' },

  // Database
  db:     { icon: Database, category: 'database', color: 'text-teal-400' },
  sqlite: { icon: Database, category: 'database', color: 'text-teal-400' },
  sql:    { icon: Database, category: 'database', color: 'text-teal-400' },
}

const FALLBACK: FileTypeInfo = { icon: File, category: 'other', color: 'text-muted-foreground' }

export function getFileTypeInfo(filename: string): FileTypeInfo {
  const ext = extname(filename).toLowerCase().slice(1)
  return EXT_MAP[ext] ?? FALLBACK
}

export type { FileTypeInfo }
