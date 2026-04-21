// ═══════════════════════════════════════════════════════════
//  forms/ebl-flat/schema.js
//  Defines the complete form_data structure for EBL Flat
//  Valuation. Used by collectFormData() and populateFormData()
//  in ebl-flat-form.html and by EBLFlatPDF.render() in
//  pdf-template.js.
//
//  Sections:
//    1.  Cover Page
//    2.  Cover Letter + Flat Valuation Table
//    3.  Summary
//    A.  Particulars of Account
//    B.  Particulars of Property Owner
//    C.  Schedule of Property
//    D.  Property Identification (Property + Flat Chowhoddi)
//    E.  Other Features of Property
//    F.  Civil Construction of Property
//    G.  Flat Specification + Area Table
//    H.  Construction Completion % Table  (dynamic rows)
//    I.  Floor-wise Building Value Table  (dynamic rows)
//    J.  Price Reference
//    _   Photo annexures (binary blobs)
// ═══════════════════════════════════════════════════════════

const EBLFlatSchema = {

    // ── 1. COVER PAGE ────────────────────────────────────────
    reference_account_name : '',   // text
    reference_no           : '',   // text
    recipient_name         : '',   // text
    recipient_address      : '',   // textarea  (multiline)

    // ── 2. COVER LETTER ──────────────────────────────────────
    letter_ref   : '',             // text   e.g. "AMK/EBPLC/2025/..."
    letter_date  : '',             // date   ISO string "YYYY-MM-DD"
    comm_medium  : '',             // text   e.g. "email"
    comm_date    : '',             // date
    comm_person  : '',             // text

    // Flat Valuation Table (Page 2) — all values stored as
    // formatted strings (with commas) matching the inputs.
    flat_pmv_area_plan   : '',     // number string  — Flat Area as per Plan (a)
    flat_pmv_area_phys   : '',     // number string  — Flat Area as per Physical (b)
    flat_pmv_rate        : '',     // number string  — Present Rate per Sft. (c)
    flat_pmv_val_plan    : '',     // computed/readonly  d = a*c
    flat_pmv_val_phys    : '',     // computed/readonly  e = b*c
    flat_park_val_plan   : '',     // user-entered  — Car Parking, Plan value
    flat_park_val_phys   : '',     // user-entered  — Car Parking, Physical value
    flat_total_val_plan  : '',     // computed  — Total Value of the Flat, Plan
    flat_total_val_phys  : '',     // computed  — Total Value of the Flat, Physical
    flat_dep_pct         : '',     // number string  — Depreciation % (user-entered)
    flat_dep_val_plan    : '',     // computed  — Depreciation amount, Plan
    flat_dep_val_phys    : '',     // computed  — Depreciation amount, Physical
    flat_net_val_plan    : '',     // computed  — Net Value of the Flat, Plan
    flat_net_val_phys    : '',     // computed  — Net Value of the Flat, Physical
    flat_forced_val_plan : '',     // computed  — Forced Sale Value (80% of net), Plan
    flat_forced_val_phys : '',     // computed  — Forced Sale Value (80% of net), Physical

    // Signatories
    valuer_1_name        : '',     // select value
    valuer_1_designation : '',     // auto-filled from select data-desig
    valuer_2_name        : '',     // select value
    valuer_2_designation : '',     // auto-filled

    // ── 3. SUMMARY ───────────────────────────────────────────
    file_receiving_date    : '',   // date
    valuation_ref_no       : '',   // text
    valuation_date         : '',   // date
    property_location      : '',   // text  (also used as page title)
    valuation_conducted_by : '',   // textarea
    surveyor_name          : '',   // text
    surveyor_designation   : '',   // text
    surveyor_nid           : '',   // text
    surveyor_contact       : '',   // text
    property_type          : '',   // select  "Freehold" | "Leasehold"
    property_seller_type   : '',   // text
    deviation_plinth       : '',   // text  — percentage
    deviation_floor        : '',   // text  — e.g. "1 to 5"

    // ── A. PARTICULARS OF ACCOUNT ────────────────────────────
    ac_name              : '',     // text
    father_name          : '',     // text  — A/C holder father
    mother_name          : '',     // text  — A/C holder mother
    present_address      : '',     // textarea
    permanent_address    : '',     // textarea
    contact_number       : '',     // text
    nid_number           : '',     // text
    contact_person_name  : '',     // text
    mobile_number        : '',     // text

    // ── B. PARTICULARS OF PROPERTY OWNER ────────────────────
    owner_name             : '',   // text
    owner_father           : '',   // text
    owner_mother           : '',   // text
    owner_present_address  : '',   // textarea
    owner_perm_address     : '',   // textarea
    owner_contact          : '',   // text
    owner_nid              : '',   // text
    owner_relationship     : '',   // text  — relationship with borrower

    // ── C. SCHEDULE OF PROPERTY ──────────────────────────────
    district              : '',    // text
    thana_upazila         : '',    // text
    mouza                 : '',    // text
    jl_no                 : '',    // text
    local_authority       : '',    // text
    land_office           : '',    // text
    sub_register_office   : '',    // text
    khatian_no            : '',    // text
    dag_no                : '',    // text
    deed_number_date      : '',    // text  — "Deed No & Registration Date"
    mutation_khatian_no   : '',    // text
    jote_no               : '',    // text
    dcr_no                : '',    // text
    grr_no                : '',    // text
    land_type_ldtr        : '',    // text
    last_ownership_transfer: '',   // text
    property_address      : '',    // textarea
    total_area_deed       : '',    // text  — Area of Land as per Deed
    way_to_visit          : '',    // textarea

    // ── D. PROPERTY IDENTIFICATION ───────────────────────────
    // Property-level Chowhoddi (4-column table)
    north_deed         : '',       // textarea
    prop_north_present : '',       // textarea
    prop_north_demar   : '',       // textarea
    north_road         : '',       // textarea
    south_deed         : '',
    prop_south_present : '',
    prop_south_demar   : '',
    south_road         : '',
    east_deed          : '',
    prop_east_present  : '',
    prop_east_demar    : '',
    east_road          : '',
    west_deed          : '',
    prop_west_present  : '',
    prop_west_demar    : '',
    west_road          : '',

    // Flat-level Chowhoddi (2-column table)
    flat_north_present : '',       // textarea
    flat_north_demar   : '',
    flat_south_present : '',
    flat_south_demar   : '',
    flat_east_present  : '',
    flat_east_demar    : '',
    flat_west_present  : '',
    flat_west_demar    : '',

    // ── E. OTHER FEATURES OF PROPERTY ───────────────────────
    electricity          : '',
    gas                  : '',
    water_supply         : '',
    sewerage             : '',
    internet             : '',
    satellite_location   : '',
    access_road_status   : '',
    nature_of_land       : '',
    type_of_land         : '',
    plot_location        : '',
    description_of_property : '',  // textarea
    usage_restriction    : '',
    flood_possibility    : '',
    land_classification  : '',
    status_master_plan   : '',
    current_possession   : '',
    annual_income        : '',
    public_establishments: '',     // textarea
    dist_prominent       : '',
    dist_main_road       : '',
    dist_branch_office   : '',
    present_use          : '',
    future_prospect      : '',     // textarea

    // ── F. CIVIL CONSTRUCTION OF PROPERTY ───────────────────
    structure_type      : '',
    foundation_type     : '',
    stories_plan        : '',      // text  — No. of stories as per plan
    stories_physical    : '',      // text  — No. of stories as per physical
    approval_authority  : '',
    plan_no             : '',      // Sarok number
    plan_date           : '',      // date
    occupancy_category  : '',
    age_of_structure    : '',      // number (years) — drives depreciation calc
    construction_from   : '',      // text  e.g. "2010"
    construction_to     : '',      // text  e.g. "2015"
    shape_of_building   : '',
    project_name        : '',
    developer_name      : '',
    owner_name_plan     : '',
    security_guards     : '',
    commercial          : '',
    garden_area         : '',
    generator           : '',
    lift                : '',
    cctv                : '',
    fire_fighting       : '',
    front_face          : '',

    // ── G. FLAT SPECIFICATION ────────────────────────────────
    floor_number        : '',      // text  — which floor the flat is on
    flat_number         : '',      // text
    direction_of_flat   : '',      // text
    unit_per_plan       : '',      // text
    unit_per_inspection : '',      // text
    number_of_room      : '',      // text
    dining_drawing_room : '',      // text
    number_of_bathroom  : '',      // text
    number_of_balcony   : '',      // text

    // Area Table — static 5-row table (Flat Area / Common / Floor / Plinth / Parking)
    // Stored as an array of objects; order matches the HTML rows.
    _area_rows: [
        // { particulars, area_plan, area_phys, dev_sft, dev_pct }
        { particulars: 'Flat Area except common space', area_plan: '', area_phys: '', dev_sft: '', dev_pct: '' },
        { particulars: 'Common Area',                   area_plan: '', area_phys: '', dev_sft: '', dev_pct: '' },
        { particulars: 'Floor Area',                    area_plan: '', area_phys: '', dev_sft: '', dev_pct: '' },
        { particulars: 'Plinth Area',                   area_plan: '', area_phys: '', dev_sft: '', dev_pct: '' },
        { particulars: 'Parking Area',                  area_plan: '', area_phys: '', dev_sft: '', dev_pct: '' },
    ],

    // ── H. CONSTRUCTION COMPLETION % ────────────────────────
    // Dynamic — one row per floor added via eblAddFloor().
    // PDF reads this array directly.
    _completion_rows: [
        // {
        //   floor      : 'Ground Floor',
        //   structure  : '',   // 0-100
        //   brick      : '',
        //   wood       : '',
        //   metal      : '',
        //   plumbing   : '',
        //   electrical : '',
        //   plaster    : '',
        //   gen_floor  : '',
        //   aluminium  : '',
        //   paint      : '',
        //   work_pct   : '',   // computed weighted %
        // }
    ],

    // ── I. FLOOR-WISE BUILDING VALUE ─────────────────────────
    // Dynamic — Foundation row is always first, then Ground Floor,
    // then any floors added by eblAddFloor().
    // Calculated cells (est_plan, est_phys, present_plan, present_phys)
    // are saved as displayed so the PDF can read them directly.
    // Manual-override flag is NOT persisted (recalculated on load).
    _cost_rows: [
        // {
        //   floor        : 'Foundation',
        //   area_plan    : '',   // (a) Sft.
        //   area_phys    : '',   // (b) Sft.
        //   cost_per_sft : '',   // (c) BDT
        //   est_plan     : '',   // (d = a*c) computed or manual
        //   est_phys     : '',   // (e = b*c)
        //   work_pct     : '',   // (f) %
        //   present_plan : '',   // (g = d*f)
        //   present_phys : '',   // (h = e*f)
        //   est_plan_manual     : false,
        //   est_phys_manual     : false,
        //   present_plan_manual : false,
        //   present_phys_manual : false,
        // }
    ],

    // ── J. PRICE REFERENCE ───────────────────────────────────
    max_price         : '',
    min_price         : '',
    last_buy_sell     : '',
    price_justification: '',       // textarea

    // ── ANNEXURE PHOTOS ──────────────────────────────────────
    // Each entry: { name: string, caption: string, dataUrl: string }
    _ann1_photos : [],   // Annexure-I:   Property Photographs (up to 14)
    _ann2_photos : [],   // Annexure-II:  Hand Sketch Map (1)
    _ann3_photos : [],   // Annexure-III: Mouza Map (1)
    _ann4_photos : [],   // Annexure-IV:  Location on Google Map (up to 2)
    _ann5_photos : [],   // Annexure-V:   QR Code for Video (1)
    _ann6_photos : [],   // Annexure-VI:  QR Code for Map (1)
    _ann7_photos : [],   // Annexure-VII: SRO Mouza Value (1)
    _ann8_photos : [],   // Annexure-VIII:Status in Area Master Plan (1)

    // ── ANNEXURE DESCRIPTIONS ────────────────────────────────
    annexure4_desc : '',           // textarea — location map description

};

