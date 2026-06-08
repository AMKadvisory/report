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
const UCBFlatPDF = {

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

        const headerImg = await loadImg('AMK Header.png');
        const footerImg = await loadImg('AMK Footer.png');

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

        const heading = (y, text) => {
            if (y + 8 > CONTENT_BOTTOM) y = newPage();
            bold(11); doc.text(text, ML, y+5);
            const textWidth = doc.getTextWidth(text);
            doc.setLineWidth(0.3); doc.line(ML, y+6.5, ML+textWidth, y+6.5);
            normal(10); return y + 12;
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

        // Grey-label : white-value key-value row
        const kvRow = (y, label, value, labelWidth = 68) => {
            const fontSize = 10;
            const padding = 2;
            normal(fontSize);

            const valueWidth = CW - (labelWidth + 5) - padding; 
            const wrappedLabel = doc.splitTextToSize(String(label || ''), labelWidth - padding);
            const wrappedValue = doc.splitTextToSize(String(value || ''), valueWidth);
            const maxLines = Math.max(wrappedLabel.length, wrappedValue.length);
            const rowHeight = Math.max(6, maxLines * 4.5); 

            if (y + rowHeight > CONTENT_BOTTOM) {
                y = newPage() + 4; // Start at top of new page with baseline offset
            }

            const boxTop = y - 4;
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.2);
            doc.rect(ML, boxTop, CW, rowHeight); 
            doc.line(ML + labelWidth, boxTop, ML + labelWidth, boxTop + rowHeight);
            doc.line(ML + labelWidth + 5, boxTop, ML + labelWidth + 5, boxTop + rowHeight);

            doc.text(wrappedLabel, ML + padding, y);
            doc.text(':', ML + labelWidth + 1.5, y);
            doc.text(wrappedValue, ML + labelWidth + 7, y);
            return y + rowHeight;
        };
        const areaRows = Array.isArray(fd._floor_area_rows) ? fd._floor_area_rows : [];
        const age = parseFloat(v('age_of_structure') || '0'); // Define age here
        const ageStr = age
            ? `${age} Years (Construction period: ${v('construction_from')} to ${v('construction_to')})` : '';


         
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
        const refRows = [
            ['Reference Account Name', v('reference_account_name')],
            ['Reference No.',  v('reference_no')],
        ];
        refRows.forEach(([lbl, val]) => {
            bold(10);
            doc.text(lbl, refStartX, ry);
            doc.text(':', refStartX + refLabelW, ry);
            doc.text(String(val), refStartX + refLabelW + refColonW + 1, ry);
            ry += 6;
        });

        // Submitted boxes
        const boxTop = 220;
        const rNameLines = doc.splitTextToSize(v('recipient'), CW/2-14); // JS Line 259 (approx)
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
        doc.text('Bank Ref No.: ' + v('letter_ref'),  ML, y); y += 5;
        doc.text('AMK Ref No.: ' + v('amk_ref'),  ML, y); y += 5;
        doc.text('Date of Print: ' + dt('letter_date'), ML, y); y += 8;
        
        // --- Recipient Block ---
        const recipientName = v('recipient') || '';
        const recipientAddressLines = doc.splitTextToSize(v('recipient_address'), CW);

        let recipientBlockHeight = 0;
        recipientBlockHeight += 5; // Height for "To"
        recipientBlockHeight += 5; // Height for Recipient Name (assuming single line)
        recipientBlockHeight += recipientAddressLines.length * 4.5; // Height for Recipient Address lines
        recipientBlockHeight += 5; // Padding after address

        if (y + recipientBlockHeight > CONTENT_BOTTOM) y = newPage();

        bold(10);
        doc.text('To', ML, y);
        y += 5;

        bold(10);
        doc.text("United Commercial Bank PLC", ML, y);
        y += 5;

        normal(10);
        doc.text("Head of Credit Administration Division ", ML, y);
        y += (recipientAddressLines.length * 1) + 0;
        normal(10);
        doc.text("Corporate Head Office, Gulshan, Dhaka", ML, y);
        y += (recipientAddressLines.length * 0.7) + 5;
        // --- End of Recipient Block ---

        // --- Requested By / A/C Block ---
        const requestedByLabel = 'Requested by:';
        const requestedByValueLines = doc.splitTextToSize(v('requested_by'), CW - doc.getTextWidth(requestedByLabel) - 1);
        const acLabel = '';
        const acValue = v('');

        let requestedByAcBlockHeight = 0;
        requestedByAcBlockHeight += 0.2; // Height for "Requested by:" label
        requestedByAcBlockHeight += requestedByValueLines.length * 0.2; // Height for Requested by value
        requestedByAcBlockHeight += 0.2; // Padding
        requestedByAcBlockHeight += 0.2; // Height for "A/C:" label
        requestedByAcBlockHeight += 0.2; // Height for A/C value
        requestedByAcBlockHeight += 0.2; // Padding

        if (y + requestedByAcBlockHeight > CONTENT_BOTTOM) y = newPage();

        bold(10);
        doc.text(requestedByLabel, ML, y);
        y += 5;

        normal(10);
        doc.text(requestedByValueLines, ML, y);
        y += (requestedByValueLines.length * 2.5) + 5;

        bold(10);
        doc.text(acLabel, ML, y);
        y += 0;

        normal(10);
        doc.text(acValue, ML, y);
        y += 0;
        // --- End of Requested By / A/C Block ---

        y += 2; // General spacing

        // --- Subject and Main Body ---
        bold(10);
        doc.text('Dear Sir,', ML, y); y += 5;
        
        normal(10);
        const address = v('property_address') || '';
        doc.text(doc.splitTextToSize('Presenting Valuation Report on Collateral Security to be mortgaged at ' + address, 165), ML, y);
        y += 12;
       
        bold(11);
        doc.text('Ref. A/C Name: ' + v('reference_account_name'), ML, y); y += 8;

        normal(10);
        const bodyStr = 'Pursuant to your communication through ' + v('comm_medium') +
            ', dated: ' + dt('comm_date') + ' by ' + v('comm_person') +
            ', we, AMK Associates Limited ("AMK") has conducted the inspection, survey and valuation.' +
            ' Summary of the valuation is as below:';
        const bodyLines = doc.splitTextToSize(bodyStr, CW);
        doc.text(bodyLines, ML, y); y += bodyLines.length*3.5 + 0;
        
        
        
        y = heading(y, '1.  Particulars of Loan /Investment Customer:');
        [['Name of the Account ',            v('borrower_name')],
        ['Name of the Client',               v('client_name')],
        ['NID Number',               v('flat_owner_nid_number')],
        ['Telephone Number',                 v('telephone_number')],
        ['Client Address (Present)',         v('client_address')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 60); });
        y += 2;

        y = heading(y, '2. Particulars of the Engineers /Surveyor/Valuers who physically verified the Flat/Apartment'); 
        y = heading(y - 5.5, 'and conducted the Survey:'); 
        y += 0;
        [['Name (Surveyor) ',                v('surveyor_name')],
        ['NID No.',                          v('surv_nid_number')],
        ['Designation',                      v('surv_designation')],
        ['Mobile',                           v('surv_mobile')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 60); });
        y += 2;
            
         y = heading(y, '3. Details of the proposed Flat/Apartment to be mortgaged:');
        
        [['Name of the present Flat Owner',    v('flat_owner_name')],
        ['Present Flat Owner NID',             v('flat_owner_nid_number')],
        ['Present Flat Owner S/O',             v('flat_owner_s_o')],
        ['Address of the Present Owner: (Present Address)', v('flat_owner_present_address')],
        ['Address of the Present Owner: (Permanent Address)', v('flat_owner_permanent_address')],
        ['Name of the Proposed Flat Owner',    v('proposed_flat_owner_name')],
        ['Proposed Apartment Owner NID',       v('proposed_flat_owner_nid')],
        ['Proposed Apartment Owner S/O',       v('proposed_flat_owner_s_o')],
        ['Address of the Proposed Flat Owner: (Present Address)', v('proposed_flat_owner_present_address')],
        ['Address of the Proposed Flat Owner: (Permanent Address)', v('proposed_flat_owner_permanent_address')],
        ['Relation Between the Proposed Apartment/Flat Owner and Borrower ', v('proposed_flat_owner_relation')],
        ['Address of the Apartment/Flat Space', v('flat_address')],
        ].forEach(([l, val]) => { 
            // This MUST capture the new 'y' returned by the function
            y = kvRow(y, l, val, 60); 
        }); y += 1;


        // ══════════════════════════════════════════════════
        //  PAGE 3 – SUMMARY  (Sheet 3)
        // ══════════════════════════════════════════════════

   y = heading(y, '3. Details of the proposed Flat/Apartment to be mortgaged:');

