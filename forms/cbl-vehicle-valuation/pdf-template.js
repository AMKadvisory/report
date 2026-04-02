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
        const dt = (k)        => E.dt(fd, k);
        const tm = (k)        => E.tm(fd, k);
        const bo = (f, opts)  => E.buildOpts(fd, f, opts);

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

        // Data row
        E.normal(9);
        const pmvData = [
            v('purchaser_name'),
            v('cover_registration_number') || v('registration_number'),
            v('assessed_price'),
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
        doc.line(ML, y, ML+78, y);
        doc.line(ML+100, y, ML+178, y);
        y += 5;
        E.bold(10);
        doc.text(v('valuer_1_name'), ML,     y);
        doc.text(v('valuer_2_name'), ML+100, y); y += 5;
        E.normal(10);
        doc.text(v('valuer_1_designation'), ML,     y);
        doc.text(v('valuer_2_designation'), ML+100, y); y += 10;

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
         ['Registration Date',                  dt('registration_date')],
         ['Ownership Transfer Status',           v('ownership_transfer')],
         ['Insurance Policy Number & Date',      v('insurance_policy')],
         ['Tax Clearance Certificate Number',    v('tax_clearance_number')],
         ['Tax Clearance Up To',                 dt('tax_clearance_date')],
         ['Fitness Certificate Number',          v('fitness_cert_number')],
         ['Fitness Validity Up To',              dt('fitness_validity')],
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
        const pjCws = [CW - 55 - 55, 55, 55];
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
        E.bold(9);
        const pjHeaders = ['Particulars', 'Maximum Price\n(BDT)', 'Final/Assessed\nPrice (BDT)'];
        const pjHdrH = 14; // fixed header height — enough for 2-line headers
        let pjx = ML;
        pjHeaders.forEach((h, i) => {
            const ls = doc.splitTextToSize(h, pjCws[i] - 3);
            doc.rect(pjx, y, pjCws[i], pjHdrH);
            doc.text(ls, pjx + pjCws[i] / 2, y + pjHdrH / 2, { align: 'center', baseline: 'middle' });
            pjx += pjCws[i];
        });
        y += pjHdrH;

        // Data rows
        E.normal(9);
        const pjRows = [
            ['Current Offer Price at Pre-Owned vehicle Showrooms', v('pj_showroom_max'),  v('pj_showroom_assessed')],
            ['Current Offer Price on the online Marketplace',       v('pj_online_max'),    v('pj_online_assessed')],
            ['Recent valuation as recorded in our database',        v('pj_database_max'),  v('pj_database_assessed')],
        ];
        pjRows.forEach(([label, maxVal, assessedVal]) => {
            const ls = doc.splitTextToSize(label, pjCws[0] - 3);
            const rh2 = Math.max(10, ls.length * 5 + 4); // enough padding around wrapped lines
            if (y + rh2 > CONTENT_BOTTOM) y = E.newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
            // Particulars cell — text vertically centered
            doc.rect(ML, y, pjCws[0], rh2);
            doc.text(ls, ML + 2, y + rh2 / 2, { baseline: 'middle' });
            // Max Price cell
            doc.rect(ML + pjCws[0], y, pjCws[1], rh2);
            doc.text(String(maxVal||''), ML + pjCws[0] + pjCws[1] / 2, y + rh2 / 2, { align: 'center', baseline: 'middle' });
            // Assessed Price cell
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
        doc.text(pjParaL, ML, y); y += pjParaL.length*4.5 + 8;

        // Declaration
        if (y + 20 > CONTENT_BOTTOM) y = E.newPage();
        y = heading(y, 'Declaration:');
        y = numberedList(y, [
            'The valuation has been performed based on our physical inspection, verification, local market analysis and assessment to the best of our knowledge and all the information provided in this report is based on the vehicle related documents, other necessary documents and information as provided by concern Bank/NBFI/Officials/Vehicle Owner/Borrower/Individual.',
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
        doc.line(PW/2 - drW1/2, y+1.5, PW/2 + drW1/2, y+1.5);
        y += 10;
        E.normal(10);

        const rh = 8;
        const C3 = Math.floor(CW/3), C3r = CW - C3*2;
        const FS = 9;
        doc.setFontSize(FS);

        const lvH = (x, cy, lw, vw, h, label, val) => {
            const lblL = doc.splitTextToSize(label, lw-2);
            const valL = doc.splitTextToSize(val||'', vw-2);
            const ch = Math.max(h, Math.max(lblL.length, valL.length)*4.5+3);
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            doc.rect(x, cy, lw, ch);
            doc.setFont('times','bold'); doc.setFontSize(FS); doc.text(lblL, x+1.5, cy+4);
            doc.rect(x+lw, cy, vw, ch);
            doc.setFont('times','normal'); doc.setFontSize(FS); doc.text(valL, x+lw+1.5, cy+4);
            return ch;
        };

        const row3b = (lw, pairs, minH) => {
            const colWs = [C3, C3, C3r];
            let maxH = minH;
            pairs.forEach(([lbl,val], i) => {
                const vw = colWs[i]-lw;
                const needed = Math.max(doc.splitTextToSize(lbl,lw-2).length, doc.splitTextToSize(val||'',vw-2).length)*4.5+3;
                if (needed > maxH) maxH = needed;
            });
            let x = ML;
            pairs.forEach(([lbl,val], i) => { lvH(x, y, lw, colWs[i]-lw, maxH, lbl, val); x += colWs[i]; });
            return maxH;
        };

        const hdr = (w, label) => {
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2); doc.rect(ML, y, w, rh);
            doc.setFont('times','bold'); doc.setFontSize(FS); doc.text(label, ML+1.5, y+5);
        };

        const LW1=22, LW2=24;

        // Registration Info
        hdr(CW, 'Registration Info');
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
        doc.rect(ML+C3*2, y, LW1, rh);
        doc.setFont('times','bold'); doc.setFontSize(FS); doc.text('Current\nAuthority', ML+C3*2+1.5, y+2.5);
        doc.rect(ML+C3*2+LW1, y, C3r-LW1, rh);
        doc.setFont('times','normal'); doc.setFontSize(FS);
        doc.text(doc.splitTextToSize(v('brta_authority'), C3r-LW1-2), ML+C3*2+LW1+1.5, y+3.5);
        doc.setFont('times','bold'); doc.setFontSize(FS); doc.text('Registration Info', ML+1.5, y+5);
        y += rh;

        y += row3b(LW1,[['Registration\nId',v('brta_registration_id')],['Registration\nNo',v('brta_registration_no')],['Previous\nReg No',v('brta_prev_reg_no')]],rh*2);
        y += row3b(LW1,[['Application\nStatus',v('brta_app_status')],['Registration\nDate',dt('brta_reg_date')],['Hire',v('brta_hire')]],rh*2);
        y += row3b(LW1,[['Ownership\nType',v('brta_ownership_type')],['Hire\nPurchase',v('brta_hire_purchase')],['Bank Name',v('brta_bank_name')]],rh*2);

        const baLines = doc.splitTextToSize(v('brta_bank_address')||'', CW-LW1-2);
        const baH = Math.max(rh, baLines.length*4.5+3);
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
        doc.rect(ML, y, LW1, baH);
        doc.setFont('times','bold'); doc.setFontSize(FS); doc.text('Bank Address', ML+1.5, y+4);
        doc.rect(ML+LW1, y, CW-LW1, baH);
        doc.setFont('times','normal'); doc.setFontSize(FS); doc.text(baLines, ML+LW1+1.5, y+4);
        y += baH+4;

        // Vehicle Info
        hdr(CW, 'Vehicle Info'); y += rh;
        y += row3b(LW2,[['Chassis No',v('brta_chassis_no')],['Engine No',v('brta_engine_no')],['Manufacture\nYear',v('brta_mfg_year')]],rh*2);
        y += row3b(LW2,[['Vehicle Class',v('brta_veh_class')],['Vehicle Type',v('brta_veh_type')],['No of Seat',v('brta_num_seats')]],rh*2);
        y += row3b(LW2,[['Manufacturer',v('brta_manufacturer')],["Maker's\nCountry",v('brta_country')],['Color',v('brta_color')]],rh*2);
        y += row3b(LW2,[['Horse Power',v('brta_hp')],['RPM',v('brta_rpm')],['CC',v('brta_cc')]],rh);
        y += row3b(LW2,[['Unladen\nWeight',v('brta_unladen_weight')],['Max Weight',v('brta_max_weight')],['No of\nCylinders',v('brta_cylinders')]],rh);
        let x3=ML;
        lvH(x3,y,LW2,C3-LW2,rh,'Vehicle Model',v('brta_vehicle_model')); x3+=C3;
        lvH(x3,y,LW2,C3-LW2,rh,'Mileage',v('brta_mileage')); x3+=C3;
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.2); doc.rect(x3,y,C3r,rh);
        y += rh+4;

        // Owner Info
        hdr(CW, 'Owner Info'); y += rh;
        let ownerIdx = 1;
        while (fd['owner_'+ownerIdx+'_name'] || ownerIdx === 1) {
            const oName=v('owner_'+ownerIdx+'_name'), oFather=v('owner_'+ownerIdx+'_father'), oAddr=v('owner_'+ownerIdx+'_address');
            if (!oName && ownerIdx>1) break;
            y += row3b(22,[["Owner's\nName",oName],["Father's\nName",oFather],["Owner's\nAddress",oAddr]],rh*2);
            ownerIdx++;
            if (y+rh*2 > CONTENT_BOTTOM) y = E.newPage();
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