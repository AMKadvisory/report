// ═══════════════════════════════════════════════════════════
//  forms/ebl-land-building/pdf-template.js
//  ► Edit THIS file to change the EBL Land & Building PDF.
//  ► Uses PDFEngine (E) primitives only.
//
//  Page map (mirrors EBL HTML sheet by sheet):
//    Page 1  → Sheet 1  Cover (Ref A/C, Ref No, Submitted by/to)
//    Page 2  → Sheet 2  Cover Letter + Valuation table + Signatures
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
const EBLLandBuildingPDF = {

    async render(formData, E) {
        const fd = formData || {};
        const v  = (k, fb = '') => E.v(fd, k, fb);
        const dt = (k)          => E.dt(fd, k);

        // Number helpers
        const raw = (k) => parseFloat((fd[k] || '0').toString().replace(/,/g, '')) || 0;
        const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Init document FIRST – sets E.doc
        let y = await E.init('AMK Header.png', 'AKM Footer.png');
        const { doc, PW, ML, CW, CONTENT_BOTTOM } = E;

        // ── Local drawing helpers ──────────────────────────

        // Grey-label : white-value key-value row
        const kvRow = (y, label, val, lw = 60) => {
            const vw    = CW - lw - 4;
            const lines = doc.splitTextToSize(String(val || ''), vw - 2);
            const rh    = Math.max(6, lines.length * 4.5 + 2);
            if (y + rh > CONTENT_BOTTOM) y = E.newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            doc.setFillColor(255,255,255); doc.rect(ML,      y, lw,  rh, 'FD');
            doc.setFillColor(255,255,255); doc.rect(ML+lw,   y, 4,   rh, 'FD');
            doc.rect(ML+lw+4, y, vw, rh, 'FD');
            E.bold(10);   doc.text(String(label), ML+1.5, y+4);
            E.normal(10); doc.text(':', ML+lw+1.2, y+4);
            doc.text(lines[0], ML+lw+5.5, y+4);
            for (let i = 1; i < lines.length; i++) doc.text(lines[i], ML+lw+5.5, y+4+i*4.5);
            return y + rh;
        };

        const heading = (y, text) => {
            if (y + 8 > CONTENT_BOTTOM) y = E.newPage();
            E.bold(12); doc.text(text, ML, y+5);
            const textWidth = doc.getTextWidth(text);
            doc.setLineWidth(0.3); doc.line(ML, y+6.5, ML+textWidth, y+6.5);
            E.normal(10); return y + 11;
        };

        // Table header row — FIX: measure actual multi-line height before drawing
        const tblHeader = (y, cols, cws) => {
            // Calculate the required header height based on wrapped text in each cell
            let hdrH = 7;
            E.bold(9);
            cols.forEach((c, i) => {
                const ls = doc.splitTextToSize(c, cws[i] - 2);
                hdrH = Math.max(hdrH, ls.length * 4.5 + 3);
            });
            if (y + hdrH > CONTENT_BOTTOM) y = E.newPage();
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
            let rh = 6;
            cells.forEach((c, i) => {
                const ls = doc.splitTextToSize(String(c||''), cws[i]-1);
                rh = Math.max(rh, ls.length * 4.5 + 2);
            });
            if (y + rh > CONTENT_BOTTOM) y = E.newPage();
            let x = ML;
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            cells.forEach((c, i) => {
                doc.rect(x, y, cws[i], rh);
                const ls   = doc.splitTextToSize(String(c||''), cws[i]-1);
                const align = i === 0 ? 'left' : 'center';
                const tx    = i === 0 ? x+1.5 : x+cws[i]/2;
                if (i === 0 && firstBold) E.bold(9); else E.normal(9);
                doc.text(ls, tx, y+4, { align });
                x += cws[i];
            });
            return y + rh;
        };

        // Formula italic sub-row
        const formulaRow = (y, cells, cws) => {
            if (y + 5 > CONTENT_BOTTOM) y = E.newPage();
            let x = ML;
            E.italic(8); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            cells.forEach((c, i) => {
                doc.rect(x, y, cws[i], 5);
                doc.text(String(c), x+cws[i]/2, y+3.5, { align: 'center' });
                x += cws[i];
            });
            E.normal(10); return y + 5;
        };

        // Numbered list with overflow check
        const numberedList = (y, items) => {
            items.forEach((txt, i) => {
                const prefix = `${i+1}. `;
                const prefixW = doc.getTextWidth(prefix);
                const ls = doc.splitTextToSize(txt, CW - 4 - prefixW);
                if (y + ls.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
                E.normal(9);
                doc.text(prefix, ML+2, y);
                doc.text(ls, ML+2+prefixW, y, { align: 'justify', maxWidth: CW - 4 - prefixW });
                y += ls.length*4 + 0.5;
            });
            return y;
        };

        // Pre-compute valuation values (used on pages 2 & 3)
        const mArea  = raw('market_land_area');
        const mRate  = raw('market_rate');
        const mBuild = raw('market_build_val');
        const mLand  = mArea * mRate;
        const mTotal = mLand + mBuild;
        const fRate  = mRate  * 0.8;
        const fLand  = mLand  * 0.8;
        const fBuild = mBuild * 0.8;
        const fTotal = mTotal * 0.8;
        const zArea  = raw('mouza_land_area');
        const zRate  = raw('mouza_rate');
        const zBuild = raw('mouza_build_val');
        const zLand  = zArea * zRate;
        const zTotal = zLand + zBuild;

        

        // ══════════════════════════════════════════════════
        //  PAGE 1 – COVER  (Sheet 1)
        //  EBL: NO surveyor table – only Ref + Submitted boxes
        // ══════════════════════════════════════════════════
        const titleY = 80;
        E.bold(18);
        doc.text('INSPECTION SURVEY & VALUATION REPORT', PW/2, titleY, { align:'center' });

        // Reference fields — centered block
        let ry = titleY + 80;
        const refLabelW = 52, refColonW = 4;
        const refStartX = (PW - refLabelW - refColonW - 60) / 2;
        [
            ['Reference Account Name', v('reference_account_name')],
            ['Reference No.',  v('reference_no')],
        ].forEach(([lbl, val]) => {
            E.bold(10);
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
        doc.rect(ML, boxTop, CW/2-2, boxH, 'FD');
        doc.rect(ML+CW/2+2, boxTop, CW/2-2, boxH, 'FD');

        let by = boxTop + 6;
        E.bold(10);  doc.text('Submitted by:', ML+3, by); by += 6;
        E.bold(10);  doc.text('AMK Associates Limited', ML+3, by); by += 5.5;
        E.normal(10);
        doc.text('68, Khilgaon Chowdhury Para (4th floor)', ML+3, by); by += 5;
        doc.text('DIT Road Rampura, Dhaka-1219', ML+3, by); by += 5;
        doc.text('E-mail: www.amkassociatesbd@gmail.com', ML+3, by); by += 5;
        doc.text('Web: www.amkassociatesbd.com', ML+3, by); by += 5;
        doc.text('Contact: 01841132714', ML+3, by);

        const rx = ML + CW/2 + 5;
        let ty = boxTop + 6;
        E.bold(10); doc.text('Submitted to:', rx, ty); ty += 6;
        rNameLines.forEach(l => { doc.text(l, rx, ty); ty += 5.5; });
        E.normal(10); addrL.forEach(l => { doc.text(l, rx, ty); ty += 5; });

        // ══════════════════════════════════════════════════
        //  PAGE 2 – COVER LETTER  (Sheet 2)
        // ══════════════════════════════════════════════════
        y = E.newPage();
        E.normal(10);
        doc.text('Ref.: ' + v('letter_ref'),  ML, y); y += 6;
        doc.text('Date: ' + dt('letter_date'), ML, y); y += 9;
        E.bold(10); doc.text(v('recipient_name'), ML, y); y += 5;
        E.normal(10);
        const addrL2 = doc.splitTextToSize(v('recipient_address'), CW);
        doc.text(addrL2, ML, y); y += addrL2.length*4.5 + 5;

        E.bold(10);
        doc.text('Subject: Inspection, Survey & Valuation Report on Land with Building', ML, y, { maxWidth: CW }); y += 6;
        doc.text('Ref. A/C Name: ' + v('reference_account_name'), ML, y); y += 8;

        E.normal(10);
        doc.text('Dear Sir,', ML, y); y += 5;
        doc.text('Greetings from AMK Associates Limited and Thank You very much for referring us!', ML, y, { maxWidth: CW }); y += 8;
        const bodyStr = 'Pursuant to your communication through ' + v('comm_medium') +
            ', dated: ' + dt('comm_date') + ' by ' + v('comm_person') +
            ', we, AMK Associates Limited ("AMK") has conducted the inspection, survey and valuation.' +
            ' Summary of the valuation is as below:';
        const bodyLines = doc.splitTextToSize(bodyStr, CW);
        doc.text(bodyLines, ML, y); y += bodyLines.length*4.5 + 5;


        // Valuation table
        const vCws = [42, 26, 30, 26, 28, 26];
        E.italic(9); doc.text('Amount in BDT', ML+CW, y, { align: 'right' }); y += 4;

        // Custom table header with Description spanning 2 rows
        const hdrH1 = 11, hdrH2 = 5;
        const totalHdrH = hdrH1 + hdrH2;
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
        E.bold(9);

        // Draw full outer border for entire header block
        doc.rect(ML, y, vCws.reduce((a,b)=>a+b,0), totalHdrH);

        // Draw Description cell — vertical right border only
        doc.line(ML + vCws[0], y, ML + vCws[0], y + totalHdrH);

        // Draw vertical dividers for remaining columns
        let hx = ML + vCws[0];
        for (let i = 1; i < vCws.length - 1; i++) {
            hx += vCws[i];
            doc.line(hx, y, hx, y + totalHdrH);
        }

        // Draw horizontal divider between header labels and formula row
        // Skip the Description column (starts after vCws[0])
        doc.line(ML + vCws[0], y + hdrH1, ML + vCws.reduce((a,b)=>a+b,0), y + hdrH1);

        // Draw Description text (vertically centered across full header height)
        E.bold(9);
        doc.text('Description', ML + vCws[0]/2, y + totalHdrH/2 + 1.5, { align: 'center' });

        // Draw other header label texts (top row)
        hx = ML + vCws[0];
        const hdrLabels = ['Total Land Area\n(Decimal)', 'Present Rate per\nDecimal (BDT)', 'Land Value\n(BDT)', 'Building Value\n(BDT)', 'Total Value\n(BDT)'];
        for (let i = 0; i < hdrLabels.length; i++) {
            const ls = doc.splitTextToSize(hdrLabels[i], vCws[i+1] - 1);
            doc.text(ls, hx + vCws[i+1]/2, y + 3.5, { align: 'center' });
            hx += vCws[i+1];
        }

        // Draw formula texts (bottom row)
        E.italic(8);
        hx = ML + vCws[0];
        const formulas = ['a', 'b', 'c=a*b', 'd', 'e=c+d'];
        for (let i = 0; i < formulas.length; i++) {
            doc.text(formulas[i], hx + vCws[i+1]/2, y + hdrH1 + 3.5, { align: 'center' });
            hx += vCws[i+1];
        }
        y += totalHdrH;

        // Custom data rows — ensure Description cell height matches full row without overlap
        const dataRows = [
            ['Present Market Value',        mArea||'', fmt(mRate), fmt(mLand), fmt(mBuild), fmt(mTotal)],
            ['Forced Sale Value (20% less)', mArea||'', fmt(fRate), fmt(fLand), fmt(fBuild), fmt(fTotal)],
            ['Mouza Value',                  zArea||'', fmt(zRate), fmt(zLand), fmt(zBuild), fmt(zTotal)],
        ];

        dataRows.forEach(cells => {
            // Calculate required row height based on all cells
            let rh = 7;
            cells.forEach((c, i) => {
                const ls = doc.splitTextToSize(String(c||''), vCws[i] - 2);
                rh = Math.max(rh, ls.length * 4.5 + 3);
            });

            if (y + rh > E.CONTENT_BOTTOM) y = E.newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);

            let dx = ML;
            cells.forEach((c, i) => {
                doc.rect(dx, y, vCws[i], rh);
                const ls = doc.splitTextToSize(String(c||''), vCws[i] - 2);
                const align = i === 0 ? 'left' : 'center';
                const tx    = i === 0 ? dx + 2 : dx + vCws[i]/2;
                if (i === 0) E.bold(9); else E.normal(9);
                // Vertically center the text within the cell
                const textY = y + (rh - (ls.length - 1) * 4.5) / 2 + 1;
                doc.text(ls, tx, textY, { align });
                dx += vCws[i];
            });
            y += rh;
        });
        y += 5;

        E.normal(10);
        const p1L = doc.splitTextToSize('The report has been prepared based on our physical inspection, verification, necessary documents as provided by concern office/individual, local market analysis and assessment to the best of our knowledge.', CW);
        doc.text(p1L, ML, y); y += p1L.length*4.5 + 4;
        doc.text('Detail Report and necessary attachments are enclosed herewith for your record and perusal.', ML, y, { maxWidth: CW }); y += 6;
        doc.text('For any query, please feel free to contact us.', ML, y); y += 6;
        doc.text('With best regards,', ML, y); y += 18;

        // Signatures
        doc.setLineWidth(0.3);
        doc.line(ML, y, ML+74, y); doc.line(ML+104, y, ML+178, y); y += 4;
        E.bold(10);
        doc.text(v('valuer_1_name'), ML,      y);
        doc.text(v('valuer_2_name'), ML+104,  y); y += 5;
        E.normal(10);
        doc.text(v('valuer_1_designation'), ML,     y);
        doc.text(v('valuer_2_designation'), ML+104, y); y += 8;

        // Enclosures
        const encl = [
            ['1. Annexure-I: Photograph of Property',   '5. Annexure-V: QR Code for video'],
            ['2. Annexure-II: Hand Sketch Map',          '6. Annexure-VI: QR Code for Map'],
            ['3. Annexure-III: Mouza Map',               '7. Annexure-VII: SRO Mouza Value'],
            ['4. Annexure-IV: Location on Google Map',   '8. Annexure-VIII: Status In Area Master Plan'],
        ];
        E.bold(10); doc.text('Encl:', ML, y); y += 5;
        E.normal(9);
        encl.forEach(([left, right]) => { doc.text(left, ML, y); doc.text(right, ML+CW/2, y); y += 4.5; });

        // ══════════════════════════════════════════════════
        //  PAGE 3 – SUMMARY  (Sheet 3)
        // ══════════════════════════════════════════════════
        y = E.newPage();
        // FIX 1: Add underline under "Summary of the Valuation Report"
        const summaryTitle = 'Summary of the Valuation Report';
        E.bold(12);
        doc.text(summaryTitle, PW/2, y+5, { align: 'center' });
        const summaryTitleW = doc.getTextWidth(summaryTitle);
        doc.setLineWidth(0.4);
        doc.line(PW/2 - summaryTitleW/2, y+7, PW/2 + summaryTitleW/2, y+7);
        E.normal(10); y += 13;

        [['File Receiving Date',     dt('file_receiving_date')],
         ['Valuation Ref No.',        v('valuation_ref_no')],
         ['Valuation Date',           dt('valuation_date')],
         ['Property Location',        v('property_location')],
         ['Valuation Conducted By',   v('valuation_conducted_by') || 'AMK Associates Limited'],
        ].forEach(([l, val]) => { y = kvRow(y, l, val); });
        y += 3;
        // Surveyor on sheet 3 in EBL
        [['Surveyor Name',  v('surveyor_name')],
         ['Designation',    v('surveyor_designation')],
         ['NID Number',     v('surveyor_nid')],
         ['Contact Number', v('surveyor_contact')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val); });
        y += 3;
        [['Type of Property',        v('property_type')],
         ['Type of Property Seller', v('property_seller_type')],
         ['Current Market Value',    'BDT ' + fmt(mTotal)],
         ['Forced Sale Value',       'BDT ' + fmt(fTotal)],
         ['Deviation (Plinth)',      v('deviation_plinth') + (v('deviation_plinth') ? '%' : '')],
         ['Deviation (Floor)',       v('deviation_floor')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val); });

        // ══════════════════════════════════════════════════
        //  PAGE 4 – A & B  (Sheet 4)
        // ══════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'A. Particulars of Account:');
        [['A/C Name',              v('ac_name')],
         ['Contact Person Name',    v('contact_person_name')],
         ['Mobile Number of Contact Person', v('mobile_number')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val); });
        y += 4;
        y = heading(y, 'B. Particulars of Property Owner:');
        [["Property Owner(s) Name",   v('owner_name')],
         ["Father's Name",             v('owner_father')],
         ["Mother's Name",             v('owner_mother')],
         ['Present Address',           v('owner_present_address')],
         ['Permanent Address',         v('owner_perm_address')],
         ['Contact Number',            v('owner_contact')],
         ['NID Number',                v('owner_nid')],
         ['Relationship with Borrower',v('owner_relationship')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val); });

        // ══════════════════════════════════════════════════
        //  PAGE 5 – C & D  (Sheet 5)
        // ══════════════════════════════════════════════════
        y = E.newPage();
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
         ['Total Area Physically found',     v('total_area_physical')],
         ['Way to visit Property',           v('way_to_visit')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 62); });

        y += 4;
        y = heading(y, 'D. Property Identification:');
        const dCws = [18, 40, 40, 40, 40];
        y = tblHeader(y, ['Direction','Chowhoddi as Per Deed','Present Chowhoddi','Demarcation','Access Road'], dCws);
        ['north','south','east','west'].forEach(dir => {
            y = tblRow(y, [
                dir.charAt(0).toUpperCase()+dir.slice(1),
                v(dir+'_deed'), v(dir+'_present'), v(dir+'_demar'), v(dir+'_road')
            ], dCws);
        });

        // ══════════════════════════════════════════════════
        //  PAGE 6 – E  (Sheet 6)
        // ══════════════════════════════════════════════════
        y = E.newPage();
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
        //  PAGE 7 – F  (Sheet 7)
        // ══════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'F. Civil Construction of Property:');
        const age = parseFloat(v('age_of_structure') || '0');
        const ageStr = age
            ? `${age} Years (Construction period: ${v('construction_from')} to ${v('construction_to')})`
            : '';
        [['Structure Type',                  v('structure_type')],
         ['Foundation Type',                 v('foundation_type')],
         ['Number of Stories',
           '(a) As per Plan: ' + v('stories_plan') + ' Storied  /  (b) As per Physical: ' + v('stories_physical') + ' Storied'],
         ['Approval Authority',              v('approval_authority')],
         ['Plan No. & Date',                'Sarok No: ' + v('plan_no') + '  Date: ' + dt('plan_date')],
         ['Occupancy Category',              v('occupancy_category')],
         ['Age of Structure',                ageStr],
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
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 64); });

        // ══════════════════════════════════════════════════
        //  PAGE 8 – FLOOR TABLES + G. SETBACK  (Sheet 8)
        // ══════════════════════════════════════════════════
        y = E.newPage();

        // FIX 3a: Floor Area table — tblHeader now auto-sizes height, no overflow
        const aCws = [32, 37, 37, 36, 36];
        y = tblHeader(y, ['Floor','Area as per Plan\n(Sft.)','Area as per Physical\n(Sft.)','Deviation\n(Sft.)','Deviation\n(%)'], aCws);
        const areaRows = Array.isArray(fd._floor_area_rows) && fd._floor_area_rows.length
            ? fd._floor_area_rows
            : [{ floor:'Ground Floor', area_plan:'', area_phys:'', dev_sft:'', dev_pct:'' }];
        areaRows.forEach(r => {
            y = tblRow(y, [r.floor||'', r.area_plan||'', r.area_phys||'', r.dev_sft||'', r.dev_pct||''], aCws);
        });
        y += 5;

        // FIX 3b: Floor Unit table — tblHeader now auto-sizes height, no overflow
        const uCws = [25,20,20,18,20,18,20,20,17];
        y = tblHeader(y, ['Floor','Unit/Floor\n(Plan)','Unit/Floor\n(Phys)','Rooms','Bathrooms','Balcony',
                          'Drawing\nRoom','Dining\nRoom','Drawing\nCum Dining'], uCws);
        const unitRows = Array.isArray(fd._floor_unit_rows) && fd._floor_unit_rows.length
            ? fd._floor_unit_rows
            : [{ floor:'Ground Floor' }];
        unitRows.forEach(r => {
            y = tblRow(y, [r.floor||'', r.unit_plan||'', r.unit_phys||'', r.rooms||'',
                           r.bathrooms||'', r.balcony||'', r.drawing||'', r.dining||'', r.drawing_dining||''], uCws);
        });
        y += 5;

        // G. Setback
        y = heading(y, 'G. Setback Comparison:');
        const gCws = [30, 50, 50, 48];
        y = tblHeader(y, ['Direction','As Per Approved Plan (Ft.)','As Per Physical (Ft.)','Deviation (Ft.)'], gCws);
        y = formulaRow(y, ['','a','b','c = b-a'], gCws);
        [['North','setback_north'], ['South','setback_south'], ['East','setback_east'],
         ['West','setback_west'],  ['Road (N/S)','setback_ns'], ['Road (E/W)','setback_ew'],
        ].forEach(([label, key]) => {
            const plan = parseFloat(fd[key+'_plan']||0)||0;
            const phys = parseFloat(fd[key+'_phys']||0)||0;
            const dev = plan||phys ? `(${Math.abs(phys-plan).toFixed(2)})` : '';
            y = tblRow(y, [label, plan||'', phys||'', dev], gCws);
        });

        // ══════════════════════════════════════════════════
        //  PAGE 9 – H & I  (Sheet 9)
        // ══════════════════════════════════════════════════
        y = E.newPage();

        // FIX 3c: H. Construction % — tblHeader now auto-sizes height, no overflow
        y = heading(y, 'H. Construction Percentage:');
        const hCws = [22,15,11,12,12,16,16,12,14,18,11,19];
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

        // FIX 3d: I. Floor-wise Building Value — tblHeader now auto-sizes height, no overflow
        y = heading(y, 'I. Floor-wise Building Value:');
        const iCws = [22, 16, 18, 22, 22, 22, 18, 20, 20];

        const iR1H = 12, iR2H = 12, iR3H = 6;
        const iTotalHdrH = iR1H + iR2H + iR3H;

        if (y + iTotalHdrH > CONTENT_BOTTOM) y = E.newPage();
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
        E.bold(9);

        // Column x positions
        const iXPos = iCws.reduce((acc, w, i) => {
            acc.push(i === 0 ? ML : acc[i-1] + iCws[i-1]);
            return acc;
        }, []);

        // Helper: draw cell with centered wrapped text
        const iHdrCell = (x, y, w, h, label) => {
            doc.rect(x, y, w, h);
            const ls = doc.splitTextToSize(label, w - 2);
            const textY = y + (h - (ls.length - 1) * 4.5) / 2 + 1.5;
            doc.text(ls, x + w/2, textY, { align: 'center' });
        };

        // ── ROW 1 ──────────────────────────────────────────────
        // Floor (rowspan=3)
        iHdrCell(iXPos[0], y, iCws[0], iTotalHdrH, 'Floor');

        // Area (colspan=2)
        iHdrCell(iXPos[1], y, iCws[1]+iCws[2], iR1H, 'Area (Sft.)');

        // Present Construction Cost (rowspan=3)
        iHdrCell(iXPos[3], y, iCws[3], iTotalHdrH, 'Present\nConstruction\nCost per Sft.\n(BDT)');

        // Estimated Value (colspan=2)
        iHdrCell(iXPos[4], y, iCws[4]+iCws[5], iR1H, 'Estimated Value (BDT) for\n100% completion of Construction');

        // Work Completion (rowspan=3)
        iHdrCell(iXPos[6], y, iCws[6], iTotalHdrH, 'Work\nCompletion\n(%)\ntill date');

        // Present Value (colspan=2)
        iHdrCell(iXPos[7], y, iCws[7]+iCws[8], iR1H, 'Present Value (BDT)');

        // ── ROW 2 ──────────────────────────────────────────────
        const iY2 = y + iR1H;
        iHdrCell(iXPos[1], iY2, iCws[1], iR2H, 'As per\nPlan');
        iHdrCell(iXPos[2], iY2, iCws[2], iR2H, 'As per\nPhysical\nInspection');
        iHdrCell(iXPos[4], iY2, iCws[4], iR2H, 'As per Plan');
        iHdrCell(iXPos[5], iY2, iCws[5], iR2H, 'As per\nPhysical\nInspection');
        iHdrCell(iXPos[7], iY2, iCws[7], iR2H, 'As per\nPlan');
        iHdrCell(iXPos[8], iY2, iCws[8], iR2H, 'As per\nPhysical\nInspection');

        // ── ROW 3 (formula row) ─────────────────────────────────
        const iY3 = y + iR1H + iR2H;
        E.italic(8);
        [['a',1],['b',2],['c',3],['d=a*c',4],['e=b*c',5],['f',6],['g=d*f',7],['h=e*f',8]].forEach(([label, i]) => {
            doc.rect(iXPos[i], iY3, iCws[i], iR3H);
            doc.text(label, iXPos[i] + iCws[i]/2, iY3 + 4, { align: 'center' });
        });

        y += iTotalHdrH;

        // ── DATA ROWS ───────────────────────────────────────────
        E.normal(9);
        const costRows = Array.isArray(fd._cost_rows) && fd._cost_rows.length
            ? fd._cost_rows : [{ floor:'Foundation' }, { floor:'Ground Fl.' }];

        let totD=0, totE=0, totG=0, totH=0;
        costRows.forEach(r => {
            // Use saved calculated values directly, fallback to recalculate if missing
            const a = parseFloat((r.area_plan    ||'').replace(/,/g,'').replace('–','')) || 0;
            const b = parseFloat((r.area_phys   ||'').replace(/,/g,'').replace('–','')) || 0;
            const c = parseFloat((r.cost_per_sft||'').replace(/,/g,'').replace('–','')) || 0;
            const f = parseFloat((r.work_pct    ||'').replace(/,/g,'').replace('–','')) || 0;

            // Use saved est/present values if available, otherwise recalculate
            const d = parseFloat((r.est_plan    ||'').replace(/,/g,'').replace('–','')) || (a * c);
            const e = parseFloat((r.est_phys    ||'').replace(/,/g,'').replace('–','')) || (b * c);
            const g = parseFloat((r.present_plan||'').replace(/,/g,'').replace('–','')) || (d * f / 100);
            const h = parseFloat((r.present_phys||'').replace(/,/g,'').replace('–','')) || (e * f / 100);

            totD+=d; totE+=e; totG+=g; totH+=h;

            y = tblRow(y, [
                r.floor||'',
                a ? fmt(a) : '-',
                b ? fmt(b) : '-',
                c ? fmt(c) : '-',
                d ? fmt(d) : '-',
                e ? fmt(e) : '-',
                f ? f+'%'  : '-',
                g ? fmt(g) : '-',
                h ? fmt(h) : '-'
            ], iCws);
        });

        // ── FOOTER ROWS ─────────────────────────────────────────
        const depPct = age ? Math.round((100/70)*age) : 0;
        const depG = totG*depPct/100, depH = totH*depPct/100;
        const iFRh = 7;

        // Total Value row
        if (y + iFRh > CONTENT_BOTTOM) y = E.newPage();
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
        E.bold(9);
        const iSpanW1 = iCws[0]+iCws[1]+iCws[2]+iCws[3];
        doc.rect(ML, y, iSpanW1, iFRh);
        doc.text('Total Value of Building (1)', ML+2, y+4.5);
        doc.rect(iXPos[4], y, iCws[4], iFRh); doc.text(fmt(totD), iXPos[4]+iCws[4]/2, y+4.5, { align:'center' });
        doc.rect(iXPos[5], y, iCws[5], iFRh); doc.text(fmt(totE), iXPos[5]+iCws[5]/2, y+4.5, { align:'center' });
        doc.rect(iXPos[6], y, iCws[6], iFRh);
        doc.rect(iXPos[7], y, iCws[7], iFRh); doc.text(fmt(totG), iXPos[7]+iCws[7]/2, y+4.5, { align:'center' });
        doc.rect(iXPos[8], y, iCws[8], iFRh); doc.text(fmt(totH), iXPos[8]+iCws[8]/2, y+4.5, { align:'center' });
        y += iFRh;

        // Depreciation row
        E.normal(9);
        if (y + iFRh > CONTENT_BOTTOM) y = E.newPage();
        const iSpanW2 = iCws[0]+iCws[1]+iCws[2]+iCws[3]+iCws[4]+iCws[5]+iCws[6];
        doc.rect(ML, y, iSpanW2, iFRh);
        doc.text('Depreciation (2) @ '+depPct+'%', ML+2, y+4.5);
        doc.rect(iXPos[7], y, iCws[7], iFRh); doc.text(fmt(depG), iXPos[7]+iCws[7]/2, y+4.5, { align:'center' });
        doc.rect(iXPos[8], y, iCws[8], iFRh); doc.text(fmt(depH), iXPos[8]+iCws[8]/2, y+4.5, { align:'center' });
        y += iFRh;

        // Net Value row
        E.bold(9);
        if (y + iFRh > CONTENT_BOTTOM) y = E.newPage();
        doc.rect(ML, y, iSpanW2, iFRh);
        doc.text('Net Value of Building', ML+2, y+4.5);
        doc.rect(iXPos[7], y, iCws[7], iFRh); doc.text(fmt(totG-depG), iXPos[7]+iCws[7]/2, y+4.5, { align:'center' });
        doc.rect(iXPos[8], y, iCws[8], iFRh); doc.text(fmt(totH-depH), iXPos[8]+iCws[8]/2, y+4.5, { align:'center' });
        y += iFRh;

        E.normal(10); y += 5;

        E.bold(9);
        doc.text('Note:', ML, y); 
        E.italic(9);

        ['1. Building value has been considered based on Approved Plan and construction cost as per current market standards.',
        age ? `2. Average life of concrete structure has been considered as 70 Years. As this structure is ${age}-years-old, thus the Depreciation is considered as (100/70) x ${age} = ${((100/70)*age).toFixed(2)} ~ ${depPct}%.`
            : '2. Average life of concrete structure has been considered as 70 Years.',
        ].forEach(note => {
            const ls = doc.splitTextToSize(note, CW - 14);
            if (y + ls.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
            doc.text(ls, ML + 12, y); y += ls.length*4 + 1;
        });

        E.normal(10); y += 5;

        // ══════════════════════════════════════════════════
        //  PAGE 10 – J, K, L  (Sheet 10)
        // ══════════════════════════════════════════════════
        y = E.newPage();

        // J. Price Justification – structured table
        y = heading(y, 'J. Price Justification:');
        [['Maximum Price',       v('max_price')],
         ['Minimum Price',       v('min_price')],
         ['Last Buy-Sell Record',v('last_buy_sell')],
         ['Price Justification', v('price_justification')],
        ].forEach(([l, val]) => { y = kvRow(y, l, val); });
        y += 6;

        // K. About our overall Valuation – 9 static points
        y = heading(y, 'K. About our overall Valuation:');
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
        y += 5;

        // L. Declaration – 9 static points
        if (y + 20 > CONTENT_BOTTOM) y = E.newPage();
        y = heading(y, 'L. Declaration:');
        y = numberedList(y, [
            'The valuation has been performed based on our physical inspection, verification, local market analysis and assessment to the best of our knowledge and all the information provided in this report is based on the property/ land related documents, other necessary documents and information as provided by the concerned Bank/NBFI/Officials/Property Owner/Borrower/Individual (the client). No responsibility is accepted for any errors resulting from incorrect information provided by the client.',
            'The inspection was limited to a visual examination only. So, AMK shall not be held responsible, for any latent defects not apparent during inspection.',
            "AMK's responsibility is limited to the valuation of the said property only without considering any legal matter related to the property and documents as well.",
            'This report is not a certificate of title or ownership. Legal verification should be undertaken independently.',
            'The valuation reflects the market value on the date of inspection only. No responsibility is accepted for any changes in market conditions thereafter.',
            'Except inspection, survey and valuation of the said property, AMK or any of its Officials has no interest directly or indirectly, at present or in near future in any manner whatsoever in the subject matter of this report.',
            'This report is not intended to absolve the concerned parties from their contractual obligations.',
            'This report is confidential and intended only for the named client. AMK accepts no liability to any third party for any loss or damage suffered as a result of reliance on this report.',
            'The report is duly signed by the authorized signatories of AMK and it contains 18 (Eighteen) pages.',
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
                    y = E.newPage();
                    // Annexure heading
                    E.bold(11);
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
                E.italic(9);
                doc.text(cap1Lines, ML + CW / 2, iy + imgH + 4.5, { align: 'center' });
            }
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-II – HAND SKETCH MAP (description + 158×178mm)
        // ══════════════════════════════════════════════════════════
        const ann2 = Array.isArray(fd._ann2_photos) ? fd._ann2_photos : [];
        {
            y = E.newPage();
            // Heading
            E.bold(11);
            const ann2Title = 'Annexure-II: Hand Sketch Map';
            doc.text(ann2Title, ML, y + 5);
            const ann2TitleW = doc.getTextWidth(ann2Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann2TitleW, y + 6.5);
            y += 14;

            // Description
            const ann2Desc = fd.annexure2_desc || '';
            if (ann2Desc) {
                E.normal(10);
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
                E.italic(9);
                doc.text(cap2Lines, ML + CW / 2, y + imgH + 4.5, { align: 'center' });
                y += imgH + 10;
            }
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-III – MOUZA MAP (description + 158×178mm)
        // ══════════════════════════════════════════════════════════
        const ann3 = Array.isArray(fd._ann3_photos) ? fd._ann3_photos : [];
        {
            y = E.newPage();
            // Heading
            E.bold(11);
            const ann3Title = 'Annexure-III: Mouza Map';
            doc.text(ann3Title, ML, y + 5);
            const ann3TitleW = doc.getTextWidth(ann3Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann3TitleW, y + 6.5);
            y += 14;

            // Description
            const ann3Desc = fd.annexure3_desc || '';
            if (ann3Desc) {
                E.normal(10);
                const descLines = doc.splitTextToSize(ann3Desc, CW);
                doc.text(descLines, ML, y);
                y += descLines.length * 4.5 + 6;
            }

            // Image
            if (ann3.length) {
                const imgW = 158, imgH = 178;
                const imgX = ML + (CW - imgW) / 2;
                doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
                try {
                    const fmt2 = ann3[0].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(ann3[0].dataUrl, fmt2, imgX, y, imgW, imgH);
                } catch(e) {
                    doc.setFillColor(230, 230, 230);
                    doc.rect(imgX, y, imgW, imgH, 'FD');
                }
                doc.rect(imgX, y, imgW, imgH);

                // Caption
                const cap3 = ann3[0].caption || ann3[0].name.replace(/\.[^/.]+$/, '');
                const cap3Lines = doc.splitTextToSize(cap3, imgW);
                E.italic(9);
                doc.text(cap3Lines, ML + CW / 2, y + imgH + 4.5, { align: 'center' });
                y += imgH + 10;
            }
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-IV – GOOGLE MAP (1 line desc + 2 images 158×102mm)
        // ══════════════════════════════════════════════════════════
        const ann4 = Array.isArray(fd._ann4_photos) ? fd._ann4_photos : [];
        {
            y = E.newPage();
            // Heading
            E.bold(11);
            const ann4Title = 'Annexure-IV: Location on Google Map';
            doc.text(ann4Title, ML, y + 5);
            const ann4TitleW = doc.getTextWidth(ann4Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann4TitleW, y + 6.5);
            y += 14;

            // One line description
            const ann4Desc = fd.annexure4_desc || '';
            if (ann4Desc) {
                E.normal(10);
                doc.text(ann4Desc, ML, y);
                y += 7;
            }

            // Two images stacked
            const imgW4 = 158, imgH4 = 102, capH4 = 7, gap4 = 8;
            ann4.slice(0, 2).forEach((photo, i) => {
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
                E.italic(9);
                doc.text(cap4Lines, ML + CW / 2, y + imgH4 + 4.5, { align: 'center' });
                y += imgH4 + capH4 + gap4;
            });
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-V & VI – QR CODES (same page, 51×51mm each, centered)
        // ══════════════════════════════════════════════════════════
        const ann5 = Array.isArray(fd._ann5_photos) ? fd._ann5_photos : [];
        const ann6 = Array.isArray(fd._ann6_photos) ? fd._ann6_photos : [];
        {
            y = E.newPage();
            const qrW = 51, qrH = 51;
            const qrX = ML + (CW - qrW) / 2;

            // Annexure V heading
            E.bold(11);
            const ann5Title = 'Annexure-V: QR Code for video of the Property';
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
                // Placeholder box if no image
                doc.setFillColor(240, 240, 240);
                doc.rect(qrX, y, qrW, qrH, 'FD');
            }
            y += qrH + 14;

            // Annexure VI heading
            E.bold(11);
            const ann6Title = 'Annexure-VI: QR Code for Map of the Property';
            doc.text(ann6Title, ML, y + 5);
            const ann6TitleW = doc.getTextWidth(ann6Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann6TitleW, y + 6.5);
            y += 14;

            // QR VI image
            if (ann6.length) {
                doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
                try {
                    const fmt2 = ann6[0].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(ann6[0].dataUrl, fmt2, qrX, y, qrW, qrH);
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
            E.bold(10);
            doc.text('Instructions for use:', ML + 20, y); y += 6;
            E.italic(9);
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
        //  ANNEXURE-VII – SRO MOUZA VALUE (full page, 158×178mm)
        // ══════════════════════════════════════════════════════════
        const ann7 = Array.isArray(fd._ann7_photos) ? fd._ann7_photos : [];
        if (ann7.length) {
            y = E.newPage();
            // Heading
            E.bold(11);
            const ann7Title = 'Annexure-VII: SRO Mouza Value';
            doc.text(ann7Title, ML, y + 5);
            const ann7TitleW = doc.getTextWidth(ann7Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann7TitleW, y + 6.5);
            y += 14;

            const imgW = 158, imgH = 178;
            const imgX = ML + (CW - imgW) / 2;
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
            try {
                const fmt2 = ann7[0].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(ann7[0].dataUrl, fmt2, imgX, y, imgW, imgH);
            } catch(e) {
                doc.setFillColor(230, 230, 230);
                doc.rect(imgX, y, imgW, imgH, 'FD');
            }
            doc.rect(imgX, y, imgW, imgH);
        }

        // ══════════════════════════════════════════════════════════
        //  ANNEXURE-VIII – AREA MASTER PLAN (full page, 158×178mm)
        // ══════════════════════════════════════════════════════════
        const ann8 = Array.isArray(fd._ann8_photos) ? fd._ann8_photos : [];
        if (ann8.length) {
            y = E.newPage();
            // Heading
            E.bold(11);
            const ann8Title = 'Annexure-VIII: Status in Area Master Plan';
            doc.text(ann8Title, ML, y + 5);
            const ann8TitleW = doc.getTextWidth(ann8Title);
            doc.setLineWidth(0.3);
            doc.line(ML, y + 6.5, ML + ann8TitleW, y + 6.5);
            y += 14;

            const imgW = 158, imgH = 178;
            const imgX = ML + (CW - imgW) / 2;
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
            try {
                const fmt2 = ann8[0].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(ann8[0].dataUrl, fmt2, imgX, y, imgW, imgH);
            } catch(e) {
                doc.setFillColor(230, 230, 230);
                doc.rect(imgX, y, imgW, imgH, 'FD');
            }
            doc.rect(imgX, y, imgW, imgH);

            // Caption below image
            const cap8 = ann8[0].caption || ann8[0].name.replace(/\.[^/.]+$/, '');
            const cap8Lines = doc.splitTextToSize(cap8, imgW);
            E.italic(9);
            doc.text(cap8Lines, ML + CW / 2, y + imgH + 4.5, { align: 'center' });
        }
        // Save
        const filename = 'EBL_LandBuilding_' + (v('reference_account_name') || v('letter_ref') || 'Report') + '.pdf';
        E.save(filename);
    }
};
