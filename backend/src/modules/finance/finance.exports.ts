// Small text PDF writer: no HTML execution or third-party renderer required.
export function csv(rows: any[]) {
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const cell = (v: any) => { let s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); if (/^[\s]*[=+@-]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  return '\uFEFF' + [keys.map(cell).join(','), ...rows.map(r => keys.map(k => cell(r[k])).join(','))].join('\r\n');
}
export function pdf(title: string, metadata: string[], rows: any[]): Buffer {
  const clean = (v: any) => String(v ?? '').replace(/[^\x20-\x7e]/g, '?');
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const lines = [...metadata, 'Money values are integer INR paise (divide by 100).', '', ...rows.flatMap((r, i) => [`Record ${i + 1}`, ...keys.map(k => `${k}: ${typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k] ?? 'Unavailable'}`), ''])].flatMap(s => clean(s).match(/.{1,100}/g) || ['']);
  const pages: string[][] = []; for (let i = 0; i < Math.max(1, lines.length); i += 44) pages.push(lines.slice(i, i + 44));
  const objects: string[] = ['', '<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const refs: number[] = [];
  const escape = (s: string) => clean(s).replace(/[\\()]/g, '\\$&');
  pages.forEach((page, i) => {
    const pageId = objects.length, contentId = pageId + 1; refs.push(pageId);
    const stream = ['BT /F1 10 Tf 40 795 Td', `(${escape(`EventFlow | ${title} | Page ${i + 1}/${pages.length}`)}) Tj`, ...page.flatMap(line => ['0 -16 Td', `(${escape(line)}) Tj`]), 'ET'].join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`, `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });
  objects[2] = `<< /Type /Pages /Count ${refs.length} /Kids [${refs.map(r => `${r} 0 R`).join(' ')}] >>`;
  let result = '%PDF-1.4\n'; const offsets = [0];
  for (let i = 1; i < objects.length; i++) { offsets.push(Buffer.byteLength(result)); result += `${i} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = Buffer.byteLength(result); result += `xref\n0 ${objects.length}\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('') + `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(result);
}
