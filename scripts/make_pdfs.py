"""Genera los PDF de entrega digital y recursos del aula a partir de storage/content.json."""
import json, re, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from xml.sax.saxutils import escape as _esc

def escape(t):
    # Las fuentes base del PDF son Latin-1: sustituimos símbolos fuera de ese rango
    return _esc(str(t).replace('π', 'pi').replace('→', '->').replace('≥', '>='))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = json.load(open(f'{ROOT}/storage/content.json', encoding='utf-8'))
BUR, INK = colors.HexColor('#7b1230'), colors.HexColor('#0c0a0b')
base = ParagraphStyle('b', fontName='Times-Roman', fontSize=11, leading=16, spaceAfter=7, textColor=INK)
H1 = ParagraphStyle('h1', parent=base, fontName='Times-Bold', fontSize=24, leading=28, textColor=BUR, spaceAfter=6)
H2 = ParagraphStyle('h2', parent=base, fontName='Times-Bold', fontSize=15, leading=19, textColor=BUR, spaceBefore=12, spaceAfter=5)
KICK = ParagraphStyle('k', parent=base, fontName='Helvetica-Bold', fontSize=8, textColor=BUR, spaceAfter=4)
QUOTE = ParagraphStyle('q', parent=base, fontName='Times-Italic', fontSize=12, leftIndent=14, textColor=BUR)
SMALL = ParagraphStyle('s', parent=base, fontSize=9, leading=12, textColor=colors.HexColor('#6a5f63'))

def inline(t):
    t = escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)', r'\1<i>\2</i>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1', t)
    return t

def md(src):
    out = []
    for block in re.split(r'\n{2,}', src.replace('\r', '')):
        b = block.strip()
        if not b: continue
        if b.startswith('## '): out.append(Paragraph(inline(b[3:]), H2))
        elif b.startswith('- '):
            for l in b.split('\n'): out.append(Paragraph('•&nbsp;&nbsp;' + inline(l[2:]), ParagraphStyle('li', parent=base, leftIndent=14, firstLineIndent=-10, spaceAfter=3)))
            out.append(Spacer(1, 4))
        elif b.startswith('>'): out.append(Paragraph(inline(re.sub(r'^> ?', '', b, flags=re.M)), QUOTE))
        else: out.append(Paragraph(inline(b).replace('\n', '<br/>'), base))
    return out

def build(path, title, flow, subject):
    def deco(c, d):
        c.saveState(); c.setFillColor(BUR); c.rect(0, A4[1] - 0.9*cm, A4[0], 0.9*cm, stroke=0, fill=1)
        c.setFillColor(colors.white); c.setFont('Helvetica-Bold', 8); c.drawString(2*cm, A4[1] - 0.58*cm, 'BASE  Parkway'); c.setFont('Helvetica', 8); c.drawRightString(A4[0] - 2*cm, A4[1] - 0.58*cm, title[:70])
        c.setFillColor(colors.HexColor('#6a5f63')); c.setFont('Helvetica', 8); c.drawString(2*cm, 1.2*cm, 'Base Parkway · Editorial y aula académica · Uso personal'); c.drawRightString(A4[0] - 2*cm, 1.2*cm, f'{d.page}'); c.restoreState()
    doc = BaseDocTemplate(path, pagesize=A4, title=title, author='Base Parkway', subject=subject, leftMargin=2*cm, rightMargin=2*cm, topMargin=2.2*cm, bottomMargin=2*cm)
    doc.addPageTemplates([PageTemplate(id='p', frames=[Frame(2*cm, 2*cm, A4[0]-4*cm, A4[1]-4.4*cm, id='f')], onPage=deco)])
    doc.build(flow); print('ok', os.path.relpath(path, ROOT))

def table_ishango():
    rows = [['Columna', 'Grupos de marcas', 'Suma']]
    for k, v in C['ISHANGO'].items(): rows.append([f"{v['name']}", ', '.join(map(str, v['groups'])), str(sum(v['groups']))])
    rows.append(['Total', '16 grupos', '168'])
    t = Table(rows, colWidths=[4.5*cm, 9*cm, 2.5*cm])
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), BUR), ('TEXTCOLOR', (0,0), (-1,0), colors.white), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 10), ('GRID', (0,0), (-1,-1), .4, colors.HexColor('#cdbfc4')), ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6)]))
    return t

def cover(kicker, title, sub):
    return [Spacer(1, 3*cm), Paragraph(kicker, KICK), Paragraph(title, H1), Paragraph(sub, ParagraphStyle('sub', parent=base, fontSize=13, leading=18)), Spacer(1, .6*cm)]

src = Paragraph(f"<b>Fuente:</b> {escape(C['SRC'])} <br/>{escape(C['SRC_URL'])}", SMALL)
F = C['fichas']