normal(10);
doc.setFont(undefined, 'normal');

// --- ১. HTML ইনপুট ফিল্ড থেকে সরাসরি ডেটা রিড করা ---
const flatTotal = v('flat_total');
const landShare = v('land_share');
const landTotal = v('land_total');

const mouza = v('mouza_summary'); // Use mouza_summary from HTML

// JL No এর ইনপুটসমূহ
const jl_cs = v('jl_no_cs');
const jl_sa = v('jl_no_sa');
const jl_rs = v('jl_no_rs');
const jl_bs = v('jl_no_bs');
const jl_dcj = v('jl_no_dcj');

// Khatian এর ইনপুটসমূহ
const kh_cs = v('khatian_cs');
const kh_sa = v('khatian_sa');
const kh_rs = v('khatian_rs');
const kh_bs = v('khatian_bs');
const kh_dcj = v('khatian_dcj');

// Dag No এর ইনপুটসমূহ
const dag_cs = v('dag_cs');
const dag_sa = v('dag_sa');
const dag_rs = v('dag_rs');
const dag_bs = v('dag_bs');
const dag_dcj = v('dag_dcj');

// নিচের সিঙ্গেল রো এর ইনপুটসমূহ
const mutation = v('mutation_jote');
const sro = v('sro');
const thana = v('thana_summary');
const dist = v('district_summary');

