// ═══════════════════════════════════════════════════════════
//  forms/vehicle-valuation/pdf-template.js
//  ► Edit THIS file to change the vehicle valuation PDF layout.
//  ► Uses PDFEngine primitives — never touch core/pdf-engine.js
//    for form-specific changes.
//  Requires: core/pdf-engine.js
// ═══════════════════════════════════════════════════════════
const VehicleValuationPDF = {

    async render(formData, E) {
        const fd = formData || {};
        // Shorthand helpers that close over fd
        const v  = (k, fb='') => E.v(fd, k, fb);
        const tm = (k)        => E.tm(fd, k);
        const bo = (f, opts)  => E.buildOpts(fd, f, opts);
        const dt = (k) => {
            const raw = fd[k];
            if (!raw) return '';
            const d = new Date(raw);
            if (isNaN(d)) return raw;
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        };
        const dts = (k) => {
            const raw = fd[k];
            if (!raw) return '';
            const d = new Date(raw);
            if (isNaN(d)) return raw;
            return d.toLocaleDateString('en-GB'); // gives DD/MM/YYYY
        };

        // Initialise document — returns starting y (MT)
        let y = await E.init('AMK Header.png', 'AKM Footer.png');
        const { doc, PW, ML, CW, CONTENT_BOTTOM } = E;

        // Helper to render section heading with underline 
        const heading = (y, text) => {
            if (y + 8 > CONTENT_BOTTOM) y = E.newPage();
            E.bold(12); doc.text(text, ML, y+5);
            const textWidth = doc.getTextWidth(text);
            doc.setLineWidth(0.3); doc.line(ML, y+6.5, ML+textWidth, y+6.5);
            E.normal(10); return y + 10;
        };

        const numberedList = (y, items) => {
            items.forEach((txt, i) => {
                const prefix = `${i+1}. `;
                const prefixW = doc.getTextWidth(prefix);
                const ls = doc.splitTextToSize(txt, CW - 4 - prefixW);
                if (y + ls.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
                E.normal(10);
                doc.text(prefix, ML+2, y);
                doc.text(ls, ML+2+prefixW, y, { align: 'justify', maxWidth: CW - 4 - prefixW });
                y += ls.length*4 + 0.5;
            });
            return y;
        };

        // ── PAGE 1: COVER ─────────────────────────────────────
        const titleY = 80;
        E.bold(16);
        doc.text('INSPECTION & VALUATION REPORT OF', PW/2, titleY, { align:'center' });
        doc.text('USED/PRE-OWNED VEHICLE', PW/2, titleY+10, { align:'center' });

        // Reference fields — centered block
        let ry = titleY + 50;
        const refLabelW = 52, refColonW = 4;
        const refStartX = (PW - refLabelW - refColonW - 60) / 2;
        [
            ['Reference Account Name', v('reference_account_name')],
            ['File Reference Number',  v('file_reference_number')],
            ['Referred By',            v('referred_by')],
            ['Date of Inspection',     dt('date_of_inspection')]
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
        doc.rect(ML, boxTop, CW/2, boxH, 'FD');
        doc.rect(ML+CW/2, boxTop, CW/2-2, boxH, 'FD');

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

        // ── PAGE 2: COVER LETTER ─────────────────────────────
        y = E.newPage();
        E.normal(10);
        doc.text('Ref.: ' + v('letter_ref'), ML, y); y += 6;
        doc.text('Date: ' + dt('letter_date'), ML, y); y += 9;
        E.bold(10); doc.text(v('recipient_name'), ML, y); y += 6;
        E.normal(10);
        const addrLines2 = doc.splitTextToSize(v('recipient_address'), CW);
        doc.text(addrLines2, ML, y); y += addrLines2.length*5+5;
        E.bold(10); doc.text('Re: Inspection & Valuation Report of used/pre-owned vehicle', ML, y); y += 8;
        E.normal(10); doc.text('Dear Sir,', ML, y); y += 7;
        doc.text('Greetings from AMK Associates Limited and Thank You very much for referring us!', ML, y, { maxWidth:CW }); y += 11;
        const body = 'Pursuant to your communication through ' + v('comm_medium') + ', dated: ' + dt('comm_date') +
            ' by ' + v('comm_person') + ', we, AMK Associates Limited has conducted the inspection and valuation of the referred vehicle, summary of which is as per following:';
        const bodyL = doc.splitTextToSize(body, CW);
        doc.text(bodyL, ML, y); y += bodyL.length*5+7;

        // Price table
        E.italic(10); doc.text('Amount in BDT', ML+CW, y, { align:'right' }); y += 4;
        const col3W = CW/3, hdrH = 16;
        doc.setDrawColor(0,0,0); doc.setFillColor(255,255,255);
        [0,1,2].forEach(i => doc.rect(ML+col3W*i, y, col3W, hdrH, 'FD'));
        E.bold(10);
        doc.text('Maximum Price',        ML+col3W*0.5, y+7, { align:'center' });
        doc.text('Assessed Price',       ML+col3W*1.5, y+7, { align:'center' });
        doc.text('Forced Sale Value on', ML+col3W*2.5, y+4,  { align:'center' });
        doc.text('Assessed Price',       ML+col3W*2.5, y+9,  { align:'center' });
        doc.text('(20% Depreciation)',   ML+col3W*2.5, y+14, { align:'center' });
        y += hdrH;
        doc.setFillColor(255,255,255);
        [0,1,2].forEach(i => doc.rect(ML+col3W*i, y, col3W, 10, 'FD'));
        E.normal(10);
        doc.text(v('max_price','—'),         ML+col3W*0.5, y+6.5, { align:'center' });
        doc.text(v('assessed_price','—'),    ML+col3W*1.5, y+6.5, { align:'center' });
        doc.text(v('forced_sale_value','—'), ML+col3W*2.5, y+6.5, { align:'center' });
        y += 18;

        E.normal(10);
        const c1L = doc.splitTextToSize('As per our understanding, the aforementioned valuation is fair and reasonable and our responsibility is restricted within the physical existence of the used vehicle and the value thereof.', CW);
        doc.text(c1L, ML, y); y += c1L.length*5+6;
        const c2L = doc.splitTextToSize('The report has been prepared based on our physical inspection, verification, necessary documents as provided by concern office/individual, local market analysis and assessment to the best of our knowledge.\n\nFor any query, please feel free to contact us.', CW);
        doc.text(c2L, ML, y); y += c2L.length*5+10;
        doc.text('With best regards,', ML, y); y += 24;
        doc.setDrawColor(0,0,0);
        doc.line(ML, y, ML+50, y); doc.line(ML+100, y, ML+150, y); y += 5;
        E.bold(10);
        doc.text(v('valuer_1_name'), ML, y); doc.text(v('valuer_2_name'), ML+100, y); y += 6;
        E.normal(10);
        doc.text(v('valuer_1_designation'), ML, y); doc.text(v('valuer_2_designation'), ML+100, y); y += 12;

        E.italic(10); doc.text('Encl:', ML, y);
        ['1. Annexure-I   : Detail Report',
         '2. Annexure-II  : Registration Acknowledgement Slip Verification Report',
         '3. Annexure-III : Photograph of Vehicle',
         '4. Annexure-IV  : QR Code for Video of Vehicle'
        ].forEach((l, i) => { doc.text(l, ML+16, y + i*4.5); });

        // ── PAGE 3: VEHICLE & REGISTRATION ───────────────────
        y = E.newPage();
        E.italic(10); doc.text('Annexure-I', ML+CW, y, { align:'right' }); y += 7;
        E.bold(12);
        doc.text('Detail Report', PW/2, y, { align:'center' });
        const drW = doc.getTextWidth('Detail Report');
        doc.setLineWidth(0.2);
        doc.line(PW/2 - drW/2, y + 1.5, PW/2 + drW/2, y + 1.5);
        y += 10;

        E.normal(10);
        y = heading(y, 'Vehicle Details');
        [['Manufacturing Company',v('manufacturer')],['Trim / Package',v('trim_package')],
         ['Vehicle Model',v('vehicle_model')],['Country of Origin',v('country_of_origin')],
         ['Engine Number',v('engine_number')],['Chassis Number',v('chassis_number')],
         ['Manufacturing Year',v('manufacturing_year')],['Cubic Capacity (CC)',v('cubic_capacity')],
         ['Color',v('color')]
        ].forEach(([l,val]) => { y = E.tRow(y,l,val); });
        y = E.checkRow(y, 'Type of Vehicle', bo('vehicle_type', ['Non-Hybrid','Hybrid','Electric']));
        y = E.checkRow(y, 'Fuel Used',       bo('fuel_used',    ['Petrol','Diesel','CNG','Octane','Electric']));
        y+=10;


        y = heading(y, 'Registration Details');
        [['Current Owner Name',v('owner_name')],['Registration Number',v('registration_number')],
         ['Registration ID',v('registration_id')],['Registration Date',dts('registration_date')],
         ['Ownership Transfer Status',v('ownership_transfer')],
         ['Insurance Policy Number & Date',v('insurance_policy')],
         ['Tax Clearance Certificate Number',v('tax_clearance_number')],
         ['Tax Clearance Up To',dts('tax_clearance_date')],
         ['Fitness Certificate Number',v('fitness_cert_number')],
         ['Fitness Validity Up To',dts('fitness_validity')]
        ].forEach(([l,val]) => { y = E.tRow(y,l,val); });
        y = E.checkRow(y, 'Hire Purchase', bo('hire_purchase', ['Yes','No']));

        // ── PAGE 4: INTERIOR INSPECTION ───────────────────────
        y = E.newPage();
        y = heading(y, 'Interior Inspection');
        [['Transmission (Gear)','transmission',['Auto','Manual']],
         ['Ignition (Start)','ignition',['Push','Key']],
         ['Power Window','power_window',['Auto','Manual']],
         ['Power Steering','power_steering',['Auto','Manual']],
         ['Power Side Mirror','power_side_mirror',['Auto','Manual']],
         ['Power Door Locks','power_door_locks',['Yes','No']],
         ['Sound System','sound_system',['Built-in','Modified']],
         ['Wooden Panel','wooden_panel',['Yes','No']],
         ['Leather Interior','leather_interior',['Yes','No']],
         ['Airbag','airbag',['Yes','No']],
         ['Back Camera','back_camera',['Yes','No']],
         ['Ambient Lighting','ambient_lighting',['Built-in','Modified']],
        ].forEach(([lbl,field,opts]) => { y = E.checkRow(y, lbl, bo(field, opts)); });
        y = E.checkRow(y, 'Additional Accessories', bo('interior_accessories_yn', ['Yes','No']));
        const intAcc = fd['interior_accessories_yn'];
        if (intAcc === 'Yes' || (Array.isArray(intAcc) && intAcc.includes('Yes')))
            y = E.tRow(y, 'Accessories Detail', v('interior_accessories'));
        y = E.tRow(y, 'No. of Seats', v('num_seats'));
        y = E.tRow(y, 'Total Mileage (as per Dashboard)', v('total_mileage'));
        y+=10;


        y = heading(y, 'Exterior Inspection');
        [['Body Condition','body_condition',['Good','Fair','Moderate','Poor']],
         ['Engine Condition','engine_condition',['Good','Fair','Moderate','Poor']],
         ['Tires Condition','tires_condition',['Good','Fair','Moderate','Poor']],
         ['Major Defects','major_defects',['Yes','No']],
         ['Chassis Repaired','chassis_repaired',['Yes','No']],
         ['Alloy Rim','alloy_rim',['Built-in','Modified']],
         ['Sun Roof/Moon Roof','sun_roof',['Yes','No']],
         ['Glass','glass',['Original','Repaired']],
         ['Fog Light','fog_light',['Yes','No']],
         ['Dimension','dimension',['Long','Hatchback','Saloon','SUV']],
         ['Paint Condition','paint_condition',['Good','Fair','Moderate','Poor']],
        ].forEach(([lbl,field,opts]) => { y = E.checkRow(y, lbl, bo(field, opts)); });
        y = E.checkRow(y, 'Major Accidental History', bo('accidental_history', ['Yes','No']));
        const acc = fd['accidental_history'];
        if (acc === 'Yes' || (Array.isArray(acc) && acc.includes('Yes')))
            y = E.tRow(y, 'Accidental History Detail', v('accidental_history_detail'));
        y = E.checkRow(y, 'HID Lights', bo('hid_lights', ['Good','Fair','Moderate','Poor']));
        y = E.checkRow(y, 'Additional Accessories', bo('exterior_accessories_yn', ['Yes','No']));
        const extAcc = fd['exterior_accessories_yn'];
        if (extAcc === 'Yes' || (Array.isArray(extAcc) && extAcc.includes('Yes')))
            y = E.tRow(y, 'Accessories Detail', v('exterior_accessories'));

        // ── PAGE 5: ASSESSMENT + DECLARATION ─────────────────
        y = E.newPage();
        y = heading(y, 'Overall Assessment');
        [['Interior Condition','interior_condition',['Good','Average','Poor']],
         ['Exterior Condition','exterior_condition',['Good','Average','Poor']],
         ['Any Known Defects','known_defects',['Yes','No']],
        ].forEach(([lbl,field,opts]) => { y = E.checkRow(y, lbl, bo(field, opts)); });
        const kd = fd['known_defects'];
        if (kd === 'Yes' || (Array.isArray(kd) && kd.includes('Yes')))
            y = E.tRow(y, 'Known Defects Detail', v('known_defects_detail'));

        y += 10; if (y+10 > CONTENT_BOTTOM) y = E.newPage();
        y = heading(y, 'Inspection Particulars');
        [['Date of Inspection', dt('inspection_date')],
         ['Inspection Time', tm('inspection_time')],
         ['Location', v('inspection_location')],
         ['Contact Person Presented', v('contact_person')],
         ['Name of Verification Agent', v('verification_agent')]
        ].forEach(([l,val]) => { y = E.tRow(y,l,val); });

        y += 10; if (y+10 > CONTENT_BOTTOM) y = E.newPage();
        y = heading(y, 'Declaration');y += 5;
        y = numberedList(y, [
            'The valuation has been performed based on our physical inspection, verification, local market analysis and assessment to the best of our knowledge.',
            "AMK's responsibility is limited to the valuation of the said vehicle only without considering any legal matter related to the vehicle and documents.",
            'Except inspection and valuation of the said vehicle, AMK or any of its Officials has no interest directly or indirectly in any manner whatsoever in the subject matter of this report.',
            "In case of Forced Sale Value, the rate is assumed on the basis of the vehicle's demand, price, marketability and other factors.",
            'This report is not intended to absolve the concerned parties from their contractual obligations.'
        ]);

        // ── PAGE 6: ANNEXURE-II — BRTA Registration ─────────────────
        y = E.newPage();
        E.italic(10); doc.text('Annexure-II', ML+CW, y, { align:'right' }); y += 7;
        E.bold(12);
        doc.text('Registration Details Report', PW/2, y, { align:'center' });
        const drW1 = doc.getTextWidth('Registration Details Report');
        doc.setLineWidth(0.3);
        doc.line(PW/2 - drW1/2, y + 1.5, PW/2 + drW1/2, y + 1.5);
        y += 10;
        E.normal(10);

        // ─── TABLE DRAWING HELPERS ───────────────────────────────────
        const FS = 9;
        const COL = CW / 8; // width of one column unit

        // Draw a single cell: x, y, width, height, text, bold, color (optional)
        const PAD_X = 1.5;
        const PAD_W = 3;

        const cell = (cx, cy, w, h, text, bold = false, color = null) => {
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
            doc.setFillColor(255, 255, 255);
            doc.rect(cx, cy, w, h, 'FD');
            if (color) doc.setTextColor(...color);
            doc.setFont('times', bold ? 'bold' : 'normal');
            doc.setFontSize(FS);
            const lines = doc.splitTextToSize(String(text || ''), w - PAD_W);
            const lineH  = 4.5; // height per line in mm
            const textH  = lines.length * lineH;
            const startY = cy + (h - textH) / 2 + lineH * 0.8; // vertically centered
            doc.text(lines, cx + PAD_X, startY);
            doc.setTextColor(0, 0, 0);
        };

        // Row height calculator — finds tallest cell in a row
        const rowH = (pairs, colW) => {
            let max = 8;
            pairs.forEach(([txt, w]) => {
                const lines = doc.splitTextToSize(String(txt || ''), (w || colW) - 3);
                const needed = lines.length * 4.5 + 3;
                if (needed > max) max = needed;
            });
            return max;
        };

        // ─── TABLE 1: REGISTRATION INFO ──────────────────────────────

        // Row 1: Registration Info (4 cols) | Current Authority (1 col) | value (3 cols)
        const r1H = 10;
        cell(ML,           y, COL*4, r1H, 'Registration Info',   true);
        cell(ML + COL*4,   y, COL,   r1H, 'Current Authority',   true);
        cell(ML + COL*5,   y, COL*3, r1H, v('brta_authority'),   false); // red value
        y += r1H;

        // Row 2: 8 equal columns — label|value|label|value|label|value|label|value
        const r2Pairs = [
            ['Registration\nId',  COL], [v('brta_registration_id'),  COL],
            ['Registration\nNo',  COL], [v('brta_registration_no'),  COL],
            ['Previous\nRegistration No',  COL], [v('brta_prev_reg_no'),      COL],
            ['Application\nStatus',COL],[v('brta_app_status'),       COL],
        ];
        const r2H = rowH(r2Pairs.map(([t, w]) => [t, w]), COL);
        let rx2 = ML;
        r2Pairs.forEach(([txt, w], i) => {
            cell(rx2, y, w, r2H, txt, i % 2 === 0); // odd index = label (bold)
            rx2 += w;
        });
        y += r2H;

        // Row 3: Registration Date|val | Hire|val | Ownership Type (label 1col, value 3col)
        const r3Pairs = [
            ['Registration\nDate', COL], [dts('brta_reg_date'), COL],
            ['Hire',               COL], [v('brta_hire'),       COL],
            ['Ownership\nType',    COL], [v('brta_ownership_type'), COL*3],
        ];
        const r3H = rowH(r3Pairs.map(([t, w]) => [t, w]), COL);
        let rx3 = ML;
        r3Pairs.forEach(([txt, w], i) => {
            const isBold = i % 2 === 0; // labels at even index
            cell(rx3, y, w, r3H, txt, isBold);
            rx3 += w;
        });
        y += r3H;

        // Row 4: Hire Purchase|val | Bank Name|val | Bank Address (label 1col, value 3col)
        const r4Pairs = [
            ['Hire\nPurchase', COL], [v('brta_hire_purchase'), COL],
            ['Bank Name',      COL], [v('brta_bank_name'),     COL],
            ['Bank Address',   COL], [v('brta_bank_address'),  COL*3],
        ];
        const r4H = rowH(r4Pairs.map(([t, w]) => [t, w]), COL);
        let rx4 = ML;
        r4Pairs.forEach(([txt, w], i) => {
            cell(rx4, y, w, r4H, txt, i % 2 === 0);
            rx4 += w;
        });
        y += r4H + 4;

        // ─── SHARED HELPERS for Vehicle & Owner tables ───────────
        const rh  = 6;
        const LW2 = 24;
        const C3  = Math.floor(CW / 3), C3r = CW - C3 * 2;

        const row3b = (lw, pairs, minH) => {
            const colWs = [C3, C3, C3r];
            let maxH = minH;
            pairs.forEach(([lbl, val], i) => {
                const vw = colWs[i] - lw;
                const needed = Math.max(
                    doc.splitTextToSize(lbl, lw - 2).length,
                    doc.splitTextToSize(val || '', vw - 2).length
                ) * 4.5 + 3;
                if (needed > maxH) maxH = needed;
            });
            let x = ML;
            pairs.forEach(([lbl, val], i) => {
                cell(x, y, lw, maxH, lbl, true);
                cell(x + lw, y, colWs[i] - lw, maxH, val, false);
                x += colWs[i];
            });
            return maxH;
        };

        // Section header spanning full width
        const sectionHdr = (label) => {
            cell(ML, y, CW, rh, label, true);
        };

        // TABLE 2: Vehicle Info
        sectionHdr('Vehicle Info'); y += rh;
        y += row3b(LW2,[['Chassis No',v('brta_chassis_no')],['Engine No',v('brta_engine_no')],['Manufacture\nYear',v('brta_mfg_year')]],rh);
        y += row3b(LW2,[['Vehicle Class',v('brta_veh_class')],['Vehicle Type',v('brta_veh_type')],['No of Seat',v('brta_num_seats')]],rh);
        y += row3b(LW2,[['Manufacturer',v('brta_manufacturer')],["Maker's\nCountry",v('brta_country')],['Color',v('brta_color')]],rh);
        y += row3b(LW2,[['Horse Power',v('brta_hp')],['RPM',v('brta_rpm')],['CC',v('brta_cc')]],rh);
        y += row3b(LW2,[['Unladen\nWeight',v('brta_unladen_weight')],['Max Weight',v('brta_max_weight')],['No of\nCylinders',v('brta_cylinders')]],rh);
        
        // Last row: Vehicle Model | Mileage | empty | empty
        cell(ML,            y, LW2,       rh, 'Vehicle Model', true);
        cell(ML+LW2,        y, C3-LW2,    rh, v('brta_vehicle_model'), false);
        cell(ML+C3,         y, LW2,       rh, 'Mileage', true);
        cell(ML+C3+LW2,     y, C3-LW2,    rh, v('brta_mileage'), false);
        cell(ML+C3*2,       y, LW2,       rh, '', false);
        cell(ML+C3*2+LW2,   y, C3r-LW2,   rh, '', false);
        y += rh + 4;

        // TABLE 3: Owner Info
        sectionHdr('Owner Info'); y += rh;
        let ownerIdx = 1;
        while (fd['owner_'+ownerIdx+'_name'] || ownerIdx === 1) {
            const oName   = v('owner_'+ownerIdx+'_name');
            const oFather = v('owner_'+ownerIdx+'_father');
            const oAddr   = v('owner_'+ownerIdx+'_address');
            if (!oName && ownerIdx > 1) break;
            y += row3b(22, [["Owner's\nName", oName], ["Father's\nName", oFather], ["Owner's\nAddress", oAddr]], rh);
            ownerIdx++;
            if (y + rh > CONTENT_BOTTOM) y = E.newPage();
        }

        // ── PHOTOS & QR ───────────────────────────────────────
        E.renderPhotos(fd);
        E.renderQR(fd);

        // Save
        // Helper to remove illegal filename characters ( \ / : * ? " < > | )
        const sanitize = (str) => str ? str.replace(/[\\/:\*\?"<>\|]/g, '-') : '';

        const ref = sanitize(v('letter_ref'));
        const account = sanitize(v('reference_account_name'));

        // Combine both with a fallback if both are empty
        const identifier = (ref && account) ? `${ref}_${account}` : (ref || account || 'Report');

        const filename = `INCOMING-${identifier}.pdf`;
        E.save(filename);
    }
};