# 1) Dossier
d = cover('DOSSIER · COLECCIÓN ISHANGO', 'El hueso de Ishango', 'Síntesis académica: hallazgo, tabla de columnas, primos gemelos y debate.')
d += [table_ishango(), Spacer(1, .5*cm)]
for f in F[:3]: d += [Paragraph(escape(f['kind']).upper(), KICK), Paragraph(escape(f['title']), H1.clone('h1b', fontSize=17, leading=21))] + md(re.sub(r'^## .*\n\n', '', f['body'], count=1) if False else f['body'])
d += [Spacer(1, .4*cm), Paragraph('Bibliografía y fuentes', H2), src, Paragraph('Alexander Marshack, Dirk Huylebrouck y Vladimir Pletser son citados en el artículo como parte del debate sobre la interpretación de las marcas.', SMALL)]
build(f'{ROOT}/storage/downloads/dossier-ishango.pdf', 'Dossier Ishango', d, 'Hueso de Ishango')

# 2) Colección completa
d = cover('COLECCIÓN ISHANGO', 'Cinco fichas editoriales', 'Objeto · Tabla · Primos gemelos · Números Empédocles · Debate')
d += [table_ishango(), PageBreak()]
for i, f in enumerate(F):
    d += [Paragraph(escape(f['kind']).upper(), KICK), Paragraph(escape(f['title']), H1), Paragraph(f"<i>{escape(f['subtitle'])}</i>", base)] + md(f['body']) + [Spacer(1, .3*cm), src]
    if i < len(F) - 1: d.append(PageBreak())
build(f'{ROOT}/storage/downloads/coleccion-fichas-ishango.pdf', 'Colección Ishango · cinco fichas', d, 'Fichas editoriales')

# 3) Guía didáctica
course = C['course']
d = cover('GUÍA DIDÁCTICA', course['title'], course['summary'])
d += [Paragraph('Estructura del curso', H2)]
for m in course['modules']:
    d.append(Paragraph(escape(m['title']), ParagraphStyle('m', parent=base, fontName='Times-Bold', fontSize=12, spaceBefore=6)))
    for l in m['lessons']: d.append(Paragraph(f"•&nbsp;&nbsp;{escape(l['title'])} <font color='#6a5f63'>({escape(l['kind'])}, {l['minutes']} min)</font>", ParagraphStyle('li', parent=base, leftIndent=14, firstLineIndent=-10, spaceAfter=2)))
d += [Paragraph('Rúbrica de evaluación', H2), Paragraph('Se aprueba cada evaluación con 70 %. Los talleres se valoran por: (1) exactitud de los cálculos, (2) claridad al distinguir dato, patrón e interpretación y (3) uso de la fuente citada.', base), PageBreak()]
for m in course['modules']:
    for l in m['lessons']:
        d += [Paragraph(escape(m['title']).upper(), KICK), Paragraph(escape(l['title']), H1.clone('h1c', fontSize=18, leading=22))] + md(l['body'])
        if l.get('quiz'): d += [Paragraph('Preguntas', H2)] + [Paragraph(f"{i+1}. {escape(q['q'])}", base) for i, q in enumerate(l['quiz'])]
        d.append(Spacer(1, .4*cm))
d.append(src)
build(f'{ROOT}/storage/downloads/guia-didactica-ishango.pdf', 'Guía didáctica · Ishango y los números primos', d, 'Curso piloto')

# 4) Hoja de trabajo (recurso del aula, solo matriculados)
d = [Spacer(1, .2*cm), Paragraph('HOJA DE TRABAJO', KICK), Paragraph('Criba de Eratóstenes y tabla de Ishango', H1), Paragraph('Tacha el 1 y los múltiplos de 2, 3, 5 y 7 (sin tachar esos números). Encierra los primos que queden y une con una línea las parejas (p, p+2).', base)]
grid = [[str(r*10 + c + 1) for c in range(10)] for r in range(10)]
t = Table(grid, colWidths=[1.6*cm]*10, rowHeights=[1.3*cm]*10)
t.setStyle(TableStyle([('GRID', (0,0), (-1,-1), .5, colors.HexColor('#cdbfc4')), ('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 11)]))
d += [t, Spacer(1, .6*cm), Paragraph('Tabla de Ishango para completar', H2), Paragraph('Anota la suma de cada columna y marca con un círculo los grupos cuyo número es primo.', base)]
rows = [['Columna', 'Grupos', 'Suma (completa)', 'Primos (cuántos)']]
for k, v in C['ISHANGO'].items(): rows.append([v['name'], ', '.join(map(str, v['groups'])), '', ''])
t2 = Table(rows, colWidths=[4*cm, 6.5*cm, 3.3*cm, 3.2*cm], rowHeights=[.9*cm] + [1.2*cm]*3)
t2.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), BUR), ('TEXTCOLOR', (0,0), (-1,0), colors.white), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('GRID', (0,0), (-1,-1), .4, colors.HexColor('#cdbfc4')), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('FONTSIZE', (0,0), (-1,-1), 10)]))
d += [t2, Spacer(1, .4*cm), Paragraph('Pregunta final: ¿qué evidencia adicional te convencería de que quienes tallaron el hueso conocían los números primos?', base)]
build(f'{ROOT}/storage/resources/hoja-de-trabajo-ishango.pdf', 'Hoja de trabajo · Ishango', d, 'Recurso del aula')