// --- ২. টেবিল লেআউট ড্রইং এবং ডেটা বসানো ---
const tableWidth = 168; // আপনার দেওয়া টেবিলের সাইজ
doc.rect(ML, y, tableWidth, 64); // টেবিলের বাইরের চারকোনা বর্ডার

// ওপরের ডেসক্রিপশন লাইন (অটো-লাইন ব্রেকসহ)
const topHeading = `Apartment / Flat Space = ${flatTotal} sft. (approx.) in total for 3 flats along with undivided & un-demarcated Land of ${landShare} Decimal out of total land ${landTotal} Decimal`;
doc.setFont(undefined, 'bold');
doc.text(doc.splitTextToSize(topHeading, tableWidth - 4), ML + 2, y + 5);
doc.line(ML, y + 12, ML + tableWidth, y + 12); // হেডারের নিচের দাগ
y += 12;

doc.setFont(undefined, 'normal');
const scheduleRowH = 6.5; 
const firstColW = 27;     // ১ম কলামের প্রস্থ (Label)
const colW = 24.6;        // বাকি ৫টি কলামের নিখুঁত প্রস্থ (138 / 5 = 27.6)

// Row 1: Mouza
doc.text("Mouza", ML + 2, y + 5);
doc.text(mouza, ML + firstColW + 2, y + 5); // পজিশন ঠিক করা হয়েছে যেন ওভারল্যাপ না হয়
doc.line(ML, y + scheduleRowH, ML + tableWidth, y + scheduleRowH);
y += scheduleRowH;

// রো ২: JL No (y + 2 থেকে বাড়িয়ে y + 5.5 করা হয়েছে যেন লেখা লাইনের মাঝে বসে)
doc.text("JL No", ML + 2, y + 5);
doc.text("CS- " + jl_cs, ML + firstColW + 2, y + 5);
doc.text("SA- " + jl_sa, ML + firstColW + (1 * colW) + 2, y + 5);
doc.text("RS- " + jl_rs, ML + firstColW + (2 * colW) + 2, y + 5);
doc.text("BS- " + jl_bs, ML + firstColW + (3 * colW) + 2, y + 5);
doc.text("DCJ- " + jl_dcj, ML + firstColW + (4 * colW) + 2, y + 5);
doc.line(ML, y + scheduleRowH, ML + tableWidth, y + scheduleRowH);
y += scheduleRowH;