// ── collectFormData() ────────────────────────────────────────
// Reads all data-field inputs + dynamic table rows from the DOM
// and returns a plain object matching EBLFlatSchema.
function collectFormData() {
    const fd = {};

    // 1. All simple data-field inputs / selects / textareas
    document.querySelectorAll('[data-field]').forEach(el => {
        fd[el.dataset.field] = el.value;
    });

    // 2. Static area table (_area_rows)
    const areaBody = document.querySelector('#ebl-tbl-area tbody');
    if (areaBody) {
        fd._area_rows = Array.from(areaBody.rows).map(row => {
            const ins = row.querySelectorAll('input');
            return {
                particulars : row.cells[0]?.textContent?.trim() || '',
                area_plan   : ins[0]?.value || '',
                area_phys   : ins[1]?.value || '',
                dev_sft     : ins[2]?.value || '',
                dev_pct     : ins[3]?.value || '',
            };
        });
    }

    // 3. Construction completion rows (_completion_rows)
    fd._completion_rows = Array.from(
        document.querySelectorAll('#ebl-comp-body tr')
    ).map(row => {
        const ins = row.querySelectorAll('input');
        return {
            floor      : ins[0]?.value  || '',
            structure  : ins[1]?.value  || '',
            brick      : ins[2]?.value  || '',
            wood       : ins[3]?.value  || '',
            metal      : ins[4]?.value  || '',
            plumbing   : ins[5]?.value  || '',
            electrical : ins[6]?.value  || '',
            plaster    : ins[7]?.value  || '',
            gen_floor  : ins[8]?.value  || '',
            aluminium  : ins[9]?.value  || '',
            paint      : ins[10]?.value || '',
            work_pct   : ins[11]?.value || '',
        };
    });

    // 4. Building value rows (_cost_rows)
    fd._cost_rows = Array.from(
        document.querySelectorAll('#ebl-cost-body tr')
    ).map(row => {
        const ins = row.querySelectorAll('input');
        return {
            floor              : ins[0]?.value || '',
            area_plan          : ins[1]?.value || '',
            area_phys          : ins[2]?.value || '',
            cost_per_sft       : ins[3]?.value || '',
            est_plan           : ins[4]?.value || '',
            est_phys           : ins[5]?.value || '',
            work_pct           : ins[6]?.value || '',
            present_plan       : ins[7]?.value || '',
            present_phys       : ins[8]?.value || '',
            est_plan_manual    : ins[4]?.dataset.manual === '1',
            est_phys_manual    : ins[5]?.dataset.manual === '1',
            present_plan_manual: ins[7]?.dataset.manual === '1',
            present_phys_manual: ins[8]?.dataset.manual === '1',
        };
    });

    // 5. Photo stores (already maintained in memory by eblPhotoStores)
    [
        ['ebl-ann1', '_ann1_photos'],
        ['ebl-ann2', '_ann2_photos'],
        ['ebl-ann3', '_ann3_photos'],
        ['ebl-ann4', '_ann4_photos'],
        ['ebl-ann5', '_ann5_photos'],
        ['ebl-ann6', '_ann6_photos'],
        ['ebl-ann7', '_ann7_photos'],
        ['ebl-ann8', '_ann8_photos'],
    ].forEach(([storeKey, fdKey]) => {
        fd[fdKey] = eblPhotoStores[storeKey] || [];
    });

    return fd;
}

