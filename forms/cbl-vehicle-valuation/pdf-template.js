// ═══════════════════════════════════════════════════════════
//  forms/cbl-vehicle-valuation/pdf-template.js
//  ► CBL (City Bank PLC) Vehicle Valuation PDF
//  ► Differences from BBPLC (vehicle-valuation):
//      PAGE 1: Cover — A/C Title, vehicle image, key info table,
//              present market value table, report submission date
//      PAGE 2: Cover Letter — Bank Ref + Our Ref, comm_date only,
//              no price highlight box, different body text
//      PAGE 5: Assessment + Price Justification table + Declaration
//              (6 points, 13 pages)
//  ► All other pages identical to VehicleValuationPDF
//  Requires: core/pdf-engine.js
// ═══════════════════════════════════════════════════════════
const CBLVehicleValuationPDF = {

    async render(formData, E) {
        const fd = formData || {};
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

        // Format a plain-digit string with international commas (1,000,000)
        const fmtNum = (k) => {
            const raw = (fd[k] || '').toString().replace(/[^\d]/g, '');
            if (!raw) return '';
            return parseInt(raw, 10).toLocaleString('en-US');
        };

        // FIX #4: 'AKM Footer.png' was a typo — corrected to 'AMK Footer.png'
        let y = await E.init('AMK Header.png', 'AMK Footer.png');
        const { doc, PW, ML, CW, CONTENT_BOTTOM } = E;

        // ── Local helpers ────────────────────────────────────
        const heading = (y, text) => {
            if (y + 8 > CONTENT_BOTTOM) y = E.newPage();
            doc.setTextColor(0,0,0);
            doc.setFillColor(255,255,255);
            E.bold(12); doc.text(text, ML, y+5);
            const tw = doc.getTextWidth(text);
            doc.setLineWidth(0.3);
            doc.line(ML, y+6.5, ML+tw, y+6.5);
            E.normal(10); return y + 11;
        };

        const numberedList = (y, items) => {
            items.forEach((txt, i) => {
                const prefix  = `${i+1}. `;
                const prefixW = doc.getTextWidth(prefix);
                const ls = doc.splitTextToSize(txt, CW - 4 - prefixW);
                if (y + ls.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
                E.normal(10);
                doc.text(prefix, ML+2, y);
                doc.text(ls, ML+2+prefixW, y, { align:'justify', maxWidth: CW - 4 - prefixW });
                y += ls.length*4 + 0.5;
            });
            return y;
        };

        // ══════════════════════════════════════════════════════
        //  PAGE 1 – COVER
        //  Layout: Title → Vehicle Image → Key Info Table →
        //          Present Market Value Table → Submission Date
        // ══════════════════════════════════════════════════════

        y += 6;
        // Title
        E.bold(16);
        doc.text('Inspection & Valuation Report of Used/Pre-Owned Vehicle', PW/2, y, { align:'center' });
        y += 12;

        // A/C Title line
        E.bold(12);
        doc.text('A/C Title: ' + v('ac_title'), PW/2, y, { align:'center' });
        y += 10;

        // Vehicle cover image — 4 inch × 6.23 inch = 101.6mm × 158.24mm
        const coverImg = fd._cover_image;
        const cvW = 158, cvH = 102; // 4"×6.23" in mm
        const cvX = ML + (CW - cvW) / 2;
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
        if (coverImg && coverImg.dataUrl) {
            try {
                const fmt2 = coverImg.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(coverImg.dataUrl, fmt2, cvX, y, cvW, cvH);
            } catch(e) {
                doc.setFillColor(240,240,240);
                doc.rect(cvX, y, cvW, cvH, 'FD');
            }
        } else {
            doc.setFillColor(240,240,240);
            doc.rect(cvX, y, cvW, cvH, 'FD');
        }
        doc.rect(cvX, y, cvW, cvH);
        y += cvH + 12;

        // Key Information of the Vehicle table
        E.bold(10);
        doc.text('Key Information of the Vehicle:', ML, y); y += 8;
 
        // Centered table: label col 55mm, value col 90mm, total 145mm
        const kiTotalW = 110;
        const kiLabelW = 55;
        const kiValueW = kiTotalW - kiLabelW;
        const kiX = ML + (CW - kiTotalW) / 2;
        const kiRows = [
            ["Vehicle's Brand",   v('vehicle_brand')  || v('manufacturer')],
            ['Manufacturing Year', v('cover_manufacturing_year') || v('manufacturing_year')],
            ['Chassis No.',        v('cover_chassis_number')     || v('chassis_number')],
            ['Engine No.',         v('cover_engine_number')      || v('engine_number')],
        ];
 
        doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
        kiRows.forEach(([label, val]) => {
            const rh = 7;
            if (y + rh > CONTENT_BOTTOM) y = E.newPage();
            doc.setFillColor(255,255,255);
            doc.rect(kiX,            y, kiLabelW, rh, 'FD');
            doc.rect(kiX + kiLabelW, y, kiValueW, rh, 'FD');
            E.normal(10);
            doc.setTextColor(0,0,0);
            doc.text(String(label),   kiX + 2,            y + 4.8);
            doc.text(String(val||''), kiX + kiLabelW + 2, y + 4.8);
            y += rh;
        });
        y += 6;

        // Present Market Value table
        E.bold(10);
        doc.text('Present Market Value:', ML, y); y += 8;

        const pmvCws = [60, 60, CW - 120];
        const pmvHeaders = ['Vehicle Purchaser\'s Name', 'Vehicle Registration No.', 'Assessed Price (BDT)'];

        // Header row
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
        E.bold(9);
        let hx = ML;
        pmvHeaders.forEach((h, i) => {
            doc.rect(hx, y, pmvCws[i], 7);
            const ls = doc.splitTextToSize(h, pmvCws[i]-2);
            doc.text(ls, hx + pmvCws[i]/2, y+4, { align:'center' });
            hx += pmvCws[i];
        });
        y += 7;

        // Data row — assessed_price formatted with commas
        E.normal(9);
        const pmvData = [
            v('purchaser_name'),
            v('cover_registration_number') || v('registration_number'),
            fmtNum('assessed_price'),
        ];
        let dx2 = ML;
        pmvData.forEach((val, i) => {
            doc.rect(dx2, y, pmvCws[i], 7);
            doc.text(String(val||''), dx2 + pmvCws[i]/2, y+4.5, { align:'center' });
            dx2 += pmvCws[i];
        });
        y += 7 + 13;

        // Report Submission Date — centered bold
        E.bold(11);
        const submDate = dt('report_submission_date');
        doc.text('Report Submission Date: ' + submDate, PW/2, y, { align:'center' });

        // ══════════════════════════════════════════════════════
        //  PAGE 2 – COVER LETTER
        // ══════════════════════════════════════════════════════
        y = E.newPage();
        E.normal(10);

        y+= 6;
        // Bank Ref + Our Ref + Date block
        doc.text('Bank Ref. No.: ' + v('bank_ref'), ML, y); y += 5;
        doc.text('Our Ref.: ' + v('letter_ref'),    ML, y); y += 5;
        doc.text('Date: ' + dt('comm_date'),         ML, y); y += 9;

        // Recipient
        E.bold(10); doc.text(v('recipient_name'), ML, y); y += 5;
        E.normal(10);
        const addrLines2 = doc.splitTextToSize(v('recipient_address'), CW);
        doc.text(addrLines2, ML, y); y += addrLines2.length*4.5 + 5;

        // Subject
        E.bold(10);
        doc.text('Re: Inspection & Valuation Report of used/pre-owned vehicle', ML, y); y += 8;

        E.normal(10);
        doc.text('Dear Sir,', ML, y); y += 6;
        doc.text('Greetings from AMK Associates Limited and Thank You very much for referring us!', ML, y, { maxWidth:CW }); y += 8;

        // Body paragraph — uses comm_date only (no comm_medium / comm_person for CBL)
        const bodyStr = 'Pursuant to your communication through email, dated: ' + dt('comm_date') +
            ', we, AMK Associates Limited (\'AMK\') has conducted the inspection and valuation of the referred vehicle.';
        const bodyL = doc.splitTextToSize(bodyStr, CW);
        doc.text(bodyL, ML, y); y += bodyL.length*4.5 + 6;

        // Valuation assessment paragraph
        const para1 = 'As per our understanding, the aforementioned valuation is fair and reasonable and our responsibility is restricted within the physical existence of the used vehicle and the value thereof.';
        const para1L = doc.splitTextToSize(para1, CW);
        doc.text(para1L, ML, y); y += para1L.length*4.5 + 5;

        // Report preparation paragraph
        const para2 = 'The report has been prepared based on our physical inspection, verification, necessary documents as provided by concern office/individual, local market analysis and assessment to the best of our knowledge.';
        const para2L = doc.splitTextToSize(para2, CW);
        doc.text(para2L, ML, y); y += para2L.length*4.5 + 5;

        doc.text('For any query, please feel free to contact us.', ML, y); y += 6;
        doc.text('With best regards,', ML, y); y += 18;

        // Signatures
        doc.setDrawColor(0,0,0);
        doc.line(ML, y, ML+50, y);
        doc.line(ML+100, y, ML+150, y); 
        y += 5;

        E.bold(10);
        doc.text(v('valuer_1_name'), ML, y); 
        doc.text(v('valuer_2_name'), ML+100, y); 
        y += 6;
        E.normal(10);
        doc.text(v('valuer_1_designation'), ML, y); 
        doc.text(v('valuer_2_designation'), ML+100, y); 
        y += 12;

        // FIX #9: Added page overflow guard before rendering enclosures list
        const enclosures = [
            '1. Annexure-I   : Detail Report',
            '2. Annexure-II  : Registration Acknowledgement Slip Verification Report',
            '3. Annexure-III : Photograph of Vehicle',
            '4. Annexure-IV  : QR Code for Video of Vehicle',
        ];
        const enclosureBlockH = enclosures.length * 4.5 + 8; // approx height
        if (y + enclosureBlockH > CONTENT_BOTTOM) y = E.newPage();

        E.italic(10); doc.text('Encl:', ML, y);
        enclosures.forEach((l, i) => { doc.text(l, ML+16, y + i*4.5); });

        // ══════════════════════════════════════════════════════
        //  PAGE 3 – VEHICLE & REGISTRATION (same as BBPLC)
        // ══════════════════════════════════════════════════════
        y = E.newPage();
        E.italic(10); doc.text('Annexure-I', ML+CW, y, { align:'right' }); y += 7;
        E.bold(12);
        doc.text('Detail Report', PW/2, y, { align:'center' });
        const drW = doc.getTextWidth('Detail Report');
        doc.setLineWidth(0.3);
        doc.line(PW/2 - drW/2, y+1.5, PW/2 + drW/2, y+1.5);
        y += 10;
        E.normal(10);

        y = heading(y, 'Vehicle Details');
        [['Manufacturing Company', v('manufacturer')],
         ['Trim / Package',        v('trim_package')],
         ['Vehicle Model',         v('vehicle_model')],
         ['Country of Origin',     v('country_of_origin')],
         ['Engine Number',         v('engine_number')],
         ['Chassis Number',        v('chassis_number')],
         ['Manufacturing Year',    v('manufacturing_year')],
         ['Cubic Capacity (CC)',   v('cubic_capacity')],
         ['Color',                 v('color')],
        ].forEach(([l,val]) => { y = E.tRow(y,l,val); });
        y = E.checkRow(y, 'Type of Vehicle', bo('vehicle_type', ['Non-Hybrid','Hybrid','Electric']));
        y = E.checkRow(y, 'Fuel Used',       bo('fuel_used',    ['Petrol','Diesel','CNG','Octane','Electric']));
        y += 10;

        y = heading(y, 'Registration Details');
        [['Current Owner Name',                 v('owner_name')],
         ['Registration Number',                v('registration_number')],
         ['Registration ID',                    v('registration_id')],
         ['Registration Date',                  dts('registration_date')],
         ['Ownership Transfer Status',           v('ownership_transfer')],
         ['Insurance Policy Number & Date',      v('insurance_policy')],
         ['Tax Clearance Certificate Number',    v('tax_clearance_number')],
         ['Tax Clearance Up To',                 dts('tax_clearance_date')],
         ['Fitness Certificate Number',          v('fitness_cert_number')],
         ['Fitness Validity Up To',              dts('fitness_validity')],
        ].forEach(([l,val]) => { y = E.tRow(y,l,val); });
        y = E.checkRow(y, 'Hire Purchase', bo('hire_purchase', ['Yes','No']));

        // ══════════════════════════════════════════════════════
        //  PAGE 4 – INTERIOR & EXTERIOR INSPECTION (same as BBPLC)
        // ══════════════════════════════════════════════════════
        y = E.newPage();
        y = heading(y, 'Interior Inspection');
        [['Transmission (Gear)',  'transmission',      ['Auto','Manual']],
         ['Ignition (Start)',     'ignition',           ['Push','Key']],
         ['Power Window',         'power_window',       ['Auto','Manual']],
         ['Power Steering',       'power_steering',     ['Auto','Manual']],
         ['Power Side Mirror',    'power_side_mirror',  ['Auto','Manual']],
         ['Power Door Locks',     'power_door_locks',   ['Yes','No']],
         ['Sound System',         'sound_system',       ['Built-in','Modified']],
         ['Wooden Panel',         'wooden_panel',       ['Yes','No']],
         ['Leather Interior',     'leather_interior',   ['Yes','No']],
         ['Airbag',               'airbag',             ['Yes','No']],
         ['Back Camera',          'back_camera',        ['Yes','No']],
         ['Ambient Lighting',     'ambient_lighting',   ['Built-in','Modified']],
        ].forEach(([lbl,field,opts]) => { y = E.checkRow(y, lbl, bo(field, opts)); });
        y = E.checkRow(y, 'Additional Accessories', bo('interior_accessories_yn', ['Yes','No']));
        const intAcc = fd['interior_accessories_yn'];
        if (intAcc === 'Yes' || (Array.isArray(intAcc) && intAcc.includes('Yes')))
            y = E.tRow(y, 'Accessories Detail', v('interior_accessories'));
        y = E.tRow(y, 'No. of Seats',                    v('num_seats'));
        y = E.tRow(y, 'Total Mileage (as per Dashboard)', v('total_mileage'));
        y += 10;

        y = heading(y, 'Exterior Inspection');
        [['Body Condition',     'body_condition',   ['Good','Fair','Moderate','Poor']],
         ['Engine Condition',   'engine_condition', ['Good','Fair','Moderate','Poor']],
         ['Tires Condition',    'tires_condition',  ['Good','Fair','Moderate','Poor']],
         ['Major Defects',      'major_defects',    ['Yes','No']],
         ['Chassis Repaired',   'chassis_repaired', ['Yes','No']],
         ['Alloy Rim',          'alloy_rim',        ['Built-in','Modified']],
         ['Sun Roof/Moon Roof', 'sun_roof',         ['Yes','No']],
         ['Glass',              'glass',            ['Original','Repaired']],
         ['Fog Light',          'fog_light',        ['Yes','No']],
         ['Dimension',          'dimension',        ['Long','Hatchback','Saloon','SUV']],
         ['Paint Condition',    'paint_condition',  ['Good','Fair','Moderate','Poor']],
        ].forEach(([lbl,field,opts]) => { y = E.checkRow(y, lbl, bo(field, opts)); });
        y = E.checkRow(y, 'Major Accidental History', bo('accidental_history', ['Yes','No']));
        const acc = fd['accidental_history'];
        if (acc === 'Yes' || (Array.isArray(acc) && acc.includes('Yes')))
            y = E.tRow(y, 'Accidental History Detail', v('accidental_history_detail'));
        // FIX #5: HID Lights now rendered in PDF — matching field now present in form
        y = E.checkRow(y, 'HID Lights', bo('hid_lights', ['Good','Fair','Moderate','Poor']));
        y = E.checkRow(y, 'Additional Accessories', bo('exterior_accessories_yn', ['Yes','No']));
        const extAcc = fd['exterior_accessories_yn'];
        if (extAcc === 'Yes' || (Array.isArray(extAcc) && extAcc.includes('Yes')))
            y = E.tRow(y, 'Accessories Detail', v('exterior_accessories'));

        // ══════════════════════════════════════════════════════
        //  PAGE 5 – ASSESSMENT + INSPECTION PARTICULARS +
        //           PRICE JUSTIFICATION + DECLARATION
        // ══════════════════════════════════════════════════════
        y = E.newPage();

        // Overall Assessment
        y = heading(y, 'Overall Assessment');
        [['Interior Condition', 'interior_condition', ['Good','Average','Poor']],
         ['Exterior Condition', 'exterior_condition', ['Good','Average','Poor']],
         ['Any Known Defects',  'known_defects',      ['Yes','No']],
        ].forEach(([lbl,field,opts]) => { y = E.checkRow(y, lbl, bo(field, opts)); });
        const kd = fd['known_defects'];
        if (kd === 'Yes' || (Array.isArray(kd) && kd.includes('Yes')))
            y = E.tRow(y, 'Known Defects Detail', v('known_defects_detail'));

        // Inspection Particulars
        y += 10; if (y+10 > CONTENT_BOTTOM) y = E.newPage();
        y = heading(y, 'Inspection Particulars');
        [['Date of Inspection',         dt('inspection_date')],
         ['Inspection Time',             tm('inspection_time')],
         ['Location',                    v('inspection_location')],
         ['Contact person',              v('contact_person')],
         ['Name of Verification Agent',  v('verification_agent')],
        ].forEach(([l,val]) => { y = E.tRow(y,l,val); });

// Price Justification table
        y += 10; if (y+10 > CONTENT_BOTTOM) y = E.newPage();
        y = heading(y, 'Price Justification:');

        // Table header
        const pjCws = [CW - 40 - 40, 40, 40];
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
        E.bold(9);
        const pjHeaders = ['Particulars', 'Maximum Price\n(BDT)', 'Final/Assessed\nPrice (BDT)'];
        const pjHdrH = 12;
        let pjx = ML;
        pjHeaders.forEach((h, i) => {
            const ls = h.split('\n');
            const lineH = 4.5;
            const totalTextH = ls.length * lineH;
            const startY = y + (pjHdrH - totalTextH) / 2 + lineH / 2;
            doc.rect(pjx, y, pjCws[i], pjHdrH);
            ls.forEach((line, li) => {
                doc.text(line, pjx + pjCws[i] / 2, startY + li * lineH, { align: 'center', baseline: 'middle' });
            });
            pjx += pjCws[i];
        });
        y += pjHdrH;

        // Data rows
        E.normal(9);
        const pjRows = [
            ['Current Offer Price at Pre-Owned vehicle Showrooms', fmtNum('pj_showroom_max'),  fmtNum('pj_showroom_assessed')],
            ['Current Offer Price on the online Marketplace',       fmtNum('pj_online_max'),    fmtNum('pj_online_assessed')],
            ['Recent valuation as recorded in our database',        fmtNum('pj_database_max'),  fmtNum('pj_database_assessed')],
        ];
        const pjPadX = 2;
        const pjPadY = 2;
        const pjLineH = 4.5;
        pjRows.forEach(([label, maxVal, assessedVal]) => {
            const ls = doc.splitTextToSize(label, pjCws[0] - pjPadX * 2);
            const textBlockH = ls.length * pjLineH;
            const rh2 = textBlockH + pjPadY * 2;
            if (y + rh2 > CONTENT_BOTTOM) y = E.newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);

            // Particulars cell — left aligned, vertically centered
            doc.rect(ML, y, pjCws[0], rh2);
            doc.text(ls, ML + pjPadX, y + rh2 / 2, { baseline: 'middle' });

            // Max Price cell — center aligned both axes
            doc.rect(ML + pjCws[0], y, pjCws[1], rh2);
            doc.text(String(maxVal||''), ML + pjCws[0] + pjCws[1] / 2, y + rh2 / 2, { align: 'center', baseline: 'middle' });

            // Assessed Price cell — center aligned both axes
            doc.rect(ML + pjCws[0] + pjCws[1], y, pjCws[2], rh2);
            doc.text(String(assessedVal||''), ML + pjCws[0] + pjCws[1] + pjCws[2] / 2, y + rh2 / 2, { align: 'center', baseline: 'middle' });

            y += rh2;
        });
        y += 6;

        // Price justification conclusion paragraph
        E.normal(10);
        const pjPara = 'We have assessed the price of the vehicle based on the vehicle\'s condition as per inspection and considered current market demand for such vehicle in addition to above price discovery.';
        const pjParaL = doc.splitTextToSize(pjPara, CW);
        if (y + pjParaL.length*4.5 > CONTENT_BOTTOM) y = E.newPage();
        doc.text(pjParaL, ML, y); y += pjParaL.length*4.5 + 0;

        // Declaration
        if (y + 10 > CONTENT_BOTTOM) y = E.newPage();
        y = heading(y, 'Declaration:');
        y = numberedList(y, [
            'The valuation has been performed based on our physical inspection, verification, local market analysis and assessment to the best of our knowledge and all the information provided in this report is based on the vehicle related documents, other necessary documents and information as provided by concern Bank/ NBFI/ Officials/ Vehicle Owner/ Borrower/ Individual.',
            'AMK\'s responsibility is limited to the valuation of the said vehicle only without considering any legal matter related to the vehicle and documents as well.',
            'Except inspection and valuation of the said vehicle, AMK or any of its Official has no interest directly or indirectly, at present or in future in any manner whatsoever in the subject matter of this report.',
            'In case of Forced Sale Value, the rate is assumed on the basis of the vehicle\'s demand, price, marketability and other factors, which may have relation to unforeseen or uncontrollable event that drives to sell the vehicle within a short duration.',
            'This report is not intended to absolve the concerned parties from their contractual obligations.',
            'The report is duly signed by the authorized signatories of AMK and it contains 13 (Thirteen) pages.',
        ]);

        // ══════════════════════════════════════════════════════
        //  PAGE 6 – ANNEXURE-II — BRTA Registration (same as BBPLC)
        // ══════════════════════════════════════════════════════
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

        // ── Photos & QR (same as BBPLC) ──────────────────────
        E.renderPhotos(fd);
        E.renderQR(fd);

        // Save
        const sanitize = (str) => str ? str.replace(/[\\\/:\*\?"<>\|]/g, '-') : '';
        const ref     = sanitize(v('letter_ref'));
        const account = sanitize(v('ac_title') || v('reference_account_name'));
        const identifier = (ref && account) ? `${ref}_${account}` : (ref || account || 'Report');
        E.save(`${identifier}.pdf`);
    }
};