// রো ৩: Khatian
doc.text("Khatian", ML + 2, y + 5);
doc.text("CS- " + kh_cs, ML + firstColW + 2, y + 5);
doc.text("SA- " + kh_sa, ML + firstColW + (1 * colW) + 2, y + 5);
doc.text("RS- " + kh_rs, ML + firstColW + (2 * colW) + 2, y + 5);
doc.text("BS- " + kh_bs, ML + firstColW + (3 * colW) + 2, y + 5);
doc.text("DCJ- " + kh_dcj, ML + firstColW + (4 * colW) + 2, y + 5);
doc.line(ML, y + scheduleRowH, ML + tableWidth, y + scheduleRowH);
y += scheduleRowH;

// রো ৪: Dag No
doc.text("Dag No", ML + 2, y + 5);
doc.text("CS- " + dag_cs, ML + firstColW + 2, y + 5);
doc.text("SA- " + dag_sa, ML + firstColW + (1 * colW) + 2, y + 5);
doc.text("RS- " + dag_rs, ML + firstColW + (2 * colW) + 2, y + 5);
doc.text("BS- " + dag_bs, ML + firstColW + (3 * colW) + 2, y + 5);
doc.text("DCJ- " + dag_dcj, ML + firstColW + (4 * colW) + 2, y + 5);
doc.line(ML, y + scheduleRowH, ML + tableWidth, y + scheduleRowH);
y += scheduleRowH;

// রো ৫ থেকে ৮: সিঙ্গেল ফিল্ডগুলো
const scheduleSingleRows = [
    ["Mutation & Jote", mutation],
    ["S.R.O.", sro],
    ["Thana", thana],
    ["District", dist]
];

scheduleSingleRows.forEach((row, index) => {
    doc.text(row[0], ML + 2, y + 5);
    doc.text(row[1], ML + firstColW + 2, y + 5);
    if(index < 3) doc.line(ML, y + scheduleRowH, ML + tableWidth, y + scheduleRowH);
    y += scheduleRowH;
});

// --- ৩. টেবিলের ভেতরের খাড়া গ্রিড লাইন (Vertical Borders) ---
doc.line(ML + firstColW, y - (scheduleRowH * 8), ML + firstColW, y); // ১ম কলামের ডানদিকের খাড়া দাগ

for(let i = 1; i <= 4; i++) {
    // খাড়া দাগগুলোর পজিশন কলামের নতুন চওড়া (.colW) অনুযায়ী ডাইনামিক করা হয়েছে 
    let lineX = ML + firstColW + (i * colW);
    doc.line(lineX, y - (scheduleRowH * 7), lineX, y - (scheduleRowH * 4));
} y += 6;

 bold(9);
        doc.text("(a) Surrounding/Chowhoddi:", ML, y);
        y += 2;

{
    bold(10);

    const dCws = [20, 37, 37, 37, 37];

    // টেবিল হেডারের নরমাল লেখাগুলো বামে থাকবে এবং ভার্টিক্যালি মাঝে থাকবে
    y = tblHeader(y, 
        ['Direction', 'Chowhoddi as Per Deed', 'Present Chowhoddi', 'Demarcation', 'Access Road'], 
        dCws, 
        { align: 'left', baseline: 'middle' }
    );

    ['north', 'south', 'east', 'west'].forEach(dir => {
        // টেবিল রো-এর নরমাল লেখাগুলো বামে থাকবে এবং ভার্টিক্যালি মাঝে থাকবে
        y = tblRow(y, [
            dir.charAt(0).toUpperCase() + dir.slice(1),
            v(dir+'_deed'), 
            v('prop_'+dir+'_present'), 
            v('prop_'+dir+'_demar'), 
            v(dir+'_road')
        ], dCws, { align: 'left', baseline: 'middle' }); 
    });
    
    y += 6;
}
        // আপনার আগের করা স্টাইল ঠিক রাখতে (ফন্ট সাইজ এবং ওয়াই-অক্ষ সেট করা)
bold(9); 

// (b) Area of Flat/Apartment Space
doc.setFont('times', 'bold');
doc.text('(b) Area of Flat/Apartment Space: ', ML, y); // ML ব্যবহারের ফলে একদম টেবিলের শুরুর বর্ডারের সাথে মিলবে
let currentX = ML + doc.getTextWidth('(b) Area of Flat/Apartment Space: ');
doc.setFont('times', 'normal');
doc.text(v('flat_total') + ' sft.', currentX, y); 
y += 6; 