// ── populateFormData() ───────────────────────────────────────
// Writes a saved form_data object back into the DOM.
function populateFormData(fd) {
    if (!fd) return;

    // 1. Simple fields
    document.querySelectorAll('[data-field]').forEach(el => {
        if (fd[el.dataset.field] !== undefined) {
            el.value = fd[el.dataset.field];
        }
    });

    // 2. Static area table
    if (Array.isArray(fd._area_rows)) {
        const areaBody = document.querySelector('#ebl-tbl-area tbody');
        if (areaBody) {
            fd._area_rows.forEach((r, i) => {
                const row = areaBody.rows[i];
                if (!row) return;
                const ins = row.querySelectorAll('input');
                if (ins[0]) ins[0].value = r.area_plan || '';
                if (ins[1]) ins[1].value = r.area_phys || '';
                if (ins[2]) ins[2].value = r.dev_sft   || '';
                if (ins[3]) ins[3].value = r.dev_pct   || '';
            });
        }
    }

    // 3. Construction completion rows
    if (Array.isArray(fd._completion_rows)) {
        const compBody = document.getElementById('ebl-comp-body');
        // Clear all rows except the first (Ground Floor)
        while (compBody.rows.length > 1) compBody.deleteRow(-1);
        eblFloorCount = 1;

        fd._completion_rows.forEach((r, i) => {
            let row;
            if (i === 0) {
                // Populate the existing Ground Floor row
                row = compBody.rows[0];
            } else {
                // Add new rows for additional floors
                eblFloorCount++;
                row = document.createElement('tr');
                row.innerHTML =
                    `<td><input type="text" value="" readonly style="background:transparent;"></td>` +
                    [...Array(10)].map(() =>
                        `<td><input type="number" min="0" max="100" oninput="eblCalcWorkPct(this)"></td>`
                    ).join('') +
                    `<td><input type="text" readonly></td>`;
                compBody.appendChild(row);
            }
            const ins = row.querySelectorAll('input');
            if (ins[0])  ins[0].value  = r.floor      || '';
            if (ins[1])  ins[1].value  = r.structure  || '';
            if (ins[2])  ins[2].value  = r.brick      || '';
            if (ins[3])  ins[3].value  = r.wood       || '';
            if (ins[4])  ins[4].value  = r.metal      || '';
            if (ins[5])  ins[5].value  = r.plumbing   || '';
            if (ins[6])  ins[6].value  = r.electrical || '';
            if (ins[7])  ins[7].value  = r.plaster    || '';
            if (ins[8])  ins[8].value  = r.gen_floor  || '';
            if (ins[9])  ins[9].value  = r.aluminium  || '';
            if (ins[10]) ins[10].value = r.paint      || '';
            if (ins[11]) ins[11].value = r.work_pct   || '';
        });
    }

    // 4. Building value rows (_cost_rows)
    if (Array.isArray(fd._cost_rows)) {
        const costBody = document.getElementById('ebl-cost-body');
        // Keep first 2 static rows (Foundation + Ground Fl.), remove dynamic ones
        while (costBody.rows.length > 2) costBody.deleteRow(-1);

        fd._cost_rows.forEach((r, i) => {
            let row;
            if (i < 2) {
                row = costBody.rows[i];
            } else {
                row = document.createElement('tr');
                row.innerHTML =
                    `<td><input type="text" style="min-width:80px;" oninput="eblBVMarkManual(this)" onblur="eblBVFillHyphen(this)"></td>` +
                    `<td><input type="text" oninput="eblCalcBV(this)" onblur="eblBVFillHyphen(this)"></td>`.repeat(3) +
                    `<td><input type="text" oninput="eblBVMarkManual(this)" onblur="eblBVFillHyphen(this)"></td>`.repeat(2) +
                    `<td><input type="text" oninput="eblCalcBV(this)" onblur="eblBVFillHyphen(this)"></td>` +
                    `<td><input type="text" oninput="eblBVMarkManual(this)" onblur="eblBVFillHyphen(this)"></td>`.repeat(2);
                costBody.appendChild(row);
            }
            const ins = row.querySelectorAll('input');
            if (ins[0]) ins[0].value = r.floor        || '';
            if (ins[1]) ins[1].value = r.area_plan    || '';
            if (ins[2]) ins[2].value = r.area_phys    || '';
            if (ins[3]) ins[3].value = r.cost_per_sft || '';
            if (ins[4]) ins[4].value = r.est_plan     || '';
            if (ins[5]) ins[5].value = r.est_phys     || '';
            if (ins[6]) ins[6].value = r.work_pct     || '';
            if (ins[7]) ins[7].value = r.present_plan || '';
            if (ins[8]) ins[8].value = r.present_phys || '';
            // Restore manual override flags
            if (r.est_plan_manual)     ins[4].dataset.manual = '1';
            if (r.est_phys_manual)     ins[5].dataset.manual = '1';
            if (r.present_plan_manual) ins[7].dataset.manual = '1';
            if (r.present_phys_manual) ins[8].dataset.manual = '1';
        });
    }

    // 5. Photo stores
    [
        ['ebl-ann1', '_ann1_photos', 'ebl-ann1-grid', 14, 'ebl-ann1-label', true ],
        ['ebl-ann2', '_ann2_photos', 'ebl-ann2-grid',  1, 'ebl-ann2-label', true ],
        ['ebl-ann3', '_ann3_photos', 'ebl-ann3-grid',  1, 'ebl-ann3-label', true ],
        ['ebl-ann4', '_ann4_photos', 'ebl-ann4-grid',  2, 'ebl-ann4-label', true ],
        ['ebl-ann5', '_ann5_photos', 'ebl-ann5-grid',  1, 'ebl-ann5-label', false],
        ['ebl-ann6', '_ann6_photos', 'ebl-ann6-grid',  1, 'ebl-ann6-label', false],
        ['ebl-ann7', '_ann7_photos', 'ebl-ann7-grid',  1, 'ebl-ann7-label', false],
        ['ebl-ann8', '_ann8_photos', 'ebl-ann8-grid',  1, 'ebl-ann8-label', true ],
    ].forEach(([storeKey, fdKey, gridId, max, labelId, hasCaption]) => {
        if (Array.isArray(fd[fdKey])) {
            eblPhotoStores[storeKey] = fd[fdKey].map(p => ({
                ...p, caption: p.caption ?? p.name.replace(/\.[^/.]+$/, '')
            }));
            eblRenderPhotos(gridId, storeKey, max, labelId, hasCaption);
        }
    });
}