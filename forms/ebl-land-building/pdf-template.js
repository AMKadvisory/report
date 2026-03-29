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

        // Table header row
        const tblHeader = (y, cols, cws) => {
            if (y + 7 > CONTENT_BOTTOM) y = E.newPage();
            let x = ML;
            E.bold(9); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            cols.forEach((c, i) => {
                doc.rect(x, y, cws[i], 7);
                doc.text(doc.splitTextToSize(c, cws[i]-1), x + cws[i]/2, y+3.5, { align: 'center' });
                x += cws[i];
            });
            return y + 7;
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
                const ls = doc.splitTextToSize(`${i+1}. ${txt}`, CW - 4);
                if (y + ls.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
                E.normal(9); doc.text(ls, ML+2, y);
                y += ls.length*4.5 + 2;
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
        const formulas = ['a', 'b', 'c=a×b', 'd', 'e=c+d'];
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
        E.bold(12); doc.text('Summary of the Valuation Report', PW/2, y+5, { align: 'center' });
        // doc.setLineWidth(0.3); doc.line(ML, y+7, ML+CW, y+7);
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
        ].forEach(([l, val]) => { y = kvRow(y, l, val, 55); });

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

        // Floor Area table
        const aCws = [32, 37, 37, 36, 36];
        y = tblHeader(y, ['Floor','Area as per Plan\n(Sft.)','Area as per Physical\n(Sft.)','Deviation\n(Sft.)','Deviation\n(%)'], aCws);
        const areaRows = Array.isArray(fd._floor_area_rows) && fd._floor_area_rows.length
            ? fd._floor_area_rows
            : [{ floor:'Ground Floor', area_plan:'', area_phys:'', dev_sft:'', dev_pct:'' }];
        areaRows.forEach(r => {
            y = tblRow(y, [r.floor||'', r.area_plan||'', r.area_phys||'', r.dev_sft||'', r.dev_pct||''], aCws);
        });
        y += 5;

        // Floor Unit table
        const uCws = [22,18,18,16,18,16,18,18,14];
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
        y = formulaRow(y, ['','a','b','c = b − a'], gCws);
        [['North','setback_north'], ['South','setback_south'], ['East','setback_east'],
         ['West','setback_west'],  ['Road (N/S)','setback_ns'], ['Road (E/W)','setback_ew'],
        ].forEach(([label, key]) => {
            const plan = parseFloat(fd[key+'_plan']||0)||0;
            const phys = parseFloat(fd[key+'_phys']||0)||0;
            const dev  = plan||phys ? (phys-plan).toFixed(2) : '';
            y = tblRow(y, [label, plan||'', phys||'', dev], gCws);
        });

        // ══════════════════════════════════════════════════
        //  PAGE 9 – H & I  (Sheet 9)
        // ══════════════════════════════════════════════════
        y = E.newPage();

        // H. Construction %
        y = heading(y, 'H. Construction Percentage:');
        const hCws = [20,14,14,14,13,16,16,14,14,14,13,16];
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

        // I. Floor-wise Building Value
        y = heading(y, 'I. Floor-wise Building Value:');
        const iCws = [20,18,18,22,20,20,18,22,20];
        y = tblHeader(y, ['Floor','Area Plan\n(Sft.)','Area Phys.\n(Sft.)','Cost/Sft\n(BDT)',
                          'Est. Plan\n(BDT)','Est. Phys.\n(BDT)','Work %',
                          'Present Plan\n(BDT)','Present Phys.\n(BDT)'], iCws);
        y = formulaRow(y, ['','a','b','c','d=a×c','e=b×c','f','g=d×f','h=e×f'], iCws);

        const costRows = Array.isArray(fd._cost_rows) && fd._cost_rows.length
            ? fd._cost_rows : [{ floor:'Foundation' }, { floor:'Ground Fl.' }];

        let totD=0, totE=0, totG=0, totH=0;
        costRows.forEach(r => {
            const a = parseFloat(r.area_plan||0), b = parseFloat(r.area_phys||0);
            const c = parseFloat((r.cost_per_sft||'0').replace(/,/g,''));
            const f = parseFloat(r.work_pct||0)/100;
            const d=a*c, e=b*c, g=d*f, h=e*f;
            totD+=d; totE+=e; totG+=g; totH+=h;
            y = tblRow(y, [r.floor||'', a?fmt(a):'', b?fmt(b):'', c?fmt(c):'',
                           d?fmt(d):'', e?fmt(e):'', r.work_pct||'', g?fmt(g):'', h?fmt(h):''], iCws);
        });

        E.bold(9);
        y = tblRow(y, ['Total Value of Building\u00B9','','','',fmt(totD),fmt(totE),'',fmt(totG),fmt(totH)], iCws);
        const depPct = age ? Math.round((100/70)*age) : 0;
        const depG = totG*depPct/100, depH = totH*depPct/100;
        y = tblRow(y, ['Depreciation\u00B2 @ '+depPct+'%','','','','','','',fmt(depG),fmt(depH)], iCws);
        y = tblRow(y, ['Net Value of the Building','','','','','','',fmt(totG-depG),fmt(totH-depH)], iCws);
        E.normal(10); y += 5;

        E.normal(9);
        ['1. Building value has been considered based on Approved Plan and construction cost as per current market standards.',
         '2. Average life of concrete structure has been considered as 70 Years.',
        ].forEach(note => {
            const ls = doc.splitTextToSize(note, CW-4);
            if (y + ls.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
            doc.text(ls, ML+2, y); y += ls.length*4.5+2;
        });

        if (age) {
            y += 3;
            const depExact = ((100/70)*age).toFixed(2);
            const dline = `As this structure is ${age}-year-old, Depreciation = (100/70) × ${age} = ${depExact} \u2245 ${depPct}%.`;
            const dlines = doc.splitTextToSize(dline, CW);
            if (y + dlines.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
            E.normal(10); doc.text(dlines, ML, y); y += dlines.length*4.5+5;
        }

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

        // ══════════════════════════════════════════════════
        //  ANNEXURE-I – PHOTOS
        // ══════════════════════════════════════════════════
        const photos = Array.isArray(fd._photos) && fd._photos.length ? fd._photos : [];
        if (photos.length) {
            const imgW=158, imgH=102, capH=6, gapY=8, perPage=2;
            let photosY = 0;
            for (let i=0; i<photos.length; i++) {
                if (i % perPage === 0) {
                    const y0 = E.newPage();
                    E.bold(11);
                    doc.text('Annexure-I: Photograph of Property'+(i>0?' (Contd.)':''), PW/2, y0+5, { align:'center' });
                    photosY = y0 + 14;
                }
                const slot = i % perPage;
                const iy   = photosY + slot*(imgH+capH+gapY);
                const imgX = ML + (CW-imgW)/2;
                doc.setDrawColor(0,0,0);
                try {
                    const fmt2 = photos[i].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(photos[i].dataUrl, fmt2, imgX, iy, imgW, imgH);
                } catch(e) { doc.setFillColor(240,240,240); doc.rect(imgX, iy, imgW, imgH, 'FD'); }
                doc.setDrawColor(0,0,0); doc.setLineWidth(0.4); doc.rect(imgX, iy, imgW, imgH);
                doc.setLineWidth(0.2);
                const cap = photos[i].caption || photos[i].name.replace(/\.[^/.]+$/,'');
                E.normal(10); doc.text(cap.length>50?cap.slice(0,48)+'…':cap, PW/2, iy+imgH+4.5, { align:'center' });
            }
        }

        // Save
        const filename = 'EBL_LandBuilding_' + (v('reference_no') || v('valuation_ref_no') || 'Report') + '.pdf';
        E.save(filename);
    }
};