// (c) Description of the Construction of Flat/Apartment Space
doc.setFont('times', 'bold');
doc.text('(c) Description of the Construction of Flat/Apartment Space: ', ML, y);
currentX = ML + doc.getTextWidth('(c) Description of the Construction of Flat/Apartment Space: ');
doc.setFont('times', 'normal');
doc.text(v('flat_construction'), currentX, y);
y += 6;

// (d) Approach / Access Road with size & Photo
doc.setFont('times', 'bold');
doc.text('(d) Approach / Access Road with size & Photo: ', ML, y);
currentX = ML + doc.getTextWidth('(d) Approach / Access Road with size & Photo: ');
doc.setFont('times', 'normal');
doc.text(v('flat_accessroad'), currentX, y);
y += 6;

// (e) Road Type- Government/Owned/Other
doc.setFont('times', 'bold');
doc.text('(e) Road Type- Government/Owned/Other: ', ML, y);
currentX = ML + doc.getTextWidth('(e) Road Type- Government/Owned/Other: ');
doc.setFont('times', 'normal');
doc.text(v('flat_road_type'), currentX, y);
y += 6;

// (f) Nature of Road- Muddy, Brick or other
doc.setFont('times', 'bold');
doc.text('(f) Nature of Road- Muddy, Brick or other: ', ML, y);
currentX = ML + doc.getTextWidth('(f) Nature of Road- Muddy, Brick or other: ');
doc.setFont('times', 'normal');
doc.text(v('flat_nature_road'), currentX, y);
y += 6;

// (g) Distance from Important Place
doc.setFont('times', 'bold');
doc.text('(g) Distance from Important Place: ', ML, y);
currentX = ML + doc.getTextWidth('(g) Distance from Important Place: ');
doc.setFont('times', 'normal');
doc.text(v('flat_imp_distance'), currentX, y); 
y += 8;

        bold(11);
        doc.text('5. Description of the Construction of Flat/Apartment:', ML, y); 
        y += 5;

        normal(10);
        doc.setFont('times', 'normal'); 

        // ML + 5 ব্যবহারের ফলে শুধু এই লেখাটি ৫ ইউনিড ডানে সরে যাবে
        doc.text(v('flat_construction'), ML + 5, y); 
        y += 6;

        bold(11);
        doc.text('6. Location of The Flat/Apartment:', ML, y); 
        y += 5;

        normal(10);
        doc.setFont('times', 'normal'); 

        // ML + 5 ব্যবহারের ফলে শুধু এই লেখাটি ৫ ইউনিড ডানে সরে যাবে
        doc.text(v('flat_location'), ML + 5, y); 
        y += 6;

        bold(11);
        doc.text('7. Importance of The Location:', ML, y); 
        y += 6;

        normal(10);
        doc.setFont('times', 'normal'); 

        // ML + 5 ব্যবহারের ফলে শুধু এই লেখাটি ৫ ইউনিড ডানে সরে যাবে
        doc.text(v('flat_importance_location'), ML + 5, y); 
        y += 6;

        bold(11);
        doc.text('8. Route for Communication to the Flat/Apartment to be Mortgaged:', ML, y); 
        y += 6;

        normal(10);
        doc.setFont('times', 'normal'); 

        // ML + 5 ব্যবহারের ফলে শুধু এই লেখাটি ৫ ইউনিড ডানে সরে যাবে
        doc.text(v('flat_route_communication'), ML + 5, y); 
        y += 6;

        bold(11);
        doc.text('9. Distance from Important Place/Location of the Flat/Apartment to be Mortgaged', ML, y); 
        y += 6;

        normal(10);
        doc.setFont('times', 'normal'); 

        // ML + 5 ব্যবহারের ফলে শুধু এই লেখাটি ৫ ইউনিড ডানে সরে যাবে
        doc.text(v('flat_imp_distance'), ML + 5, y); 
        y += 6;

        bold(11);
        doc.text('10. Possibility of Future Improved or Further Disadvantage Factors', ML, y); 
        y += 6;

        normal(10);
        doc.setFont('times', 'normal'); 

        // ML + 5 ব্যবহারের ফলে শুধু এই লেখাটি ৫ ইউনিড ডানে সরে যাবে
        doc.text(v('flat_future_adv'), ML + 5, y); 
        y += 6;

