// ═══════════════════════════════════════════════════════════
//  core/pdf-engine.js  —  Generic PDF engine
//  ► Provides shared drawing primitives to every pdf-template.
//  ► Never add form-specific content here.
//  ► To change a form's PDF, edit its own pdf-template.js only.
//  Requires: ui.js, jsPDF loaded globally
// ═══════════════════════════════════════════════════════════
const PDFEngine = {

    // Page constants (A4 mm)
    PW: 210, PH: 297,
    IMG_H: 22,
    MT: 30, MB: 20,
    ML: 16, MR: 16,
    get CW() { return this.PW - this.ML - this.MR; },
    get CONTENT_BOTTOM() { return this.PH - this.MB; },

    doc: null,
    headerImg: null,
    footerImg: null,

    // ── Image loader ─────────────────────────────────────────
    async _loadImg(src) {
        return new Promise(resolve => {
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
    },

    // ── Bootstrap a new PDF document ─────────────────────────
    async init(headerSrc = 'AMK Header.png', footerSrc = 'AKM Footer.png') {
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        this.headerImg = await this._loadImg(headerSrc);
        this.footerImg = await this._loadImg(footerSrc);
        this.drawHeaderFooter();
        return this.MT; // returns starting y
    },

    // ── Header & footer on every page ───────────────────────
    drawHeaderFooter() {
        const { doc, PW, PH, IMG_H } = this;
        if (this.headerImg) { try { doc.addImage(this.headerImg, 'PNG', 0, 0, PW, IMG_H); } catch(e){} }
        if (this.footerImg) { try { doc.addImage(this.footerImg, 'PNG', 0, PH - IMG_H, PW, IMG_H); } catch(e){} }
    },

    newPage() {
        this.doc.addPage();
        this.drawHeaderFooter();
        return this.MT;
    },

    // ── Typography helpers ───────────────────────────────────
    bold(size = 10)   { this.doc.setFont('times', 'bold');   this.doc.setFontSize(size); this.doc.setTextColor(0,0,0); },
    normal(size = 10) { this.doc.setFont('times', 'normal'); this.doc.setFontSize(size); this.doc.setTextColor(0,0,0); },
    italic(size = 10) { this.doc.setFont('times', 'italic'); this.doc.setFontSize(size); this.doc.setTextColor(0,0,0); },

    // ── Value helpers ────────────────────────────────────────
    v(fd, k, fb = '') {
        const val = fd[k];
        return (val === undefined || val === null || val === '') ? fb : String(val);
    },
    ar(fd, k) {
        return Array.isArray(fd[k]) ? fd[k].join(', ') : (fd[k] || '—');
    },
    dt(fd, k) {
        const s = fd[k];
        if (!s) return '—';
        try { return new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
        catch(e) { return s; }
    },
    tm(fd, k) {
        const t = fd[k];
        if (!t || !t.includes(':')) return t || '—';
        const [h, m] = t.split(':');
        const hr = parseInt(h);
        return `${hr % 12 || 12}:${m}${hr < 12 ? ' AM' : ' PM'}`;
    },

    // ── Section bar ──────────────────────────────────────────
    sectionBar(y, text) {
        const { doc, ML, CW } = this;
        doc.setDrawColor(0,0,0); doc.setFillColor(255,255,255);
        doc.rect(ML, y, CW, 7, 'FD');
        this.bold(10);
        doc.text(text.toUpperCase(), ML+2, y+5);
        return y + 9;
    },

    // ── Standard label:value row (2-column) ──────────────────
    tRow(y, label, value) {
        const { doc, ML, CW, CONTENT_BOTTOM } = this;
        const rowH = 6, col1 = 74, col2 = CW - col1 - 4;
        if (y + rowH > CONTENT_BOTTOM) y = this.newPage();
        doc.setDrawColor(0,0,0);
        doc.setFillColor(240,240,240); doc.rect(ML, y, col1, rowH, 'FD');
        doc.setFillColor(255,255,255); doc.rect(ML+col1, y, 4, rowH, 'FD');
        doc.rect(ML+col1+4, y, col2, rowH, 'FD');
        this.bold(10);  doc.text(String(label), ML+1.5, y+4);
        this.normal(10); doc.text(':', ML+col1+1.2, y+4);
        const lines = doc.splitTextToSize(String(value || '—'), col2-3);
        doc.text(lines[0], ML+col1+5.5, y+4);
        return y + rowH;
    },

    // ── Checkbox row with tick marks ─────────────────────────
    checkRow(y, rowLabel, options) {
        const { doc, ML, CW, CONTENT_BOTTOM } = this;
        const rowH = 7, col1 = 74, colonW = 4, boxSz = 3.2;
        if (y + rowH > CONTENT_BOTTOM) y = this.newPage();
        doc.setDrawColor(0,0,0); doc.setFillColor(240,240,240);
        doc.rect(ML, y, col1, rowH, 'FD');
        this.bold(10); doc.text(String(rowLabel), ML+1.5, y + rowH/2 + 1.2);
        doc.setFillColor(255,255,255); doc.rect(ML+col1, y, colonW, rowH, 'FD');
        this.normal(10); doc.text(':', ML+col1+1.2, y + rowH/2 + 1.2);
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
            this.normal(10); doc.text(String(opt.label), ox+boxSz+1.2, oy+boxSz-0.4);
        });
        return y + rowH;
    },

    // ── Build checkbox options from form data ─────────────────
    buildOpts(fd, field, optLabels) {
        const raw = fd[field];
        const saved = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        return optLabels.map(l => ({ label: l, checked: saved.includes(l) }));
    },

    // ── Photos pages ─────────────────────────────────────────
    renderPhotos(fd) {
        const photos = Array.isArray(fd._photos) && fd._photos.length ? fd._photos : [];
        if (!photos.length) return;
        const { doc, ML, CW, PW } = this;
        const imgW = 158, imgH = 102, capH = 6, gapY = 8, perPage = 2;
        for (let i = 0; i < photos.length; i++) {
            if (i % perPage === 0) {
                const y0 = this.newPage();
                this.bold(11);
                doc.text('Annexure-III: Photograph of Vehicle', PW/2, y0+5, { align:'center' });
                this._photosY = y0 + 14;
            }
            const slot = i % perPage;
            const iy   = this._photosY + slot * (imgH + capH + gapY);
            const imgX = ML + (CW - imgW) / 2;
            doc.setDrawColor(0,0,0);
            try {
                const fmt = photos[i].dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(photos[i].dataUrl, fmt, imgX, iy, imgW, imgH);
            } catch(e) { doc.setFillColor(240,240,240); doc.rect(imgX, iy, imgW, imgH, 'FD'); }
            doc.setDrawColor(0,0,0); doc.setLineWidth(0.4);
            doc.rect(imgX, iy, imgW, imgH);
            doc.setLineWidth(0.2);
            const raw = photos[i].caption || photos[i].name.replace(/\.[^/.]+$/, '');
            const nm  = raw.length > 50 ? raw.slice(0,48)+'…' : raw;
            this.normal(10); doc.text(nm, PW/2, iy + imgH + 4.5, { align:'center' });
        }
    },

    // ── QR code page ─────────────────────────────────────────
    renderQR(fd) {
        const qr = fd._qr;
        if (!qr) return;
        const { doc, ML, CW, PW } = this;
        let y = this.newPage();
        this.bold(12);
        doc.text('Annexure-IV: QR Code for Video of Vehicle', PW/2, y+5, { align:'center' }); y += 14;
        this.bold(10);
        doc.text(this.v(fd,'qr_label','Document QR Code'), PW/2, y, { align:'center' }); y += 10;
        const qrSize = 60, qrX = (PW - qrSize) / 2;
        try {
            const fmt = qr.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(qr.dataUrl, fmt, qrX, y, qrSize, qrSize);
        } catch(e) { doc.setDrawColor(0,0,0); doc.rect(qrX, y, qrSize, qrSize); }
        y += qrSize + 6;
        if (fd.qr_url) {
            this.normal(10);
            doc.text(fd.qr_url, PW/2, y, { align:'center', maxWidth: CW }); y += 8;
        }
        y += 6;
        doc.setDrawColor(180,180,180); doc.setLineWidth(0.3);
        doc.line(ML, y, ML+CW, y); doc.setLineWidth(0.2); doc.setDrawColor(0,0,0);
        y += 7;
        this.bold(10); doc.text('Instructions for use:', ML, y); y += 7;
        this.normal(10);
        ['Download & install any QR code scanner/reader.',
         'Scan the attached QR code.',
         'Open the link using Google chrome/any browser.'
        ].forEach(line => {
            doc.circle(ML+1.5, y-1.2, 0.8, 'F');
            const wrapped = doc.splitTextToSize(line, CW-8);
            doc.text(wrapped, ML+6, y); y += wrapped.length * 5.5;
        });
    },

    // ── Save the PDF ──────────────────────────────────────────
    save(filename) {
        this.doc.save(filename);
        UI.showToast('PDF downloaded!', 'success');
    },

    // ── Main entry point ─────────────────────────────────────
    // Delegates all content rendering to the form-specific template
    async generate(formData, template) {
        UI.showToast('Generating PDF…', 'info', 15000);
        try {
            await template.render(formData, this);
            UI.showToast('PDF downloaded!', 'success');
        } catch(err) {
            console.error('PDF error:', err);
            UI.showToast('PDF failed: ' + err.message, 'error');
        }
    }
};