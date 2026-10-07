# -*- coding: utf-8 -*-
"""
Script to generate the complete Risk Management Manual and Plan for Fiscal Year 2570
for Fang Kham Subdistrict Administrative Organization (SAO), Sirindhorn District, Ubon Ratchathani.
"""
import os
import shutil
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def format_run(run, font_name="TH Sarabun PSK", size_pt=16, bold=False, italic=False, color_rgb=(0,0,0)):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*color_rgb)
    rPr = run._r.get_or_add_rPr()
    rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{font_name}" w:hAnsi="{font_name}" w:cs="{font_name}"/>')
    rPr.append(rFonts)

def add_p(doc, text="", font_name="TH Sarabun PSK", size_pt=16, bold=False, italic=False, 
          align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=4, line_spacing=1.15,
          indent=0, color_rgb=(0,0,0)):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if indent > 0:
        p.paragraph_format.first_line_indent = Inches(indent)
    if text:
        run = p.add_run(text)
        format_run(run, font_name, size_pt, bold, italic, color_rgb)
    return p

def add_heading_1(doc, text):
    p = add_p(doc, text, size_pt=18, bold=True, color_rgb=(30, 58, 138), space_before=12, space_after=6)
    return p

def add_heading_2(doc, text):
    p = add_p(doc, text, size_pt=16, bold=True, color_rgb=(15, 23, 42), space_before=8, space_after=4)
    return p

def format_cell(cell, text, bold=False, size_pt=14, align=WD_ALIGN_PARAGRAPH.LEFT, bg_hex=None, text_color=(0,0,0)):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(text)
    format_run(run, size_pt=size_pt, bold=bold, color_rgb=text_color)
    if bg_hex:
        set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