y = newPage();
y += 10;
        // ══════════════════════════════════════════════════
        //  PAGE  – A , B & C (Sheet 4)
        // ══════════════════════════════════════════════════
       bold(11);
        doc.text('5. Description of the Construction of Flat/Apartment:', ML, y); 
        y += 8;

               // ১. ডিমার্কেশনের আগের সাধারণ ডাটাগুলো প্রিন্ট করা
const basicRowsBeforeDemarcation = [
    ['Classification of Land',    v('classification_of_land')],
    ['Nature of Land',            v('nature_of_land')],
    ['Present use of Land',       v('present_use_of_land')],
    ['Communication Facilities',  v('communication_facilities')],
    ['Fitting & Fixture',         v('fiting_type')],
    ['Flooring Type',             v('flooring_type')]
];

basicRowsBeforeDemarcation.forEach(([l, val]) => { 
    y = kvRow(y, l, val, 68); 
});

// ২. "Demarcation" কে একটি একক রো হিসেবে প্রিন্ট করা
// (আপনার kvRow ফাংশনের ডিজাইন অনুযায়ী ভ্যালু ফিল্ড খালি রাখলে এটি একক রো এর মতো দেখাবে)
y = kvRow(y, 'Demarcation', null);

// ৩. এবার ডাইনামিক টেবিল থেকে প্রতিটা ফ্লোরের ডাটা লুপ করে প্রিন্ট করা
const rows = document.querySelectorAll('.demarcation-row');
rows.forEach(row => {
    const floor = row.querySelector('.floor-name').value || 'Floor';
    const north = 'North- ' + (row.querySelector('.side-north').value || '');
    const south = 'South- ' + (row.querySelector('.side-south').value || '');
    const east = 'East- ' + (row.querySelector('.side-east').value || '');
    const west = 'West- ' + (row.querySelector('.side-west').value || '');
    
    // চারদিকের ডাটা এক লাইনে সুন্দরভাবে সাজানোর জন্য:
    const demarcationDetails = `${north} | ${south} | ${east} | ${west}`;
    
    // ফ্লোরের নাম লেবেল হিসেবে এবং চারদিকের সীমানা ভ্যালু হিসেবে প্রিন্ট হবে
    y = kvRow(y, floor, demarcationDetails, 68);
});

// ৪. ডিমার্কেশনের পরের বাকি ডাটাগুলো প্রিন্ট করা
const basicRowsAfterDemarcation = [
    ['Shape & Size',              v('shape_size')],
    ['Utility Service',           v('utility_service')],
    ['Year of Construction',      v('year_of_construction')],
    ['Type of Foundation',        v('type_of_foundation')],
    ['Facing of Flat',            v('facing_of_flat')],
    ['Distance from Main Road',   v('distance_from_main_road')],
    ['Apartment/Flat Area',       v('apartment_flat_area')],
];

basicRowsAfterDemarcation.forEach(([l, val]) => { 
    y = kvRow(y, l, val, 68); 
});

