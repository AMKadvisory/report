// ═══════════════════════════════════════════════════════════
//  forms/ebl-flat/pdf-template.js
//  ► Edit THIS file to change the EBL Flat Valuation PDF.
//  ► SELF-CONTAINED — no dependency on pdf-engine.js
//
//  Page map (mirrors EBL Flat HTML sheet by sheet):
//    Page 1  → Sheet 1  Cover (Ref A/C, Ref No, Submitted by/to)
//    Page 2  → Sheet 2  Cover Letter + Flat Valuation table + Signatures
//    Page 3  → Sheet 3  Summary
//    Page 4  → Sheet 4  A. Account  +  B. Owner
//    Page 5  → Sheet 5  C. Schedule  +  D. Identification
//    Page 6  → Sheet 6  E. Other Features
//    Page 7  → Sheet 7  F. Civil Construction
//    Page 8  → Sheet 8  Floor Area + Floor Unit + G. Setback
//    Page 9  → Sheet 9  H. Construction %  +  I. Building Value
//    Page 10 → Sheet 10 J. Price Justification + K (static) + L (static)
//    Page 11+→ Annexure-I photo sheets
// ═══════════════════════════════════════════════════════════
const EBLFlatPDF = {

    async render(formData, _E, mode) {
        const fd = formData || {};

        // ── Value helpers (were E.v / E.dt) ─────────────────
        const v  = (k, fb = '') => { const val = fd[k]; return (val === undefined || val === null || val === '') ? fb : String(val); };
        const dt = (k) => {
            const s = fd[k];
            if (!s) return '—';
            try { return new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
            catch(e) { return s; }
        };

        // Number helpers
        const raw = (k) => parseFloat((fd[k] || '0').toString().replace(/,/g, '')) || 0;
        const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // ── Page constants (were E.PW / E.ML etc.) ───────────
        const PW = 210, PH = 297;
        const MT = 25, MB = 20;
        const ML = 24, MR = 18;
        const CW = PW - ML - MR;
        const HEADER_W = 127, HEADER_H = 12.7;
        const FOOTER_H = 10.9;
        const CONTENT_BOTTOM = PH - FOOTER_H - 2;

        // ── jsPDF init (was E.init()) ────────────────────────
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        // ── Image loader (was E._loadImg) ────────────────────
        const loadImg = (src) => new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width  = img.naturalWidth  || img.width;
                canvas.height = img.naturalHeight || img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });

        const headerImg = await loadImg(null);
        const footerImg = await loadImg(null);

        // ── Typography helpers (were E.bold / E.normal / E.italic) ──
        const bold   = (sz = 10) => { doc.setFont('times', 'bold');   doc.setFontSize(sz); doc.setTextColor(0,0,0); };
        const normal = (sz = 10) => { doc.setFont('times', 'normal'); doc.setFontSize(sz); doc.setTextColor(0,0,0); };
        const italic = (sz = 10) => { doc.setFont('times', 'italic'); doc.setFontSize(sz); doc.setTextColor(0,0,0); };

        // ── Header & footer (was E.drawHeaderFooter) ─────────
        const drawHeaderFooter = () => {
            if (headerImg) {
                try { doc.addImage(headerImg, 'PNG', (PW - HEADER_W) / 2, 5, HEADER_W, HEADER_H); } catch(e) {}
            }
            if (footerImg) {
                try { doc.addImage(footerImg, 'PNG', 0, PH - FOOTER_H, PW, FOOTER_H); } catch(e) {}
            }
        };

        // ── New page (was E.newPage()) ────────────────────────
        const newPage = () => {
            doc.addPage();
            drawHeaderFooter();
            return MT;
        };

        // Draw header/footer on page 1 and set starting y (was E.init() return value)
        drawHeaderFooter();
        let y = MT;

        // ── Local drawing helpers ──────────────────────────

        // Grey-label : white-value key-value row
        const kvRow = (y, label, val, lw = 60) => {
            const vw    = CW - lw - 4;
            const lines = doc.splitTextToSize(String(val || ''), vw - 2);
            const rh    = Math.max(5, lines.length * 4.5 + 0.5);
            if (y + rh > CONTENT_BOTTOM) y = newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            doc.setFillColor(255,255,255); doc.rect(ML,      y, lw,  rh, 'FD');
            doc.setFillColor(255,255,255); doc.rect(ML+lw,   y, 4,   rh, 'FD');
            doc.rect(ML+lw+4, y, vw, rh, 'FD');
            bold(10);   doc.text(String(label), ML+1.5, y+4);
            normal(10); doc.text(':', ML+lw+1.2, y+4);
            doc.text(lines[0], ML+lw+5.5, y+4);
            for (let i = 1; i < lines.length; i++) doc.text(lines[i], ML+lw+5.5, y+4+i*4.5);
            return y + rh;
        };

        const heading = (y, text) => {
            if (y + 8 > CONTENT_BOTTOM) y = newPage();
            bold(12); doc.text(text, ML, y+5);
            const textWidth = doc.getTextWidth(text);
            doc.setLineWidth(0.3); doc.line(ML, y+6.5, ML+textWidth, y+6.5);
            normal(10); return y + 9;
        };

        // Table header row — FIX: measure actual multi-line height before drawing
        const tblHeader = (y, cols, cws) => {
            // Calculate the required header height based on wrapped text in each cell
            let hdrH = 5;
            bold(9);
            cols.forEach((c, i) => {
                const ls = doc.splitTextToSize(c, cws[i] - 2);
                hdrH = Math.max(hdrH, ls.length * 4.5 + 0.5);
            });
            if (y + hdrH > CONTENT_BOTTOM) y = newPage();
            let x = ML;
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            cols.forEach((c, i) => {
                doc.rect(x, y, cws[i], hdrH);
                const ls = doc.splitTextToSize(c, cws[i] - 2);
                // Vertically center multi-line text within the header cell
                const totalTextH = (ls.length - 1) * 4.5;
                const textStartY = y + (hdrH - totalTextH) / 2 + 1;
                doc.text(ls, x + cws[i] / 2, textStartY, { align: 'center' });
                x += cws[i];
            });
            return y + hdrH;
        };

        // Table data row
        const tblRow = (y, cells, cws, firstBold = true) => {
            let rh = 5;
            cells.forEach((c, i) => {
                const ls = doc.splitTextToSize(String(c||''), cws[i]-1);
                rh = Math.max(rh, ls.length * 4.5 + 0.5);
            });
            if (y + rh > CONTENT_BOTTOM) y = newPage();
            let x = ML;
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            cells.forEach((c, i) => {
                doc.rect(x, y, cws[i], rh);
                const ls   = doc.splitTextToSize(String(c||''), cws[i]-1);
                const align = i === 0 ? 'left' : 'center';
                const tx    = i === 0 ? x+1.5 : x+cws[i]/2;
                if (i === 0 && firstBold) bold(9); else normal(9);
                doc.text(ls, tx, y+4, { align });
                x += cws[i];
            });
            return y + rh;
        };

        // Formula italic sub-row
        const formulaRow = (y, cells, cws) => {
            if (y + 5 > CONTENT_BOTTOM) y = newPage();
            let x = ML;
            italic(8); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            cells.forEach((c, i) => {
                doc.rect(x, y, cws[i], 5);
                doc.text(String(c), x+cws[i]/2, y+3.5, { align: 'center' });
                x += cws[i];
            });
            normal(10); return y + 5;
        };

        // Numbered list with overflow check
        const numberedList = (y, items) => {
            items.forEach((txt, i) => {
                const prefix = `${i+1}. `;
                const prefixW = doc.getTextWidth(prefix);
                const ls = doc.splitTextToSize(txt, CW - 4 - prefixW);
                if (y + ls.length*4.5 > CONTENT_BOTTOM) y = newPage();
                normal(10);
                doc.text(prefix, ML+2, y);
                doc.text(ls, ML+2+prefixW, y, { align: 'justify', maxWidth: CW - 4 - prefixW });
                y += ls.length*4 + 0.5;
            });
            return y;
        };
        const areaRows = Array.isArray(fd._floor_area_rows) ? fd._floor_area_rows : [];
        

        // ══════════════════════════════════════════════════
        //  PAGE 1 – COVER  (Sheet 1)
        //  EBL: NO surveyor table – only Ref + Submitted boxes
        // ══════════════════════════════════════════════════
        const titleY = 80;
        bold(18);
        doc.text('INSPECTION SURVEY & VALUATION REPORT', PW/2, titleY, { align:'center' });

        // Reference fields — centered block
        let ry = titleY + 80;
        const refLabelW = 52, refColonW = 4;
        const refStartX = (PW - refLabelW - refColonW - 60) / 2;
        [
            ['Reference Account Name', v('reference_account_name')],
            ['Reference No.',  v('reference_no')],
        ].forEach(([lbl, val]) => {
            bold(10);
            doc.text(lbl, refStartX, ry);
            doc.text(':', refStartX + refLabelW, ry);
            doc.text(String(val), refStartX + refLabelW + refColonW + 1, ry);
            ry += 6;
        });

        // Submitted boxes
        const boxTop = 220;
        const rNameLines = doc.splitTextToSize(v('recipient_name'), CW/2-14);
        const addrL      = doc.splitTextToSize(v('recipient_address'), CW/2-14);
        const boxH = Math.max(40, 14 + Math.max(6, rNameLines.length + addrL.length) * 5.5);

        doc.setDrawColor(0,0,0); doc.setFillColor(255,255,255);

        // Draw outer rectangle spanning both boxes (single shared border)
        doc.rect(ML, boxTop, CW, boxH, 'FD');

        // Draw only the vertical divider line in the middle
        const midX = ML + CW/2;
        doc.line(midX, boxTop, midX, boxTop + boxH);

        let by = boxTop + 6;
        bold(10);  doc.text('Submitted by:', ML+3, by); by += 6;
        bold(10);  doc.text('AMK Associates Limited', ML+3, by); by += 5.5;
        normal(10);
        doc.text('68, Khilgaon Chowdhury Para (4th floor)', ML+3, by); by += 5;
        doc.text('DIT Road Rampura, Dhaka-1219', ML+3, by); by += 5;
        doc.text('E-mail: www.amkassociatesbd@gmail.com', ML+3, by); by += 5;
        doc.text('Web: www.amkassociatesbd.com', ML+3, by); by += 5;
        doc.text('Contact: 01841132714', ML+3, by);

        const rx = midX + 3;
        let ty = boxTop + 6;
        bold(10); doc.text('Submitted to:', rx, ty); ty += 6;
        rNameLines.forEach(l => { bold(10); doc.text(l, rx, ty); ty += 5.5; });
        normal(10); addrL.forEach(l => { doc.text(l, rx, ty); ty += 5; });

        
        // ══════════════════════════════════════════════════
        //  PAGE 2 – COVER LETTER  (Sheet 2)
        // ══════════════════════════════════════════════════
        y = newPage();
        normal(10);
        doc.text('Ref.: ' + v('letter_ref'),  ML, y); y += 6;
        doc.text('Date: ' + dt('letter_date'), ML, y); y += 9;
        bold(10); doc.text(v('recipient_name'), ML, y); y += 5;
        normal(10);
        const addrL2 = doc.splitTextToSize(v('recipient_address'), CW);
        doc.text(addrL2, ML, y); y += addrL2.length*4.5 + 5;

        bold(10);
        doc.text('Subject: Inspection, Survey & Valuation Report on Flat', ML, y, { maxWidth: CW }); y += 6;
        doc.text('Ref. A/C Name: ' + v('reference_account_name'), ML, y); y += 8;

        normal(10);
        doc.text('Dear Sir,', ML, y); y += 5;
        doc.text('Greetings from AMK Associates Limited and Thank You very much for referring us!', ML, y, { maxWidth: CW }); y += 8;
        const bodyStr = 'Pursuant to your communication through ' + v('comm_medium') +
            ', dated: ' + dt('comm_date') + ' by ' + v('comm_person') +
            ', we, AMK Associates Limited ("AMK") has conducted the inspection, survey and valuation.' +
            ' Summary of the valuation is as below:';
        const bodyLines = doc.splitTextToSize(bodyStr, CW);
        doc.text(bodyLines, ML, y); y += bodyLines.length*4.5 + 5;


        // ── Flat valuation table (matches the image: Description | a | b | c | d=a*c | e=b*c)
        // Column widths: Description(40) | Area Plan(25) | Area Phys(25) | Rate(28) | Val Plan(30) | Val Phys(30)
        const vCws = [36, 24, 24, 24, 26, 26];
        const vTotalW = vCws.reduce((a,b)=>a+b,0);

        //italic(9); doc.text('Amount in BDT', ML + vTotalW, y, { align: 'right' }); y += 4;

        // ── Header row 1 (label row)
        const vH1 = 16, vH2 = 5, vTotalHdrH = vH1 + vH2;
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
        bold(9);

        // Outer border for whole header
        doc.rect(ML, y, vTotalW, vTotalHdrH);

        // Vertical dividers across full header height
        let vhx = ML;
        vCws.forEach((w, i) => {
            if (i > 0) doc.line(vhx, y, vhx, y + vTotalHdrH);
            vhx += w;
        });

        // Horizontal divider between label row and formula row (skip col 0 — Description spans both)
        doc.line(ML + vCws[0], y + vH1, ML + vTotalW, y + vH1);

        // Description — vertically centred across full header height
        bold(9);
        doc.text('Description', ML + vCws[0]/2, y + vTotalHdrH/2 + 1.5, { align: 'center' });

        // Header labels (top row) for cols 1-5
        const vHdrLabels = [
            'Flat Area as\nper Plan\n(Sft.)',
            'Flat Area as per\nPhysical\n(Sft.)',
            'Present Rate\nper Sft.\nConsidered\n(BDT)',
            'Total Value\nas per Plan\n(BDT)',
            'Total Value\nas per\nPhysical\n(BDT)',
        ];
        vhx = ML + vCws[0];
        vHdrLabels.forEach((lbl, i) => {
            const ls = doc.splitTextToSize(lbl, vCws[i+1] - 2);
            const textY = y + (vH1 - (ls.length-1)*4) / 2 + 1;
            doc.text(ls, vhx + vCws[i+1]/2, textY, { align: 'center' });
            vhx += vCws[i+1];
        });

        // Formula row (row 2) for cols 1-5
        italic(8);
        vhx = ML + vCws[0];
        ['a', 'b', 'c', 'd=a*c', 'e=b*c'].forEach((f, i) => {
            doc.text(f, vhx + vCws[i+1]/2, y + vH1 + 3.5, { align: 'center' });
            vhx += vCws[i+1];
        });
        y += vTotalHdrH;

        // ── Helper: parse a field value stripping commas
        const vParse = (k) => parseFloat((fd[k]||'').toString().replace(/,/g,'')) || 0;

        // ── Collect values from form fields
        const pmvAreaPlan = vParse('flat_pmv_area_plan');
        const pmvAreaPhys = vParse('flat_pmv_area_phys');
        const pmvRate     = vParse('flat_pmv_rate');
        const pmvValPlan  = pmvAreaPlan && pmvRate ? pmvAreaPlan * pmvRate : vParse('flat_pmv_val_plan');
        const pmvValPhys  = pmvAreaPhys && pmvRate ? pmvAreaPhys * pmvRate : vParse('flat_pmv_val_phys');

        const parkValPlan = vParse('flat_park_val_plan');
        const parkValPhys = vParse('flat_park_val_phys');

        const totalValPlan = pmvValPlan + parkValPlan;
        const totalValPhys = pmvValPhys + parkValPhys;

        const depPctFlat  = vParse('flat_dep_pct') / 100;
        const depValPlan  = totalValPlan * depPctFlat;
        const depValPhys  = totalValPhys * depPctFlat;
        const netValPlan  = totalValPlan - depValPlan;
        const netValPhys  = totalValPhys - depValPhys;
        const forcedPlan  = netValPlan * 0.8;
        const forcedPhys  = netValPhys * 0.8;

        // ── Draw helper: one data row
        const vRow = (desc, col1, col2, col3, col4, col5, isBold = false) => {
            const cells = [desc, col1, col2, col3, col4, col5];
            let rh = 5;
            cells.forEach((c, i) => {
                const ls = doc.splitTextToSize(String(c||''), vCws[i]-2);
                rh = Math.max(rh, ls.length * 4.5 + 0.5);
            });
            if (y + rh > CONTENT_BOTTOM) y = newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            let dx = ML;
            cells.forEach((c, i) => {
                doc.rect(dx, y, vCws[i], rh);
                const ls    = doc.splitTextToSize(String(c||''), vCws[i]-2);
                const align = i === 0 ? 'left' : 'center';
                const tx    = i === 0 ? dx+2 : dx+vCws[i]/2;
                const textY = y + (rh-(ls.length-1)*4.5)/2 + 0.5;
                if (isBold || (i === 0)) bold(9); else normal(9);
                doc.text(ls, tx, textY, { align });
                dx += vCws[i];
            });
            y += rh;
        };

        // ── Merged-cell row helper (cols 0-3 merged, cols 4 & 5 individual)
        const vRowMerged = (desc, col4, col5, isBold = false) => {
            const mergedW = vCws[0]+vCws[1]+vCws[2]+vCws[3];
            const cells45 = [col4, col5];
            let rh = 5;
            const descLs = doc.splitTextToSize(String(desc||''), mergedW-2);
            rh = Math.max(rh, descLs.length*4.5+0.5);
            cells45.forEach((c,i) => {
                const ls = doc.splitTextToSize(String(c||''), vCws[i+4]-2);
                rh = Math.max(rh, ls.length*4.5+0.5);
            });
            if (y + rh > CONTENT_BOTTOM) y = newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            // Merged cell
            doc.rect(ML, y, mergedW, rh);
            const textY0 = y + (rh-(descLs.length-1)*4.5)/2 + 0.5;
            isBold ? bold(9) : normal(9);
            doc.text(descLs, ML+2, textY0, { align:'left' });
            // Col 4
            doc.rect(ML+mergedW, y, vCws[4], rh);
            const ls4 = doc.splitTextToSize(String(col4||''), vCws[4]-2);
            const textY4 = y + (rh-(ls4.length-1)*4.5)/2 + 0.5;
            isBold ? bold(9) : normal(9);
            doc.text(ls4, ML+mergedW+vCws[4]/2, textY4, { align:'center' });
            // Col 5
            doc.rect(ML+mergedW+vCws[4], y, vCws[5], rh);
            const ls5 = doc.splitTextToSize(String(col5||''), vCws[5]-2);
            const textY5 = y + (rh-(ls5.length-1)*4.5)/2 + 0.5;
            isBold ? bold(9) : normal(9);
            doc.text(ls5, ML+mergedW+vCws[4]+vCws[5]/2, textY5, { align:'center' });
            y += rh;
        };
        

        // ── Table data rows
        // Row 1: Present Market Value — all 6 cells
        vRow('Present Market Value',
            pmvAreaPlan ? fmt(pmvAreaPlan) : '',
            pmvAreaPhys ? fmt(pmvAreaPhys) : '',
            pmvRate     ? fmt(pmvRate)     : '',
            pmvValPlan  ? fmt(pmvValPlan)  : '',
            pmvValPhys  ? fmt(pmvValPhys)  : '');

        // Row 2: Car Parking — cols 0-3 merged
        vRowMerged('Car Parking',
            parkValPlan ? fmt(parkValPlan) : '',
            parkValPhys ? fmt(parkValPhys) : '');

        // Row 3: Total Value — cols 0-3 merged, bold
        vRowMerged('Total Value of the Flat',
            totalValPlan ? fmt(totalValPlan) : '',
            totalValPhys ? fmt(totalValPhys) : '', true);

        // Row 4: Depreciation — cols 0-3 merged (include % in label)
        const depLbl = depPctFlat > 0
            ? `Depreciation* @ ${vParse('flat_dep_pct')}%`
            : 'Depreciation* @ 0%';
        vRowMerged(depLbl,
            depValPlan ? fmt(depValPlan) : '-',
            depValPhys ? fmt(depValPhys) : '-');

        // Row 5: Net Value — cols 0-3 merged, bold
        vRowMerged('Net Value of the Flat',
            netValPlan ? fmt(netValPlan) : '',
            netValPhys ? fmt(netValPhys) : '', true);

        // Row 6: Forced Sale Value — cols 0-3 merged
        vRowMerged('Forced Sale Value (20% less to Net Market Value)',
            forcedPlan ? fmt(forcedPlan) : '',
            forcedPhys ? fmt(forcedPhys) : '');

        y += 5;
        const age    = parseFloat(v('structure_age') || '0');
        const depPct = age ? Math.round((100 / 70) * age) : 0;
        bold(9);
        doc.text('Note:', ML, y); 
        italic(9);
        ['1. Average life of concrete structure has been considered as 70 years',
        age === 0
            ? '2. As the flat is recently constructed, thus noDepreciation is considered. Here flat area has been calculated including common area.'
            : `2. As this structure is ${age} year-old, thus the Depreciation is considered as (100/70) x ${age} = ${((100/70)*age).toFixed(2)} ~ ${depPct}%. Here flat area has been calculated including common area.`,
        ].forEach(note => {
            const ls = doc.splitTextToSize(note, CW - 14);
            if (y + ls.length*4.5 > CONTENT_BOTTOM) y = newPage();
            doc.text(ls, ML + 12, y); y += ls.length*4 + 0.5;
        });
        normal(10); y += 5;



        normal(10);
        const p1L = doc.splitTextToSize('The report has been prepared based on our physical inspection, verification, necessary documents as provided by concern office/individual, local market analysis and assessment to the best of our knowledge.', CW);
        doc.text(p1L, ML, y); y += p1L.length*4.5 + 4;
        doc.text('Detail Report and necessary attachments are enclosed herewith for your record and perusal.', ML, y, { maxWidth: CW }); y += 6;
        doc.text('For any query, please feel free to contact us.', ML, y); y += 6;
        doc.text('With best regards,', ML, y); y += 18;

        // Signatures
        doc.setDrawColor(0,0,0);
        doc.line(ML, y, ML+50, y);
        doc.line(ML+100, y, ML+150, y); 
        y += 5;
        bold(10);
        doc.text(v('valuer_1_name'), ML,      y);
        doc.text(v('valuer_2_name'), ML+100,  y); y += 5;
        normal(10);
        doc.text(v('valuer_1_designation'), ML,     y);
        doc.text(v('valuer_2_designation'), ML+100, y); y += 10;

        // Enclosures
        const encl = [
            ['1. Annexure-I: Photograph of Property',    '4. Annexure-IV: QR Code for video of the Property',],
            ['2. Annexure-II: Hand Sketch Map',          '5. Annexure-V: QR Code for Map of the Property',],
            ['3. Annexure-III: Location on Google Map',  '6. Annexure-VI: Status in Area Master Plan'],
        ];
        italic(10); doc.text('Encl:', ML, y);
        italic(9);
        const enclIndent = ML + 16; // indent after 'Encl:'
        const enclColW   = CW / 2;
        encl.forEach(([left, right]) => {
            doc.text(left,  enclIndent,           y);
            doc.text(right, enclIndent + enclColW, y);
            y += 4.5;
        });
        
        // ══════════════════════════════════════════════════
        //  PAGE 3 – SUMMARY  (Sheet 3)
        // ══════════════════════════════════════════════════
        y = newPage();
        // FIX 1: Add underline under "Summary of the Valuation Report"
        const summaryTitle = 'Summary of the Valuation Report';
        bold(12);
        doc.text(summaryTitle, PW/2, y+5, { align: 'center' });
        const summaryTitleW = doc.getTextWidth(summaryTitle);
        doc.setLineWidth(0.4);
        doc.line(PW/2 - summaryTitleW/2, y+7, PW/2 + summaryTitleW/2, y+7);
        normal(10); y += 13;

        [['File Receiving Date',     dt('file_receiving_date')],
         ['Valuation Ref No.',        v('valuation_ref_no')],
         ['Valuation Date',           dt('valuation_date')],
         ['Property Location',        v('property_location')],
         ['Valuation Conducted By',   v('valuation_conducted_by') || 'AMK Associates Limited'],
        ].forEach(([l, val]) => { y = kvRow(y, l, val,68); });
        y += 4;
        // Surveyor on sheet 3 in EBL
        [['Surveyor Name',  v('surveyor_name')],
         ['Designation',    v('surveyor_designation')],
         ['NID Number',     v('surveyor_nid')],
         ['Contact Number', v('surveyor_contact')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val,68); });
        y += 4;
        [['Type of Property',        v('property_type')],
         ['Type of Property Seller', v('property_seller_type')],
         ['Current Market Value',    v('flat_total_val_phys') ? 'BDT ' + v('flat_total_val_phys') : ''],
         ['Forced Sale Value',       v('flat_forced_val_phys') ? 'BDT ' + v('flat_forced_val_phys') : ''],
         ['Deviation (Plinth)',      areaRows[3]?.dev_pct || ''],
         ['Deviation (Floor)',       areaRows[2]?.dev_pct || ''],
        ].forEach(([l, val]) => { y = kvRow(y, l, val,68); });

        // ══════════════════════════════════════════════════
        //  PAGE 4 – A , B & C (Sheet 4)
        // ══════════════════════════════════════════════════
        // SECTION A: Account 
        y = newPage();
        y = heading(y, 'A. Particulars of Proposed Borrower:');
        [['Name of Proposed Borrower',       v('borrower_name')],
        ['Father\'s Name',                   v('father_name')],
        ['Mother\'s Name',                   v('mother_name')],
        ['Present Address',                  v('present_address')],
        ['Permanent Address',                v('permanent_address')],
        ['Contact Number',                   v('contact_number')],
        ['NID Number',                       v('nid_number')],
        ['Contact Person Name',              v('contact_person_name')],
        ['Mobile Number of Contact Person',  v('mobile_number')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 68); });
        y += 4;

        // SECTION B: Owner details
        y = heading(y, 'B. Particulars of Property Owner:');
        [["Property Owner(s) Name",   v('owner_name')],
         ["Father's Name",             v('owner_father')],
         ["Mother's Name",             v('owner_mother')],
         ['Present Address',           v('owner_present_address')],
         ['Permanent Address',         v('owner_perm_address')],
         ['Contact Number',            v('owner_contact')],
         ['NID Number',                v('owner_nid')],
         ['Relationship with Borrower',v('owner_relationship')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val,68); });
        y += 4;

        // SECTION C: Schedule of Property
        y = heading(y, 'C. Schedule of Property:');
        // FIX 2: Increased lw from 55 to 62 so long labels like "Way to visit Property"
        // don't overflow. Value column shrinks accordingly but still wraps properly.
        [['District',               v('district')],
         ['Thana / Upazila',        v('thana_upazila')],
         ['Mouza',                  v('mouza')],
         ['JL No.',                 v('jl_no')],
         ['Local Authority',        v('local_authority')],
         ['Land Office',            v('land_office')],
         ['Sub-Register Office',    v('sub_register_office')],
         ['Khatian No.',            v('khatian_no')],
         ['Corresponding Dag No.',  v('dag_no')],
         ['Deed Number & Date',     v('deed_number_date')],
         ['Mutation Khatian No.',   v('mutation_khatian_no')],
         ['Jote No.',               v('jote_no')],
         ['DCR No.',                v('dcr_no')],
         ['GRR No.',                v('grr_no')],
         ['Land Type (LDTR)',       v('land_type_ldtr')],
         ['Property Address',       v('property_address')],
         ['Last Ownership Transfer',v('last_ownership_transfer')],
         ['Total Area as per Deed',          v('total_area_deed')],
         ['Way to visit Property',           v('way_to_visit')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 68); });

        // ══════════════════════════════════════════════════
        //  PAGE 5 – D & E  (Sheet 5)
        // ══════════════════════════════════════════════════
        // SECTION D: Property Identification
        y = newPage();
        y = heading(y, 'D. Property Identification:');
        y += 4;

        {
            bold(10);
            const label = 'i) Property:';
            const textW = doc.getTextWidth(label);
            doc.text(label, ML+5, y);
            doc.setLineWidth(0.3);
            doc.line(ML+5, y+0.8, ML+5+textW, y+0.8);
            y += 4;
            const dCws = [20, 37, 37, 37, 37];
            y = tblHeader(y, ['Direction','Chowhoddi as Per Deed','Present Chowhoddi','Demarcation','Access Road'], dCws);
            ['north','south','east','west'].forEach(dir => {
                y = tblRow(y, [
                    dir.charAt(0).toUpperCase()+dir.slice(1),
                    v(dir+'_deed'), v('prop_'+dir+'_present'), v('prop_'+dir+'_demar'), v(dir+'_road')
                ], dCws);
            });
            y += 4;
        }

        {
            bold(10);
            const label = 'ii) Flat:';
            const textW = doc.getTextWidth(label);
            doc.text(label, ML+5, y);
            doc.setLineWidth(0.3);
            doc.line(ML+5, y+0.8, ML+5+textW, y+0.8);
            y += 4;
            const eCws = [38, 65, 65];
            y = tblHeader(y, ['Direction','Present Chowhoddi','Demarcation'], eCws);
            ['north','south','east','west'].forEach(dir => {
                y = tblRow(y, [
                    dir.charAt(0).toUpperCase()+dir.slice(1),
                    v('flat_'+dir+'_present'), v('flat_'+dir+'_demar')
                ], eCws);
            });
            y += 4;
        }

        // SECTION E: Other Features of Property
        y = heading(y, 'E. Other Features of Property:');
        [['Electricity',                                 v('electricity')],
         ['GAS',                                         v('gas')],
         ['Water Supply',                                v('water_supply')],
         ['Sewerage System',                             v('sewerage')],
         ['Internet',                                    v('internet')],
         ['Satellite / Google Location',                 v('satellite_location')],
         ['Status of access Road for Transports',        v('access_road_status')],
         ['Nature of Land',                              v('nature_of_land')],
         ['Type of Land',                                v('type_of_land')],
         ['Plot Location',                               v('plot_location')],
         ['Description of Property',                     v('description_of_property')],
         ['Usage Restriction',                           v('usage_restriction')],
         ['Possibility of Frequent Flood',               v('flood_possibility')],
         ['Classification of Land',                      v('land_classification')],
         ['Status in Master Plan',                       v('status_master_plan')],
         ['Current Possession',                          v('current_possession')],
         ['Public Establishments nearby the Property',   v('public_establishments')],
         ['Distance from nearby Prominent location',     v('dist_prominent')],
         ['Distance from nearby Main Road',              v('dist_main_road')],
         ['Distance from nearby Branch / Office',        v('dist_branch_office')],
         ['Annual Income from the Property',             v('annual_income')],
         ['Present Use of the Property',                 v('present_use')],
         ['Future Prospect',                             v('future_prospect')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 68); });

        // ══════════════════════════════════════════════════
        //  PAGE 6 – F ,G & H  (Sheet 6)
        // ══════════════════════════════════════════════════
        y = newPage();
        y = heading(y, 'F. Civil Construction of Property:');
        //const age = parseFloat(v('age_of_structure') || '0');
        const ageStr = age
            ? `${age} Years (Construction period: ${v('construction_from')} to ${v('construction_to')})`
            : '';
        [['Structure Type',                  v('structure_type')],
         ['Foundation Type',                 v('foundation_type')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 68); });

        // Number of Stories row with conditional red highlight
        {
            const label = 'Number of Stories';
            const planVal = parseInt(v('stories_plan')) || 0;
            const physVal = parseInt(v('stories_physical')) || 0;
            const lw = 68;
            const vw = CW - lw - 4;
            const lineStr = '(a) As per Plan: ' + v('stories_plan') + ' Storied  /  (b) As per Physical: ';
            const physStr = v('stories_physical') + ' Storied';
            const rh = 5.5;
            if (y + rh > CONTENT_BOTTOM) y = newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            doc.setFillColor(255,255,255); doc.rect(ML,      y, lw,  rh, 'FD');
            doc.setFillColor(255,255,255); doc.rect(ML+lw,   y, 4,   rh, 'FD');
            doc.rect(ML+lw+4, y, vw, rh, 'FD');
            bold(10);   doc.text(label,  ML+1.5,   y+4);
            normal(10); doc.text(':',    ML+lw+1.2, y+4);
            // Draw the static part of the value
            doc.text(lineStr, ML+lw+5.5, y+4);
            // Draw stories_physical in red if it exceeds plan, otherwise normal black
            const lineStrW = doc.getTextWidth(lineStr);
            if (physVal > planVal) {
                bold(10);
                doc.setTextColor(220, 38, 38); // set red AFTER bold resets color
            } else {
                normal(10);
                doc.setTextColor(0, 0, 0);
            }
            doc.text(physStr, ML+lw+5.5+lineStrW, y+4);
            doc.setTextColor(0, 0, 0); // reset color
            normal(10);
            y += rh;
        }
        [['Approval Authority',              v('approval_authority')],
         ['Plan No. & Date',                'Sarok No: ' + v('plan_no') + '  Date: ' + dt('plan_date')],
         ['Occupancy Category',              v('occupancy_category')],
         ['Age of Structure',                v('age_of_structure')],
         ['Shape of Building',               v('shape_of_building')],
         ['Project Name',                    v('project_name')],
         ["Developer's Name",                v('developer_name')],
         ["Owner's Name in Building Plan",   v('owner_name_plan')],
         ['Security Guards',                 v('security_guards')],
         ['Commercial',                      v('commercial')],
         ['Garden Area / Play Zone',         v('garden_area')],
         ['Generator Facilities',            v('generator')],
         ['Lift Facilities',                 v('lift')],
         ['Close Circuit Camera (CCTV)',     v('cctv')],
         ['Fire Fighting & Emergency',       v('fire_fighting')],
         ['Front Face of Structure',         v('front_face')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 68); });
        y+=2;


        y = heading(y, 'G. Flat Specification:');
        [['Floor Number',                    v('floor_number')],
        ['Flat Number',                     v('flat_number')],
        ['Direction of Flat',               v('direction_of_flat')],
        ['Unit as per Plan',                v('unit_per_plan')],
        ['Unit as per Physical Inspection', v('unit_per_inspection')],
        ['Number of Room',                  v('number_of_room')],
        ['No of Dining cum Drawing Room',   v('dining_drawing_room')],
        ['Number of Bathroom',              v('number_of_bathroom')],
        ['Number of Balcony',               v('number_of_balcony')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 68); });
        y += 2;


        const aCws = [48, 30, 30, 30, 30];
        y = tblHeader(y, [
            'Particulars',
            'As per Approved\nPlan (Sft.)',
            'As per Physical\n(Sft.)',
            'Deviation\n(Sft.)',
            'Deviation\n(%)'
        ], aCws);
 
        const areaRowLabels = [
            'Flat Area except common space',
            'Common Area',
            'Floor Area',
            'Plinth Area',
            'Parking Area',
        ];
        //const areaRows = Array.isArray(fd._floor_area_rows) ? fd._floor_area_rows : [];
        areaRowLabels.forEach((label, i) => {
            const r = areaRows[i] || {};
            y = tblRow(y, [
                label,
                r.area_plan || '',
                r.area_phys || '',
                r.dev_sft   || '',
                r.dev_pct   || '',
            ], aCws);
        });
        y += 2;

        // H. Setback
        y = heading(y, 'H. Setback Comparison with Approved Plan:');
        const gCws = [34, 42, 50, 42];

        // Header heights
        const gHdrH = 7;   // top header row height
        const gFmlH = 5;   // formula row height
        const gTotalHdrH = gHdrH + gFmlH;

        if (y + gTotalHdrH > CONTENT_BOTTOM) y = newPage();
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);

        // Column x positions
        const gXPos = gCws.reduce((acc, w, i) => {
            acc.push(i === 0 ? ML : acc[i-1] + gCws[i-1]);
            return acc;
        }, []);

        // Helper: draw cell with centered wrapped text
        const gHdrCell = (x, y, w, h, label, isItalic = false) => {
            doc.rect(x, y, w, h);
            isItalic ? italic(8) : bold(9);
            const ls = doc.splitTextToSize(label, w - 2);
            const textY = y + (h - (ls.length - 1) * 4.5) / 2 + 1.5;
            doc.text(ls, x + w / 2, textY, { align: 'center' });
        };

        // ── ROW 1 — Header ─────────────────────────────────────────
        // "Direction" spans both rows (rowspan=2)
        gHdrCell(gXPos[0], y, gCws[0], gTotalHdrH, 'Direction');

        // Other 3 headers — normal height only
        gHdrCell(gXPos[1], y, gCws[1], gHdrH, 'As Per Approved Plan (Ft.)');
        gHdrCell(gXPos[2], y, gCws[2], gHdrH, 'As Per Physical Inspection (Ft.)');
        gHdrCell(gXPos[3], y, gCws[3], gHdrH, 'Deviation (Ft.)');

        // ── ROW 2 — Formula row (cols 1-3 only, col 0 already spanned) ─
        const gFmlY = y + gHdrH;
        ['a', 'b', 'c = b - a'].forEach((label, i) => {
            gHdrCell(gXPos[i + 1], gFmlY, gCws[i + 1], gFmlH, label, true);
        });

        y += gTotalHdrH;
        normal(10);

        // ── DATA ROWS ───────────────────────────────────────────────
        [
            ['North', 'setback_north'],
            ['South', 'setback_south'],
            ['East',  'setback_east'],
            ['West',  'setback_west'],
        ].forEach(([label, key]) => {
            const plan = parseFloat(fd[key + '_plan'] || 0) || 0;
            const phys = parseFloat(fd[key + '_phys'] || 0) || 0;
            const dev  = (plan || phys) ? `(${Math.abs(phys - plan).toFixed(2)})` : '';
            y = tblRow(y, [label, plan || '', phys || '', dev], gCws);
        });

        // Dynamic rows
        const dynSetbackRows = Array.isArray(fd._setback_dynamic_rows) ? fd._setback_dynamic_rows : [];
        dynSetbackRows.forEach(r => {
            const plan = parseFloat(r.plan || 0) || 0;
            const phys = parseFloat(r.phys || 0) || 0;
            const dev  = (plan || phys) ? `(${Math.abs(phys - plan).toFixed(2)})` : '';
            y = tblRow(y, [r.label || '', plan || '', phys || '', dev], gCws);
        });

        y += 5;


        // ══════════════════════════════════════════════════
        //  PAGE 7 – I & J & I  (Sheet 7)
        // ══════════════════════════════════════════════════

        y = newPage();
        y = heading(y, 'I. Construction Work Completion Percentage (Flat):');
        const hCws = [22,15,10,10,10,16,15,12,13,18,10,18];
        y = tblHeader(y, ['Floor','Structure','Brick','Wood','Metal','Plumbing\n& Sanitary',
                          'Electrical','Plaster','General\nFloor','Aluminium','Paint','Work\nCompletion %'], hCws);
        const compRows = Array.isArray(fd._completion_rows) && fd._completion_rows.length
            ? fd._completion_rows
            : [{ floor:'Ground' }];
        compRows.forEach(r => {
            y = tblRow(y, [r.floor||'', r.structure||'', r.brick||'', r.wood||'', r.metal||'',
                           r.plumbing||'', r.electrical||'', r.plaster||'', r.gen_floor||'',
                           r.aluminium||'', r.paint||'', r.work_pct||''], hCws);
        });
        y += 5;

        y = heading(y, 'J. Construction Work Completion Percentage (Building):');
        const wCws = [70, 40, 58];
        y = tblHeader(y, [
            'Particulars',
            'Work\nCompletion (%)',
            'Total Work Completion of\nBuilding (%)'
        ], wCws);

        const items = [
            ['Structure',                'wc_structure'],
            ['Lift',                     'wc_lift'],
            ['Generator',                'wc_generator'],
            ['Stair',                    'wc_stair'],
            ['Paint',                    'wc_paint'],
            ['Plaster',                  'wc_plaster'],
            ['Common Area Tiles',        'wc_common_tiles'],
            ['Overhead Water Reservoir', 'wc_overhead_water'],
            ['Sewerage Facilities',      'wc_sewerage'],
            ['Main Gate',                'wc_main_gate'],
            ['Cabling',                  'wc_cabling'],
            ['Plumbing',                 'wc_plumbing'],
        ];

        const totalWcPct = v('wc_total_pct') || '';
        const startY = y;
        const rowH = 7;

        // Draw col 0 + col 1 rows individually
        items.forEach(([label, key]) => {
            y = tblRow(y, [label, v(key), ''], wCws);
        });

        const endY = y;
        const totalH = endY - startY;

        // Overdraw col 2 as one merged cell with the total value centred
        doc.setFillColor(255, 255, 255);
        doc.rect(ML + wCws[0] + wCws[1], startY, wCws[2], totalH, 'FD');
        bold(10);
        doc.text(totalWcPct ? totalWcPct + '%' : '', ML + wCws[0] + wCws[1] + wCws[2]/2, startY + totalH/2 + 1, { align: 'center' });

        y += 4;

        // ══════════════════════════════════════════════════
        //  PAGE 8 – J, K, L  (Sheet 8)
        // ══════════════════════════════════════════════════
        y = newPage();

        // J. Price Reference – structured table
        y = heading(y, 'J. Price Reference:');
        [['Maximum Price',       v('max_price')],
         ['Minimum Price',       v('min_price')],
         ['Last Buy-Sell Record',v('last_buy_sell')],
         ['Price Justification', v('price_justification')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val,68); });
        y += 6;

        // K. About our overall Valuation – 9 static points
        y = heading(y, 'K. About our overall Valuation:');
        y+=2;
        y = numberedList(y, [
            'Physical inspection and measure, as necessary.',
            'Interview with local people.',
            'Interview with owner.',
            'Market price of recent transfer of property in nearby locality.',
            'Access road and transport facility.',
            'Current economic activity and development features in the locality.',
            'Future prospect of the locality.',
            'Present Market Value has been considered based on various parameters including but not limited to the above. Mentionable here that the said value may vary time to time on different aspects or situations which may not match with the basis of present valuation.',
            "In case of Forced Sale Value, the rate is assumed based on the property's demand, price, marketability and other factors, which may have relation to unforeseen or uncontrollable event that drives to sell the property within a short duration.",
        ]);
        y += 2;

        // L. Declaration – 9 static points
        if (y + 20 > CONTENT_BOTTOM) y = newPage();
        y = heading(y, 'L. Declaration:');
        y+=2;
        y = numberedList(y, [
            'The valuation has been performed based on our physical inspection, verification, local market analysis and assessment to the best of our knowledge and all the information provided in this report is based on the property/ land related documents, other necessary documents and information as provided by the concerned Bank/ NBFI/ Officials/ Property Owner/ Borrower/ Individual (the client). No responsibility is accepted for any errors resulting from incorrect information provided by the client.',
            'The inspection was limited to a visual examination only. So, AMK shall not be held responsible, for any latent defects not apparent during inspection.',
            "AMK's responsibility is limited to the valuation of the said property only without considering any legal matter related to the property and documents as well.",
            'This report is not a certificate of title or ownership. Legal verification should be undertaken independently.',
            'The valuation reflects the market value on the date of inspection only. No responsibility is accepted for any changes in market conditions thereafter.',
            'Except inspection, survey and valuation of the said property, AMK or any of its Officials has no interest directly or indirectly, at present or in near future in any manner whatsoever in the subject matter of this report.',
            'This report is not intended to absolve the concerned parties from their contractual obligations.',
            'This report is confidential and intended only for the named client. AMK accepts no liability to any third party for any loss or damage suffered as a result of reliance on this report.',
            'The report is duly signed by the authorized signatories of AMK and it contains 19 (Nineteen) pages.',
        ]);

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-I – PHOTOS (2 per page, 158×102mm each)
        // ══════════════════════════════════════════════════════════
        const ann1 = Array.isArray(fd._ann1_photos) ? fd._ann1_photos : [];
        if (ann1.length) {
            const imgW = 158, imgH = 102, capH = 7, perPage = 2;
            const totalSlotH = imgH + capH;
            const gapBetween = 8;

            for (let i = 0; i < ann1.length; i++) {
                if (i % perPage === 0) {
                    y = newPage();
                    // Annexure heading
                    bold(11);
                    const ann1Title = 'Annexure-I: Photograph of Property';
                    doc.text(ann1Title, ML, y + 5);
                    const ann1TitleW = doc.getTextWidth(ann1Title);
                    doc.setLineWidth(0.3);
                    doc.line(ML, y + 6.5, ML + ann1TitleW, y + 6.5);
                    y += 14;
                }

                const slot = i % perPage;
                const iy = y + slot * (totalSlotH + gapBetween);
                const imgX = ML + (CW - imgW) / 2;

                // Draw image
                doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
                try {
                    const fmt2 = ann1[i].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(ann1[i].dataUrl, fmt2, imgX, iy, imgW, imgH);
                } catch(e) {
                    doc.setFillColor(230, 230, 230);
                    doc.rect(imgX, iy, imgW, imgH, 'FD');
                }
                doc.rect(imgX, iy, imgW, imgH);

                // Caption
                const cap1 = ann1[i].caption || ann1[i].name.replace(/\.[^/.]+$/, '');
                const cap1Lines = doc.splitTextToSize(cap1, imgW);
                italic(9);
                doc.text(cap1Lines, ML + CW / 2, iy + imgH + 4.5, { align: 'center' });
            }
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-II – HAND SKETCH MAP (description + 158×178mm)
        // ══════════════════════════════════════════════════════════
        const ann2 = Array.isArray(fd._ann2_photos) ? fd._ann2_photos : [];
        {
            y = newPage();
            // Heading
            bold(11);
            const ann2Title = 'Annexure-II: Hand Sketch Map';
            doc.text(ann2Title, ML, y + 5);
            const ann2TitleW = doc.getTextWidth(ann2Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann2TitleW, y + 6.5);
            y += 14;

            // Description
            const ann2Desc = fd.annexure2_desc || '';
            if (ann2Desc) {
                normal(10);
                const descLines = doc.splitTextToSize(ann2Desc, CW);
                doc.text(descLines, ML, y);
                y += descLines.length * 4.5 + 6;
            }

            // Image
            if (ann2.length) {
                const imgW = 158, imgH = 178;
                const imgX = ML + (CW - imgW) / 2;
                doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
                try {
                    const fmt2 = ann2[0].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(ann2[0].dataUrl, fmt2, imgX, y, imgW, imgH);
                } catch(e) {
                    doc.setFillColor(230, 230, 230);
                    doc.rect(imgX, y, imgW, imgH, 'FD');
                }
                doc.rect(imgX, y, imgW, imgH);

                // Caption
                const cap2 = ann2[0].caption || ann2[0].name.replace(/\.[^/.]+$/, '');
                const cap2Lines = doc.splitTextToSize(cap2, imgW);
                italic(9);
                doc.text(cap2Lines, ML + CW / 2, y + imgH + 4.5, { align: 'center' });
                y += imgH + 10;
            }
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-III – GOOGLE MAP (1 line desc + 2 images 158×102mm)
        // ══════════════════════════════════════════════════════════

        const ann3 = Array.isArray(fd._ann3_photos) ? fd._ann3_photos : [];
        {
            y = newPage();
            // Heading
            bold(11);
            const ann3Title = 'Annexure-III: Location on Google Map';
            doc.text(ann3Title, ML, y + 5);
            const ann3TitleW = doc.getTextWidth(ann3Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann3TitleW, y + 6.5);
            y += 14;

            // One line description
            const ann3Desc = fd.annexure3_desc || '';
            if (ann3Desc) {
                normal(10);
                doc.text(ann3Desc, ML, y);
                y += 7;
            }

            // Two images stacked
            const imgW4 = 158, imgH4 = 102, capH4 = 7, gap4 = 8;
            ann3.slice(0, 2).forEach((photo, i) => {
                const imgX = ML + (CW - imgW4) / 2;
                doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
                try {
                    const fmt2 = photo.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(photo.dataUrl, fmt2, imgX, y, imgW4, imgH4);
                } catch(e) {
                    doc.setFillColor(230, 230, 230);
                    doc.rect(imgX, y, imgW4, imgH4, 'FD');
                }
                doc.rect(imgX, y, imgW4, imgH4);

                // Caption
                const cap4 = photo.caption || photo.name.replace(/\.[^/.]+$/, '');
                const cap4Lines = doc.splitTextToSize(cap4, imgW4);
                italic(9);
                doc.text(cap4Lines, ML + CW / 2, y + imgH4 + 4.5, { align: 'center' });
                y += imgH4 + capH4 + gap4;
            });
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-IV & V – QR CODES (same page, 51×51mm each, centered)
        // ══════════════════════════════════════════════════════════
        const ann4 = Array.isArray(fd._ann4_photos) ? fd._ann4_photos : [];
        const ann5 = Array.isArray(fd._ann5_photos) ? fd._ann5_photos : [];
        {
            y = newPage();
            const qrW = 51, qrH = 51;
            const qrX = ML + (CW - qrW) / 2;

            // Annexure IV heading
            bold(11);
            const ann4Title = 'Annexure-IV: QR Code for video of the Property';
            doc.text(ann4Title, ML, y + 5);
            const ann4TitleW = doc.getTextWidth(ann4Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann4TitleW, y + 6.5);
            y += 14;

            // QR IV image
            if (ann4.length) {
                doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
                try {
                    const fmt2 = ann4[0].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(ann4[0].dataUrl, fmt2, qrX, y, qrW, qrH);
                } catch(e) {
                    doc.setFillColor(230, 230, 230);
                    doc.rect(qrX, y, qrW, qrH, 'FD');
                }
                doc.rect(qrX, y, qrW, qrH);
            } else {
                // Placeholder box if no image
                doc.setFillColor(240, 240, 240);
                doc.rect(qrX, y, qrW, qrH, 'FD');
            }
            y += qrH + 14;

            // Annexure V heading
            bold(11);
            const ann5Title = 'Annexure-V: QR Code for Map of the Property';
            doc.text(ann5Title, ML, y + 5);
            const ann5TitleW = doc.getTextWidth(ann5Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann5TitleW, y + 6.5);
            y += 14;

            // QR V image
            if (ann5.length) {
                doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
                try {
                    const fmt2 = ann5[0].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(ann5[0].dataUrl, fmt2, qrX, y, qrW, qrH);
                } catch(e) {
                    doc.setFillColor(230, 230, 230);
                    doc.rect(qrX, y, qrW, qrH, 'FD');
                }
                doc.rect(qrX, y, qrW, qrH);
            } else {
                doc.setFillColor(240, 240, 240);
                doc.rect(qrX, y, qrW, qrH, 'FD');
            }
            y += qrH + 14;

            // Instructions
            bold(10);
            doc.text('Instructions for use:', ML + 20, y); y += 6;
            italic(9);
            ['Download & install any QR Code scanner/reader.',
            'Scan the attached QR Code.',
            'Open the link using Google Chrome/any browser.',
            ].forEach(inst => {
                doc.circle(ML + 23, y - 1, 0.8, 'F');
                doc.text(inst, ML + 26, y);
                y += 5.5;
            });
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-VI – AREA MASTER PLAN (full page, 158×178mm)
        // ══════════════════════════════════════════════════════════
        const ann6 = Array.isArray(fd._ann6_photos) ? fd._ann6_photos : [];
        if (ann6.length) {
            y = newPage();
            // Heading
            bold(11);
            const ann6Title = 'Annexure-VI: Status in Area Master Plan';
            doc.text(ann6Title, ML, y + 5);
            const ann6TitleW = doc.getTextWidth(ann6Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann6TitleW, y + 6.5);
            y += 14;

            const imgW = 158, imgH = 178;
            const imgX = ML + (CW - imgW) / 2;
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
            try {
                const fmt2 = ann6[0].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(ann6[0].dataUrl, fmt2, imgX, y, imgW, imgH);
            } catch(e) {
                doc.setFillColor(230, 230, 230);
                doc.rect(imgX, y, imgW, imgH, 'FD');
            }
            doc.rect(imgX, y, imgW, imgH);

            // Caption below image
            const cap6 = ann6[0].caption || ann6[0].name.replace(/\.[^/.]+$/, '');
            const cap6Lines = doc.splitTextToSize(cap6, imgW);
            italic(9);
            doc.text(cap6Lines, ML + CW / 2, y + imgH + 4.5, { align: 'center' });
        }

        // Save or preview
        const filename = 'EBL_Flat_' + (v('reference_account_name') || v('letter_ref') || 'Report') + '.pdf';
        if (mode === 'preview') {
            return doc.output('bloburl');
        } else {
            doc.save(filename);
        }
    }
};