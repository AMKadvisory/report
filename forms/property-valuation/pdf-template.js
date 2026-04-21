// ═══════════════════════════════════════════════════════════
//  forms/property-valuation/pdf-template.js
//  ► Edit THIS file to change the property PDF layout.
//  ► Uses PDFEngine (E) primitives only — never touch core/pdf-engine.js.
//
//  FIX: Moved `const { doc, ... } = E` to AFTER `await E.init()`
//  so that `doc` is the live jsPDF instance, not null.
// ═══════════════════════════════════════════════════════════
const PropertyValuationPDF = {

    async render(formData, E, mode) {
        const fd  = formData || {};
        const v   = (k, fb = '') => E.v(fd, k, fb);
        const dt  = (k)          => E.dt(fd, k);

        // ── Number helpers ───────────────────────────────────
        const raw = (k) => parseFloat((fd[k] || '0').toString().replace(/,/g, '')) || 0;
        const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // ════════════════════════════════════════════════════
        //  Init document FIRST — this sets E.doc to a live jsPDF
        //  instance. Destructuring before this call captures null.
        // ════════════════════════════════════════════════════
        let y = await E.init('AMK Header.png', 'AKM Footer.png');

        // Destructure AFTER init so doc is the live jsPDF instance
        const { doc, PW, ML, CW, CONTENT_BOTTOM } = E;

        // ── Local drawing helpers ────────────────────────────

        // Standard label : value row — grey label cell, white value cell
        // lw = label column width (default 60)
        const kvRow = (y, label, val, lw = 60) => {
            const vw   = CW - lw - 4;
            const text = String(val || '');
            const lines = doc.splitTextToSize(text, vw - 2);
            const rh   = Math.max(6, lines.length * 4.5 + 2);
            if (y + rh > CONTENT_BOTTOM) y = E.newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            doc.setFillColor(255,255,255); doc.rect(ML,       y, lw, rh, 'FD');
            doc.setFillColor(255,255,255); doc.rect(ML+lw,    y, 4,  rh, 'FD');
            doc.rect(ML+lw+4, y, vw, rh, 'FD');
            E.bold(10);   doc.text(String(label), ML+1.5,    y+4);
            E.normal(10); doc.text(':', ML+lw+1.2, y+4);
            doc.text(lines[0], ML+lw+5.5, y+4);
            for (let i = 1; i < lines.length; i++) doc.text(lines[i], ML+lw+5.5, y+4+(i*4.5));
            return y + rh;
        };

        // Underlined bold section heading
        const heading = (y, text) => {
            if (y + 8 > CONTENT_BOTTOM) y = E.newPage();
            E.bold(12); doc.text(text, ML, y+5);
            doc.setLineWidth(0.3); doc.line(ML, y+6.5, ML+CW, y+6.5);
            E.normal(10); return y + 11;
        };

        // Table header row — all cells bold centred
        const tblHeader = (y, cols, cws) => {
            if (y + 7 > CONTENT_BOTTOM) y = E.newPage();
            let x = ML;
            E.bold(9); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            cols.forEach((c, i) => {
                doc.rect(x, y, cws[i], 7);
                const ls = doc.splitTextToSize(c, cws[i]-1);
                doc.text(ls, x + cws[i]/2, y + 3.5, { align: 'center' });
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
                const ls = doc.splitTextToSize(String(c||''), cws[i]-1);
                if (i === 0 && firstBold) { E.bold(9); }
                else { E.normal(9); }
                const align  = i === 0 ? 'left' : 'center';
                const textX  = i === 0 ? x + 1.5 : x + cws[i]/2;
                doc.text(ls, textX, y + 4, { align });
                x += cws[i];
            });
            return y + rh;
        };

        // Formula italic sub-header row
        const formulaRow = (y, cells, cws) => {
            if (y + 5 > CONTENT_BOTTOM) y = E.newPage();
            let x = ML;
            E.italic(8); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            cells.forEach((c, i) => {
                doc.rect(x, y, cws[i], 5);
                doc.text(String(c), x + cws[i]/2, y+3.5, { align: 'center' });
                x += cws[i];
            });
            E.normal(10); return y + 5;
        };

        // ════════════════════════════════════════════════════
        //  PAGE 1 — COVER  (Sheet 1)
        // ════════════════════════════════════════════════════

        // Title
        const titleY = 80;
        E.bold(18);
        doc.text('INSPECTION SURVEY & VALUATION REPORT', PW/2, titleY, { align:'center' });

        // Reference fields — centered block
        let ry = titleY + 50;
        const refLabelW = 52, refColonW = 4;
        const refStartX = (PW - refLabelW - refColonW - 60) / 2;
        [
            ['Reference Account Name', v('reference_account_name')],
            ['Reference No.',          v('reference_no')],
            ['W/O Received Date',      dt('wo_received_date')],
            ['Date of Inspection',     dt('date_of_inspection')],
        ].forEach(([lbl, val]) => {
            E.bold(10);
            doc.text(lbl, refStartX, ry);
            doc.text(':', refStartX + refLabelW, ry);
            doc.text(String(val), refStartX + refLabelW + refColonW + 1, ry);
            ry += 6;
        });

        ry += 10; // ← gap between reference and surveyor blocks

        // Surveyor table
        [
            ['Surveyor Name',   v('surveyor_name')],
            ['Designation',     v('surveyor_designation')],
            ['NID Number',      v('surveyor_nid')],
            ['Contact Number',  v('surveyor_contact')],
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

        // Draw outer rectangle spanning both boxes (single shared border)
        doc.rect(ML, boxTop, CW, boxH, 'FD');

        // Draw only the vertical divider line in the middle
        const midX = ML + CW/2;
        doc.line(midX, boxTop, midX, boxTop + boxH);

        let by = boxTop + 6;
        E.bold(10);  doc.text('Submitted by:', ML+3, by); by += 6;
        E.bold(10);  doc.text('AMK Associates Limited', ML+3, by); by += 5.5;
        E.normal(10);
        doc.text('68, Khilgaon Chowdhury Para (4th floor)', ML+3, by); by += 5;
        doc.text('DIT Road Rampura, Dhaka-1219', ML+3, by); by += 5;
        doc.text('E-mail: www.amkassociatesbd@gmail.com', ML+3, by); by += 5;
        doc.text('Web: www.amkassociatesbd.com', ML+3, by); by += 5;
        doc.text('Contact: 01841132714', ML+3, by);

        const rx = midX + 3;
        let ty = boxTop + 6;
        E.bold(10); doc.text('Submitted to:', rx, ty); ty += 6;
        rNameLines.forEach(l => { E.bold(10); doc.text(l, rx, ty); ty += 5.5; });
        E.normal(10); addrL.forEach(l => { doc.text(l, rx, ty); ty += 5; });


        // ════════════════════════════════════════════════════
        //  PAGE 2 — COVER LETTER  (Sheet 2)
        // ════════════════════════════════════════════════════
        y = E.newPage();
        E.normal(10);
        doc.text('Ref.: ' + v('letter_ref'),  ML, y); y += 6;
        doc.text('Date: ' + dt('letter_date'), ML, y); y += 9;

        E.bold(10);   doc.text(v('recipient_name'), ML, y); y += 5;
        E.normal(10);
        const addrL2 = doc.splitTextToSize(v('recipient_address'), CW);
        doc.text(addrL2, ML, y); y += addrL2.length * 4.5 + 5;

        E.bold(10);
        const subjectLine = 'Subject: Inspection, Survey & Valuation Report on ' + v('letter_subject');
        const subjectLines = doc.splitTextToSize(subjectLine, CW);
        doc.text(subjectLines, ML, y); y += subjectLines.length * 5 + 3;
        doc.text('Ref. A/C Name: ' + v('reference_account_name'), ML, y); y += 8;

        E.normal(10);
        doc.text('Dear Sir,', ML, y); y += 6;
        doc.text('Greetings from AMK Associates Limited and Thank You very much for referring us!', ML, y, { maxWidth: CW }); y += 8;
        const bodyStr = 'Pursuant to your communication through ' + v('comm_medium') +
            ', dated: ' + dt('comm_date') + ' by ' + v('comm_person') +
            ', we, AMK Associates Limited ("AMK") has conducted the inspection, survey and valuation.' +
            ' Summary of the valuation is as below:';
        const bodyLines = doc.splitTextToSize(bodyStr, CW);
        doc.text(bodyLines, ML, y); y += bodyLines.length * 4.5 + 5;

        // ── Valuation table ──────────────────────────────────
        const mArea  = raw('market_land_area');
        const mRate  = raw('market_rate');
        const mBuild = raw('market_build_val');
        const mLand  = mArea * mRate;
        const mTotal = mLand + mBuild;

        const fArea  = mArea;
        const fRate  = mRate  * 0.8;
        const fLand  = mLand  * 0.8;
        const fBuild = mBuild * 0.8;
        const fTotal = mTotal * 0.8;

        const zArea  = raw('mouza_land_area');
        const zRate  = raw('mouza_rate');
        const zBuild = raw('mouza_build_val');
        const zLand  = zArea * zRate;
        const zTotal = zLand + zBuild;

        const vCws = [42, 26, 30, 26, 28, 26];

        E.italic(9); doc.text('Amount in BDT', ML+CW, y, { align: 'right' }); y += 4;
        y = tblHeader(y,
            ['Description', 'Total Land Area\n(Decimal)', 'Present Rate per\nDecimal (BDT)',
             'Land Value\n(BDT)', 'Building Value\n(BDT)', 'Total Value\n(BDT)'],
            vCws);
        y = formulaRow(y, ['', 'a', 'b', 'c=a×b', 'd', 'e=c+d'], vCws);
        y = tblRow(y, ['Present Market Value', mArea || '', fmt(mRate), fmt(mLand), fmt(mBuild), fmt(mTotal)], vCws, true);
        y = tblRow(y, ['Forced Sale Value (20% less)', fArea||'', fmt(fRate), fmt(fLand), fmt(fBuild), fmt(fTotal)], vCws, true);
        y = tblRow(y, ['Mouza Value', zArea||'', fmt(zRate), fmt(zLand), fmt(zBuild), fmt(zTotal)], vCws, true);
        y += 5;

        E.normal(10);
        const p1 = doc.splitTextToSize('The report has been prepared based on our physical inspection, verification, necessary documents as provided by concern office/individual, local market analysis and assessment to the best of our knowledge.', CW);
        doc.text(p1, ML, y); y += p1.length * 4.5 + 4;
        doc.text('Detail Report and necessary attachments are enclosed herewith for your record and perusal.', ML, y, { maxWidth: CW }); y += 6;
        doc.text('For any query, please feel free to contact us.', ML, y); y += 5;
        doc.text('With best regards,', ML, y); y += 18;

        // Signature lines
        doc.setLineWidth(0.3);
        doc.line(ML, y, ML+74, y);
        doc.line(ML+104, y, ML+178, y);
        y += 4;
        E.bold(10);
        doc.text(v('valuer_1_name'), ML,     y);
        doc.text(v('valuer_2_name'), ML+104, y);
        y += 5;
        E.normal(10);
        doc.text(v('valuer_1_designation'), ML,     y);
        doc.text(v('valuer_2_designation'), ML+104, y);
        y += 8;

        // Enclosures
        const encl = [
            ['1. Annexure-I: Photograph of Property',    '5. Annexure-V: QR Code for video'],
            ['2. Annexure-II: Hand Sketch Map',          '6. Annexure-VI: QR Code for Map'],
            ['3. Annexure-III: Mouza Map',               '7. Annexure-VII: SRO Mouza Value'],
            ['4. Annexure-IV: Location on Google Map',   '8. Annexure-VIII: Status In Area Master Plan'],
        ];
        E.bold(10); doc.text('Encl:', ML, y); y += 5;
        E.normal(9);
        encl.forEach(([left, right]) => {
            doc.text(left,  ML,          y);
            doc.text(right, ML + CW/2,   y);
            y += 4.5;
        });

        // ════════════════════════════════════════════════════
        //  PAGE 3 — SUMMARY  (Sheet 3)
        // ════════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'Summary of the Valuation Report');

        [
            ['File Receiving Date',     dt('file_receiving_date')],
            ['Valuation Ref No.',        v('valuation_ref_no')],
            ['Valuation Date',           dt('valuation_date')],
            ['Property Location',        v('property_location')],
            ['Valuation Conducted By',   v('valuation_conducted_by') || 'AMK Associates Limited'],
        ].forEach(([lbl, val]) => { y = kvRow(y, lbl, val); });

        y += 3;
        [
            ['Surveyor Name',   v('surveyor_name')],
            ['Designation',     v('surveyor_designation')],
            ['NID Number',      v('surveyor_nid')],
            ['Contact Number',  v('surveyor_contact')],
        ].forEach(([lbl, val]) => { y = kvRow(y, lbl, val); });

        y += 3;
        [
            ['Type of Property',        v('property_type')],
            ['Type of Property Seller', v('property_seller_type')],
            ['Current Market Value',    'BDT ' + fmt(mTotal)],
            ['Forced Sale Value',        'BDT ' + fmt(fTotal)],
            ['Deviation (Plinth)',       v('deviation_plinth') + (v('deviation_plinth') ? '%' : '')],
            ['Deviation (Floor)',        v('deviation_floor')],
        ].forEach(([lbl, val]) => { y = kvRow(y, lbl, val); });

        // ════════════════════════════════════════════════════
        //  PAGE 4 — SECTIONS A & B  (Sheet 4)
        // ════════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'A. Particulars of Account:');
        [
            ['A/C Name',              v('ac_name')],
            ['Office/Business Address', v('office_address')],
            ['Factory Address',       v('factory_address')],
            ['Nature of Business',    v('nature_of_business')],
            ['Age of Business',       v('age_of_business')],
            ['Organization Type',     v('organization_type')],
            ['Contact Person Name',   v('contact_person_name')],
            ['Mobile Number',         v('mobile_number')],
        ].forEach(([lbl, val]) => { y = kvRow(y, lbl, val); });

        y += 4;
        y = heading(y, 'B. Particulars of Property Owner:');
        [
            ["Property Owner(s) Name",   v('owner_name')],
            ["Father's Name",             v('owner_father')],
            ["Mother's Name",             v('owner_mother')],
            ['Present Address',           v('owner_present_address')],
            ['Permanent Address',         v('owner_perm_address')],
            ['Contact Number',            v('owner_contact')],
            ['NID Number',                v('owner_nid')],
            ['Relationship with Borrower',v('owner_relationship')],
        ].forEach(([lbl, val]) => { y = kvRow(y, lbl, val); });

        // ════════════════════════════════════════════════════
        //  PAGE 5 — SECTIONS C & D  (Sheet 5)
        // ════════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'C. Schedule of Property:');
        [
            ['District',               v('district')],
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
            ['Total Area (Deed)',      v('total_area_deed')],
            ['Total Area (Physical)',  v('total_area_physical')],
            ['Way to Visit Property',  v('way_to_visit')],
        ].forEach(([lbl, val]) => { y = kvRow(y, lbl, val, 55); });

        y += 4;
        y = heading(y, 'D. Property Identification:');

        const dCws = [18, 40, 40, 40, 40];
        y = tblHeader(y, ['Direction','Chowhoddi as Per Deed','Present Chowhoddi','Demarcation','Access Road'], dCws);

        ['north','south','east','west'].forEach(dir => {
            const cells = [
                dir.charAt(0).toUpperCase() + dir.slice(1),
                v(dir+'_deed'), v(dir+'_present'), v(dir+'_demar'), v(dir+'_road')
            ];
            y = tblRow(y, cells, dCws, true);
        });

        // ════════════════════════════════════════════════════
        //  PAGE 6 — SECTION E  (Sheet 6)
        // ════════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'E. Other Features of Property:');
        [
            ['Electricity',                   v('electricity')],
            ['GAS',                           v('gas')],
            ['Water Supply',                  v('water_supply')],
            ['Sewerage System',               v('sewerage')],
            ['Internet',                      v('internet')],
            ['Satellite / Google Location',   v('satellite_location')],
            ['Status of Access Road',         v('access_road_status')],
            ['Nature of Land',                v('nature_of_land')],
            ['Type of Land',                  v('type_of_land')],
            ['Plot Location',                 v('plot_location')],
            ['Description of Property',       v('description_of_property')],
            ['Usage Restriction',             v('usage_restriction')],
            ['Flood Possibility',             v('flood_possibility')],
            ['Classification of Land',        v('land_classification')],
            ['Status in Master Plan',         v('status_master_plan')],
            ['Current Possession',            v('current_possession')],
            ['Public Establishments Nearby',  v('public_establishments')],
            ['Distance to Prominent Location',v('dist_prominent')],
            ['Distance to Main Road',         v('dist_main_road')],
            ['Distance to Branch/Office',     v('dist_branch_office')],
            ['Annual Income from Property',   v('annual_income')],
            ['Present Use of Property',       v('present_use')],
            ['Future Prospect',               v('future_prospect')],
        ].forEach(([lbl, val]) => { y = kvRow(y, lbl, val, 62); });

        // ════════════════════════════════════════════════════
        //  PAGE 7 — SECTION F  (Sheet 7)
        // ════════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'F. Civil Construction of Property:');
        const ageStr = v('age_of_structure');
        [
            ['Structure Type',            v('structure_type')],
            ['Foundation Type',           v('foundation_type')],
            ['Number of Stories',
                'As per Plan: ' + v('stories_plan') + ' Storied   /   As per Physical: ' + v('stories_physical') + ' Storied'],
            ['Approval Authority',        v('approval_authority')],
            ['Plan No. & Date',           'Sarok No: ' + v('plan_no') + '   Date: ' + dt('plan_date')],
            ['Occupancy Category',        v('occupancy_category')],
            ['Age of Structure',          ageStr ? ageStr + ' Years' : ''],
            ['Shape of Building',         v('shape_of_building')],
            ['Project Name',              v('project_name')],
            ["Developer's Name",          v('developer_name')],
            ["Owner's Name in Plan",      v('owner_name_plan')],
            ['Security Guards',           v('security_guards')],
            ['Commercial',                v('commercial')],
            ['Garden Area / Play Zone',   v('garden_area')],
            ['Generator Facilities',      v('generator')],
            ['Lift Facilities',           v('lift')],
            ['CCTV',                      v('cctv')],
            ['Fire Fighting & Emergency', v('fire_fighting')],
            ['Front Face of Structure',   v('front_face')],
        ].forEach(([lbl, val]) => { y = kvRow(y, lbl, val, 62); });

        // ════════════════════════════════════════════════════
        //  PAGE 8 — FLOOR TABLES  (Sheet 8)
        // ════════════════════════════════════════════════════
        y = E.newPage();

        const aCws = [32, 37, 37, 36, 36];
        y = tblHeader(y,
            ['Floor', 'Area as per Plan\n(Sft.)', 'Area as per Physical\n(Sft.)', 'Deviation\n(Sft.)', 'Deviation\n(%)'],
            aCws);

        const areaRows = Array.isArray(fd._floor_area_rows) && fd._floor_area_rows.length
            ? fd._floor_area_rows
            : [{ floor: 'Ground Floor', area_plan: '', area_phys: '', dev_sft: '', dev_pct: '' }];

        areaRows.forEach(r => {
            y = tblRow(y, [r.floor||'', r.area_plan||'', r.area_phys||'', r.dev_sft||'', r.dev_pct||''], aCws);
        });
        y += 5;

        const uCws = [22, 18, 18, 16, 18, 16, 18, 18, 14];
        y = tblHeader(y,
            ['Floor','Unit/Floor\n(Plan)','Unit/Floor\n(Phys)','Rooms','Bathrooms','Balcony','Drawing\nRoom','Dining\nRoom','Drawing\nCum Dining'],
            uCws);

        const unitRows = Array.isArray(fd._floor_unit_rows) && fd._floor_unit_rows.length
            ? fd._floor_unit_rows
            : [{ floor:'Ground Floor', unit_plan:'', unit_phys:'', rooms:'', bathrooms:'', balcony:'', drawing:'', dining:'', drawing_dining:'' }];

        unitRows.forEach(r => {
            y = tblRow(y,
                [r.floor||'', r.unit_plan||'', r.unit_phys||'', r.rooms||'',
                 r.bathrooms||'', r.balcony||'', r.drawing||'', r.dining||'', r.drawing_dining||''],
                uCws);
        });

        // ════════════════════════════════════════════════════
        //  PAGE 9 — SECTIONS G & H  (Sheet 9)
        // ════════════════════════════════════════════════════
        y = E.newPage();

        y = heading(y, 'G. Setback Comparison:');
        const gCws = [30, 50, 50, 48];
        y = tblHeader(y, ['Direction','As Per Approved Plan (Ft.)','As Per Physical (Ft.)','Deviation (Ft.)'], gCws);
        y = formulaRow(y, ['', 'a', 'b', 'c = b − a'], gCws);

        const sbDirs = [
            ['North',     'setback_north'],
            ['South',     'setback_south'],
            ['East',      'setback_east'],
            ['West',      'setback_west'],
            ['Road (N/S)','setback_ns'],
            ['Road (E/W)','setback_ew'],
        ];
        sbDirs.forEach(([label, key]) => {
            const plan = parseFloat(fd[key+'_plan'] || 0) || 0;
            const phys = parseFloat(fd[key+'_phys'] || 0) || 0;
            const dev  = plan || phys ? (phys - plan).toFixed(2) : '';
            y = tblRow(y, [label, plan||'', phys||'', dev], gCws);
        });
        y += 5;

        y = heading(y, 'H. Construction Percentage:');
        const hCws = [20,14,14,14,13,16,16,14,14,14,13,16];
        y = tblHeader(y,
            ['Floor','Structure','Brick','Wood','Metal','Plumbing\n& Sanitary',
             'Electrical','Plaster','General\nFloor','Aluminium','Paint','Work\nCompletion %'],
            hCws);

        const compRows = Array.isArray(fd._completion_rows) && fd._completion_rows.length
            ? fd._completion_rows
            : [{ floor:'Ground', structure:'',brick:'',wood:'',metal:'',plumbing:'',
                 electrical:'',plaster:'',gen_floor:'',aluminium:'',paint:'',work_pct:'' }];

        compRows.forEach(r => {
            y = tblRow(y,
                [r.floor||'', r.structure||'', r.brick||'', r.wood||'', r.metal||'',
                 r.plumbing||'', r.electrical||'', r.plaster||'', r.gen_floor||'',
                 r.aluminium||'', r.paint||'', r.work_pct||''],
                hCws);
        });

        // ════════════════════════════════════════════════════
        //  PAGE 10 — SECTION I  (Sheet 10)
        // ════════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'I. Floor-wise Building Value:');

        const iCws = [20, 18, 18, 22, 20, 20, 18, 22, 20];
        y = tblHeader(y,
            ['Floor', 'Area Plan\n(Sft.)', 'Area Phys.\n(Sft.)', 'Cost/Sft\n(BDT)',
             'Est. Value Plan\n(BDT)', 'Est. Value Phys.\n(BDT)',
             'Work %', 'Present Value\nPlan (BDT)', 'Present Value\nPhys. (BDT)'],
            iCws);
        y = formulaRow(y, ['', 'a', 'b', 'c', 'd=a×c', 'e=b×c', 'f', 'g=d×f', 'h=e×f'], iCws);

        const costRows = Array.isArray(fd._cost_rows) && fd._cost_rows.length
            ? fd._cost_rows
            : [{ floor:'Foundation' }, { floor:'Ground Fl.' }];

        let totD=0, totE=0, totG=0, totH=0;
        costRows.forEach(r => {
            const a = parseFloat(r.area_plan  || 0);
            const b = parseFloat(r.area_phys  || 0);
            const c = parseFloat((r.cost_per_sft||'0').replace(/,/g,''));
            const f = (parseFloat(r.work_pct  || 0)) / 100;
            const d = a*c, e = b*c, g = d*f, h = e*f;
            totD += d; totE += e; totG += g; totH += h;
            y = tblRow(y,
                [r.floor||'', a?fmt(a):'', b?fmt(b):'', c?fmt(c):'',
                 d?fmt(d):'', e?fmt(e):'', r.work_pct||'', g?fmt(g):'', h?fmt(h):''],
                iCws);
        });

        E.bold(9);
        y = tblRow(y,
            ['Total Value of Building\u00B9', '', '', '', fmt(totD), fmt(totE), '', fmt(totG), fmt(totH)],
            iCws, true);

        const age    = parseFloat(v('age_of_structure') || v('age_of_structure_i') || '0');
        const depPct = age ? Math.round((100/70) * age) : 0;
        const depG   = totG * depPct / 100;
        const depH   = totH * depPct / 100;
        y = tblRow(y,
            ['Depreciation\u00B2 @ ' + depPct + '%', '', '', '', '', '', '', fmt(depG), fmt(depH)],
            iCws, true);

        y = tblRow(y,
            ['Net Value of the Building', '', '', '', '', '', '', fmt(totG-depG), fmt(totH-depH)],
            iCws, true);
        E.normal(10);
        y += 5;

        E.normal(9);
        doc.text('*Note:', ML, y); y += 5;
        ['1. Building value has been considered based on Approved Plan and construction cost as per current market standards.',
         '2. Average life of concrete structure has been considered as 70 Years.',
        ].forEach(note => {
            const ls = doc.splitTextToSize(note, CW-6);
            if (y + ls.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
            doc.text(ls, ML+4, y); y += ls.length*4.5+2;
        });
        y += 3;

        if (age) {
            const depExact = ((100/70)*age).toFixed(2);
            const depLine = `As this structure is ${age}-year-old, thus the Depreciation is considered as (100/70) × ${age} = ${depExact} \u2245 ${depPct}%.`;
            const depLines = doc.splitTextToSize(depLine, CW);
            if (y + depLines.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
            E.normal(10); doc.text(depLines, ML, y); y += depLines.length*4.5+5;
        }

        const pj = v('price_justification');
        if (pj) {
            y += 3;
            y = heading(y, 'Price Justification:');
            const pjL = doc.splitTextToSize(pj, CW);
            if (y + pjL.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
            E.normal(10); doc.text(pjL, ML, y);
        }

        // ════════════════════════════════════════════════════
        //  ANNEXURE-I — PHOTO SHEETS
        // ════════════════════════════════════════════════════
        const photos = Array.isArray(fd._photos) && fd._photos.length ? fd._photos : [];
        if (photos.length) {
            const imgW=158, imgH=102, capH=6, gapY=8, perPage=2;
            let photosY = 0;
            for (let i=0; i<photos.length; i++) {
                if (i % perPage === 0) {
                    const y0 = E.newPage();
                    E.bold(11);
                    doc.text('Annexure-I: Photograph of Property' + (i>0 ? ' (Contd.)' : ''),
                        PW/2, y0+5, { align: 'center' });
                    photosY = y0 + 14;
                }
                const slot = i % perPage;
                const iy   = photosY + slot*(imgH+capH+gapY);
                const imgX = ML + (CW-imgW)/2;
                doc.setDrawColor(0,0,0);
                try {
                    const fmt2 = photos[i].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(photos[i].dataUrl, fmt2, imgX, iy, imgW, imgH);
                } catch(e) {
                    doc.setFillColor(255,255,255); doc.rect(imgX, iy, imgW, imgH, 'FD');
                }
                doc.setDrawColor(0,0,0); doc.setLineWidth(0.4);
                doc.rect(imgX, iy, imgW, imgH);
                doc.setLineWidth(0.2);
                const cap = photos[i].caption || photos[i].name.replace(/\.[^/.]+$/,'');
                const nm  = cap.length > 50 ? cap.slice(0,48)+'…' : cap;
                E.normal(10); doc.text(nm, PW/2, iy+imgH+4.5, { align:'center' });
            }
        }

       // Save or Preview PDF
        const filename = 'PropertyValuation_'+(v('reference_no')||v('valuation_ref_no')||'Report')+'.pdf';
        if (mode === 'preview') return E.doc.output('bloburl');
        else E.save(filename);
    }
};
