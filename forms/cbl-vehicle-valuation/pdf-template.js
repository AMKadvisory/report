// ═══════════════════════════════════════════════════════════
//  forms/cbl-vehicle-valuation/pdf-template.js
//  ► SELF-CONTAINED — no dependency on pdf-engine.js
//  ► All drawing primitives defined inline.
//  ► Requires: jsPDF loaded globally
// ═══════════════════════════════════════════════════════════
const CBLVehicleValuationPDF = {

    async render(formData, _E, mode) {
        const fd = formData || {};

        // ══════════════════════════════════════════════════════
        //  INTERNAL ENGINE — all primitives defined here
        // ══════════════════════════════════════════════════════

        // ── Page constants (A4 mm) ───────────────────────────
        const PW = 210, PH = 297;
        const MT = 30;
        const ML = 25, MR = 25;
        const CW = PW - ML - MR;
        const HEADER_W = 127, HEADER_H = 12.7;
        const FOOTER_H = 10.9;
        const CONTENT_BOTTOM = PH - FOOTER_H - 2;

        // ── jsPDF init ───────────────────────────────────────
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        // ── Typography ───────────────────────────────────────
        const bold   = (sz = 10) => { doc.setFont('times', 'bold');   doc.setFontSize(sz); doc.setTextColor(0,0,0); };
        const normal = (sz = 10) => { doc.setFont('times', 'normal'); doc.setFontSize(sz); doc.setTextColor(0,0,0); };
        const italic = (sz = 10) => { doc.setFont('times', 'italic'); doc.setFontSize(sz); doc.setTextColor(0,0,0); };

        // ── Value helpers ────────────────────────────────────
        const v   = (k, fb = '') => { const val = fd[k]; return (val === undefined || val === null || val === '') ? fb : String(val); };
        const tm  = (k) => { const t = fd[k]; if (!t || !t.includes(':')) return t || ''; const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m}${hr < 12 ? ' AM' : ' PM'}`; };
        const dt  = (k) => { const raw = fd[k]; if (!raw) return ''; const d = new Date(raw); if (isNaN(d)) return raw; return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); };
        const dts = (k) => { const raw = fd[k]; if (!raw) return ''; const d = new Date(raw); if (isNaN(d)) return raw; return d.toLocaleDateString('en-GB'); };
        const fmtNum = (k) => { const raw = (fd[k] || '').toString().replace(/[^\d]/g, ''); if (!raw) return ''; return parseInt(raw, 10).toLocaleString('en-US'); };
        const bo  = (field, opts) => { const raw = fd[field]; const saved = Array.isArray(raw) ? raw : (raw ? [raw] : []); return opts.map(l => ({ label: l, checked: saved.includes(l) })); };

        // ── Image compressor ─────────────────────────────────
        const compressImage = (dataUrl, maxWidth = 1200, quality = 0.6) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(dataUrl); // fallback to original
            img.src = dataUrl;
        });

        // ── Image loader ─────────────────────────────────────
        const loadImg = (src, maxWidth = 900, quality = 0.7) => new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.naturalWidth || img.width;
                let h = img.naturalHeight || img.height;
                if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });

        // ── Load header & footer once ────────────────────────(CHANGE HERE FOR QUALITY)
        const headerImg = await loadImg('AMK Header.png', 1000, 0.5);  
        const footerImg = await loadImg('AMK Footer.png', 1000, 0.5);

        // ── Draw header/footer on current page ───────────────
        const drawHeaderFooter = () => {
            if (headerImg) {
                try { doc.addImage(headerImg, 'JPEG', (PW - HEADER_W) / 2, 5, HEADER_W, HEADER_H); } catch(e) {}
            }
            if (footerImg) {
                try { doc.addImage(footerImg, 'JPEG', 0, PH - FOOTER_H, PW, FOOTER_H); } catch(e) {}
            }
        };

        // ── New page ─────────────────────────────────────────
        const newPage = () => {
            doc.addPage();
            drawHeaderFooter();
            return MT;
        };

        // Draw header/footer on page 1
        drawHeaderFooter();
        let y = MT;

        // ── Standard label:value row ─────────────────────────
        const tRow = (y, label, value) => {
            const rowH = 6, col1 = 60, col2 = CW - col1 - 4;
            if (y + rowH > CONTENT_BOTTOM) y = newPage();
            doc.setDrawColor(0,0,0);
            doc.setFillColor(255,255,255); doc.rect(ML, y, col1, rowH, 'FD');
            doc.setFillColor(255,255,255); doc.rect(ML+col1, y, 4, rowH, 'FD');
            doc.rect(ML+col1+4, y, col2, rowH, 'FD');
            bold(10);  doc.text(String(label), ML+1.5, y+4);
            normal(10); doc.text(':', ML+col1+1.2, y+4);
            const lines = doc.splitTextToSize(String(value || '—'), col2-3);
            doc.text(lines[0], ML+col1+5.5, y+4);
            return y + rowH;
        };

        // ── Checkbox row ─────────────────────────────────────
        const checkRow = (y, rowLabel, options) => {
            const rowH = 7, col1 = 60, colonW = 4, boxSz = 3.2;
            if (y + rowH > CONTENT_BOTTOM) y = newPage();
            doc.setDrawColor(0,0,0); doc.setFillColor(255,255,255);
            doc.rect(ML, y, col1, rowH, 'FD');
            bold(10); doc.text(String(rowLabel), ML+1.5, y + rowH/2 + 1.2);
            doc.setFillColor(255,255,255); doc.rect(ML+col1, y, colonW, rowH, 'FD');
            normal(10); doc.text(':', ML+col1+1.2, y + rowH/2 + 1.2);
            const checkAreaW = CW - col1 - colonW;
            doc.setFillColor(255,255,255); doc.rect(ML+col1+colonW, y, checkAreaW, rowH, 'FD');
            const optW = checkAreaW / options.length;
            options.forEach((opt, i) => {
                const ox = ML + col1 + colonW + i * optW + 2;
                const oy = y + (rowH - boxSz) / 2;
                doc.setDrawColor(0,0,0); doc.setFillColor(255,255,255);
                doc.rect(ox, oy, boxSz, boxSz, 'FD');
                if (opt.checked) {
                    doc.setLineWidth(0.5);
                    doc.line(ox+0.5, oy+boxSz*0.6, ox+boxSz*0.38, oy+boxSz-0.4);
                    doc.line(ox+boxSz*0.38, oy+boxSz-0.4, ox+boxSz-0.3, oy+0.4);
                    doc.setLineWidth(0.2);
                }
                normal(10); doc.text(String(opt.label), ox+boxSz+1.2, oy+boxSz-0.4);
            });
            return y + rowH;
        };

        // ── Section heading with underline ───────────────────
        const heading = (y, text) => {
            if (y + 8 > CONTENT_BOTTOM) y = newPage();
            doc.setTextColor(0,0,0);
            doc.setFillColor(255,255,255);
            bold(12); doc.text(text, ML, y+5);
            const tw = doc.getTextWidth(text);
            doc.setLineWidth(0.3);
            doc.line(ML, y+6.5, ML+tw, y+6.5);
            normal(10); return y + 11;
        };

        // ── Numbered list ────────────────────────────────────
        const numberedList = (y, items) => {
            items.forEach((txt, i) => {
                const prefix  = `${i+1}. `;
                const prefixW = doc.getTextWidth(prefix);
                const ls = doc.splitTextToSize(txt, CW - 4 - prefixW);
                if (y + ls.length*4.5 > CONTENT_BOTTOM) y = newPage();
                normal(10);
                doc.text(prefix, ML+2, y);
                doc.text(ls, ML+2+prefixW, y, { align:'justify', maxWidth: CW - 4 - prefixW });
                y += ls.length*4 + 0.5;
            });
            return y;
        };

        // ══════════════════════════════════════════════════════
        //  PAGE 1 – COVER
        // ══════════════════════════════════════════════════════

        y += 6;
        bold(16);
        doc.text('Inspection & Valuation Report of Used/Pre-Owned Vehicle', PW/2, y, { align:'center' });
        y += 12;

        bold(12);
        doc.text('A/C Title: ' + v('ac_title'), PW/2, y, { align:'center' });
        y += 10;

        // Vehicle cover image
        const coverImg = fd._cover_image;
        const cvW = 158, cvH = 102;
        const cvX = ML + (CW - cvW) / 2;
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
        if (coverImg && coverImg.dataUrl) {
            try {
                const compressed = await compressImage(coverImg.dataUrl, 800, 0.5); //(CHANGE HERE FOR QUALITY)
                doc.addImage(compressed, 'JPEG', cvX, y, cvW, cvH);
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

        // Key Information table
        bold(10);
        doc.text('Key Information of the Vehicle:', ML, y); y += 8;

        const kiTotalW = 110, kiLabelW = 55, kiValueW = 55;
        const kiX = ML + (CW - kiTotalW) / 2;
        const kiRows = [
            ["Vehicle's Brand",    v('vehicle_brand') || v('manufacturer')],
            ['Manufacturing Year', v('cover_manufacturing_year') || v('manufacturing_year')],
            ['Chassis No.',        v('cover_chassis_number')     || v('chassis_number')],
            ['Engine No.',         v('cover_engine_number')      || v('engine_number')],
        ];
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
        kiRows.forEach(([label, val]) => {
            const rh = 7;
            if (y + rh > CONTENT_BOTTOM) y = newPage();
            doc.setFillColor(255,255,255);
            doc.rect(kiX,            y, kiLabelW, rh, 'FD');
            doc.rect(kiX + kiLabelW, y, kiValueW, rh, 'FD');
            normal(10); doc.setTextColor(0,0,0);
            doc.text(String(label),   kiX + 2,            y + 4.8);
            doc.text(String(val||''), kiX + kiLabelW + 2, y + 4.8);
            y += rh;
        });
        y += 6;

        // Present Market Value table
        bold(10);
        doc.text('Present Market Value:', ML, y); y += 8;

        const pmvCws = [60, 60, CW - 120];
        const pmvHeaders = ["Vehicle Purchaser's Name", 'Vehicle Registration No.', 'Assessed Price (BDT)'];
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
        bold(9);
        let hx = ML;
        pmvHeaders.forEach((h, i) => {
            doc.rect(hx, y, pmvCws[i], 7);
            const ls = doc.splitTextToSize(h, pmvCws[i]-2);
            doc.text(ls, hx + pmvCws[i]/2, y+4, { align:'center' });
            hx += pmvCws[i];
        });
        y += 7;
        normal(9);
        const pmvData = [v('purchaser_name'), v('cover_registration_number') || v('registration_number'), fmtNum('assessed_price')];
        let dx2 = ML;
        pmvData.forEach((val, i) => {
            doc.rect(dx2, y, pmvCws[i], 7);
            doc.text(String(val||''), dx2 + pmvCws[i]/2, y+4.5, { align:'center' });
            dx2 += pmvCws[i];
        });
        y += 7 + 13;

        bold(11);
        doc.text('Report Submission Date: ' + dt('report_submission_date'), PW/2, y, { align:'center' });

        // ══════════════════════════════════════════════════════
        //  PAGE 2 – COVER LETTER
        // ══════════════════════════════════════════════════════
        y = newPage();
        normal(10); y += 6;

        doc.text('Bank Ref. No.: ' + v('bank_ref'), ML, y); y += 5;
        doc.text('Our Ref.: '      + v('letter_ref'),    ML, y); y += 5;
        doc.text('Date: '          + dt('comm_date'),    ML, y); y += 9;

        bold(10); doc.text(v('recipient_name'), ML, y); y += 5;
        normal(10);
        const addrLines2 = doc.splitTextToSize(v('recipient_address'), CW);
        doc.text(addrLines2, ML, y); y += addrLines2.length*4.5 + 5;

        bold(10);
        doc.text('Re: Inspection & Valuation Report of used/pre-owned vehicle', ML, y); y += 8;
        normal(10);
        doc.text('Dear Sir,', ML, y); y += 6;
        doc.text('Greetings from AMK Associates Limited and Thank You very much for referring us!', ML, y, { maxWidth: CW }); y += 8;

        const bodyStr = 'Pursuant to your communication through email, dated: ' + dt('comm_date') +
            ', we, AMK Associates Limited (\'AMK\') has conducted the inspection and valuation of the referred vehicle.';
        const bodyL = doc.splitTextToSize(bodyStr, CW);
        doc.text(bodyL, ML, y); y += bodyL.length*4.5 + 6;

        const para1L = doc.splitTextToSize('As per our understanding, the aforementioned valuation is fair and reasonable and our responsibility is restricted within the physical existence of the used vehicle and the value thereof.', CW);
        doc.text(para1L, ML, y); y += para1L.length*4.5 + 5;

        const para2L = doc.splitTextToSize('The report has been prepared based on our physical inspection, verification, necessary documents as provided by concern office/individual, local market analysis and assessment to the best of our knowledge.', CW);
        doc.text(para2L, ML, y); y += para2L.length*4.5 + 5;

        doc.text('For any query, please feel free to contact us.', ML, y); y += 6;
        doc.text('With best regards,', ML, y); y += 18;

        doc.setDrawColor(0,0,0);
        doc.line(ML, y, ML+50, y);
        doc.line(ML+100, y, ML+150, y);
        y += 5;
        bold(10);
        doc.text(v('valuer_1_name'), ML, y);
        doc.text(v('valuer_2_name'), ML+100, y);
        y += 6;
        normal(10);
        doc.text(v('valuer_1_designation'), ML, y);
        doc.text(v('valuer_2_designation'), ML+100, y);
        y += 12;

        const enclosures = [
            '1. Annexure-I   : Detail Report',
            '2. Annexure-II  : Registration Acknowledgement Slip Verification Report',
            '3. Annexure-III : Photograph of Vehicle',
            '4. Annexure-IV  : QR Code for Video of Vehicle',
        ];
        if (y + enclosures.length * 4.5 + 8 > CONTENT_BOTTOM) y = newPage();
        italic(10); doc.text('Encl:', ML, y);
        enclosures.forEach((l, i) => { doc.text(l, ML+16, y + i*4.5); });

        // ══════════════════════════════════════════════════════
        //  PAGE 3 – VEHICLE & REGISTRATION
        // ══════════════════════════════════════════════════════
        y = newPage();
        italic(10); doc.text('Annexure-I', ML+CW, y, { align:'right' }); y += 7;
        bold(12); doc.text('Detail Report', PW/2, y, { align:'center' });
        const drW = doc.getTextWidth('Detail Report');
        doc.setLineWidth(0.3);
        doc.line(PW/2 - drW/2, y+1.5, PW/2 + drW/2, y+1.5);
        y += 10; normal(10);

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
        ].forEach(([l, val]) => { y = tRow(y, l, val); });
        y = checkRow(y, 'Type of Vehicle', bo('vehicle_type', ['Non-Hybrid','Hybrid','Electric']));
        y = checkRow(y, 'Fuel Used',       bo('fuel_used',    ['Petrol','Diesel','CNG','Octane','Electric']));
        y += 10;

        y = heading(y, 'Registration Details');
        [['Current Owner Name',                v('owner_name')],
         ['Registration Number',               v('registration_number')],
         ['Registration ID',                   v('registration_id')],
         ['Registration Date',                 dts('registration_date')],
         ['Ownership Transfer Status',          v('ownership_transfer')],
         ['Insurance Policy Number & Date',     v('insurance_policy')],
         ['Tax Clearance Certificate Number',   v('tax_clearance_number')],
         ['Tax Clearance Up To',                dts('tax_clearance_date')],
         ['Fitness Certificate Number',         v('fitness_cert_number')],
         ['Fitness Validity Up To',             dts('fitness_validity')],
        ].forEach(([l, val]) => { y = tRow(y, l, val); });
        y = checkRow(y, 'Hire Purchase', bo('hire_purchase', ['Yes','No']));

        // ══════════════════════════════════════════════════════
        //  PAGE 4 – INTERIOR & EXTERIOR INSPECTION
        // ══════════════════════════════════════════════════════
        y = newPage();
        y = heading(y, 'Interior Inspection');
        [['Transmission (Gear)', 'transmission',     ['Auto','Manual']],
         ['Ignition (Start)',    'ignition',          ['Push','Key']],
         ['Power Window',        'power_window',      ['Auto','Manual']],
         ['Power Steering',      'power_steering',    ['Auto','Manual']],
         ['Power Side Mirror',   'power_side_mirror', ['Auto','Manual']],
         ['Power Door Locks',    'power_door_locks',  ['Yes','No']],
         ['Sound System',        'sound_system',      ['Built-in','Modified']],
         ['Wooden Panel',        'wooden_panel',      ['Yes','No']],
         ['Leather Interior',    'leather_interior',  ['Yes','No']],
         ['Airbag',              'airbag',            ['Yes','No']],
         ['Back Camera',         'back_camera',       ['Yes','No']],
         ['Ambient Lighting',    'ambient_lighting',  ['Built-in','Modified']],
        ].forEach(([lbl, field, opts]) => { y = checkRow(y, lbl, bo(field, opts)); });
        y = checkRow(y, 'Additional Accessories', bo('interior_accessories_yn', ['Yes','No']));
        const intAcc = fd['interior_accessories_yn'];
        if (intAcc === 'Yes' || (Array.isArray(intAcc) && intAcc.includes('Yes')))
            y = tRow(y, 'Accessories Detail', v('interior_accessories'));
        y = tRow(y, 'No. of Seats',                    v('num_seats'));
        y = tRow(y, 'Total Mileage (as per Dashboard)', v('total_mileage'));
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
        ].forEach(([lbl, field, opts]) => { y = checkRow(y, lbl, bo(field, opts)); });
        y = checkRow(y, 'Major Accidental History', bo('accidental_history', ['Yes','No']));
        const acc = fd['accidental_history'];
        if (acc === 'Yes' || (Array.isArray(acc) && acc.includes('Yes')))
            y = tRow(y, 'Accidental History Detail', v('accidental_history_detail'));
        y = checkRow(y, 'HID Lights',            bo('hid_lights',             ['Good','Fair','Moderate','Poor']));
        y = checkRow(y, 'Additional Accessories', bo('exterior_accessories_yn', ['Yes','No']));
        const extAcc = fd['exterior_accessories_yn'];
        if (extAcc === 'Yes' || (Array.isArray(extAcc) && extAcc.includes('Yes')))
            y = tRow(y, 'Accessories Detail', v('exterior_accessories'));

        // ══════════════════════════════════════════════════════
        //  PAGE 5 – ASSESSMENT + PRICE JUSTIFICATION + DECLARATION
        // ══════════════════════════════════════════════════════
        y = newPage();

        y = heading(y, 'Overall Assessment');
        [['Interior Condition', 'interior_condition', ['Good','Average','Poor']],
         ['Exterior Condition', 'exterior_condition', ['Good','Average','Poor']],
         ['Any Known Defects',  'known_defects',      ['Yes','No']],
        ].forEach(([lbl, field, opts]) => { y = checkRow(y, lbl, bo(field, opts)); });
        const kd = fd['known_defects'];
        if (kd === 'Yes' || (Array.isArray(kd) && kd.includes('Yes')))
            y = tRow(y, 'Known Defects Detail', v('known_defects_detail'));

        y += 10; if (y+10 > CONTENT_BOTTOM) y = newPage();
        y = heading(y, 'Inspection Particulars');
        [['Date of Inspection',        dt('inspection_date')],
         ['Inspection Time',            tm('inspection_time')],
         ['Location',                   v('inspection_location')],
         ['Contact person',             v('contact_person')],
         ['Name of Verification Agent', v('verification_agent')],
        ].forEach(([l, val]) => { y = tRow(y, l, val); });

        // Price Justification table
        y += 10; if (y+10 > CONTENT_BOTTOM) y = newPage();
        y = heading(y, 'Price Justification:');

        const pjCws = [CW - 80, 40, 40];
        doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
        bold(9);
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

        normal(9);
        const pjRows = [
            ['Current Offer Price at Pre-Owned vehicle Showrooms', fmtNum('pj_showroom_max'),  fmtNum('pj_showroom_assessed')],
            ['Current Offer Price on the online Marketplace',       fmtNum('pj_online_max'),    fmtNum('pj_online_assessed')],
            ['Recent valuation as recorded in our database',        fmtNum('pj_database_max'),  fmtNum('pj_database_assessed')],
        ];
        const pjPadX = 2, pjPadY = 2, pjLineH = 4.5;
        pjRows.forEach(([label, maxVal, assessedVal]) => {
            const ls = doc.splitTextToSize(label, pjCws[0] - pjPadX * 2);
            const rh2 = ls.length * pjLineH + pjPadY * 2;
            if (y + rh2 > CONTENT_BOTTOM) y = newPage();
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.3);
            doc.rect(ML, y, pjCws[0], rh2);
            doc.text(ls, ML + pjPadX, y + rh2 / 2, { baseline: 'middle' });
            doc.rect(ML + pjCws[0], y, pjCws[1], rh2);
            doc.text(String(maxVal||''), ML + pjCws[0] + pjCws[1] / 2, y + rh2 / 2, { align: 'center', baseline: 'middle' });
            doc.rect(ML + pjCws[0] + pjCws[1], y, pjCws[2], rh2);
            doc.text(String(assessedVal||''), ML + pjCws[0] + pjCws[1] + pjCws[2] / 2, y + rh2 / 2, { align: 'center', baseline: 'middle' });
            y += rh2;
        });
        y += 6;

        normal(10);
        const pjParaL = doc.splitTextToSize("We have assessed the price of the vehicle based on the vehicle's condition as per inspection and considered current market demand for such vehicle in addition to above price discovery.", CW);
        if (y + pjParaL.length*4.5 > CONTENT_BOTTOM) y = newPage();
        doc.text(pjParaL, ML, y); y += pjParaL.length*4.5;

        if (y + 10 > CONTENT_BOTTOM) y = newPage();
        y = heading(y, 'Declaration:');
        y = numberedList(y, [
            'The valuation has been performed based on our physical inspection, verification, local market analysis and assessment to the best of our knowledge and all the information provided in this report is based on the vehicle related documents, other necessary documents and information as provided by concern Bank/ NBFI/ Officials/ Vehicle Owner/ Borrower/ Individual.',
            "AMK's responsibility is limited to the valuation of the said vehicle only without considering any legal matter related to the vehicle and documents as well.",
            'Except inspection and valuation of the said vehicle, AMK or any of its Official has no interest directly or indirectly, at present or in future in any manner whatsoever in the subject matter of this report.',
            "In case of Forced Sale Value, the rate is assumed on the basis of the vehicle's demand, price, marketability and other factors, which may have relation to unforeseen or uncontrollable event that drives to sell the vehicle within a short duration.",
            'This report is not intended to absolve the concerned parties from their contractual obligations.',
            'The report is duly signed by the authorized signatories of AMK and it contains 13 (Thirteen) pages.',
        ]);

        // ══════════════════════════════════════════════════════
        //  PAGE 6 – ANNEXURE-II — BRTA Registration
        // ══════════════════════════════════════════════════════
        y = newPage();
        italic(10); doc.text('Annexure-II', ML+CW, y, { align:'right' }); y += 7;
        bold(12); doc.text('Registration Details Report', PW/2, y, { align:'center' });
        const drW1 = doc.getTextWidth('Registration Details Report');
        doc.setLineWidth(0.3);
        doc.line(PW/2 - drW1/2, y + 1.5, PW/2 + drW1/2, y + 1.5);
        y += 10; normal(10);

        // ── BRTA table helpers ───────────────────────────────
        const FS  = 9;
        const COL = CW / 8;
        const PAD_X = 1.5, PAD_W = 3;

        const cell = (cx, cy, w, h, text, isBold = false) => {
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
            doc.setFillColor(255,255,255); doc.rect(cx, cy, w, h, 'FD');
            doc.setFont('times', isBold ? 'bold' : 'normal'); doc.setFontSize(FS);
            doc.setTextColor(0,0,0);
            const lines = doc.splitTextToSize(String(text || ''), w - PAD_W);
            const lineH = 4.5;
            const textH = lines.length * lineH;
            const startY = cy + (h - textH) / 2 + lineH * 0.8;
            doc.text(lines, cx + PAD_X, startY);
        };

        const rowH = (pairs) => {
            let max = 8;
            pairs.forEach(([txt, w]) => {
                const lines = doc.splitTextToSize(String(txt || ''), (w || COL) - 3);
                const needed = lines.length * 4.5 + 3;
                if (needed > max) max = needed;
            });
            return max;
        };

        // Row 1
        const r1H = 10;
        cell(ML,         y, COL*4, r1H, 'Registration Info',  true);
        cell(ML + COL*4, y, COL,   r1H, 'Current Authority',  true);
        cell(ML + COL*5, y, COL*3, r1H, v('brta_authority'),  false);
        y += r1H;

        // Row 2
        const r2Pairs = [
            ['Registration\nId', COL], [v('brta_registration_id'), COL],
            ['Registration\nNo', COL], [v('brta_registration_no'), COL],
            ['Previous\nRegistration No', COL], [v('brta_prev_reg_no'), COL],
            ['Application\nStatus', COL], [v('brta_app_status'), COL],
        ];
        const r2H = rowH(r2Pairs);
        let rx2 = ML;
        r2Pairs.forEach(([txt, w], i) => { cell(rx2, y, w, r2H, txt, i % 2 === 0); rx2 += w; });
        y += r2H;

        // Row 3
        const r3Pairs = [
            ['Registration\nDate', COL], [dts('brta_reg_date'), COL],
            ['Hire', COL], [v('brta_hire'), COL],
            ['Ownership\nType', COL], [v('brta_ownership_type'), COL*3],
        ];
        const r3H = rowH(r3Pairs);
        let rx3 = ML;
        r3Pairs.forEach(([txt, w], i) => { cell(rx3, y, w, r3H, txt, i % 2 === 0); rx3 += w; });
        y += r3H;

        // Row 4
        const r4Pairs = [
            ['Hire\nPurchase', COL], [v('brta_hire_purchase'), COL],
            ['Bank Name', COL], [v('brta_bank_name'), COL],
            ['Bank Address', COL], [v('brta_bank_address'), COL*3],
        ];
        const r4H = rowH(r4Pairs);
        let rx4 = ML;
        r4Pairs.forEach(([txt, w], i) => { cell(rx4, y, w, r4H, txt, i % 2 === 0); rx4 += w; });
        y += r4H + 4;

        // Shared helpers for Vehicle & Owner tables
        const rh2 = 6;
        const LW2 = 24;
        const C3 = Math.floor(CW / 3), C3r = CW - C3 * 2;

        const row3b = (pairs, minH) => {
            const colWs = [C3, C3, C3r];
            let maxH = minH;
            pairs.forEach(([lbl, val], i) => {
                const vw = colWs[i] - LW2;
                const needed = Math.max(
                    doc.splitTextToSize(lbl, LW2 - 2).length,
                    doc.splitTextToSize(val || '', vw - 2).length
                ) * 4.5 + 3;
                if (needed > maxH) maxH = needed;
            });
            let x = ML;
            pairs.forEach(([lbl, val], i) => {
                cell(x, y, LW2, maxH, lbl, true);
                cell(x + LW2, y, colWs[i] - LW2, maxH, val, false);
                x += colWs[i];
            });
            return maxH;
        };

        const sectionHdr = (label) => { cell(ML, y, CW, rh2, label, true); };

        // Vehicle Info table
        sectionHdr('Vehicle Info'); y += rh2;
        y += row3b([['Chassis No', v('brta_chassis_no')], ['Engine No', v('brta_engine_no')], ['Manufacture\nYear', v('brta_mfg_year')]], rh2);
        y += row3b([['Vehicle Class', v('brta_veh_class')], ['Vehicle Type', v('brta_veh_type')], ['No of Seat', v('brta_num_seats')]], rh2);
        y += row3b([['Manufacturer', v('brta_manufacturer')], ["Maker's\nCountry", v('brta_country')], ['Color', v('brta_color')]], rh2);
        y += row3b([['Horse Power', v('brta_hp')], ['RPM', v('brta_rpm')], ['CC', v('brta_cc')]], rh2);
        y += row3b([['Unladen\nWeight', v('brta_unladen_weight')], ['Max Weight', v('brta_max_weight')], ['No of\nCylinders', v('brta_cylinders')]], rh2);
        cell(ML,          y, LW2,       rh2, 'Vehicle Model', true);
        cell(ML+LW2,      y, C3-LW2,   rh2, v('brta_vehicle_model'), false);
        cell(ML+C3,       y, LW2,       rh2, 'Mileage', true);
        cell(ML+C3+LW2,   y, C3-LW2,   rh2, v('brta_mileage'), false);
        cell(ML+C3*2,     y, LW2,       rh2, '', false);
        cell(ML+C3*2+LW2, y, C3r-LW2,  rh2, '', false);
        y += rh2 + 4;

        // Owner Info table
        sectionHdr('Owner Info'); y += rh2;
        let ownerIdx = 1;
        while (fd['owner_'+ownerIdx+'_name'] || ownerIdx === 1) {
            const oName   = v('owner_'+ownerIdx+'_name');
            const oFather = v('owner_'+ownerIdx+'_father');
            const oAddr   = v('owner_'+ownerIdx+'_address');
            if (!oName && ownerIdx > 1) break;
            y += row3b([["Owner's\nName", oName], ["Father's\nName", oFather], ["Owner's\nAddress", oAddr]], rh2);
            ownerIdx++;
            if (y + rh2 > CONTENT_BOTTOM) y = newPage();
        }

        // ══════════════════════════════════════════════════════
        //  ANNEXURE-III – PHOTOS
        // ══════════════════════════════════════════════════════
        const photos = Array.isArray(fd._photos) && fd._photos.length ? fd._photos : [];
        if (photos.length) {
            const imgW = 158, imgH = 102, capH = 6, gapY = 8, perPage = 2;
            let photosY = 0;
            for (let i = 0; i < photos.length; i++) {
                if (i % perPage === 0) {
                    const y0 = newPage();
                    bold(11);
                    doc.text('Annexure-III: Photograph of Vehicle', PW/2, y0+5, { align:'center' });
                    photosY = y0 + 14;
                }
                const slot = i % perPage;
                const iy   = photosY + slot * (imgH + capH + gapY);
                const imgX = ML + (CW - imgW) / 2;
                doc.setDrawColor(0,0,0);
                try {
                    const compressed = await compressImage(photos[i].dataUrl, 800, 0.5); //(CHANGE HERE FOR QUALITY)
                    doc.addImage(compressed, 'JPEG', imgX, iy, imgW, imgH);
                } catch(e) {
                    doc.setFillColor(255,255,255); doc.rect(imgX, iy, imgW, imgH, 'FD');
                }
                doc.setDrawColor(0,0,0); doc.setLineWidth(0.4);
                doc.rect(imgX, iy, imgW, imgH);
                doc.setLineWidth(0.2);
                const raw = photos[i].caption || photos[i].name.replace(/\.[^/.]+$/, '');
                const nm  = raw.length > 50 ? raw.slice(0,48)+'…' : raw;
                normal(10); doc.text(nm, PW/2, iy + imgH + 4.5, { align:'center' });
            }
        }

        // ══════════════════════════════════════════════════════
        //  ANNEXURE-IV – QR CODE
        // ══════════════════════════════════════════════════════
        const qr = fd._qr;
        if (qr) {
            let qy = newPage();
            bold(12);
            doc.text('Annexure-IV: QR Code for Video of Vehicle', PW/2, qy+5, { align:'center' }); qy += 14;
            const qrSize = 60, qrX = (PW - qrSize) / 2;
            try {
                const compressed = await compressImage(qr.dataUrl, 300, 0.5); //(CHANGE HERE FOR QUALITY)
                doc.addImage(compressed, 'JPEG', qrX, qy, qrSize, qrSize);
            } catch(e) {
                doc.setFillColor(240,240,240); doc.rect(qrX, qy, qrSize, qrSize, 'FD');
            }
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.4);
            doc.rect(qrX, qy, qrSize, qrSize);
            doc.setLineWidth(0.2);
            qy += qrSize + 6;
            if (fd.qr_url) {
                normal(10);
                doc.text(fd.qr_url, PW/2, qy, { align:'center', maxWidth: CW }); qy += 8;
            }
            qy += 13;
            bold(10); doc.text('Instructions for use:', ML + 20, qy); qy += 6;
            normal(10);
            ['Download & install any QR Code scanner/reader.',
             'Scan the attached QR Code.',
             'Open the link using Google Chrome/any browser.',
            ].forEach(inst => {
                doc.circle(ML + 23, qy - 1, 0.8, 'F');
                doc.text(inst, ML + 26, qy);
                qy += 5.5;
            });
        }

        // ── Save ─────────────────────────────────────────────
        const sanitize = (str) => str ? str.replace(/[\\\/:\*\?"<>\|]/g, '-') : '';
        const ref      = sanitize(v('letter_ref'));
        const account  = sanitize(v('ac_title') || v('reference_account_name'));
        const identifier = (ref && account) ? `${ref}_${account}` : (ref || account || 'Report');
        if (mode === 'preview') return doc.output('bloburl');
        else doc.save(`${identifier}.pdf`);
    }
};