def build_manual():
    doc = Document()
    
    # Page setup - A4 Portrait
    for section in doc.sections:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        section.top_margin = Cm(2.54)
        section.bottom_margin = Cm(2.54)
        section.left_margin = Cm(2.8)
        section.right_margin = Cm(2.2)
        section.different_first_page_header_footer = True
        
    print("Writing Document Cover Page...")
    # ------------------ COVER PAGE ------------------
    add_p(doc, "", space_before=40)
    add_p(doc, "คู่มือและแผนการบริหารจัดการความเสี่ยง", size_pt=26, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_after=8)
    add_p(doc, "ประจำปีงบประมาณ พ.ศ. ๒๕๗๐", size_pt=22, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(51, 65, 85), space_after=24)
    
    add_p(doc, "------------------------------------------------------------", size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(148, 163, 184), space_after=24)
    
    add_p(doc, "ตามพระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. ๒๕๖๑ มาตรา ๗๙", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(71, 85, 105), space_after=4)
    add_p(doc, "และหลักเกณฑ์กระทรวงการคลังว่าด้วยมาตรฐานและหลักเกณฑ์ปฏิบัติ", size_pt=15, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(71, 85, 105), space_after=4)
    add_p(doc, "การบริหารจัดการความเสี่ยงสำหรับหน่วยงานของรัฐ พ.ศ. ๒๕๖๒", size_pt=15, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(71, 85, 105), space_after=60)
    
    add_p(doc, "องค์การบริหารส่วนตำบลฝางคำ", size_pt=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_after=4)
    add_p(doc, "อำเภอสิรินธร จังหวัดอุบลราชธานี", size_pt=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(51, 65, 85), space_after=6)
    add_p(doc, "โทรศัพท์ ๐ ๔๕๒๕ ๒๕๘๖  |  เว็บไซต์ www.fangkham.go.th", size_pt=15, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(100, 116, 139), space_after=0)
    
    doc.add_page_break()

    # ------------------ PREFACE ------------------
    print("Writing Preface (คำนำ)...")
    add_p(doc, "คำนำ", size_pt=22, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_before=10, space_after=18)
    
    add_p(doc, "การบริหารจัดการความเสี่ยง (Risk Management) ถือเป็นกลไกและเครื่องมือสำคัญในการบริหารจัดการภาครัฐตามหลักธรรมาภิบาล สอดคล้องตามบทบัญญัติแห่งพระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. ๒๕๖๑ มาตรา ๗๙ ซึ่งกำหนดให้หน่วยงานของรัฐจัดให้มีการตรวจสอบภายใน การควบคุมภายใน และการบริหารจัดการความเสี่ยง โดยให้ถือปฏิบัติตามมาตรฐานและหลักเกณฑ์ที่กระทรวงการคลังกำหนด ประกอบกับหนังสือกระทรวงการคลัง ที่ กค ๐๔๐๙.๔/ว ๒๓ ลงวันที่ ๑๙ มีนาคม ๒๕๖๒ เรื่อง หลักเกณฑ์กระทรวงการคลังว่าด้วยมาตรฐานและหลักเกณฑ์ปฏิบัติการบริหารจัดการความเสี่ยงสำหรับหน่วยงานของรัฐ พ.ศ. ๒๕๖๒ และกรอบการบริหารความเสี่ยงระดับองค์กรตามมาตรฐานสากล (COSO Enterprise Risk Management: ERM)", 
          indent=0.5, space_after=8)
          
    add_p(doc, "องค์การบริหารส่วนตำบลฝางคำ อำเภอสิรินธร จังหวัดอุบลราชธานี ได้ตระหนักถึงความสำคัญของการบริหารจัดการความเสี่ยง เพื่อให้การปฏิบัติงานตามภารกิจอำนาจหน้าที่และการจัดบริการสาธารณะแก่ประชาชนในเขตตำบลฝางคำทั้ง ๔ หมู่บ้าน (บ้านคำก้อม บ้านฝางเทิง บ้านโนนจิก และบ้านคำกลาง) เป็นไปอย่างมีประสิทธิภาพ ประสิทธิผล และคุ้มค่าสูงสุด จึงได้ดำเนินการจัดทำ \"คู่มือและแผนการบริหารจัดการความเสี่ยง ประจำปีงบประมาณ พ.ศ. ๒๕๗๐\" ขึ้น โดยบูรณาการการดำเนินงานร่วมกันระหว่างทุกส่วนราชการ ได้แก่ สำนักปลัด กองคลัง กองช่าง กองการศึกษา ศาสนาและวัฒนธรรม (รวมถึงศูนย์พัฒนาเด็กเล็กวัดเจริญทัศน์ และศูนย์พัฒนาเด็กเล็กบ้านฝางเทิง) และกองสวัสดิการสังคม โดยมีหน่วยตรวจสอบภายในทำหน้าที่สอบทานและประเมินผลอย่างเป็นอิสระตามหลักการ Three Lines Model", 
          indent=0.5, space_after=8)

    add_p(doc, "คู่มือและแผนฉบับนี้ ได้รับการทบทวนและปรับปรุงเนื้อหาให้สอดรับกับบริบทความเสี่ยงที่แท้จริงในพื้นที่ตำบลฝางคำ และข้อกำหนดทางกฎหมายในปัจจุบันอย่างรอบด้าน อาทิ ความปลอดภัยทางไซเบอร์และการคุ้มครองข้อมูลส่วนบุคคล (PDPA) การปฏิบัติราชการทางอิเล็กทรอนิกส์ การป้องกันและบรรเทาสาธารณภัยในพื้นที่ติดอ่างเก็บน้ำเขื่อนสิรินธรและแหล่งท่องเที่ยวชายหาดฝางเทิง การพัฒนาระบบประปาหมู่บ้านและไฟฟ้าสาธารณะ การบริหารจัดการอาหารกลางวันและอาหารเสริมนมของเด็กปฐมวัย การดูแลผู้สูงอายุและกลุ่มเปราะบาง รวมถึงความโปร่งใสในการจัดซื้อจัดจ้างและการป้องกันการทุจริตตามเกณฑ์ ITA", 
          indent=0.5, space_after=8)

    add_p(doc, "องค์การบริหารส่วนตำบลฝางคำ หวังเป็นอย่างยิ่งว่าคู่มือและแผนการบริหารจัดการความเสี่ยงเล่มนี้ จะเป็นกรอบแนวทางที่ชัดเจนและเป็นประโยชน์แก่ผู้บริหารและเจ้าหน้าที่ผู้ปฏิบัติงานทุกท่าน ในการร่วมกันควบคุมและลดทอนความเสี่ยงให้อยู่ในระดับที่ยอมรับได้ เพื่อประโยชน์สุขสูงสุดของประชาชนชาวตำบลฝางคำอย่างยั่งยืนต่อไป", 
          indent=0.5, space_after=24)

    add_p(doc, "องค์การบริหารส่วนตำบลฝางคำ", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=4)
    add_p(doc, "อำเภอสิรินธร จังหวัดอุบลราชธานี", size_pt=16, align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=0)

    doc.add_page_break()

    # ------------------ TABLE OF CONTENTS ------------------
    print("Writing Table of Contents (สารบัญ)...")
    add_p(doc, "สารบัญ", size_pt=22, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_before=10, space_after=18)
    
    toc_table = doc.add_table(rows=1, cols=2)
    toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    toc_table.autofit = False
    toc_table.columns[0].width = Cm(13.5)
    toc_table.columns[1].width = Cm(2.5)
    
    format_cell(toc_table.rows[0].cells[0], "เรื่อง", bold=True, size_pt=16, bg_hex="F1F5F9")
    format_cell(toc_table.rows[0].cells[1], "หน้า", bold=True, size_pt=16, align=WD_ALIGN_PARAGRAPH.RIGHT, bg_hex="F1F5F9")
    
    toc_items = [
        ("ส่วนที่ ๑: หลักการ เหตุผล และกรอบแนวคิดการบริหารจัดการความเสี่ยง", "๑"),
        ("     ๑.๑ ความเป็นมาและหลักการตามกฎหมาย", "๑"),
        ("     ๑.๒ วัตถุประสงค์ของการจัดทำคู่มือและแผนบริหารความเสี่ยง", "๒"),
        ("     ๑.๓ นิยามศัพท์สำคัญด้านการบริหารจัดการความเสี่ยง", "๒"),
        ("     ๑.๔ กรอบแนวคิดการบริหารความเสี่ยงระดับองค์กร (COSO ERM)", "๓"),
        ("     ๑.๕ ประเภทของความเสี่ยงตามหลักเกณฑ์กระทรวงการคลัง (๖ ด้าน)", "๔"),
        ("     ๑.๖ ความสัมพันธ์ ๔ เสาหลัก: ธรรมาภิบาล การควบคุมภายใน การบริหารความเสี่ยง และการตรวจสอบภายใน (Three Lines Model)", "๕"),
        ("ส่วนที่ ๒: โครงสร้างและแนวทางการดำเนินงานบริหารความเสี่ยง อบต.ฝางคำ", "๗"),
        ("     ๒.๑ ข้อมูลทั่วไปและบริบทเชิงพื้นที่ อบต.ฝางคำ", "๗"),
        ("     ๒.๒ โครงสร้างคณะกรรมการและคณะทำงานบริหารความเสี่ยง", "๘"),
        ("     ๒.๓ บทบาทหน้าที่และความรับผิดชอบตามภารกิจ", "๙"),
        ("     ๒.๔ ยุทธศาสตร์การพัฒนา อบต.ฝางคำ (๗ ยุทธศาสตร์)", "๑๐"),
        ("ส่วนที่ ๓: เกณฑ์มาตรฐานและเครื่องมือการวิเคราะห์ความเสี่ยง", "๑๑"),
        ("     ๓.๑ กระบวนการบริหารความเสี่ยง ๕ ขั้นตอน", "๑๑"),
        ("     ๓.๒ เกณฑ์การประเมินระดับโอกาสการเกิดความเสี่ยง (Likelihood)", "๑๒"),
        ("     ๓.๓ เกณฑ์การประเมินระดับผลกระทบของความเสี่ยง (Impact) ทั้งเชิงปริมาณและเชิงคุณภาพ", "๑๓"),
        ("     ๓.๔ แผนภูมิประเมินระดับความเสี่ยง (Risk Assessment Matrix 5x5)", "๑๕"),
        ("     ๓.๕ กลยุทธ์และการตอบสนองต่อความเสี่ยง (4T Strategies)", "๑๖"),
        ("ส่วนที่ ๔: แผนการดำเนินงานและปฏิทินปฏิบัติงาน ประจำปีงบประมาณ พ.ศ. ๒๕๗๐", "๑๗"),
        ("     ๔.๑ แผนภูมิขั้นตอนการดำเนินงานบริหารความเสี่ยง", "๑๗"),
        ("     ๔.๒ ปฏิทินและกรอบระยะเวลาปฏิบัติงานตลอด ๔ ไตรมาส (๑๔ กิจกรรม)", "๑๘"),
        ("ส่วนที่ ๕: แผนบริหารจัดการความเสี่ยงรายภารกิจ ประจำปีงบประมาณ พ.ศ. ๒๕๗๐", "๒๑"),
        ("     ๕.๑ แบบ บส. ๑: กำหนดขอบเขตความรับผิดชอบตามประเด็นยุทธศาสตร์/โครงการสำคัญ (๑๖ รายการ)", "๒๑"),
        ("     ๕.๒ แบบ บส. ๒: การวิเคราะห์โอกาส ผลกระทบ และการตอบสนองความเสี่ยง", "๒๗"),
        ("     ๕.๓ แบบ บส. ๓: รายงานการจัดทำแผนบริหารความเสี่ยง (มาตรการปฏิบัติการและตัวชี้วัด)", "๓๓"),
        ("ภาคผนวก", "๔๑"),
        ("     ภาคผนวก ก: ร่างคำสั่งแต่งตั้งคณะกรรมการและคณะทำงานบริหารความเสี่ยง ปีงบประมาณ พ.ศ. ๒๕๗๐", "๔๒"),
        ("     ภาคผนวก ข: ร่างประกาศเจตนารมณ์และนโยบายการบริหารความเสี่ยง ปีงบประมาณ พ.ศ. ๒๕๗๐", "๔๔")
    ]
    
    for title, page_str in toc_items:
        row = toc_table.add_row()
        bold = ("ส่วนที่" in title or "ภาคผนวก" in title)
        color = (30, 58, 138) if bold else (15, 23, 42)
        format_cell(row.cells[0], title, bold=bold, size_pt=14, text_color=color)
        format_cell(row.cells[1], page_str, bold=bold, size_pt=14, align=WD_ALIGN_PARAGRAPH.RIGHT, text_color=color)
        
    set_table_borders(toc_table, color="E2E8F0", sz="4")
    doc.add_page_break()

    # ------------------ SECTION 1 ------------------
    print("Writing Section 1: Principles & Framework...")
    add_p(doc, "ส่วนที่ ๑", size_pt=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_before=10, space_after=4)
    add_p(doc, "หลักการ เหตุผล และกรอบแนวคิดการบริหารจัดการความเสี่ยง", size_pt=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(51, 65, 85), space_after=14)
    add_p(doc, "------------------------------------------------------------", size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(203, 213, 225), space_after=14)

    add_heading_1(doc, "๑.๑ ความเป็นมาและหลักการตามกฎหมาย")
    add_p(doc, "สภาวะแวดล้อมในการดำเนินงานขององค์กรปกครองส่วนท้องถิ่นในปัจจุบันต้องเผชิญกับความไม่แน่นอนและการเปลี่ยนแปลงอย่างรวดเร็ว ทั้งด้านกฎหมาย ระเบียบวิธีปฏิบัติ นวัตกรรมเทคโนโลยีดิจิทัล ความคาดหวังของประชาชน ความผันผวนทางเศรษฐกิจ และการเปลี่ยนแปลงของสภาพภูมิอากาศ (Climate Change) ซึ่งปัจจัยดังกล่าวอาจส่งผลกระทบต่อการดำเนินงานขององค์กร ทำให้ภารกิจไม่บรรลุตามเป้าหมาย หรือก่อให้เกิดความเสียหายแก่ทรัพย์สิน ชื่อเสียง และความเชื่อมั่นของประชาชน", 
          indent=0.5, space_after=6)
    add_p(doc, "เพื่อป้องกันความสูญเสียและเสริมสร้างธรรมาภิบาลในการบริหารงาน พระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. ๒๕๖๑ มาตรา ๗๙ จึงได้บัญญัติกำหนดว่า \"ให้หน่วยงานของรัฐจัดให้มีการตรวจสอบภายใน การควบคุมภายใน และการบริหารจัดการความเสี่ยง โดยให้ถือปฏิบัติตามมาตรฐานและหลักเกณฑ์ที่กระทรวงการคลังกำหนด\" ประกอบกับกระทรวงการคลังได้ออกหนังสือ ที่ กค ๐๔๐๙.๔/ว ๒๓ ลงวันที่ ๑๙ มีนาคม ๒๕๖๒ เรื่อง หลักเกณฑ์กระทรวงการคลังว่าด้วยมาตรฐานและหลักเกณฑ์ปฏิบัติการบริหารจัดการความเสี่ยงสำหรับหน่วยงานของรัฐ พ.ศ. ๒๕๖๒ และหนังสือสั่งการกรมส่งเสริมการปกครองท้องถิ่นที่เกี่ยวข้อง", 
          indent=0.5, space_after=6)
    add_p(doc, "องค์การบริหารส่วนตำบลฝางคำ จึงต้องขับเคลื่อนการบริหารจัดการความเสี่ยงให้เป็นระบบงานสำคัญประจำวัน ควบคู่ไปกับระบบการควบคุมภายในและการตรวจสอบภายในอย่างเป็นรูปธรรม เพื่อให้มั่นใจได้ว่าการบริหารจัดการทรัพยากรสาธารณะเป็นไปอย่างคุ้มค่า โปร่งใส ตรวจสอบได้ และสามารถบรรลุพันธกิจตามแผนพัฒนาท้องถิ่นได้อย่างมีประสิทธิภาพสูงสุด", 
          indent=0.5, space_after=10)

    add_heading_1(doc, "๑.๒ วัตถุประสงค์ของการจัดทำคู่มือและแผนบริหารความเสี่ยง")
    add_p(doc, "๑) เพื่อเป็นแนวทางปฏิบัติงานมาตรฐานสำหรับบุคลากรทุกส่วนราชการขององค์การบริหารส่วนตำบลฝางคำ ให้มีความรู้ ความเข้าใจ และสามารถนำกระบวนการบริหารจัดการความเสี่ยงไปประยุกต์ใช้ในการปฏิบัติงานจริงได้อย่างมีทิศทางเดียวกัน", 
          indent=0.5, space_after=4)
    add_p(doc, "๒) เพื่อระบุ วิเคราะห์ และประเมินปัจจัยเสี่ยงที่อาจเป็นอุปสรรคต่อการบรรลุเป้าหมายตามยุทธศาสตร์ แผนพัฒนาท้องถิ่น ข้อบัญญัติงบประมาณรายจ่าย และการจัดบริการสาธารณะของ อบต.ฝางคำ", 
          indent=0.5, space_after=4)
    add_p(doc, "๓) เพื่อกำหนดมาตรการควบคุมและกิจกรรมการจัดการความเสี่ยง (Risk Mitigation Plan) ที่มีประสิทธิภาพ คุ้มค่า และสามารถลดระดับความเสี่ยงให้อยู่ในระดับที่องค์กรยอมรับได้ (Risk Appetite)", 
          indent=0.5, space_after=4)
    add_p(doc, "๔) เพื่อใช้เป็นกรอบในการติดตาม ประเมินผล และรายงานผลการบริหารจัดการความเสี่ยงต่อผู้บริหาร คณะกรรมการ และหน่วยงานตรวจสอบภายนอกอย่างต่อเนื่อง", 
          indent=0.5, space_after=10)

    add_heading_1(doc, "๑.๓ นิยามศัพท์สำคัญด้านการบริหารจัดการความเสี่ยง")
    definitions = [
        ("ความเสี่ยง (Risk)", "เหตุการณ์หรือสถานการณ์ที่ไม่แน่นอน ซึ่งหากเกิดขึ้นจะส่งผลกระทบในเชิงลบต่อการบรรลุวัตถุประสงค์ เป้าหมาย หรือภารกิจหลักของหน่วยงาน ทั้งในมิติด้านกลยุทธ์ การดำเนินงาน การเงิน และการปฏิบัติตามกฎหมาย"),
        ("การบริหารจัดการความเสี่ยง (Risk Management)", "กระบวนการที่เป็นระบบ ต่อเนื่อง และครอบคลุมทั่วทั้งองค์กร ซึ่งกำหนดขึ้นโดยฝ่ายบริหารและบุคลากร เพื่อระบุ ประเมิน จัดการ ติดตาม และรายงานความเสี่ยง ให้อยู่ในระดับที่ยอมรับได้ เพื่อให้เกิดความมั่นใจอย่างสมเหตุสมผลว่าองค์กรจะบรรลุเป้าหมาย"),
        ("ปัจจัยเสี่ยง (Risk Factors)", "สาเหตุ ต้นเหตุ หรือสภาวการณ์ทั้งจากภายในและภายนอกองค์กร ที่ก่อให้เกิดเหตุการณ์ความเสี่ยง เช่น บุคลากร กระบวนการ ระบบสารสนเทศ นโยบาย สภาพอากาศ เป็นต้น"),
        ("ระดับความเสี่ยงที่ยอมรับได้ (Risk Appetite)", "ระดับหรือปริมาณของความเสี่ยงในภาพรวมที่องค์การบริหารส่วนตำบลฝางคำพร้อมที่จะเผชิญหรือยอมรับได้ เพื่อให้บรรลุเป้าหมายตามพันธกิจ"),
        ("ระดับความเบี่ยงเบนของความเสี่ยงที่ยอมรับได้ (Risk Tolerance)", "ขอบเขตความเบี่ยงเบนของผลการดำเนินงานที่ยอมรับได้จากเป้าหมายที่กำหนดไว้ โดยไม่ส่งผลกระทบเสียหายต่อภารกิจหลัก"),
        ("เจ้าของความเสี่ยง (Risk Owner)", "หัวหน้าส่วนราชการหรือผู้รับผิดชอบกระบวนงานที่มีหน้าที่โดยตรงในการประเมิน ออกแบบมาตรการควบคุม และบริหารจัดการความเสี่ยงในกิจกรรมนั้นๆ")
    ]
    for term, desc in definitions:
        p = add_p(doc, f"• {term}: ", bold=True, space_after=3, indent=0.5)
        run = p.add_run(desc)
        format_run(run, bold=False)

    add_heading_1(doc, "๑.๔ กรอบแนวคิดการบริหารความเสี่ยงระดับองค์กร (COSO ERM 2017)")
    add_p(doc, "องค์การบริหารส่วนตำบลฝางคำ ได้นำกรอบการบริหารความเสี่ยงระดับองค์กรตามมาตรฐานสากล The Committee of Sponsoring Organizations of the Treadway Commission (COSO ERM 2017: Enterprise Risk Management - Integrating with Strategy and Performance) มาปรับใช้ ซึ่งประกอบด้วย ๕ องค์ประกอบหลักที่เชื่อมโยงกัน ได้แก่:", 
          indent=0.5, space_after=4)
    add_p(doc, "๑. การกำกับดูแลและวัฒนธรรมองค์กร (Governance and Culture): การสร้างวัฒนธรรมที่ตระหนักถึงความเสี่ยง การกำหนดบทบาทหน้าที่ของฝ่ายบริหารและคณะกรรมการที่ชัดเจน", indent=0.5, space_after=3)
    add_p(doc, "๒. กลยุทธ์และการกำหนดวัตถุประสงค์ (Strategy and Objective-Setting): การพิจารณาความเสี่ยงควบคู่กับการกำหนดยุทธศาสตร์และแผนพัฒนาท้องถิ่น", indent=0.5, space_after=3)
    add_p(doc, "๓. ผลการปฏิบัติงาน (Performance): การระบุความเสี่ยง การประเมินความรุนแรง การจัดลำดับความสำคัญ และการเลือกมาตรการตอบสนองความเสี่ยง", indent=0.5, space_after=3)
    add_p(doc, "๔. การทบทวนและการปรับปรุง (Review and Revision): การติดตามผลการจัดการความเสี่ยงเพื่อทบทวนว่ามาตรการที่ใช้ยังคงมีประสิทธิผลหรือไม่", indent=0.5, space_after=3)
    add_p(doc, "๕. ข้อมูล สารสนเทศ การสื่อสาร และการรายงาน (Information, Communication, and Reporting): การแลกเปลี่ยนข้อมูลความเสี่ยงทั่วทั้งองค์กรและการรายงานผลต่อผู้บริหารอย่างสม่ำเสมอ", indent=0.5, space_after=10)

    add_heading_1(doc, "๑.๕ ประเภทของความเสี่ยงตามหลักเกณฑ์กระทรวงการคลัง (๖ ด้าน)")
    add_p(doc, "เพื่อความครอบคลุมและสอดรับกับบริบท อบต.ฝางคำ ในปีงบประมาณ พ.ศ. ๒๕๗๐ จึงแบ่งประเภทความเสี่ยงออกเป็น ๖ ด้านหลัก ดังนี้:", 
          indent=0.5, space_after=4)
    risk_types = [
        ("๑. ความเสี่ยงด้านกลยุทธ์ (Strategic Risk - S)", "ความเสี่ยงที่เกิดจากการกำหนดนโยบาย ยุทธศาสตร์ แผนงาน หรือการตัดสินใจของผู้บริหารที่ไม่สอดคล้องกับสภาพแวดล้อมหรือความต้องการที่แท้จริงของประชาชน ทำให้ไม่สามารถบรรลุวิสัยทัศน์ของ อบต.ฝางคำ"),
        ("๒. ความเสี่ยงด้านการดำเนินงาน (Operational Risk - O)", "ความเสี่ยงที่เกิดจากกระบวนการทำงาน การใช้ทรัพยากร บุคลากร อุปกรณ์ เครื่องจักร หรือระบบงานขัดข้อง ส่งผลให้การจัดบริการสาธารณะล่าช้า ด้อยคุณภาพ หรือหยุดชะงัก"),
        ("๓. ความเสี่ยงด้านการเงินและการคลัง (Financial Risk - F)", "ความเสี่ยงที่เกิดจากความไม่เพียงพอของงบประมาณ การจัดเก็บรายได้ไม่เข้าเป้า การรั่วไหล ความผิดพลาดในระบบบัญชีและการเบิกจ่าย หรือภาระผูกพันทางการเงิน"),
        ("๔. ความเสี่ยงด้านการปฏิบัติตามกฎหมายและระเบียบ (Compliance Risk - C)", "ความเสี่ยงที่เกิดจากการไม่ปฏิบัติตาม หรือปฏิบัติไม่ถูกต้องตามกฎหมาย ระเบียบ ข้อบังคับ มติ ครม. หรือหนังสือสั่งการกระทรวงมหาดไทย/กระทรวงการคลัง"),
        ("๕. ความเสี่ยงด้านเทคโนโลยีสารสนเทศและดิจิทัล (IT & Cyber Risk - T)", "ความเสี่ยงจากระบบสารสนเทศล่ม การถูกโจมตีทางไซเบอร์ การละเมิดข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (PDPA) หรือปัญหาในระบบ e-Saraban / e-Payment"),
        ("๖. ความเสี่ยงด้านคุณธรรมและความโปร่งใส (Integrity & Corruption Risk - I)", "ความเสี่ยงที่เกี่ยวข้องกับการขัดกันระหว่างประโยชน์ส่วนตนกับประโยชน์ส่วนรวม การทุจริตเชิงนโยบาย การปฏิบัติหน้าที่โดยมิชอบ และการไม่ผ่านเกณฑ์การประเมิน ITA")
    ]
    for rt_title, rt_desc in risk_types:
        p = add_p(doc, f"{rt_title}: ", bold=True, space_after=3, indent=0.5)
        run = p.add_run(rt_desc)
        format_run(run, bold=False)

    add_heading_1(doc, "๑.๖ ความสัมพันธ์ ๔ เสาหลัก: ธรรมาภิบาล การควบคุมภายใน การบริหารความเสี่ยง และการตรวจสอบภายใน (Three Lines Model)")
    add_p(doc, "การบริหารจัดการที่ดี (Good Governance) เปรียบเสมือนร่มเงาที่สร้างความมั่นคงและเจริญเติบโตให้แก่องค์กร โดยมี ๔ เสาหลักที่ค้ำจุนและประสานสอดคล้องกันตามหลักสากล Three Lines Model ดังนี้:", 
          indent=0.5, space_after=4)
    add_p(doc, "• สายงานระดับที่ ๑ (1st Line - Operational Management): ผู้บริหารส่วนราชการและเจ้าหน้าที่ผู้ปฏิบัติงาน (สำนักปลัด, กองคลัง, กองช่าง, กองการศึกษา, กองสวัสดิการสังคม) เป็นเจ้าของความเสี่ยง (Risk Owners) มีหน้าที่ในการออกแบบ ดำเนินการ และควบคุมความเสี่ยงในกระบวนการทำงานประจำวัน", indent=0.5, space_after=3)
    add_p(doc, "• สายงานระดับที่ ๒ (2nd Line - Risk & Compliance Oversight): คณะกรรมการและคณะทำงานบริหารความเสี่ยง มีหน้าที่กำหนดนโยบาย กรอบแนวทาง พัฒนาเครื่องมือ ติดตาม และสนับสนุนให้ทุกส่วนราชการดำเนินการบริหารความเสี่ยงอย่างถูกต้องและสอดคล้องกับระเบียบ", indent=0.5, space_after=3)
    add_p(doc, "• สายงานระดับที่ ๓ (3rd Line - Independent Internal Audit): หน่วยตรวจสอบภายใน (นักวิชาการตรวจสอบภายใน) ทำหน้าที่ให้ความเชื่อมั่นอย่างเป็นอิสระและเที่ยงธรรม (Independent Assurance) ในการประเมินและสอบทานความเพียงพอของระบบการควบคุมภายในและการบริหารจัดการความเสี่ยง โดยไม่เข้าไปเป็นผู้จัดทำหรือตัดสินใจในมาตรการนั้นเอง เพื่อรักษาความเป็นอิสระตามมาตรฐานกระทรวงการคลัง", indent=0.5, space_after=10)

    doc.add_page_break()

    # ------------------ SECTION 2 ------------------
    print("Writing Section 2: Structure & Roles in Fang Kham SAO...")
    add_p(doc, "ส่วนที่ ๒", size_pt=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_before=10, space_after=4)
    add_p(doc, "โครงสร้างและแนวทางการดำเนินงานบริหารความเสี่ยง อบต.ฝางคำ", size_pt=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(51, 65, 85), space_after=14)
    add_p(doc, "------------------------------------------------------------", size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(203, 213, 225), space_after=14)

    add_heading_1(doc, "๒.๑ ข้อมูลทั่วไปและบริบทเชิงพื้นที่ อบต.ฝางคำ")
    add_p(doc, "องค์การบริหารส่วนตำบลฝางคำ ตั้งอยู่ในเขตอำเภอสิรินธร จังหวัดอุบลราชธานี มีประวัติความเป็นมาเชื่อมโยงกับการก่อสร้างเขื่อนสิรินธร (อ่างเก็บน้ำนิคมฯ ลำโดมน้อย) ปัจจุบันมีพื้นที่รับผิดชอบครอบคลุม ๔ หมู่บ้าน ได้แก่:", 
          indent=0.5, space_after=4)
    add_p(doc, "๑) หมู่ที่ ๑ บ้านคำก้อม: เป็นพื้นที่ชุมชนเกษตรกรรม และเป็นแหล่งท่องเที่ยวยอดนิยมด้านการกางเต็นท์ พักผ่อนธรรมชาติริมอ่างเก็บน้ำ", indent=0.5, space_after=3)
    add_p(doc, "๒) หมู่ที่ ๒ บ้านฝางเทิง: เป็นที่ตั้งของที่ทำการ อบต.ฝางคำ และแหล่งท่องเที่ยวแลนด์มาร์คสำคัญ \"ชายหาดฝางคำ (หาดฝางเทิง)\" มีกิจกรรมทางน้ำและการท่องเที่ยวชุมชน", indent=0.5, space_after=3)
    add_p(doc, "๓) หมู่ที่ ๓ บ้านโนนจิก: ชุมชนเกษตรกรรมและการทำประมงน้ำจืด", indent=0.5, space_after=3)
    add_p(doc, "๔) หมู่ที่ ๔ บ้านคำกลาง: ชุมชนเกษตรกรรม ปศุสัตว์ และหัตถกรรมพื้นบ้าน", indent=0.5, space_after=6)
    add_p(doc, "นอกจากนี้ อบต.ฝางคำ ยังมีหน่วยงานทางการศึกษาในความดูแล ได้แก่ ศูนย์พัฒนาเด็กเล็กวัดเจริญทัศน์, ศูนย์พัฒนาเด็กเล็กบ้านฝางเทิง และประสานการสนับสนุนอาหารกลางวัน-อาหารเสริมนมให้แก่โรงเรียนในสังกัด สพฐ. จำนวน ๓ แห่ง", 
          indent=0.5, space_after=10)

    add_heading_1(doc, "๒.๒ โครงสร้างคณะกรรมการและคณะทำงานบริหารความเสี่ยง ประจำปีงบประมาณ พ.ศ. ๒๕๗๐")
    add_p(doc, "เพื่อให้การบริหารจัดการความเสี่ยงมีกลไกขับเคลื่อนที่เข้มแข็ง อบต.ฝางคำ ได้กำหนดโครงสร้างคณะกรรมการและคณะทำงานบริหารจัดการความเสี่ยง ดังนี้:", 
          indent=0.5, space_after=6)
          
    committee_table = doc.add_table(rows=1, cols=3)
    committee_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    committee_table.autofit = False
    committee_table.columns[0].width = Cm(1.8)
    committee_table.columns[1].width = Cm(8.5)
    committee_table.columns[2].width = Cm(5.7)
    
    format_cell(committee_table.rows[0].cells[0], "ลำดับ", bold=True, size_pt=15, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(committee_table.rows[0].cells[1], "ตำแหน่งในการบริหารงาน", bold=True, size_pt=15, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(committee_table.rows[0].cells[2], "บทบาทหน้าที่ในคณะทำงาน", bold=True, size_pt=15, bg_hex="1E3A8A", text_color=(255,255,255))
    
    members = [
        ("๑", "นายกองค์การบริหารส่วนตำบลฝางคำ", "ประธานคณะทำงาน"),
        ("๒", "รองนายกองค์การบริหารส่วนตำบลฝางคำ", "รองประธานคณะทำงาน"),
        ("๓", "ปลัดองค์การบริหารส่วนตำบลฝางคำ", "คณะทำงาน"),
        ("๔", "รองปลัดองค์การบริหารส่วนตำบลฝางคำ", "คณะทำงาน"),
        ("๕", "ผู้อำนวยการกองคลัง", "คณะทำงาน"),
        ("๖", "ผู้อำนวยการกองช่าง", "คณะทำงาน"),
        ("๗", "ผู้อำนวยการกองการศึกษา ศาสนาและวัฒนธรรม", "คณะทำงาน"),
        ("๘", "ผู้อำนวยการกองสวัสดิการสังคม", "คณะทำงาน"),
        ("๙", "หัวหน้าสำนักปลัด", "คณะทำงานและเลขานุการ"),
        ("๑๐", "นักวิเคราะห์นโยบายและแผน", "คณะทำงานและผู้ช่วยเลขานุการ"),
        ("๑๑", "นักวิชาการตรวจสอบภายใน", "ผู้สอบทานและให้คำปรึกษา (อิสระ)")
    ]
    for idx, pos, role in members:
        row = committee_table.add_row()
        format_cell(row.cells[0], idx, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[1], pos, size_pt=14)
        is_bold = ("ประธาน" in role or "เลขานุการ" in role or "สอบทาน" in role)
        format_cell(row.cells[2], role, bold=is_bold, size_pt=14, text_color=(30, 58, 138) if is_bold else (0,0,0))
        
    set_table_borders(committee_table, color="CBD5E1", sz="4")
    add_p(doc, "", space_after=8)

    add_heading_1(doc, "๒.๓ ยุทธศาสตร์การพัฒนาขององค์การบริหารส่วนตำบลฝางคำ (๗ ยุทธศาสตร์)")
    add_p(doc, "การบริหารจัดการความเสี่ยงได้รับการจัดวางให้สอดคล้องกับยุทธศาสตร์การพัฒนาของ อบต.ฝางคำ ๗ ด้าน ได้แก่:", 
          indent=0.5, space_after=4)
    strategies = [
        ("ยุทธศาสตร์ที่ ๑", "การพัฒนาด้านโครงสร้างพื้นฐาน การคมนาคม สาธารณูปโภคและสาธารณูปการ"),
        ("ยุทธศาสตร์ที่ ๒", "การพัฒนาคุณภาพชีวิต การศึกษา สาธารณสุข และการพัฒนาสังคม"),
        ("ยุทธศาสตร์ที่ ๓", "การจัดระเบียบชุมชน สังคม และการรักษาความสงบเรียบร้อย การป้องกันและบรรเทาสาธารณภัย"),
        ("ยุทธศาสตร์ที่ ๔", "การวางแผน การส่งเสริมการลงทุน พาณิชยกรรม การท่องเที่ยว และการส่งเสริมอาชีพ"),
        ("ยุทธศาสตร์ที่ ๕", "การบริหารจัดการทรัพยากรธรรมชาติ สิ่งแวดล้อม และการจัดการขยะมูลฝอย"),
        ("ยุทธศาสตร์ที่ ๖", "การอนุรักษ์ ฟื้นฟู และสืบสานศาสนา ศิลปวัฒนธรรม จารีตประเพณี และภูมิปัญญาท้องถิ่น"),
        ("ยุทธศาสตร์ที่ ๗", "การบริหารจัดการทรัพยากรขององค์กรปกครองส่วนท้องถิ่นตามหลักธรรมาภิบาลและการพัฒนาบุคลากร")
    ]
    for strat_num, strat_desc in strategies:
        p = add_p(doc, f"• {strat_num}: ", bold=True, space_after=3, indent=0.5)
        run = p.add_run(strat_desc)
        format_run(run, bold=False)

    doc.add_page_break()

    # ------------------ SECTION 3 ------------------
    print("Writing Section 3: Risk Assessment Criteria & Matrix...")
    add_p(doc, "ส่วนที่ ๓", size_pt=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_before=10, space_after=4)
    add_p(doc, "เกณฑ์มาตรฐานและเครื่องมือการวิเคราะห์ความเสี่ยง", size_pt=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(51, 65, 85), space_after=14)
    add_p(doc, "------------------------------------------------------------", size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(203, 213, 225), space_after=14)

    add_heading_1(doc, "๓.๑ กระบวนการบริหารความเสี่ยง ๕ ขั้นตอน")
    add_p(doc, "กระบวนการบริหารจัดการความเสี่ยงขององค์การบริหารส่วนตำบลฝางคำ ดำเนินการตามวงจรคุณภาพต่อเนื่อง ๕ ขั้นตอน ได้แก่:", 
          indent=0.5, space_after=4)
    steps = [
        ("ขั้นตอนที่ ๑: การกำหนดวัตถุประสงค์และขอบเขต (Objective Setting)", "กำหนดวัตถุประสงค์ของภารกิจ/โครงการ ให้สอดรับกับแผนพัฒนาท้องถิ่นและยุทธศาสตร์ อบต.ฝางคำ"),
        ("ขั้นตอนที่ ๒: การระบุความเสี่ยง (Risk Identification)", "ค้นหาและระบุเหตุการณ์ความเสี่ยง ปัจจัยเสี่ยง ทั้งภายในและภายนอกที่อาจทำให้งานไม่บรรลุวัตถุประสงค์"),
        ("ขั้นตอนที่ ๓: การวิเคราะห์และประเมินความเสี่ยง (Risk Assessment)", "วิเคราะห์ระดับโอกาสที่จะเกิด (Likelihood) และผลกระทบ (Impact) เพื่อคำนวณคะแนนระดับความเสี่ยง"),
        ("ขั้นตอนที่ ๔: การตอบสนองและจัดการความเสี่ยง (Risk Response / Treatment)", "กำหนดมาตรการควบคุมและแนวทางปฏิบัติการ (4T) เพื่อลดโอกาสหรือผลกระทบให้อยู่ในระดับที่ยอมรับได้"),
        ("ขั้นตอนที่ ๕: การติดตามประเมินผลและการรายงาน (Monitoring and Reporting)", "ติดตามผลการดำเนินงานตามมาตรการที่กำหนด และรายงานผลต่อผู้บริหารและคณะกรรมการอย่างสม่ำเสมอ")
    ]
    for s_title, s_desc in steps:
        p = add_p(doc, f"• {s_title}: ", bold=True, space_after=3, indent=0.5)
        run = p.add_run(s_desc)
        format_run(run, bold=False)

    add_heading_1(doc, "๓.๒ เกณฑ์การประเมินระดับโอกาสการเกิดความเสี่ยง (Likelihood: L)")
    add_p(doc, "กำหนดเกณฑ์การประเมินระดับโอกาสเกิดเหตุการณ์ความเสี่ยงออกเป็น ๕ ระดับ (คะแนน ๑ - ๕) ดังนี้:", 
          indent=0.5, space_after=6)
          
    l_table = doc.add_table(rows=1, cols=4)
    l_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    l_table.autofit = False
    l_table.columns[0].width = Cm(1.5)
    l_table.columns[1].width = Cm(3.0)
    l_table.columns[2].width = Cm(5.2)
    l_table.columns[3].width = Cm(6.3)
    
    format_cell(l_table.rows[0].cells[0], "ระดับ", bold=True, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(l_table.rows[0].cells[1], "ความถี่/โอกาส", bold=True, size_pt=14, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(l_table.rows[0].cells[2], "เกณฑ์เชิงปริมาณ (ความถี่)", bold=True, size_pt=14, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(l_table.rows[0].cells[3], "เกณฑ์เชิงคุณภาพ (ความเป็นไปได้)", bold=True, size_pt=14, bg_hex="1E3A8A", text_color=(255,255,255))
    
    l_data = [
        ("๕", "สูงมาก (Very High)", "เกิดบ่อยมาก (มากกว่า ๔ ครั้ง/ปี หรือทุกเดือน)", "มีความเป็นไปได้สูงมากที่จะเกิดขึ้น (> ๘๐%) สภาพแวดล้อมมีความเสี่ยงสูงอย่างชัดเจน"),
        ("๔", "สูง (High)", "เกิดค่อนข้างบ่อย (๓ - ๔ ครั้ง/ปี)", "มีโอกาสเกิดขึ้นบ่อยครั้ง (๖๑% - ๘๐%) เคยเกิดขึ้นเป็นประจำในรอบปีที่ผ่านมา"),
        ("๓", "ปานกลาง (Medium)", "เกิดขึ้นบางครั้ง (๒ ครั้ง/ปี)", "มีโอกาสเกิดขึ้นปานกลาง (๔๑% - ๖๐%) อาจเกิดขึ้นได้ตามฤดูกาลหรือตามวงรอบ"),
        ("๒", "น้อย (Low)", "เกิดนานๆ ครั้ง (๑ ครั้งในรอบ ๑ - ๒ ปี)", "มีโอกาสเกิดขึ้นน้อย (๒๑% - ๔๐%) มีมาตรการควบคุมขั้นต้นรองรับอยู่แล้ว"),
        ("๑", "น้อยมาก (Very Low)", "แทบไม่เคยเกิดขึ้น (มากกว่า ๓ ปีต่อครั้ง)", "มีโอกาสเกิดขึ้นน้อยมาก (< ๒๐%) หรือเกิดขึ้นเฉพาะกรณีพิเศษที่ไม่คาดคิด")
    ]
    for r, name, quant, qual in l_data:
        row = l_table.add_row()
        format_cell(row.cells[0], r, bold=True, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[1], name, size_pt=14)
        format_cell(row.cells[2], quant, size_pt=14)
        format_cell(row.cells[3], qual, size_pt=14)
    set_table_borders(l_table, color="CBD5E1", sz="4")
    add_p(doc, "", space_after=8)

    add_heading_1(doc, "๓.๓ เกณฑ์การประเมินระดับผลกระทบของความเสี่ยง (Impact: I)")
    add_p(doc, "กำหนดเกณฑ์ผลกระทบออกเป็น ๕ ระดับ (คะแนน ๑ - ๕) โดยปรับมูลค่าตัวเงินให้เหมาะสมกับฐานงบประมาณของ อบต.ฝางคำ ดังนี้:", 
          indent=0.5, space_after=6)
          
    i_table = doc.add_table(rows=1, cols=4)
    i_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    i_table.autofit = False
    i_table.columns[0].width = Cm(1.5)
    i_table.columns[1].width = Cm(3.0)
    l_table.columns[2].width = Cm(5.2)
    l_table.columns[3].width = Cm(6.3)
    
    format_cell(i_table.rows[0].cells[0], "ระดับ", bold=True, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(i_table.rows[0].cells[1], "ความรุนแรง", bold=True, size_pt=14, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(i_table.rows[0].cells[2], "เกณฑ์เชิงปริมาณ (ความเสียหายตัวเงิน)", bold=True, size_pt=14, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(i_table.rows[0].cells[3], "เกณฑ์เชิงคุณภาพ (การดำเนินงาน/ชื่อเสียง/กฎหมาย)", bold=True, size_pt=14, bg_hex="1E3A8A", text_color=(255,255,255))
    
    i_data = [
        ("๕", "สูงมาก (Catastrophic)", "ความเสียหายเกินกว่า ๑,๐๐๐,๐๐๐ บาทขึ้นไป", "ภารกิจหลักหยุดชะงัก ประชาชนเดือดร้อนทั้งตำบล ถูกดำเนินคดีอาญา/ถูก สตง. ชี้มูล ทุจริต หรือเสียชีวิต"),
        ("๔", "สูง (Major)", "ความเสียหายเกินกว่า ๓๐๐,๐๐๐ - ๑,๐๐๐,๐๐๐ บาท", "โครงการสำคัญไม่บรรลุเป้าหมาย ทรัพย์สินราชการเสียหายรุนแรง ประชาชนร้องเรียนผ่านสื่อ มีการบาดเจ็บสาหัส"),
        ("๓", "ปานกลาง (Moderate)", "ความเสียหายเกินกว่า ๕๐,๐๐๐ - ๓๐๐,๐๐๐ บาท", "งานล่าช้ากว่าแผน ต้องปรับแผนปฏิบัติงาน ประชาชนร้องเรียนในพื้นที่ ถูก สตง./ผู้ตรวจ ทักท้วงให้แก้ไข"),
        ("๒", "น้อย (Minor)", "ความเสียหายเกินกว่า ๑๐,๐๐๐ - ๕๐,๐๐๐ บาท", "งานติดขัดเล็กน้อย สามารถแก้ไขได้ในระดับส่วนราชการ ประชาชนไม่ได้รับความสะดวกบางส่วน"),
        ("๑", "น้อยมาก (Insignificant)", "ความเสียหายไม่เกิน ๑๐,๐๐๐ บาท", "แทบไม่มีผลกระทบต่อภารกิจ สามารถจัดการได้ในการทำงานปกติ ประชาชนไม่ได้รับผลกระทบ")
    ]
    for r, name, quant, qual in i_data:
        row = i_table.add_row()
        format_cell(row.cells[0], r, bold=True, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[1], name, size_pt=14)
        format_cell(row.cells[2], quant, size_pt=14)
        format_cell(row.cells[3], qual, size_pt=14)
    set_table_borders(i_table, color="CBD5E1", sz="4")
    add_p(doc, "", space_after=8)

    add_heading_1(doc, "๓.๔ ผังระดับความเสี่ยง (Risk Assessment Matrix 5x5) และการจัดระดับคะแนน")
    add_p(doc, "ระดับความเสี่ยงเกิดจากการคำนวณผลคูณระหว่าง ระดับโอกาส (Likelihood) กับ ระดับผลกระทบ (Impact) โดยมีค่าคะแนนตั้งแต่ ๑ ถึง ๒๕ คะแนน และจัดแบ่งระดับความรุนแรงออกเป็น ๔ ระดับที่สอดคล้องเป็นมาตรฐานเดียวกัน ดังนี้:", 
          indent=0.5, space_after=6)
          
    level_table = doc.add_table(rows=1, cols=4)
    level_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    level_table.autofit = False
    level_table.columns[0].width = Cm(3.2)
    level_table.columns[1].width = Cm(2.8)
    level_table.columns[2].width = Cm(2.2)
    level_table.columns[3].width = Cm(7.8)
    
    format_cell(level_table.rows[0].cells[0], "ระดับความเสี่ยง", bold=True, size_pt=14, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(level_table.rows[0].cells[1], "ช่วงคะแนน (L x I)", bold=True, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(level_table.rows[0].cells[2], "สัญลักษณ์สี", bold=True, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(level_table.rows[0].cells[3], "แนวทางการจัดการที่กำหนด", bold=True, size_pt=14, bg_hex="1E3A8A", text_color=(255,255,255))
    
    levels_data = [
        ("สูงมาก (Very High / Extreme)", "๑๕ – ๒๕", "สีแดง", "เป็นระดับที่ไม่อาจยอมรับได้ ต้องกำหนดมาตรการควบคุมเร่งด่วนทันที และรายงานผู้บริหารระดับสูงอย่างใกล้ชิด"),
        ("สูง (High)", "๑๐ – ๑๔", "สีส้ม", "เป็นระดับที่ยอมรับไม่ได้ ต้องจัดทำแผนบริหารจัดการความเสี่ยงเพื่อลดระดับความเสี่ยงให้อยู่ในระดับที่ยอมรับได้"),
        ("ปานกลาง (Medium)", "๕ – ๙", "สีเหลือง", "เป็นระดับที่ยอมรับได้ภายใต้การควบคุม ต้องมีมาตรการควบคุมภายในที่ชัดเจนและติดตามผลสม่ำเสมอ"),
        ("ต่ำ (Low)", "๑ – ๔", "สีเขียว", "เป็นระดับที่ยอมรับได้ ควบคุมโดยกระบวนการทำงานปกติและติดตามประเมินผลตามรอบระยะเวลา")
    ]
    for lvl, score, col, act in levels_data:
        row = level_table.add_row()
        format_cell(row.cells[0], lvl, bold=True, size_pt=14)
        format_cell(row.cells[1], score, bold=True, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER)
        
        bg_col = "FEE2E2" if col == "สีแดง" else "FFEDD5" if col == "สีส้ม" else "FEF9C3" if col == "สีเหลือง" else "DCFCE7"
        text_c = (185, 28, 28) if col == "สีแดง" else (194, 65, 12) if col == "สีส้ม" else (161, 98, 7) if col == "สีเหลือง" else (21, 128, 61)
        format_cell(row.cells[2], col, bold=True, size_pt=14, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex=bg_col, text_color=text_c)
        format_cell(row.cells[3], act, size_pt=14)
        
    set_table_borders(level_table, color="CBD5E1", sz="4")
    add_p(doc, "", space_after=8)

    add_heading_1(doc, "๓.๕ กลยุทธ์และการตอบสนองต่อความเสี่ยง (4T Strategies)")
    add_p(doc, "เมื่อทำการประเมินความเสี่ยงแล้ว หน่วยงานจะต้องเลือกกลยุทธ์การจัดการความเสี่ยงที่เหมาะสม ๔ รูปแบบ (4T) ได้แก่:", 
          indent=0.5, space_after=4)
    t_strats = [
        ("๑. การลด/การควบคุมความเสี่ยง (Treat / Risk Mitigation)", "การปรับปรุงขั้นตอนการทำงาน เพิ่มมาตรการควบคุมภายใน วางระบบตรวจสอบ เพื่อลดโอกาสการเกิดหรือลดทอนผลกระทบให้อยู่ในเกณฑ์ยอมรับได้ (เป็นกลยุทธ์ที่ใช้มากที่สุด)"),
        ("๒. การโอนหรือกระจายความเสี่ยง (Transfer / Risk Sharing)", "การถ่ายโอนภาระความเสี่ยงหรือความเสียหายให้บุคคลภายนอก เช่น การทำประกันภัยทรัพย์สินราชการ การจ้างเหมาบริการ หรือการจัดทำบันทึกความร่วมมือ"),
        ("๓. การยอมรับความเสี่ยง (Take / Risk Acceptance)", "การยอมรับความเสี่ยงที่เกิดขึ้นโดยไม่มีการเพิ่มมาตรการใหม่ เนื่องจากระดับความเสี่ยงต่ำอยู่แล้ว หรือต้นทุนในการควบคุมสูงกว่าผลประโยชน์ที่จะได้รับ"),
        ("๔. การหลีกเลี่ยงหรือยกเลิกกิจกรรม (Terminate / Risk Avoidance)", "การตัดสินใจยกเลิก ระงับ หรือปรับเปลี่ยนกิจกรรมที่มีความเสี่ยงสูงมากซึ่งไม่อาจควบคุมให้อยู่ในเกณฑ์ยอมรับได้")
    ]
    for ts_title, ts_desc in t_strats:
        p = add_p(doc, f"• {ts_title}: ", bold=True, space_after=3, indent=0.5)
        run = p.add_run(ts_desc)
        format_run(run, bold=False)

    doc.add_page_break()

    # ------------------ SECTION 4 ------------------
    print("Writing Section 4: Operational Calendar for FY 2570...")
    add_p(doc, "ส่วนที่ ๔", size_pt=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_before=10, space_after=4)
    add_p(doc, "แผนการดำเนินงานและปฏิทินปฏิบัติงาน ประจำปีงบประมาณ พ.ศ. ๒๕๗๐", size_pt=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(51, 65, 85), space_after=14)
    add_p(doc, "------------------------------------------------------------", size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(203, 213, 225), space_after=14)

    add_p(doc, "เพื่อให้การขับเคลื่อนการบริหารจัดการความเสี่ยงขององค์การบริหารส่วนตำบลฝางคำ เกิดผลสัมฤทธิ์อย่างเป็นรูปธรรม คณะกรรมการและคณะทำงานบริหารจัดการความเสี่ยงจึงได้กำหนดแผนงานและปฏิทินปฏิบัติงานครอบคลุมตลอดปีงบประมาณ พ.ศ. ๒๕๗๐ จำนวน ๑๔ กิจกรรมหลัก ดังนี้:", 
          indent=0.5, space_after=8)

    cal_table = doc.add_table(rows=1, cols=7)
    cal_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cal_table.autofit = False
    cal_table.columns[0].width = Cm(1.2)
    cal_table.columns[1].width = Cm(6.5)
    cal_table.columns[2].width = Cm(1.5)
    cal_table.columns[3].width = Cm(1.5)
    cal_table.columns[4].width = Cm(1.5)
    cal_table.columns[5].width = Cm(1.5)
    cal_table.columns[6].width = Cm(2.3)
    
    format_cell(cal_table.rows[0].cells[0], "ที่", bold=True, size_pt=13, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(cal_table.rows[0].cells[1], "กิจกรรม / ขั้นตอนการดำเนินงาน", bold=True, size_pt=13, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(cal_table.rows[0].cells[2], "ไตรมาส ๑\n(ต.ค.-ธ.ค.)", bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(cal_table.rows[0].cells[3], "ไตรมาส ๒\n(ม.ค.-มี.ค.)", bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(cal_table.rows[0].cells[4], "ไตรมาส ๓\n(เม.ย.-มิ.ย.)", bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(cal_table.rows[0].cells[5], "ไตรมาส ๔\n(ก.ค.-ก.ย.)", bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    format_cell(cal_table.rows[0].cells[6], "ผู้รับผิดชอบหลัก", bold=True, size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
    
    cal_steps = [
        ("๑", "ทบทวนคำสั่งแต่งตั้งคณะกรรมการและคณะทำงานบริหารจัดการความเสี่ยง อบต.ฝางคำ ประจำปีงบประมาณ พ.ศ. ๒๕๗๐", "X", "", "", "", "สำนักปลัด / ผู้บริหาร"),
        ("๒", "ประชุมชี้แจงกรอบแนวทาง นโยบาย และถ่ายทอดคู่มือการบริหารจัดการความเสี่ยงแก่ทุกสำนัก/กอง", "X", "", "", "", "คณะทำงาน / หน่วยตรวจฯ"),
        ("๓", "ทุกส่วนราชการดำเนินการระบุและวิเคราะห์ปัจจัยเสี่ยงตามภารกิจ (จัดทำแบบ บส. ๑ และ บส. ๒)", "X", "", "", "", "ทุกสำนัก/กอง"),
        ("๔", "จัดลำดับความสำคัญของความเสี่ยง และกำหนดมาตรการควบคุมความเสี่ยง (จัดทำร่างแบบ บส. ๓)", "X", "", "", "", "ทุกสำนัก/กอง"),
        ("๕", "ประชุมคณะกรรมการฯ เพื่อพิจารณากลั่นกรองและให้ความเห็นชอบ (ร่าง) แผนบริหารความเสี่ยง ประจำปี ๒๕๗๐", "X", "", "", "", "คณะทำงานบริหารความเสี่ยง"),
        ("๖", "เสนอนายก อบต.ฝางคำ พิจารณาอนุมัติแผน และออกประกาศนโยบายการบริหารความเสี่ยง ปี ๒๕๗๐", "X", "", "", "", "สำนักปลัด / นายก อบต."),
        ("๗", "เผยแพร่แผนบริหารจัดการความเสี่ยงแก่บุคลากรทุกส่วนราชการ และมอบหมายผู้รับผิดชอบดำเนินงาน", "X", "X", "", "", "คณะทำงานบริหารความเสี่ยง"),
        ("๘", "ดำเนินงานตามมาตรการควบคุมความเสี่ยงที่กำหนดไว้ในแผนบริหารจัดการความเสี่ยง (แบบ บส. ๓)", "X", "X", "X", "X", "ทุกสำนัก/กอง"),
        ("๙", "ติดตามความก้าวหน้าและประเมินผลการบริหารความเสี่ยงรอบ ๖ เดือน (ไตรมาส ๒)", "", "X", "", "", "คณะทำงาน / หน่วยตรวจฯ"),
        ("๑๐", "รายงานผลการติดตามการบริหารความเสี่ยงรอบ ๖ เดือน ต่อนายก อบต.ฝางคำ", "", "X", "", "", "คณะทำงานบริหารความเสี่ยง"),
        ("๑๑", "ทบทวนและปรับปรุงมาตรการควบคุมความเสี่ยงกรณีพบสถานการณ์เปลี่ยนแปลงหรือมีความเสี่ยงใหม่", "", "", "X", "", "ทุกสำนัก/กอง"),
        ("๑๒", "ติดตามและประเมินผลการบริหารความเสี่ยงรอบ ๑๒ เดือน (สิ้นปีงบประมาณ)", "", "", "", "X", "คณะทำงานบริหารความเสี่ยง"),
        ("๑๓", "ประเมินผลการควบคุมภายในประจำปี และจัดทำรายงาน ปค.๔ และ ปค.๕ สอดรับกับผลการบริหารความเสี่ยง", "", "", "", "X", "ทุกสำนัก/กอง"),
        ("๑๔", "สรุปรายงานผลการบริหารจัดการความเสี่ยงประจำปี ๒๕๗๐ และเตรียมจัดทำแผนฯ ประจำปีงบประมาณ ๒๕๗๑", "", "", "", "X", "คณะทำงาน / ผู้บริหาร")
    ]
    for c_no, c_name, q1, q2, q3, q4, resp in cal_steps:
        row = cal_table.add_row()
        format_cell(row.cells[0], c_no, size_pt=13, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[1], c_name, size_pt=13)
        format_cell(row.cells[2], q1, bold=True, size_pt=13, align=WD_ALIGN_PARAGRAPH.CENTER, text_color=(30, 58, 138) if q1 else (0,0,0))
        format_cell(row.cells[3], q2, bold=True, size_pt=13, align=WD_ALIGN_PARAGRAPH.CENTER, text_color=(30, 58, 138) if q2 else (0,0,0))
        format_cell(row.cells[4], q3, bold=True, size_pt=13, align=WD_ALIGN_PARAGRAPH.CENTER, text_color=(30, 58, 138) if q3 else (0,0,0))
        format_cell(row.cells[5], q4, bold=True, size_pt=13, align=WD_ALIGN_PARAGRAPH.CENTER, text_color=(30, 58, 138) if q4 else (0,0,0))
        format_cell(row.cells[6], resp, size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER)
        
    set_table_borders(cal_table, color="CBD5E1", sz="4")
    doc.add_page_break()

    # ------------------ SECTION 5 ------------------
    print("Writing Section 5: Risk Plans (BS.1, BS.2, BS.3)...")
    add_p(doc, "ส่วนที่ ๕", size_pt=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_before=10, space_after=4)
    add_p(doc, "แผนบริหารจัดการความเสี่ยงรายภารกิจ ประจำปีงบประมาณ พ.ศ. ๒๕๗๐", size_pt=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(51, 65, 85), space_after=14)
    add_p(doc, "------------------------------------------------------------", size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(203, 213, 225), space_after=14)

    # 16 Risk Items detailed definition
    risk_master = [
        {
            "id": "RSK-01/2570",
            "dept": "สำนักปลัด",
            "strat": "ยุทธศาสตร์ที่ ๗ การบริหารจัดการทรัพยากรขององค์กรปกครองส่วนท้องถิ่น",
            "project": "การคุ้มครองข้อมูลส่วนบุคคล (PDPA) และระบบสารบรรณอิเล็กทรอนิกส์ (e-Saraban)",
            "budget": "๕๐,๐๐๐",
            "obj": "เพื่อรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคลของประชาชน และป้องกันเอกสารลับทางราชการรั่วไหลตามกฎหมาย PDPA",
            "kpi": "จำนวนครั้งของการรั่วไหลหรือการละเมิดสิทธิข้อมูลส่วนบุคคล (๐ ครั้ง)",
            "target": "ไม่มีข้อร้องเรียนหรือการดำเนินคดีเกี่ยวกับการละเมิดข้อมูลส่วนบุคคล และเจ้าหน้าที่ปฏิบัติตามแนวทาง PDPA ๑๐๐%",
            "risk_desc": "การรั่วไหลหรือการเข้าถึงข้อมูลส่วนบุคคลของประชาชนโดยมิชอบ ผ่านระบบบริการคำร้อง การแชร์ไฟล์ หรือระบบ e-Saraban",
            "risk_cat": "ด้านเทคโนโลยีสารสนเทศและดิจิทัล (T)",
            "l": 3, "i": 3, "score": 9, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. จัดทำและประกาศใช้นโยบายคุ้มครองข้อมูลส่วนบุคคล (Privacy Policy) และแนวปฏิบัติการคุ้มครองข้อมูลส่วนบุคคลของ อบต.ฝางคำ\n๒. กำหนดสิทธิการเข้าถึง (Access Control) เอกสารในระบบ e-Saraban และระบบจัดเก็บข้อมูลคำร้องของประชาชนเฉพาะเจ้าหน้าที่ที่ได้รับมอบหมาย\n๓. จัดอบรมให้ความรู้ด้านกฎหมาย PDPA และความตระหนักรู้ด้าน Cyber Security แก่บุคลากรทุกส่วนราชการ\n๔. แต่งตั้งเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) ประจำ อบต.ฝางคำ เพื่อกำกับดูแลและตรวจสอบการประมวลผลข้อมูล",
            "kpi_mit": "ร้อยละของบุคลากรที่ผ่านการอบรม PDPA (๑๐๐%) และไม่มีเหตุละเมิดข้อมูลส่วนบุคคล",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานผลในการประชุมประจำเดือนของ อบต.ฝางคำ และสรุปรายงานรอบ ๖ เดือน"
        },
        {
            "id": "RSK-02/2570",
            "dept": "สำนักปลัด",
            "strat": "ยุทธศาสตร์ที่ ๓ การจัดระเบียบชุมชน สังคม และการรักษาความสงบเรียบร้อย",
            "project": "การป้องกันและบรรเทาสาธารณภัย (อุทกภัย ภัยแล้ง วาตภัย และอุบัติภัยทางน้ำ)",
            "budget": "๔๐๐,๐๐๐",
            "obj": "เพื่อให้การเผชิญเหตุและการระงับสาธารณภัยเป็นไปอย่างรวดเร็ว มีประสิทธิภาพ ลดความสูญเสียในชีวิตและทรัพย์สินของประชาชน",
            "kpi": "ระยะเวลาในการเข้าถึงพื้นที่เกิดเหตุสาธารณภัยนับแต่ได้รับแจ้งเหตุ (ไม่เกิน ๑๕ นาที)",
            "target": "ไม่มีผู้เสียชีวิตจากสาธารณภัยที่สามารถป้องกันได้ และอุปกรณ์กู้ชีพกู้ภัยพร้อมใช้งาน ๑๐๐%",
            "risk_desc": "การเผชิญเหตุสาธารณภัยล่าช้า รถดับเพลิง เรือกู้ภัย หรือเครื่องสูบน้ำชำรุดเสียหายในช่วงเกิดภัยฉุกเฉิน และอุบัติภัยทางน้ำบริเวณหาดฝางเทิง",
            "risk_cat": "ด้านการดำเนินงาน (O)",
            "l": 3, "i": 4, "score": 12, "level": "สูง", "color": "สีส้ม", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. จัดทำแผนเผชิญเหตุสาธารณภัยเฉพาะด้าน (อุทกภัย, ภัยแล้ง, วาตภัย, และความปลอดภัยทางน้ำบริเวณชายหาดฝางเทิง-เขื่อนสิรินธร)\n๒. ตรวจเช็กและบำรุงรักษารถบรรทุกน้ำดับเพลิง เรือตรวจการณ์ เครื่องสูบน้ำ และอุปกรณ์กู้ชีพกู้ภัยทุกสัปดาห์ พร้อมสมุดบันทึกสภาพความพร้อม\n๓. จัดเวรยามเจ้าหน้าที่งานป้องกันฯ และอาสาสมัคร อปพร. ตลอด ๒๔ ชั่วโมง พร้อมช่องทางวิทยุสื่อสารและเบอร์โทรศัพท์สายด่วนฉุกเฉิน\n๔. ซักซ้อมแผนเผชิญเหตุสาธารณภัยและการช่วยเหลือผู้ประสบภัยทางน้ำร่วมกับชุมชนอย่างน้อยปีละ ๑ ครั้ง",
            "kpi_mit": "ความพร้อมของยานพาหนะและเครื่องมือกู้ภัย (๑๐๐%) และสามารถเข้าถึงที่เกิดเหตุได้ภายใน ๑๕ นาที",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานผลการเตรียมความพร้อมและการระงับเหตุต่อนายก อบต.ฝางคำ ทุกเดือน"
        },
        {
            "id": "RSK-03/2570",
            "dept": "สำนักปลัด",
            "strat": "ยุทธศาสตร์ที่ ๗ การบริหารจัดการทรัพยากรขององค์กรปกครองส่วนท้องถิ่น",
            "project": "การประเมินคุณธรรมและความโปร่งใส (ITA) และการป้องกันผลประโยชน์ทับซ้อน",
            "budget": "๓๐,๐๐๐",
            "obj": "เพื่อยกระดับผลการประเมิน ITA สู่ระดับผ่านดีเยี่ยม และป้องกันปัญหาการขัดกันแห่งผลประโยชน์ในองค์กร",
            "kpi": "ผลคะแนนการประเมิน ITA ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ (ไม่น้อยกว่า ๘๕ คะแนน หรือระดับผ่านดี)",
            "target": "ผ่านเกณฑ์การประเมิน ITA ในระดับ ผ่านดีเยี่ยม และไม่มีเรื่องร้องเรียนการทุจริต",
            "risk_desc": "การเปิดเผยข้อมูลสาธารณะ (OIT) ไม่ครบถ้วนตามเกณฑ์ การตอบแบบวัดการรับรู้ (IIT/EIT) ต่ำกว่าเกณฑ์ หรือมีข้อร้องเรียนเรื่องผลประโยชน์ทับซ้อน",
            "risk_cat": "ด้านคุณธรรมและความโปร่งใส (I)",
            "l": 2, "i": 4, "score": 8, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. จัดตั้งคณะทำงานขับเคลื่อนการประเมิน ITA อบต.ฝางคำ ตรวจสอบและอัปเดตข้อมูลบนเว็บไซต์ตามตัวชี้วัด OIT ให้ครบถ้วนเป็นปัจจุบัน\n๒. ประกาศเจตนารมณ์ No Gift Policy และนโยบายไม่รับของขวัญของกำนัลทุกเทศกาล\n๓. จัดกิจกรรมเสริมสร้างจริยธรรมและการป้องกันการขัดกันระหว่างผลประโยชน์ส่วนตนกับประโยชน์ส่วนรวมแก่พนักงานส่วนตำบล\n๔. พัฒนาระบบรับเรื่องร้องเรียนการทุจริตออนไลน์ที่มีการปกปิดตัวตนของผู้ร้องเรียนอย่างปลอดภัย",
            "kpi_mit": "ข้อมูล OIT ครบถ้วนตามเกณฑ์ ๑๐๐% และผลคะแนน ITA ไม่ต่ำกว่า ๘๕ คะแนน",
            "timeline": "ไตรมาส ๑ - ๔",
            "reporting": "รายงานผลการประเมิน ITA ต่อที่ประชุมผู้บริหารและเผยแพร่บนเว็บไซต์ อบต.ฝางคำ"
        },
        {
            "id": "RSK-04/2570",
            "dept": "กองคลัง",
            "strat": "ยุทธศาสตร์ที่ ๗ การบริหารจัดการทรัพยากรขององค์กรปกครองส่วนท้องถิ่น",
            "project": "การจัดเก็บภาษีที่ดินและสิ่งปลูกสร้าง ภาษีป้าย และรายได้ท้องถิ่น (LTAX GIS / e-LAAS)",
            "budget": "๘๐,๐๐๐",
            "obj": "เพื่อเพิ่มประสิทธิภาพการจัดเก็บรายได้ให้ถูกต้อง ครบถ้วน เป็นธรรม และเป็นไปตามประมาณการรายรับ",
            "kpi": "ร้อยละของการจัดเก็บภาษีและรายได้เทียบกับประมาณการข้อบัญญัติ (ไม่น้อยกว่า ๙๕%)",
            "target": "จัดเก็บภาษีได้ครบถ้วนตามเป้าหมาย ฐานข้อมูลผู้เสียภาษีถูกต้องตรงกับแผนที่ LTAX GIS",
            "risk_desc": "การสำรวจข้อมูลที่ดินและสิ่งปลูกสร้างไม่ครอบคลุม ฐานข้อมูล LTAX GIS ไม่อัปเดต การแจ้งประเมินภาษีล่าช้า หรือประชาชนค้างชำระภาษี",
            "risk_cat": "ด้านการเงินและการคลัง (F)",
            "l": 3, "i": 3, "score": 9, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. ลงพื้นที่สำรวจข้อมูลภาคสนามเพื่อปรับปรุงแผนที่ภาษีและทะเบียนทรัพย์สิน (LTAX 3000 / LTAX GIS) ให้สอดคล้องกับสภาพการใช้ประโยชน์จริงใน ๔ หมู่บ้าน\n๒. ปรับปรุงฐานข้อมูลผู้มีหน้าที่เสียภาษีในระบบ e-LAAS ให้ถูกต้องและออกหนังสือแจ้งประเมินภาษี (ภ.ด.ส. ๖, ภ.ด.ส. ๗) ตามปฏิทินเวลาที่กฎหมายกำหนด\n๓. ประชาสัมพันธ์ขั้นตอนการชำระภาษี ช่องทางการชำระผ่าน QR Code / e-Payment ทางสื่อออนไลน์และเสียงตามสายหมู่บ้าน\n๔. จัดส่งหนังสือเตือนผู้ค้างชำระภาษีอย่างเป็นระบบตามขั้นตอนกฎหมาย",
            "kpi_mit": "ร้อยละของฐานข้อมูลภาษีที่ได้รับการปรับปรุง (ไม่น้อยกว่า ๙๐%) และผลการจัดเก็บเป็นไปตามเป้าหมาย",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานผลการจัดเก็บรายได้ประจำเดือนเสนอผู้บริหาร และรายงานในที่ประชุมสภา อบต."
        },
        {
            "id": "RSK-05/2570",
            "dept": "กองคลัง",
            "strat": "ยุทธศาสตร์ที่ ๗ การบริหารจัดการทรัพยากรขององค์กรปกครองส่วนท้องถิ่น",
            "project": "กระบวนการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ (พ.ร.บ. จัดซื้อจัดจ้างฯ ๒๕๖๐ และ ว ๖๑๔)",
            "budget": "๔๐,๐๐๐",
            "obj": "เพื่อให้การจัดซื้อจัดจ้างเป็นไปด้วยความโปร่งใส ถูกต้องตามระเบียบกฎหมาย คุ้มค่า และส่งมอบงานได้ตามกำหนด",
            "kpi": "ร้อยละของโครงการจัดซื้อจัดจ้างที่ดำเนินการถูกต้องตามระเบียบและไม่มีข้อทักท้วง (๑๐๐%)",
            "target": "ไม่มีข้อทักท้วงจาก สตง. หรือหน่วยตรวจสอบภายนอก และเบิกจ่ายงบประมาณได้ตามไตรมาส",
            "risk_desc": "การจัดทำเอกสารพัสดุไม่ครบถ้วนตามหนังสือสั่งการ ว ๖๑๔ / ว ๑๒๔ การคำนวณราคากลางคลาดเคลื่อน หรือการเบิกจ่ายงบประมาณล่าช้าไม่ทันปีงบประมาณ",
            "risk_cat": "ด้านการปฏิบัติตามกฎหมายและระเบียบ (C)",
            "l": 3, "i": 4, "score": 12, "level": "สูง", "color": "สีส้ม", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. จัดทำ Checklists ตรวจสอบเอกสารการจัดซื้อจัดจ้างทุกขั้นตอน ตั้งแต่แผนจัดซื้อจัดจ้าง ขออนุมัติซื้อ/จ้าง จนถึงการตรวจรับพัสดุตาม ว ๖๑๔\n๒. จัดประชุมชี้แจงซักซ้อมระเบียบและหนังสือเวียน กค. ล่าสุด ให้แก่เจ้าหน้าที่พัสดุและคณะกรรมการตรวจรับพัสดุของทุกกอง\n๓. ติดตามเร่งรัดกระบวนการจัดหาพัสดุให้เป็นไปตามแผนการจัดซื้อจัดจ้างประจำปี และปฏิทินเร่งรัดการเบิกจ่ายงบประมาณ\n๔. เปิดเผยข้อมูลการจัดซื้อจัดจ้างบนระบบ e-GP และเว็บไซต์ อบต.ฝางคำ อย่างโปร่งใสครบถ้วนทุกโครงการ",
            "kpi_mit": "ไม่มีข้อทักท้วงด้านการจัดซื้อจัดจ้างจากหน่วยตรวจสอบ และเบิกจ่ายงบลงทุนได้ตามเป้าหมายของรัฐบาล",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานผลการจัดซื้อจัดจ้างและเร่งรัดการเบิกจ่ายประจำเดือนต่อคณะทำงานและผู้บริหาร"
        },
        {
            "id": "RSK-06/2570",
            "dept": "กองคลัง",
            "strat": "ยุทธศาสตร์ที่ ๗ การบริหารจัดการทรัพยากรขององค์กรปกครองส่วนท้องถิ่น",
            "project": "การรับ-จ่ายเงินและการเบิกจ่ายผ่านระบบอิเล็กทรอนิกส์ (KTB Corporate Online / New GFMIS Thai)",
            "budget": "๓๐,๐๐๐",
            "obj": "เพื่อให้การรับจ่ายเงินมีความถูกต้อง ปลอดภัย รวดเร็ว ปราศจากข้อผิดพลาดและการทุจริตทางไซเบอร์",
            "kpi": "ร้อยละความถูกต้องของการทำธุรกรรมเบิกจ่ายเงินผ่านระบบ e-Payment (๑๐๐%)",
            "target": "ไม่มีความเสียหายทางการเงิน ปลอดภัยจากภัยคุกคามทางไซเบอร์ และบัญชีถูกต้องตรงกัน ๑๐๐%",
            "risk_desc": "การโอนเงินผิดบัญชี การรั่วไหลของรหัสผ่าน (User ID/Password) ในระบบ KTB Corporate Online หรือระบบถูกมัลแวร์แฝงตัว",
            "risk_cat": "ด้านเทคโนโลยีสารสนเทศและดิจิทัล (T)",
            "l": 2, "i": 5, "score": 10, "level": "สูง", "color": "สีส้ม", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. แยกหน้าที่ (Dual Authorization) ระหว่างผู้สร้างรายการ (Maker) และผู้อนุมัติรายการ (Approver) อย่างเด็ดขาดตามมาตรฐานกระทรวงการคลัง\n๒. กำหนดมาตรการความปลอดภัยในการเก็บรักษา Token Key และเปลี่ยนรหัสผ่านทุก ๓ เดือน ห้ามจดบันทึกหรือเปิดเผยรหัสแก่ผู้อื่น\n๓. ติดตั้งและอัปเดตโปรแกรมป้องกันไวรัสบนเครื่องคอมพิวเตอร์ที่ใช้ทำธุรกรรมการเงิน และห้ามใช้เครื่องดังกล่าวเข้าเว็บไซต์ที่ไม่เกี่ยวข้อง\n๔. กระทบยอดเงินฝากธนาคารกับระบบ e-LAAS ทุกสิ้นเดือน และตรวจสอบสถานะรายการโอนเงินทุกครั้งหลังการอนุมัติ",
            "kpi_mit": "ยอดเงินฝากธนาคารตรงกับรายงานบัญชีในระบบ e-LAAS ๑๐๐% และไม่มีรายการโอนเงินผิดพลาด",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานงบกระทบยอดเงินฝากธนาคารเสนอผู้บริหารและแนบรายงานการเงินประจำเดือน"
        },
        {
            "id": "RSK-07/2570",
            "dept": "กองช่าง",
            "strat": "ยุทธศาสตร์ที่ ๗ การบริหารจัดการทรัพยากรขององค์กรปกครองส่วนท้องถิ่น",
            "project": "การกำหนดและคำนวณราคากลางงานก่อสร้าง (Factor F และราคาวัสดุก่อสร้าง)",
            "budget": "๕๐,๐๐๐",
            "obj": "เพื่อให้ราคากลางงานก่อสร้างถูกต้องตามหลักเกณฑ์กระทรวงการคลัง สะท้อนราคาตลาด และประหยัดงบประมาณ",
            "kpi": "ร้อยละของประมาณการราคากลางที่ถูกต้องตามหลักเกณฑ์ Factor F และไม่มีข้อทักท้วง (๑๐๐%)",
            "target": "ไม่มีข้อทักท้วงเรื่องราคากลางคลาดเคลื่อนจาก สตง. หรือ ป.ป.ช. และเปิดเผยราคากลางตามเกณฑ์",
            "risk_desc": "การคำนวณราคากลางคลาดเคลื่อน ใช้ตาราง Factor F ผิดประเภทงาน การอ้างอิงราคาวัสดุไม่ตรงดัชนีราคาของกระทรวงพาณิชย์",
            "risk_cat": "ด้านการปฏิบัติตามกฎหมายและระเบียบ (C)",
            "l": 3, "i": 3, "score": 9, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. แต่งตั้งคณะกรรมการกำหนดราคากลางที่มีความรู้ความเข้าใจ และให้ใช้โปรแกรมช่วยคำนวณที่อัปเดตสูตร Factor F ล่าสุด\n๒. ตรวจสอบดัชนีราคาวัสดุก่อสร้างของสำนักงานพาณิชย์จังหวัดอุบลราชธานี ณ เดือนที่ดำเนินการคำนวณราคากลางอย่างเคร่งครัด\n๓. จัดทำแบบฟอร์มตรวจสอบทาน (Review Checklist) โดยหัวหน้าฝ่าย/ผอ.กองช่าง ก่อนเสนอผู้บริหารพิจารณาให้ความเห็นชอบ\n๔. ประกาศเปิดเผยราคากลางและตารางคำนวณ Factor F บนระบบ e-GP และเว็บไซต์ อบต.ฝางคำ ตามแนวทาง ป.ป.ช.",
            "kpi_mit": "โครงการก่อสร้างทุกโครงการมีเอกสารคำนวณราคากลางถูกต้องและประกาศเปิดเผยครบถ้วน ๑๐๐%",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานการกำหนดราคากลางแนบพร้อมรายงานขอจ้างทุกโครงการ"
        },
        {
            "id": "RSK-08/2570",
            "dept": "กองช่าง",
            "strat": "ยุทธศาสตร์ที่ ๑ การพัฒนาด้านโครงสร้างพื้นฐาน การคมนาคม สาธารณูปโภค",
            "project": "การก่อสร้าง ปรับปรุงถนน คสล. สะพาน ท่อระบายน้ำ และการควบคุมงานก่อสร้าง",
            "budget": "๒,๕๐๐,๐๐๐",
            "obj": "เพื่อให้สิ่งก่อสร้างได้มาตรฐานทางวิศวกรรม มีความปลอดภัย ทนทาน และแล้วเสร็จตามกำหนดเวลาในสัญญาจ้าง",
            "kpi": "ร้อยละของโครงการก่อสร้างที่แล้วเสร็จตามสัญญาจ้างและได้มาตรฐานวิศวกรรม (๑๐๐%)",
            "target": "งานก่อสร้างได้มาตรฐาน ไม่มีข้อพิพาท ไม่มีการทิ้งงาน และประชาชนใช้งานได้อย่างปลอดภัย",
            "risk_desc": "ผู้รับจ้างทิ้งงาน งานก่อสร้างล่าช้ากว่าสัญญา การใช้วัสดุก่อสร้างไม่ได้มาตรฐาน (เช่น ค่ากำลังอัดคอนกรีตต่ำกว่าเกณฑ์) หรือถนนชำรุดเสียหายเร็ว",
            "risk_cat": "ด้านการดำเนินงาน (O)",
            "l": 3, "i": 4, "score": 12, "level": "สูง", "color": "สีส้ม", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. ผู้ควบคุมงานลงพื้นที่ตรวจติดตามการปฏิบัติงานของผู้รับจ้างอย่างสม่ำเสมอ บันทึกสมุดควบคุมงานและถ่ายภาพประกอบทุกขั้นตอนสำคัญ (เทคอนกรีต, วางเหล็กเสริม)\n๒. ส่งทดสอบค่ากำลังอัดลูกปูนคอนกรีต (Cylinder Test) จากสถาบันที่ได้มาตรฐานทุกโครงการก่อนการตรวจรับงานจ้าง\n๓. หากพบความล่าช้าสะสมเกินร้อยละ ๑๐ ให้มีหนังสือแจ้งเตือนเร่งรัดผู้รับจ้างทันทีตามระเบียบพัสดุฯ\n๔. ให้ประชาชนและตัวแทนชุมชนในพื้นที่ร่วมตรวจสอบการทำงานเพื่อสร้างการมีส่วนร่วมและลดข้อร้องเรียน",
            "kpi_mit": "ร้อยละของโครงการก่อสร้างที่มีผลทดสอบวัสดุผ่านเกณฑ์และส่งมอบงานได้ตามสัญญา (ไม่น้อยกว่า ๙๕%)",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานสรุปความก้าวหน้าโครงการก่อสร้างต่อนายก อบต.ฝางคำ ทุกวันที่ ๕ ของเดือน"
        },
        {
            "id": "RSK-09/2570",
            "dept": "กองช่าง",
            "strat": "ยุทธศาสตร์ที่ ๑ การพัฒนาด้านโครงสร้างพื้นฐาน การคมนาคม สาธารณูปโภค",
            "project": "การบริหารจัดการระบบผลิตและจำหน่ายน้ำประปาหมู่บ้าน/ประปาท้องถิ่น",
            "budget": "๑๒๐,๐๐๐",
            "obj": "เพื่อให้ประชาชนในตำบลฝางคำมีน้ำประปาสะอาด ถูกสุขอนามัย และไหลสม่ำเสมอตลอดปี",
            "kpi": "ร้อยละของครัวเรือนในเขตบริการประปาที่มีน้ำประปาใช้สม่ำเสมอ (ไม่น้อยกว่า ๙๕%)",
            "target": "ไม่มีเหตุน้ำประปาหยุดไหลติดต่อกันเกิน ๑๒ ชั่วโมง และคุณภาพน้ำผ่านเกณฑ์มาตรฐานน้ำดื่ม",
            "risk_desc": "น้ำประปาไม่ไหล น้ำขุ่น มีกลิ่น ระบบท่อส่งน้ำแตกรั่ว ปั๊มน้ำชำรุด หรือปริมาณน้ำดิบขาดแคลนในช่วงฤดูแล้ง",
            "risk_cat": "ด้านการดำเนินงาน (O)",
            "l": 3, "i": 3, "score": 9, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. จัดทำแผนการตรวจสอบและล้างทำความสะอาดถังกรอง ถังตกตะกอน และระบบประปาทุก ๓ เดือน\n๒. สำรองอะไหล่และอุปกรณ์ซ่อมท่อประปา ปั๊มน้ำฉุกเฉิน ให้พร้อมใช้งานตลอดเวลา\n๓. จัดตั้งชุดปฏิบัติการซ่อมบำรุงประปาเคลื่อนที่เร็ว สามารถเข้าซ่อมท่อแตกภายใน ๖ ชั่วโมงหลังรับแจ้ง\n๔. ประสานแผนบริหารจัดการน้ำดิบร่วมกับชุมชนและชลประทาน เพื่อเตรียมพร้อมรับมือภัยแล้งล่วงหน้า",
            "kpi_mit": "ร้อยละของจุดท่อแตกรั่วที่ได้รับการซ่อมแซมภายใน ๒๔ ชั่วโมง (๑๐๐%) และผลตรวจคุณภาพน้ำผ่านเกณฑ์",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานผลการบริหารจัดการน้ำประปาและข้อร้องเรียนในการประชุมประจำเดือน"
        },
        {
            "id": "RSK-10/2570",
            "dept": "กองช่าง",
            "strat": "ยุทธศาสตร์ที่ ๑ การพัฒนาด้านโครงสร้างพื้นฐาน การคมนาคม สาธารณูปโภค",
            "project": "การบำรุงรักษาระบบไฟฟ้าสาธารณะและไฟส่องสว่างพลังงานแสงอาทิตย์ (Solar Cell)",
            "budget": "๓๕๐,๐๐๐",
            "obj": "เพื่อให้ไฟฟ้าสาธารณะและไฟส่องสว่างในชุมชนใช้งานได้ตามปกติ เพิ่มความปลอดภัยทางถนนและป้องกันอาชญากรรม",
            "kpi": "ร้อยละของจุดไฟฟ้าสาธารณะที่ชำรุดได้รับการซ่อมแซมภายใน ๔๘ ชั่วโมง (ไม่น้อยกว่า ๙๐%)",
            "target": "ไฟฟ้าสาธารณะส่องสว่างครอบคลุมจุดเสี่ยง ไม่มีจุดไฟฟ้าดับติดต่อกันเกิน ๓ วันทำการ",
            "risk_desc": "ไฟฟ้าสาธารณะดับเป็นเวลานาน อุปกรณ์โคมไฟและแบตเตอรี่ Solar Cell เสื่อมสภาพ การซ่อมแซมล่าช้าทำให้เกิดอุบัติเหตุยามค่ำคืน",
            "risk_cat": "ด้านการดำเนินงาน (O)",
            "l": 3, "i": 3, "score": 9, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. จัดทำผังสำรวจและกำหนดรหัสประจำจุดโคมไฟสาธารณะและไฟ Solar Cell ทุกหมู่บ้าน เพื่อสะดวกต่อการแจ้งและติดตาม\n๒. จัดระบบรับแจ้งไฟฟ้าสาธารณะชำรุดผ่านกลุ่มไลน์ชุมชน เว็บไซต์ และสมุดรับแจ้ง ณ ที่ทำการ อบต.ฝางคำ\n๓. จัดทีมช่างออกสำรวจและซ่อมบำรุงไฟฟ้าสาธารณะเป็นรอบประจำทุกสัปดาห์ และสำรองหลอดไฟ/อุปกรณ์พร้อมเปลี่ยน\n๔. วางแผนทยอยเปลี่ยนทดแทนเป็นโคมไฟ Solar Cell คุณภาพสูงในจุดที่สายไฟเข้าไม่ถึง เพื่อประหยัดพลังงาน",
            "kpi_mit": "ร้อยละของจุดแจ้งซ่อมไฟฟ้าที่ดำเนินการแล้วเสร็จตามกำหนด (ไม่น้อยกว่า ๙๐%)",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานสรุปสถิติการรับแจ้งและผลการซ่อมแซมไฟฟ้าสาธารณะประจำเดือน"
        },
        {
            "id": "RSK-11/2570",
            "dept": "กองการศึกษา",
            "strat": "ยุทธศาสตร์ที่ ๒ การพัฒนาคุณภาพชีวิต การศึกษา สาธารณสุข",
            "project": "โครงการอาหารกลางวันและพัฒนาสุขอนามัยในศูนย์พัฒนาเด็กเล็ก (ศพด.วัดเจริญทัศน์ และ ศพด.บ้านฝางเทิง)",
            "budget": "๖๒๐,๐๐๐",
            "obj": "เพื่อให้เด็กเล็กใน ศพด. ได้รับประทานอาหารกลางวันที่มีคุณค่าทางโภชนาการ ถูกสุขลักษณะ สะอาด และปลอดภัยทุกวันทำการ",
            "kpi": "ร้อยละของรายการอาหารกลางวันที่จัดตามระบบ Thai School Lunch ครบถ้วน (๑๐๐%)",
            "target": "เด็กเล็กได้รับอาหารกลางวันครบหลักโภชนาการ ไม่มีเหตุการณ์อาหารเป็นพิษ หรือสารปนเปื้อน ๑๐๐%",
            "risk_desc": "อาหารกลางวันไม่ได้มาตรฐานโภชนาการ ใช้วัตถุดิบไม่ได้คุณภาพ มีสิ่งปนเปื้อน หรือเกิดเหตุอาหารเป็นพิษในศูนย์พัฒนาเด็กเล็ก",
            "risk_cat": "ด้านการดำเนินงาน (O)",
            "l": 2, "i": 4, "score": 8, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. จัดทำรายการอาหารล่วงหน้ารายสัปดาห์โดยใช้ระบบ Thai School Lunch สำหรับเด็กปฐมวัย และปิดประกาศให้ผู้ปกครองทราบ\n๒. แต่งตั้งคณะกรรมการตรวจรับอาหารกลางวันที่มีตัวแทนครูผู้ดูแลเด็กและตัวแทนผู้ปกครองร่วมตรวจรับวัตถุดิบทุกวันทำการ\n๓. สุ่มเก็บตัวอย่างอาหารและตรวจความสะอาดของโรงครัว ภาชนะใส่อาหาร และสุขอนามัยของผู้ปรุงอาหารทุกสัปดาห์\n๔. กำหนดมาตรการส่งมอบอาหารให้ทันเวลา (ก่อนเวลา ๑๑.๐๐ น.) และรับประทานอาหารที่ปรุงสุกใหม่ไม่เกิน ๒ ชั่วโมง",
            "kpi_mit": "รายการอาหารตรงตาม Thai School Lunch ๑๐๐% และไม่มีเหตุการณ์อาหารเป็นพิษตลอดปีการศึกษา",
            "timeline": "ตลอดภาคเรียนที่ ๑ และ ๒",
            "reporting": "บันทึกภาพถ่ายรายการอาหารและรายงานผลการตรวจรับทุกสัปดาห์เสนอ ผอ.กองการศึกษา"
        },
        {
            "id": "RSK-12/2570",
            "dept": "กองการศึกษา",
            "strat": "ยุทธศาสตร์ที่ ๒ การพัฒนาคุณภาพชีวิต การศึกษา สาธารณสุข",
            "project": "การจัดซื้อและกระจายอาหารเสริม (นม) โรงเรียน สำหรับ ศพด. และโรงเรียน สพฐ. ๓ แห่ง",
            "budget": "๗๘๐,๐๐๐",
            "obj": "เพื่อให้นักเรียนและเด็กเล็กได้ดื่มนมโรงเรียนที่มีคุณภาพ สด สะอาด ครบถ้วนตามจำนวนวันเปิดภาคเรียน ๒๖๐ วัน",
            "kpi": "ร้อยละของเด็กนักเรียนที่ได้รับนมโรงเรียนครบถ้วนตามเกณฑ์วันเปิดเรียน (๑๐๐%)",
            "target": "ไม่มีเหตุนมบูดเสีย ส่งมอบนมครบจำนวนตรงเวลา และเด็กได้ดื่มนมที่มีมาตรฐาน",
            "risk_desc": "นมโรงเรียนบูดเสีย เสื่อมคุณภาพ การขนส่งไม่ควบคุมความเย็น การส่งมอบนมล่าช้ากว่าวันเปิดภาคเรียน หรือนมกล่องชำรุดเสียหาย",
            "risk_cat": "ด้านการดำเนินงาน (O)",
            "l": 2, "i": 4, "score": 8, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. ทำสัญญาจัดซื้อนมโรงเรียนกับผู้ประกอบการที่ผ่านการรับรองจากคณะกรรมการโคนมและผลิตภัณฑ์นม และกำหนดเงื่อนไขการส่งมอบที่ชัดเจน\n๒. ตรวจสอบอุณหภูมิการขนส่ง (ต่ำกว่า ๔ องศาเซลเซียสสำหรับนมพาสเจอร์ไรส์) วันผลิตและวันหมดอายุทุกล็อตที่มีการส่งมอบ\n๓. จัดเตรียมตู้เย็น/ถังแช่เก็บรักษานมใน ศพด. ให้อยู่ในอุณหภูมิที่เหมาะสม และสุ่มตรวจชิมน้ำนมก่อนแจกจ่ายให้เด็กดื่มทุกวัน\n๔. ประสานโรงเรียน สพฐ. ทั้ง ๓ แห่งในการตรวจรับและจัดทำบันทึกการรับ-จ่ายนมโรงเรียนเป็นลายลักษณ์อักษร",
            "kpi_mit": "ไม่มีเหตุนมโรงเรียนบูดเสีย ๑๐๐% และนักเรียนได้รับนมครบตามสิทธิ ๒๖๐ วัน/ปีการศึกษา",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานผลการส่งมอบและตรวจรับนมโรงเรียนรายเดือนเสนอ ผอ.กองการศึกษา"
        },
        {
            "id": "RSK-13/2570",
            "dept": "กองการศึกษา",
            "strat": "ยุทธศาสตร์ที่ ๒ การพัฒนาคุณภาพชีวิต การศึกษา สาธารณสุข",
            "project": "การประกันคุณภาพการศึกษาและมาตรฐานความปลอดภัยของศูนย์พัฒนาเด็กเล็ก (ศพด.)",
            "budget": "๕๐,๐๐๐",
            "obj": "เพื่อให้ ศพด.วัดเจริญทัศน์ และ ศพด.บ้านฝางเทิง ผ่านเกณฑ์มาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติ และการประเมิน สมศ.",
            "kpi": "ร้อยละของ ศพด. ที่ผ่านเกณฑ์มาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติในระดับดีขึ้นไป (๑๐๐%)",
            "target": "ศพด. ทั้ง ๒ แห่งผ่านการรับรองมาตรฐาน เด็กมีพัฒนาการสมวัยทั้ง ๔ ด้าน และสภาพแวดล้อมปลอดภัย",
            "risk_desc": "ศพด. ไม่ผ่านเกณฑ์มาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติ หลักสูตรไม่ทันสมัย หรือเกิดอุบัติเหตุในศูนย์เด็กเล็ก/รถรับส่ง",
            "risk_cat": "ด้านกลยุทธ์และการดำเนินงาน (S/O)",
            "l": 2, "i": 3, "score": 6, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. ขับเคลื่อนการประเมินตนเองตามมาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติ (SAR) ทั้ง ๓ ด้านให้ครบถ้วน\n๒. อบรมพัฒนาศักยภาพครูผู้ดูแลเด็กในการจัดทำแผนการจัดประสบการณ์การเรียนรู้ที่เน้นเด็กเป็นสำคัญ\n๓. ตรวจสอบมาตรฐานความปลอดภัยของอาคารสถานที่ สนามเด็กเล่น และเครื่องเล่นทุกเดือน\n๔. วางมาตรการคัดกรองโรคติดต่อ (โรคมือ เท้า ปาก / ไข้หวัดใหญ่) และตรวจระบบความปลอดภัยของรถรับส่งนักเรียนทุกคัน",
            "kpi_mit": "ศพด. ผ่านการประเมินมาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติระดับดี และไม่มีอุบัติเหตุรุนแรงใน ศพด.",
            "timeline": "ตลอดปีการศึกษา ๒๕๗๐",
            "reporting": "รายงานผลการประเมินตนเอง (SAR) และรายงานความปลอดภัยต่อนายก อบต.ฝางคำ"
        },
        {
            "id": "RSK-14/2570",
            "dept": "กองการศึกษา",
            "strat": "ยุทธศาสตร์ที่ ๖ การอนุรักษ์ ฟื้นฟู และสืบสานศาสนา ศิลปวัฒนธรรม จารีตประเพณี",
            "project": "การจัดงานส่งเสริมประเพณีและวัฒนธรรมท้องถิ่น (สงกรานต์, บุญบั้งไฟ, ลอยกระทง)",
            "budget": "๖๕๐,๐๐๐",
            "obj": "เพื่ออนุรักษ์สืบสานประเพณีอันดีงามของท้องถิ่น ถูกต้องตามระเบียบกระทรวงมหาดไทยว่าด้วยการจัดงานฯ และปลอดภัย",
            "kpi": "ร้อยละของโครงการจัดงานประเพณีที่ดำเนินการถูกต้องตามระเบียบ มท. และไม่มีข้อทักท้วง (๑๐๐%)",
            "target": "ไม่มีข้อทักท้วงการเบิกจ่ายจาก สตง. ปลอดภัยจากอุบัติเหตุและการทะเลาะวิวาท ๑๐๐%",
            "risk_desc": "การเบิกจ่ายงบประมาณจัดงานไม่เป็นไปตามระเบียบ มท. ว่าด้วยการจัดงานฯ การเกิดอุบัติเหตุจากบั้งไฟ หรือเหตุทะเลาะวิวาทในงานประเพณี",
            "risk_cat": "ด้านการปฏิบัติตามกฎหมายและระเบียบ (C)",
            "l": 3, "i": 3, "score": 9, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. จัดทำโครงการและประมาณการค่าใช้จ่ายตามระเบียบกระทรวงมหาดไทยว่าด้วยค่าใช้จ่ายในการจัดงาน การจัดกิจกรรมสาธารณะฯ อย่างเคร่งครัด\n๒. ประสานขออนุญาตการจุดและปล่อยบั้งไฟตามประกาศจังหวัดอุบลราชธานี กำหนดขนาด ฐานจุด และมาตรการความปลอดภัยอย่างเข้มงวด\n๓. ประสานเจ้าหน้าที่ตำรวจ สภ.สิรินธร ฝ่ายปกครอง และ อปพร. จัดระเบียบการจราจรและรักษาความสงบเรียบร้อยตลอดการจัดงาน\n๔. รณรงค์และกวดขันมาตรการงานประเพณีปลอดเครื่องดื่มแอลกอฮอล์ในบริเวณจัดงานและพื้นที่จัดกิจกรรม",
            "kpi_mit": "การจัดงานถูกต้องตามระเบียบ มท. ๑๐๐% และไม่มีอุบัติเหตุรุนแรงหรือเหตุทะเลาะวิวาทในงาน",
            "timeline": "ตามห้วงเวลาจัดงานประเพณี",
            "reporting": "รายงานสรุปผลการจัดงานและการเบิกจ่ายงบประมาณต่อนายก อบต.ฝางคำ ภายใน ๓๐ วันหลังเสร็จสิ้นงาน"
        },
        {
            "id": "RSK-15/2570",
            "dept": "กองสวัสดิการสังคม",
            "strat": "ยุทธศาสตร์ที่ ๒ การพัฒนาคุณภาพชีวิต การศึกษา สาธารณสุข",
            "project": "การจ่ายเงินเบี้ยยังชีพผู้สูงอายุ คนพิการ และผู้ป่วยเอดส์ (ระบบ e-Social Welfare)",
            "budget": "๒,๕๕๐,๐๐๐",
            "obj": "เพื่อจ่ายเงินเบี้ยยังชีพสงเคราะห์ได้ถูกต้อง ครบถ้วน ตรงเวลา และตรงกลุ่มเป้าหมายผู้มีสิทธิที่แท้จริง",
            "kpi": "ร้อยละความถูกต้องของการจ่ายเงินเบี้ยยังชีพให้แก่ผู้มีสิทธิที่แท้จริง (๑๐๐%)",
            "target": "ไม่มีการจ่ายเงินซ้ำซ้อน ไม่มีการจ่ายเกินสิทธิ และไม่มีผู้มีสิทธิตกหล่น ๑๐๐%",
            "risk_desc": "การจ่ายเงินเบี้ยยังชีพซ้ำซ้อนหรือจ่ายให้แก่ผู้เสียชีวิตไปแล้วเนื่องจากข้อมูลไม่อัปเดต หรือผู้มีสิทธิรายใหม่ตกหล่นจากระบบ",
            "risk_cat": "ด้านการเงินและการคลัง (F)",
            "l": 2, "i": 4, "score": 8, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. เชื่อมโยงและตรวจสอบข้อมูลผู้มีสิทธิรับเบี้ยยังชีพกับฐานข้อมูลสำนักทะเบียนราษฎรอำเภอสิรินธร ก่อนวันประมวลผลจ่ายเงินทุกเดือน\n๒. ประสานงานเครือข่ายผู้ใหญ่บ้าน อสม. ใน ๔ หมู่บ้าน เพื่อแจ้งรายงานการย้ายถิ่นฐานและการเสียชีวิตของคนในชุมชนแบบเรียลไทม์\n๓. ตรวจสอบกระทบยอดบัญชีรายชื่อผู้รับเงินในระบบ e-Social Welfare ร่วมกับกองคลังก่อนส่งข้อมูลให้กรมบัญชีกลางโอนเงิน\n๔. เปิดรับลงทะเบียนผู้มีสิทธิรับเบี้ยยังชีพผู้สูงอายุรายใหม่อย่างต่อเนื่องตลอดทั้งปี และประชาสัมพันธ์สิทธิประโยชน์เชิงรุก",
            "kpi_mit": "ความถูกต้องของการจ่ายเบี้ยยังชีพ ๑๐๐% และไม่มีกรณีต้องเรียกเงินคืนจากทายาทเนื่องจากการจ่ายเกินสิทธิ",
            "timeline": "ทุกวันที่ ๑ - ๕ ของทุกเดือน",
            "reporting": "รายงานผลการจ่ายเบี้ยยังชีพประจำเดือนเสนอนายก อบต.ฝางคำ และปิดประกาศรายชื่อผู้มีสิทธิ"
        },
        {
            "id": "RSK-16/2570",
            "dept": "กองสวัสดิการสังคม",
            "strat": "ยุทธศาสตร์ที่ ๒ การพัฒนาคุณภาพชีวิต การศึกษา สาธารณสุข",
            "project": "การสำรวจและจัดทำฐานข้อมูลกลุ่มเปราะบาง/ผู้ด้อยโอกาสเพื่อการสงเคราะห์และพัฒนาคุณภาพชีวิต",
            "budget": "๖๐,๐๐๐",
            "obj": "เพื่อให้มีฐานข้อมูลกลุ่มเปราะบางที่แม่นยำ และสามารถให้ความช่วยเหลือสงเคราะห์ได้ตรงตามสภาพปัญหา",
            "kpi": "ร้อยละของกลุ่มเปราะบางที่ได้รับการสำรวจและได้รับความช่วยเหลือตามเกณฑ์ (ไม่น้อยกว่า ๙๐%)",
            "target": "เข้าถึงกลุ่มเปราะบางในตำบลฝางคำครบถ้วน และได้รับการประสานส่งต่อความช่วยเหลือ ๑๐๐%",
            "risk_desc": "ข้อมูลกลุ่มเปราะบางไม่เป็นปัจจุบัน ขาดการบูรณาการข้อมูลร่วมกับ พมจ. หรือการสงเคราะห์ช่วยเหลือไม่ตรงกับสภาพปัญหาที่แท้จริง",
            "risk_cat": "ด้านการดำเนินงาน (O)",
            "l": 2, "i": 3, "score": 6, "level": "ปานกลาง", "color": "สีเหลือง", "strategy": "การลดความเสี่ยง (Treat)",
            "mitigation": "๑. บูรณาการร่วมกับผู้นำชุมชน อสม. และอาสาสมัครพัฒนาสังคม (อพม.) สำรวจข้อมูลครัวเรือนเปราะบางใน ๔ หมู่บ้านปีละ ๒ ครั้ง\n๒. จัดทำระบบสมุดพกครอบครัวเปราะบาง บันทึกสภาพปัญหาด้านที่อยู่อาศัย สุขภาพ รายได้ และการศึกษา\n๓. ประสานความร่วมมือกับสำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัด (พมจ.อุบลราชธานี) และกาชาด ในการสนับสนุนเงินสงเคราะห์และซ่อมแซมบ้าน\n๔. ติดตามประเมินผลการฟื้นฟูคุณภาพชีวิตของกลุ่มเปราะบางอย่างต่อเนื่อง",
            "kpi_mit": "ฐานข้อมูลกลุ่มเปราะบางมีความครอบคลุมและเป็นปัจจุบัน ๑๐๐% และได้รับการดูแลช่วยเหลือครบทุกราย",
            "timeline": "ตลอดปีงบประมาณ ๒๕๗๐",
            "reporting": "รายงานผลการสำรวจและสงเคราะห์กลุ่มเปราะบางเสนอผู้บริหารทุกไตรมาส"
        }
    ]

    # --- Write Table BS. 1 ---
    add_heading_1(doc, "๕.๑ แบบ บส. ๑: กำหนดขอบเขตความรับผิดชอบตามประเด็นยุทธศาสตร์/โครงการสำคัญ")
    add_p(doc, "แบบ บส. ๑ เป็นการกำหนดขอบเขตและระบุความเชื่อมโยงระหว่างรหัสความเสี่ยง ยุทธศาสตร์ ภารกิจสำคัญ งบประมาณ วัตถุประสงค์ ตัวชี้วัด เป้าหมาย และส่วนราชการผู้รับผิดชอบ ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ ดังนี้:", 
          indent=0.5, space_after=6)
          
    bs1_table = doc.add_table(rows=1, cols=7)
    bs1_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    bs1_table.autofit = False
    bs1_table.columns[0].width = Cm(2.2)
    bs1_table.columns[1].width = Cm(3.2)
    bs1_table.columns[2].width = Cm(3.6)
    bs1_table.columns[3].width = Cm(1.6)
    bs1_table.columns[4].width = Cm(2.8)
    bs1_table.columns[5].width = Cm(1.8)
    bs1_table.columns[6].width = Cm(1.8)
    
    headers_bs1 = ["รหัสความเสี่ยง", "ยุทธศาสตร์ที่รับผิดชอบ", "โครงการ/ภารกิจสำคัญ", "งบประมาณ\n(บาท)", "วัตถุประสงค์", "เป้าหมาย", "ส่วนราชการ"]
    for i, h in enumerate(headers_bs1):
        format_cell(bs1_table.rows[0].cells[i], h, bold=True, size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
        
    for item in risk_master:
        row = bs1_table.add_row()
        format_cell(row.cells[0], item["id"], bold=True, size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[1], item["strat"], size_pt=11)
        format_cell(row.cells[2], item["project"], size_pt=11)
        format_cell(row.cells[3], item["budget"], size_pt=11, align=WD_ALIGN_PARAGRAPH.RIGHT)
        format_cell(row.cells[4], item["obj"], size_pt=11)
        format_cell(row.cells[5], item["target"], size_pt=11)
        format_cell(row.cells[6], item["dept"], bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        
    set_table_borders(bs1_table, color="CBD5E1", sz="4")
    add_p(doc, "", space_after=12)

    # --- Write Table BS. 2 ---
    add_heading_1(doc, "๕.๒ แบบ บส. ๒: การวิเคราะห์โอกาส ผลกระทบ และการตอบสนองความเสี่ยง")
    add_p(doc, "แบบ บส. ๒ เป็นการวิเคราะห์และประเมินระดับความเสี่ยง โดยพิจารณาจากโอกาสการเกิด (Likelihood) และผลกระทบ (Impact) พร้อมทั้งกำหนดกลยุทธ์การตอบสนองความเสี่ยง ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ ดังนี้:", 
          indent=0.5, space_after=6)
          
    bs2_table = doc.add_table(rows=1, cols=9)
    bs2_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    bs2_table.autofit = False
    bs2_table.columns[0].width = Cm(2.0)
    bs2_table.columns[1].width = Cm(3.2)
    bs2_table.columns[2].width = Cm(3.5)
    bs2_table.columns[3].width = Cm(2.2)
    bs2_table.columns[4].width = Cm(1.1)
    bs2_table.columns[5].width = Cm(1.1)
    bs2_table.columns[6].width = Cm(1.2)
    bs2_table.columns[7].width = Cm(1.4)
    bs2_table.columns[8].width = Cm(1.7)
    
    headers_bs2 = ["รหัสเสี่ยง", "โครงการ/ภารกิจ", "เหตุการณ์ความเสี่ยง", "ประเภทความเสี่ยง", "โอกาส\n(L)", "ผลกระทบ\n(I)", "คะแนน\n(LxI)", "ระดับเสี่ยง", "กลยุทธ์ตอบสนอง"]
    for i, h in enumerate(headers_bs2):
        format_cell(bs2_table.rows[0].cells[i], h, bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
        
    for item in risk_master:
        row = bs2_table.add_row()
        format_cell(row.cells[0], item["id"], bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[1], item["project"], size_pt=11)
        format_cell(row.cells[2], item["risk_desc"], size_pt=11)
        format_cell(row.cells[3], item["risk_cat"], size_pt=11)
        format_cell(row.cells[4], str(item["l"]), size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[5], str(item["i"]), size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[6], str(item["score"]), bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        
        bg_col = "FFEDD5" if item["color"] == "สีส้ม" else "FEF9C3" if item["color"] == "สีเหลือง" else "FEE2E2"
        text_c = (194, 65, 12) if item["color"] == "สีส้ม" else (161, 98, 7) if item["color"] == "สีเหลือง" else (185, 28, 28)
        format_cell(row.cells[7], item["level"], bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex=bg_col, text_color=text_c)
        format_cell(row.cells[8], item["strategy"], size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        
    set_table_borders(bs2_table, color="CBD5E1", sz="4")
    add_p(doc, "", space_after=12)

    # --- Write Table BS. 3 ---
    add_heading_1(doc, "๕.๓ แบบ บส. ๓: รายงานการจัดทำแผนบริหารความเสี่ยง (มาตรการปฏิบัติการและตัวชี้วัด)")
    add_p(doc, "แบบ บส. ๓ เป็นการกำหนดมาตรการจัดการความเสี่ยงเชิงปฏิบัติการ (Risk Mitigation Measures) อย่างเป็นรูปธรรมและวัดผลได้ พร้อมทั้งระบุตัวชี้วัด ผู้รับผิดชอบ กรอบระยะเวลา และวิธีการติดตามรายงานผล ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ ดังนี้:", 
          indent=0.5, space_after=6)
          
    bs3_table = doc.add_table(rows=1, cols=7)
    bs3_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    bs3_table.autofit = False
    bs3_table.columns[0].width = Cm(1.8)
    bs3_table.columns[1].width = Cm(2.8)
    bs3_table.columns[2].width = Cm(4.8)
    bs3_table.columns[3].width = Cm(2.8)
    bs3_table.columns[4].width = Cm(1.6)
    bs3_table.columns[5].width = Cm(1.5)
    bs3_table.columns[6].width = Cm(2.2)
    
    headers_bs3 = ["รหัสเสี่ยง", "โครงการ/ภารกิจ", "วิธีการจัดการความเสี่ยง (มาตรการปฏิบัติการ)", "ตัวชี้วัดความสำเร็จ", "ผู้รับผิดชอบ", "ระยะเวลา", "วิธีการติดตามและรายงาน"]
    for i, h in enumerate(headers_bs3):
        format_cell(bs3_table.rows[0].cells[i], h, bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="1E3A8A", text_color=(255,255,255))
        
    for item in risk_master:
        row = bs3_table.add_row()
        format_cell(row.cells[0], item["id"], bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[1], item["project"], size_pt=11)
        format_cell(row.cells[2], item["mitigation"], size_pt=10)
        format_cell(row.cells[3], item["kpi_mit"], size_pt=10)
        format_cell(row.cells[4], item["dept"], bold=True, size_pt=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[5], item["timeline"], size_pt=10, align=WD_ALIGN_PARAGRAPH.CENTER)
        format_cell(row.cells[6], item["reporting"], size_pt=10)
        
    set_table_borders(bs3_table, color="CBD5E1", sz="4")
    doc.add_page_break()

    # ------------------ APPENDIX ------------------
    print("Writing Appendix (ภาคผนวก)...")
    add_p(doc, "ภาคผนวก", size_pt=22, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(30, 58, 138), space_before=10, space_after=18)
    add_p(doc, "------------------------------------------------------------", size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(203, 213, 225), space_after=18)

    add_heading_1(doc, "ภาคผนวก ก: ร่างคำสั่งแต่งตั้งคณะกรรมการและคณะทำงานบริหารความเสี่ยง")
    add_p(doc, "คำสั่งองค์การบริหารส่วนตำบลฝางคำ", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p(doc, "ที่            / ๒๕๖๙", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_p(doc, "เรื่อง  แต่งตั้งคณะกรรมการและคณะทำงานบริหารจัดการความเสี่ยง องค์การบริหารส่วนตำบลฝางคำ", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p(doc, "ประจำปีงบประมาณ พ.ศ. ๒๕๗๐", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)

    add_p(doc, "เพื่อให้การดำเนินงานด้านการบริหารจัดการความเสี่ยงขององค์การบริหารส่วนตำบลฝางคำ เป็นไปตามบทบัญญัติแห่งพระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. ๒๕๖๑ มาตรา ๗๙ และหลักเกณฑ์กระทรวงการคลังว่าด้วยมาตรฐานและหลักเกณฑ์ปฏิบัติการบริหารจัดการความเสี่ยงสำหรับหน่วยงานของรัฐ พ.ศ. ๒๕๖๒ เพื่อให้องค์กรสามารถบริหารจัดการความเสี่ยงได้อย่างเป็นระบบ มีประสิทธิภาพ และส่งเสริมการกำกับดูแลกิจการที่ดี อาศัยอำนาจตามความในมาตรา ๕๙/๑ แห่งพระราชบัญญัติสภาตำบลและองค์การบริหารส่วนตำบล พ.ศ. ๒๕๓๗ และที่แก้ไขเพิ่มเติม จึงมีคำสั่งแต่งตั้งคณะกรรมการและคณะทำงานบริหารจัดการความเสี่ยง ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ ประกอบด้วยบุคคลดังต่อไปนี้", 
          indent=0.5, space_after=6)
          
    app_members = [
        ("๑. นายกองค์การบริหารส่วนตำบลฝางคำ", "ประธานคณะทำงาน"),
        ("๒. รองนายกองค์การบริหารส่วนตำบลฝางคำ", "รองประธานคณะทำงาน"),
        ("๓. ปลัดองค์การบริหารส่วนตำบลฝางคำ", "คณะทำงาน"),
        ("๔. รองปลัดองค์การบริหารส่วนตำบลฝางคำ", "คณะทำงาน"),
        ("๕. ผู้อำนวยการกองคลัง", "คณะทำงาน"),
        ("๖. ผู้อำนวยการกองช่าง", "คณะทำงาน"),
        ("๗. ผู้อำนวยการกองการศึกษา ศาสนาและวัฒนธรรม", "คณะทำงาน"),
        ("๘. ผู้อำนวยการกองสวัสดิการสังคม", "คณะทำงาน"),
        ("๙. หัวหน้าสำนักปลัด", "คณะทำงานและเลขานุการ"),
        ("๑๐. นักวิเคราะห์นโยบายและแผน", "คณะทำงานและผู้ช่วยเลขานุการ"),
        ("๑๑. นักวิชาการตรวจสอบภายใน", "ผู้สอบทานและให้คำปรึกษา")
    ]
    for m_name, m_role in app_members:
        p = add_p(doc, f"       {m_name}", space_after=2)
        run = p.add_run(f"    มีหน้าที่เป็น    {m_role}")
        format_run(run, bold=("ประธาน" in m_role or "เลขานุการ" in m_role or "ผู้สอบทาน" in m_role))

    add_p(doc, "โดยให้คณะทำงานมีอำนาจหน้าที่ตามที่กำหนดไว้ในคู่มือและแผนการบริหารจัดการความเสี่ยง ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ และรายงานผลการดำเนินงานต่อนายกองค์การบริหารส่วนตำบลฝางคำทราบอย่างสม่ำเสมอ", indent=0.5, space_before=6, space_after=12)

    add_p(doc, "สั่ง ณ วันที่        เดือนตุลาคม พ.ศ. ๒๕๖๙", align=WD_ALIGN_PARAGRAPH.CENTER, space_after=20)
    add_p(doc, "(.........................................................)", align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p(doc, "นายกองค์การบริหารส่วนตำบลฝางคำ", align=WD_ALIGN_PARAGRAPH.CENTER, space_after=20)

    add_p(doc, "------------------------------------------------------------", size_pt=12, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(203, 213, 225), space_after=14)

    add_heading_1(doc, "ภาคผนวก ข: ร่างประกาศเจตนารมณ์และนโยบายการบริหารความเสี่ยง")
    add_p(doc, "ประกาศองค์การบริหารส่วนตำบลฝางคำ", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p(doc, "เรื่อง  นโยบายการบริหารจัดการความเสี่ยง องค์การบริหารส่วนตำบลฝางคำ", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p(doc, "ประจำปีงบประมาณ พ.ศ. ๒๕๗๐", size_pt=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)

    add_p(doc, "เพื่อให้การบริหารราชการขององค์การบริหารส่วนตำบลฝางคำ เป็นไปตามหลักการบริหารจัดการบ้านเมืองที่ดี มีความโปร่งใส คุ้มค่า มีประสิทธิภาพ และสอดคล้องตามพระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. ๒๕๖๑ มาตรา ๗๙ จึงขอประกาศนโยบายการบริหารจัดการความเสี่ยง ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ ดังนี้:", 
          indent=0.5, space_after=4)
          
    policies = [
        "๑. ให้การบริหารจัดการความเสี่ยงเป็นหน้าที่และความรับผิดชอบของบุคลากรทุกระดับในองค์การบริหารส่วนตำบลฝางคำ ที่จะต้องตระหนักและร่วมกันขับเคลื่อนในกระบวนงานประจำวัน",
        "๒. ให้ทุกสำนัก/กอง ดำเนินการระบุ ประเมิน และจัดทำแผนบริหารจัดการความเสี่ยงตามคู่มือและแนวทางที่กำหนด โดยบูรณาการร่วมกับการควบคุมภายในและการตรวจสอบภายใน",
        "๓. มุ่งเน้นการป้องกันความเสี่ยงด้านความโปร่งใส การป้องกันผลประโยชน์ทับซ้อน การคุ้มครองข้อมูลส่วนบุคคล (PDPA) และความปลอดภัยทางไซเบอร์ เพื่อเสริมสร้างความเชื่อมั่นของประชาชน",
        "๔. กำหนดให้มีการติดตาม ประเมินผล และรายงานความก้าวหน้าการบริหารจัดการความเสี่ยงต่อคณะทำงานและผู้บริหารอย่างน้อยปีละ ๒ ครั้ง (รอบ ๖ เดือน และ ๑๒ เดือน)",
        "๕. ส่งเสริมการสร้างวัฒนธรรมองค์กรที่ตระหนักถึงความเสี่ยง (Risk-aware Culture) และสนับสนุนทรัพยากรที่จำเป็นในการบริหารความเสี่ยงอย่างคุ้มค่า"
    ]
    for pol in policies:
        add_p(doc, pol, indent=0.5, space_after=3)

    add_p(doc, "จึงประกาศให้ทราบและถือปฏิบัติโดยทั่วกัน", indent=0.5, space_before=6, space_after=16)
    add_p(doc, "ประกาศ ณ วันที่        เดือนพฤศจิกายน พ.ศ. ๒๕๖๙", align=WD_ALIGN_PARAGRAPH.CENTER, space_after=20)
    add_p(doc, "(.........................................................)", align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p(doc, "นายกองค์การบริหารส่วนตำบลฝางคำ", align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)

    # Save to both target paths
    target_path1 = os.path.join(r"C:\Users\Windows11\.gemini\antigravity\scratch\internal-audit-app\public\docs", "คู่มือและแผนการบริหารจัดการความเสี่ยง_อบต.ฝางคำ_ประจำปีงบประมาณ_2570.docx")
    target_path2 = os.path.join(r"C:\Users\Windows11\.gemini\antigravity\scratch", "คู่มือและแผนการบริหารจัดการความเสี่ยง_อบต.ฝางคำ_ประจำปีงบประมาณ_2570.docx")
    
    os.makedirs(os.path.dirname(target_path1), exist_ok=True)
    doc.save(target_path1)
    print(f"Successfully saved to {target_path1}")
    
    shutil.copy2(target_path1, target_path2)
    print(f"Successfully copied to {target_path2}")
    
    file_size_kb = os.path.getsize(target_path1) / 1024
    print(f"Generated Document Size: {file_size_kb:.2f} KB")

if __name__ == "__main__":
    build_manual()