y += 3;

     bold(11);
        doc.text('12. Physical Condition of the Flat/Apartment:', ML, y); 
        y += 6;
        normal(10);
        const physCondLinesP6 = doc.splitTextToSize(v('physical_condition'), CW - 5);
        doc.text(physCondLinesP6, ML + 5, y);
        y += physCondLinesP6.length * 4.5 + 4;

        bold(11);
        doc.text('13. Basis of the Valuation of Properties of Flat/Apartment:', ML, y); 
        y += 6;
        normal(10);
        const basisValLines = doc.splitTextToSize(v('basis_valuation'), CW - 5);
        doc.text(basisValLines, ML + 5, y);
        y += basisValLines.length * 4.5 + 4;

        bold(11);
        doc.text('14. Percentage of Flat work completed with detail description:', ML, y); 
        y += 6;
        normal(10);
        const pctCompLines = doc.splitTextToSize(v('percentage_completed'), CW - 5);
        doc.text(pctCompLines, ML + 5, y);
        y += pctCompLines.length * 4.5 + 6;

        // auto calculation of flat

        // --- RENDER DEVIATION TABLE IN PDF TEMPLATE ---
        y = heading(y, "15. Deviation of Flat/Apartment in sft.");

        let devCols = ["Flat No.", "Area (Deed)", "Area (Plan)", "Area (Physical)", "Deviation (Sft)", "Deviation (%)"];
        let devWidths = [30, 30, 32, 32, 28, 22];

        y = tblHeader(y, devCols, devWidths);

        let deviationRows = Array.isArray(fd._deviation_flat_rows) ? fd._deviation_flat_rows : [];

        if (deviationRows.length === 0) {
            y = tblRow(y, ["No deviations recorded", "—", "—", "—", "—", "—"], devWidths, false);
        } else {
            deviationRows.forEach((row) => {
                y = tblRow(y, [
                    row.flatNo,
            row.deedArea,
            row.planArea,
            row.physicalArea,
            row.deviationSft,
            row.deviationPercent
        ], devWidths, false);
    });
}

        y += 2; 

        y = heading(y, "16. Deviation of Building in sft. (If required):");

        devCols = ["Floor No.", "Measurement", "Area (Plan)", "Area (Physical)", "Deviation (Sft)", "Deviation (%)"];
        devWidths = [30, 30, 32, 32, 28, 22];

        y = tblHeader(y, devCols, devWidths);

        deviationRows = Array.isArray(fd._deviation_build_rows) ? fd._deviation_build_rows : [];

        if (deviationRows.length === 0) {
            y = tblRow(y, ["No deviations recorded", "—", "—", "—", "—", "—"], devWidths, false);
        } else {
            deviationRows.forEach((row) => {
                y = tblRow(y, [
                    row.flatNo,
                    row.deedArea,
                    row.planArea,
                    row.physicalArea,
                    row.deviationSft,
                    row.deviationPercent
                ], devWidths, false);
            });
        }

y += 5; // Section buffer margin space
       


        // ══════════════════════════════════════════════════
        //  17. ROAD MEASUREMENT SECTION (Matches image_f2e1eb.png)
        // ══════════════════════════════════════════════════
        
        // 1. Render Section Heading
        y = heading(y, '17. Road Measurement');
        y += 2; // minor adjustment spacing

        // 2. Define Table Columns widths (Total CW = 168 mm)
        // [Road Side, According to Plan, As Per Physical, Remarks]
        const roadCws = [48, 40, 50, 30]; 

        // 3. Render Table Header
        y = tblHeader(y, [
            'Road Side', 
            'According to Plan', 
            'As Per Physical Measurement', 
            'Remarks'
        ], roadCws);

        // 4. Render Row 1: North Side Data Row
        // Using tblRow(y, cells, cws, firstBold) -> sets first column to bold
        y = tblRow(y, [
            v('road_side'),
            v('road_plan'),
            v('road_physical'),
            v('road_remarks')
        ], roadCws, true);

        // 5. Render Row 2: Observation Row (with custom spanning calculation)
        // Since tblRow takes explicit column widths arrays, we calculate a merged width for the 2nd cell
        const obsLabelWidth = roadCws[0]; // 48
        const obsValueWidth = roadCws[1] + roadCws[2] + roadCws[3]; // 40 + 50 + 30 = 120
        const obsCws = [obsLabelWidth, obsValueWidth];

        y = tblRow(y, [
            'Observation (If there is\n no Road beside building)',
            v('road_observation')
        ], obsCws, true);

        y += 8; // Space after section table


        bold(11);
        doc.text('18. Basis of Valuation of Building & Civil Works:', ML, y); 
        y += 6;
        normal(10);
        const basisValBldgLines = doc.splitTextToSize(v('basis_valuation'), CW - 5);
        doc.text(basisValBldgLines, ML + 5, y);
        y += basisValBldgLines.length * 4.5 + 1;


        y += 0;

        // ── PROPERTY VALUATION REPORT ──────────────────
       y = heading(y, '19. Summary of Valuation:'); y += 2;

const valCws = [10, 60, 24, 24, 25, 25];
y = tblHeader(y, ['Sl.', 'Description', 'Area', 'Rate (TK)', 'Present Value', 'Forced Sale'], valCws);

