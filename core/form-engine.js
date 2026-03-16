// ═══════════════════════════════════════════════════════════
//  core/form-engine.js  —  Generic form renderer
//  ► Reads any schema.js and builds the form UI automatically.
//  ► Never touch this file to add a new form — add a schema instead.
//  Requires: ui.js
// ═══════════════════════════════════════════════════════════
const FormEngine = {

    schema: null,
    uploadedPhotos: [],
    uploadedQR: null,

    // Load a form schema and render nav + sections
    init(schema, container, navContainer) {
        this.schema = schema;
        this._renderNav(navContainer);
        this._renderSections(container);
        this._bindPillGroups();
    },

    // ── Navigation sidebar ────────────────────────────────────
    _renderNav(nav) {
        if (!nav) return;
        nav.innerHTML = '';
        this.schema.navGroups.forEach(group => {
            const label = document.createElement('div');
            label.className = 'nav-section-label';
            label.textContent = group.label;
            nav.appendChild(label);
            group.sections.forEach(sectionId => {
                const sec = this.schema.sections.find(s => s.id === sectionId);
                if (!sec) return;
                const item = document.createElement('div');
                item.className = 'section-nav-item';
                item.innerHTML = `<span class="nav-icon">${sec.icon || '📄'}</span> ${sec.title}`;
                item.onclick = () => this.showSection(sectionId, item);
                item.dataset.sectionId = sectionId;
                nav.appendChild(item);
            });
        });
        // Activate first item
        const first = nav.querySelector('.section-nav-item');
        if (first) first.classList.add('active');
    },

    // ── Section panels ───────────────────────────────────────
    _renderSections(container) {
        if (!container) return;
        container.innerHTML = '';
        this.schema.sections.forEach((sec, idx) => {
            const div = document.createElement('div');
            div.className = 'report-section' + (idx === 0 ? ' active' : '');
            div.id = `sec-${sec.id}`;
            div.innerHTML = `
                <div class="section-card">
                    <div class="section-heading">${sec.icon || ''} ${sec.title}</div>
                    <div id="sec-fields-${sec.id}"></div>
                </div>`;
            container.appendChild(div);
            this._renderFields(sec, document.getElementById(`sec-fields-${sec.id}`));
        });
    },

    // ── Field rendering ──────────────────────────────────────
    _renderFields(section, container) {
        if (!container) return;
        const rows = this._groupIntoRows(section.fields);
        rows.forEach(row => {
            if (row.length === 1 && row[0].fullWidth) {
                container.appendChild(this._renderField(row[0]));
            } else {
                const rowDiv = document.createElement('div');
                rowDiv.className = row.length >= 3 ? 'form-row-3' : 'form-row';
                row.forEach(f => rowDiv.appendChild(this._renderField(f)));
                container.appendChild(rowDiv);
            }
        });
    },

    _groupIntoRows(fields) {
        const rows = [];
        let current = [];
        fields.forEach(f => {
            if (f.fullWidth) {
                if (current.length) { rows.push(current); current = []; }
                rows.push([f]);
            } else {
                current.push(f);
                if (current.length === (f.rowSize || 2)) { rows.push(current); current = []; }
            }
        });
        if (current.length) rows.push(current);
        return rows;
    },

    _renderField(f) {
        const wrap = document.createElement('div');
        wrap.className = 'form-group';
        if (f.fullWidth) wrap.style.gridColumn = '1/-1';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = f.label;
        wrap.appendChild(label);

        switch (f.type) {
            case 'text':
            case 'number':
            case 'email': {
                const inp = document.createElement('input');
                inp.type = f.type;
                inp.className = 'form-control';
                inp.dataset.field = f.id;
                inp.placeholder = f.placeholder || '';
                wrap.appendChild(inp);
                break;
            }
            case 'date': {
                const inp = document.createElement('input');
                inp.type = 'date';
                inp.className = 'form-control';
                inp.dataset.field = f.id;
                wrap.appendChild(inp);
                break;
            }
            case 'time': {
                const inp = document.createElement('input');
                inp.type = 'time';
                inp.className = 'form-control';
                inp.dataset.field = f.id;
                wrap.appendChild(inp);
                break;
            }
            case 'textarea': {
                const ta = document.createElement('textarea');
                ta.className = 'form-control';
                ta.dataset.field = f.id;
                ta.rows = f.rows || 2;
                ta.placeholder = f.placeholder || '';
                wrap.appendChild(ta);
                break;
            }
            case 'select': {
                const sel = document.createElement('select');
                sel.className = 'form-control';
                sel.dataset.field = f.id;
                const blank = document.createElement('option');
                blank.value = '';
                blank.textContent = f.placeholder || 'Select…';
                sel.appendChild(blank);
                (f.options || []).forEach(o => {
                    const opt = document.createElement('option');
                    opt.value = typeof o === 'object' ? o.value : o;
                    opt.textContent = typeof o === 'object' ? o.label : o;
                    sel.appendChild(opt);
                });
                wrap.appendChild(sel);
                break;
            }
            case 'checkbox':
            case 'pills': {
                const group = document.createElement('div');
                group.className = 'pill-group';
                group.dataset.checkboxGroup = f.id;
                if (!f.multi) group.dataset.single = 'true';
                if (f.toggleTarget) group.dataset.toggleTarget = f.toggleTarget;
                (f.options || []).forEach(o => {
                    const span = document.createElement('span');
                    span.className = 'pill';
                    span.dataset.value = o;
                    span.textContent = o;
                    span.onclick = () => {
                        this._togglePill(span);
                        if (f.toggleTarget) this._toggleDetail(f.toggleTarget, group);
                    };
                    group.appendChild(span);
                });
                wrap.appendChild(group);
                // Conditional detail box
                if (f.toggleTarget) {
                    const detail = document.createElement('div');
                    detail.id = f.toggleTarget;
                    detail.style.display = 'none';
                    detail.style.marginTop = '0.5rem';
                    const ta = document.createElement('textarea');
                    ta.className = 'form-control';
                    ta.dataset.field = f.detailField || (f.id + '_detail');
                    ta.rows = 2;
                    ta.placeholder = f.detailPlaceholder || 'Provide details…';
                    detail.appendChild(ta);
                    wrap.appendChild(detail);
                }
                break;
            }
            case 'photos': {
                wrap.innerHTML += `
                    <div id="photo-upload-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem;"></div>
                    <label style="display:inline-flex;align-items:center;gap:8px;padding:0.6rem 1.2rem;background:var(--gray-100);border:2px dashed var(--gray-200);border-radius:var(--radius-sm);cursor:pointer;font-size:0.875rem;color:var(--gray-600);" id="photo-upload-label">
                        <span style="font-size:1.2rem;">📁</span> Choose Photos (up to 12)
                        <input type="file" id="photo-input" accept="image/*" multiple style="display:none;" onchange="FormEngine.handlePhotoUpload(this)">
                    </label>
                    <p style="margin-top:0.5rem;font-size:0.75rem;color:var(--gray-400);">JPG, PNG supported. Max 12 photos, 2MB each.</p>`;
                break;
            }
            case 'qr': {
                wrap.innerHTML += `
                    <p style="margin-bottom:1rem;color:var(--gray-600);font-size:0.875rem;">Upload a QR code image</p>
                    <div id="qr-preview-container" style="display:none;margin-bottom:1rem;">
                        <img id="qr-preview-img" src="" style="width:160px;height:160px;object-fit:contain;border:2px solid var(--gray-200);border-radius:8px;padding:8px;background:white;" alt="QR">
                        <div style="margin-top:0.5rem;display:flex;gap:8px;align-items:center;">
                            <span id="qr-filename" style="font-size:0.75rem;color:var(--gray-400);"></span>
                            <button onclick="FormEngine.removeQR()" style="background:var(--danger);color:white;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:0.75rem;">Remove</button>
                        </div>
                    </div>
                    <label style="display:inline-flex;align-items:center;gap:8px;padding:0.6rem 1.2rem;background:var(--gray-100);border:2px dashed var(--gray-200);border-radius:var(--radius-sm);cursor:pointer;font-size:0.875rem;color:var(--gray-600);" id="qr-upload-label">
                        <span>📲</span> Upload QR Code Image
                        <input type="file" id="qr-input" accept="image/*" style="display:none;" onchange="FormEngine.handleQRUpload(this)">
                    </label>`;
                const qrLabelField = document.createElement('div');
                qrLabelField.className = 'form-group';
                qrLabelField.style.marginTop = '1rem';
                qrLabelField.innerHTML = `<label class="form-label">QR Code Label / Caption</label>
                    <input type="text" class="form-control" data-field="qr_label" placeholder="e.g. BRTA Verification Link">`;
                wrap.appendChild(qrLabelField);
                break;
            }
            case 'owner-repeater': {
                wrap.innerHTML += `<div id="owner-rows"></div>
                    <button type="button" class="btn btn-outline btn-sm" style="margin-top:0.5rem;" onclick="FormEngine.addOwnerRow()">+ Add Another Owner</button>`;
                setTimeout(() => FormEngine._renderOwnerRow(1), 0);
                break;
            }
            case 'dynamic-checks': {
                // For inspection sections built from a list of check rows
                const checksDiv = document.createElement('div');
                checksDiv.id = `${f.id}-checks`;
                wrap.appendChild(checksDiv);
                setTimeout(() => {
                    checksDiv.innerHTML = (f.rows || []).map(([lbl, fld, opts]) =>
                        this._buildCheckRow(lbl, fld, opts)
                    ).join('');
                }, 0);
                break;
            }
        }
        return wrap;
    },

    // ── Pill toggle ──────────────────────────────────────────
    _togglePill(el) {
        const group = el.closest('[data-checkbox-group]');
        if (group?.dataset.single === 'true') {
            group.querySelectorAll('.pill').forEach(p => p.classList.remove('checked'));
        }
        el.classList.toggle('checked');
    },

    _toggleDetail(targetId, group) {
        const box = document.getElementById(targetId);
        if (!box) return;
        const checked = [...group.querySelectorAll('.pill.checked')].map(p => p.dataset.value);
        box.style.display = checked.includes('Yes') ? 'block' : 'none';
    },

    _bindPillGroups() {
        // Fallback for any manually-written pill groups not from schema
        document.querySelectorAll('.pill').forEach(p => {
            if (!p.onclick) p.onclick = () => this._togglePill(p);
        });
    },

    // ── Checkbox row builder (for dynamic-checks) ────────────
    _buildCheckRow(label, field, options, single = true) {
        return `<div class="form-group">
            <label class="form-label">${label}</label>
            <div class="pill-group" data-checkbox-group="${field}" data-single="${single}">
                ${options.map(o => `<span class="pill" data-value="${o}" onclick="FormEngine._togglePill(this)">${o}</span>`).join('')}
            </div>
        </div>`;
    },

    // ── Photo handling ───────────────────────────────────────
    handlePhotoUpload(input) {
        const files = Array.from(input.files);
        const remaining = 12 - this.uploadedPhotos.length;
        if (files.length > remaining) UI.showToast(`Max 12 photos. You can add ${remaining} more.`, 'error');
        files.slice(0, remaining).forEach(file => {
            if (file.size > 2 * 1024 * 1024) { UI.showToast(`${file.name} is too large (max 2MB)`, 'error'); return; }
            const reader = new FileReader();
            reader.onload = e => {
                const caption = file.name.replace(/\.[^/.]+$/, '');
                this.uploadedPhotos.push({ name: file.name, caption, dataUrl: e.target.result });
                this.renderPhotoGrid();
            };
            reader.readAsDataURL(file);
        });
        input.value = '';
    },

    renderPhotoGrid() {
        const grid = document.getElementById('photo-upload-grid');
        if (!grid) return;
        grid.innerHTML = this.uploadedPhotos.map((p, i) => `
            <div style="border-radius:var(--r-sm);border:1px solid var(--gray-200);overflow:hidden;display:flex;flex-direction:column;">
                <div style="position:relative;aspect-ratio:4/3;">
                    <img src="${p.dataUrl}" style="width:100%;height:100%;object-fit:cover;">
                    <button onclick="FormEngine.removePhoto(${i})" style="position:absolute;top:4px;right:4px;background:rgba(220,38,38,0.9);color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">×</button>
                </div>
                <div style="padding:4px 6px;background:#f9f9f9;border-top:1px solid var(--gray-200);">
                    <input type="text" value="${p.caption || ''}" placeholder="Photo caption"
                        onchange="FormEngine.uploadedPhotos[${i}].caption=this.value;"
                        style="width:100%;font-size:0.75rem;border:none;background:transparent;outline:none;color:#333;padding:2px 0;">
                </div>
            </div>`).join('');
        const label = document.getElementById('photo-upload-label');
        if (label) label.style.display = this.uploadedPhotos.length >= 12 ? 'none' : 'inline-flex';
    },

    removePhoto(index) {
        this.uploadedPhotos.splice(index, 1);
        this.renderPhotoGrid();
    },

    // ── QR handling ──────────────────────────────────────────
    handleQRUpload(input) {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 1 * 1024 * 1024) { UI.showToast('QR image too large (max 1MB)', 'error'); return; }
        const reader = new FileReader();
        reader.onload = e => {
            this.uploadedQR = { name: file.name, dataUrl: e.target.result };
            const img = document.getElementById('qr-preview-img');
            const fn  = document.getElementById('qr-filename');
            const con = document.getElementById('qr-preview-container');
            const lbl = document.getElementById('qr-upload-label');
            if (img) img.src = e.target.result;
            if (fn)  fn.textContent = file.name;
            if (con) con.style.display = 'block';
            if (lbl) lbl.style.display = 'none';
        };
        reader.readAsDataURL(file);
        input.value = '';
    },

    removeQR() {
        this.uploadedQR = null;
        const img = document.getElementById('qr-preview-img');
        const con = document.getElementById('qr-preview-container');
        const lbl = document.getElementById('qr-upload-label');
        if (img) img.src = '';
        if (con) con.style.display = 'none';
        if (lbl) lbl.style.display = 'inline-flex';
    },

    // ── Owner repeater ───────────────────────────────────────
    _ownerCount: 1,
    addOwnerRow() {
        this._ownerCount++;
        this._renderOwnerRow(this._ownerCount);
    },

    _renderOwnerRow(n) {
        const container = document.getElementById('owner-rows');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'form-row-3 owner-row';
        div.style.marginBottom = '1rem';
        div.innerHTML = `
            <div class="form-group">
                <label class="form-label">Owner's Name</label>
                <input type="text" class="form-control" data-field="owner_${n}_name" placeholder="">
            </div>
            <div class="form-group">
                <label class="form-label">Father's Name</label>
                <input type="text" class="form-control" data-field="owner_${n}_father" placeholder="">
            </div>
            <div class="form-group">
                <label class="form-label">Owner's Address</label>
                <input type="text" class="form-control" data-field="owner_${n}_address" placeholder="">
            </div>`;
        container.appendChild(div);
    },

    // ── Section navigation ───────────────────────────────────
    showSection(id, navItem) {
        document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.section-nav-item').forEach(n => n.classList.remove('active'));
        const sec = document.getElementById(`sec-${id}`);
        if (sec) sec.classList.add('active');
        if (navItem) navItem.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ── Collect all form data ────────────────────────────────
    collect() {
        const data = {};
        document.querySelectorAll('[data-field]').forEach(el => {
            if (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                data[el.dataset.field] = el.value;
            }
        });
        document.querySelectorAll('[data-checkbox-group]').forEach(group => {
            const key = group.dataset.checkboxGroup;
            const checked = [...group.querySelectorAll('.pill.checked')].map(p => p.dataset.value);
            data[key] = checked;
        });
        data._photos  = this.uploadedPhotos;
        data._qr      = this.uploadedQR;
        data._formType = this.schema?.id || 'vehicle-valuation';
        return data;
    },

    // ── Populate form from saved data ────────────────────────
    populate(data) {
        if (!data) return;
        document.querySelectorAll('[data-field]').forEach(el => {
            if (data[el.dataset.field] !== undefined) el.value = data[el.dataset.field];
        });
        document.querySelectorAll('[data-checkbox-group]').forEach(group => {
            const saved = data[group.dataset.checkboxGroup];
            if (!Array.isArray(saved)) return;
            group.querySelectorAll('.pill').forEach(p => {
                p.classList.toggle('checked', saved.includes(p.dataset.value));
            });
            // Restore conditional detail visibility
            const targetId = group.dataset.toggleTarget;
            if (targetId) this._toggleDetail(targetId, group);
        });
        if (Array.isArray(data._photos)) {
            this.uploadedPhotos = data._photos.map(p => ({
                ...p, caption: p.caption ?? p.name.replace(/\.[^/.]+$/, '')
            }));
            this.renderPhotoGrid();
        }
        if (data._qr) {
            this.uploadedQR = data._qr;
            const img = document.getElementById('qr-preview-img');
            const fn  = document.getElementById('qr-filename');
            const con = document.getElementById('qr-preview-container');
            const lbl = document.getElementById('qr-upload-label');
            if (img) img.src = data._qr.dataUrl;
            if (fn)  fn.textContent = data._qr.name;
            if (con) con.style.display = 'block';
            if (lbl) lbl.style.display = 'none';
        }
    }
};