const valRows = [
    ['01', v('val_desc_1', 'Value of Flat / Apartment'), v('val_area_1'), v('val_rate_1'), v('val_pmv_1'), v('val_fsv_1')],
    ['02', v('val_desc_2', 'Value of Car Parking / Amenities'), v('val_area_2'), v('val_rate_2'), v('val_pmv_2'), v('val_fsv_2')]
];
valRows.forEach(r => { y = tblRow(y, r, valCws, false); });

// Summary Matrix Layout
const sumLblW = valCws[0] + valCws[1] + valCws[2] + valCws[3];
const sumCws  = [sumLblW, valCws[4], valCws[5]];

bold(9);
y = tblRow(y, ['Total Present Market Value:', v('val_total_pmv'), v('val_total_fsv')], sumCws, true);

normal(9);
// অবচয়ের পরিমাণ PMV এবং FSV উভয় কলামে দেখানোর জন্য আপডেট করা হয়েছে
y = tblRow(y, [`Less: Depreciation (${v('val_dep_pct', '0')})`, v('val_dep_amount'), v('val_dep_fsv', '0')], sumCws, false);

bold(10);
// Net Present Market Value এবং অবচয় বাদ দিয়ে নেট Forced Sale নিখুঁতভাবে প্রিন্ট হবে
y = tblRow(y, ['Net Estimated Present Market Value:', v('val_net_pmv'), v('val_net_fsv')], sumCws, true);

y += 10;
bold(10); doc.text('Present Market Value (In Words):', ML, y); y += 5;
normal(10); 
// ফর্ম থেকে অটো জেনারেট হয়ে আসা কথার লেখা রিয়েল-টাইম প্রিন্ট হবে
doc.text(v('in_words_pmv'), ML + 5, y, { maxWidth: CW - 5 });
y += 10;

bold(10); doc.text('Total Forced Sale Value (In Words):', ML, y); y += 5;
normal(10); 
// নেট ফোর্সড সেল এর ইন-ওয়ার্ডস ডাইনামিক লেখা প্রিন্ট হবে
doc.text(v('in_words_fsv'), ML + 5, y, { maxWidth: CW - 5 });
       
y = newPage();

        // ══════════════════════════════════════════════════
        //  PAGE 8 – J, K, L  (Sheet 8)
        // ══════════════════════════════════════════════════
    

        // J. Price Reference – structured table 
      //  y = heading(y, 'J. Price Reference:');
       // [['Maximum Price',       v('max_price')],
       //  ['Minimum Price',       v('min_price')],
        // ['Last Buy-Sell Record',v('last_buy_sell')],
        // ['Price Justification', v('price_justification')],
       // ].forEach(([l, val]) => { y = kvRow(y, l, val,68); });
        y += 6; //

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
        ]);  y += 30;

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

        // --- পেজ নম্বর যোগ করার কোড ---
        const totalPages = doc.internal.getNumberOfPages(); // মোট পেজ সংখ্যা বের করবে

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i); // নির্দিষ্ট পেজে যাবে
            
            doc.setFont('times', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100); // হালকা ধূসর রঙ (Gray Color)
            
            // "Page X of Y" টেক্সট তৈরি
            const pageText = `Page ${i} of ${totalPages}`;
            
            // পেজের প্রস্থ (Width) এবং উচ্চতা (Height) বের করা
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // টেক্সটটি একদম ডান পাশে এলাইন করার জন্য পজিশন হিসাব
            const textWidth = doc.getTextWidth(pageText);
            const xPosition = (pageWidth - textWidth) / 1.19; // মাঝখানে এলাইন করার জন্য
            const yPosition = pageHeight - 15; // নিচের বর্ডার থেকে ১০ মিলিমিটার উপরে
            
            // পেজ নম্বর প্রিন্ট করা
            doc.text(pageText, xPosition, yPosition);
        }

        // Save or preview
        const filename = 'UCB_Flat_' + (v('reference_account_name') || v('letter_ref') || 'Report') + '.pdf';
        if (mode === 'preview') {
            return doc.output('bloburl');
        } else {
            doc.save(filename);
        }
    }
};