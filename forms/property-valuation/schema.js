// ═══════════════════════════════════════════════════════════
//  forms/property-valuation/schema.js
//  ► This is the ONLY file to edit when adding / removing /
//    reordering fields in the property valuation form.
//
//  Sheet mapping (matches original HTML exactly):
//    cover       → Sheet 1  – title, ref table, surveyor table, address boxes
//    letter      → Sheet 2  – cover letter, valuation table, signatures, enclosures
//    summary     → Sheet 3  – summary table, surveyor mirror, property type, values
//    sec_ab      → Sheet 4  – A. Particulars of Account  +  B. Property Owner
//    sec_cd      → Sheet 5  – C. Schedule of Property    +  D. Property Identification
//    sec_e       → Sheet 6  – E. Other Features
//    sec_f       → Sheet 7  – F. Civil Construction
//    floors      → Sheet 8  – Floor area table + Floor unit table
//    sec_gh      → Sheet 9  – G. Setback Comparison  +  H. Construction %
//    sec_i       → Sheet 10 – I. Floor-wise Building Value + depreciation + price justification
//    photos      → Dynamic  – Annexure-I photo sheets
// ═══════════════════════════════════════════════════════════
const PropertyValuationSchema = {
    id:    'property-valuation',
    title: 'Property Inspection Survey & Valuation Report',

    // ── Sidebar navigation groups ────────────────────────────
    navGroups: [
        { label: 'Cover',    sections: ['cover', 'letter', 'summary'] },
        { label: 'Details',  sections: ['sec_ab', 'sec_cd'] },
        { label: 'Features', sections: ['sec_e', 'sec_f'] },
        { label: 'Floors',   sections: ['floors', 'sec_gh', 'sec_i'] },
        { label: 'Photos',   sections: ['photos'] },
    ],

    // ── Surveyor lookup (used for auto-fill on selection) ─────
    // Key = name, value = { designation, nid, contact }
    surveyors: {
        'Engr. Abdullah Al Rafi': { designation: 'Executive, ISV',           nid: '332 778 6442', contact: '+880 1847-188078' },
        'Md Towhid Islam':        { designation: 'Senior Officer, ISV',       nid: '600 509 8812', contact: '+880 1726-966387' },
        'Alif Ahmed':             { designation: 'Assistant Executive, ISV',  nid: '736 299 6725', contact: '+880 1847-188079' },
        'MD Junaid Hasan':        { designation: 'Officer, ISV',              nid: '826 528 3591', contact: '+880 1756-736743' },
        'Utsha Kar Orka':         { designation: 'Senior Officer, ISV',       nid: '601 365 5151', contact: '+880 1760-178876' },
        'Sazzadur Rahman':        { designation: 'Senior Officer, ISV',       nid: '916 276 6894', contact: '+880 1758-551583' },
        'Shahriar Alam':          { designation: 'Officer, ISV',              nid: '286 029 1620', contact: '+880 1568-788506' },
        'Md Mesbah Uddin':        { designation: 'Manager, ISV',              nid: '599 537 0177', contact: '01830-005171'     },
        'Md. Sahed Alam':         { designation: 'Senior Officer, ISV',       nid: '287 252 2319', contact: '017488-62821'     },
    },

    // Valuer name list (used for both valuer-1 and valuer-2 dropdowns)
    valuers: [
        'Engr. Abdullah Al Rafi', 'Md Towhid Islam', 'Alif Ahmed',
        'MD Junaid Hasan', 'Utsha Kar Ork', 'Sazzadur Rahman',
        'Shahriar Alam', 'Md Mesbah Uddin', 'Md. Sahed Alam',
    ],

    // Valuer designation lookup (Sheet 2 signature dropdowns)
    valuerDesignations: {
        'Engr. Abdullah Al Rafi': 'Executive, ISV',
        'Md Towhid Islam':        'Senior Officer, ISV',
        'Alif Ahmed':             'Assistant Executive, ISV',
        'MD Junaid Hasan':        'Officer, ISV',
        'Utsha Kar Ork':          'Sr. Officer, ISV',
        'Sazzadur Rahman':        'Senior Officer, ISV',
        'Shahriar Alam':          'Officer, ISV',
        'Md Mesbah Uddin':        'Manager, ISV',
        'Md. Sahed Alam':         'Sr. Officer, ISV',
    },

    // ── Form sections ────────────────────────────────────────
    sections: [

        // ═════════════════════════════════════════════════════
        // SHEET 1 — COVER
        // ═════════════════════════════════════════════════════
        {
            id: 'cover', title: 'Cover Page', icon: '📋',
            fields: [
                // Reference table (top)
                { id: 'reference_account_name', label: 'Reference Account Name', type: 'text', placeholder: 'Enter reference account name', syncTo: 'reference_account_name' },
                { id: 'reference_no',            label: 'Reference No.',          type: 'text', placeholder: 'Enter reference number' },
                { id: 'wo_received_date',         label: 'W/O Received Date',     type: 'date' },
                { id: 'date_of_inspection',       label: 'Date of Inspection',    type: 'date' },
                // Surveyor table — selecting auto-fills the three readonly fields below
                {
                    id: 'surveyor_name', label: 'Surveyor Name', type: 'select',
                    placeholder: 'Select Surveyor',
                    options: [
                        'Engr. Abdullah Al Rafi', 'Md Towhid Islam', 'Alif Ahmed',
                        'MD Junaid Hasan', 'Utsha Kar Orka', 'Sazzadur Rahman',
                        'Shahriar Alam', 'Md Mesbah Uddin', 'Md. Sahed Alam',
                    ],
                    onchange: 'autoFillSurveyor'   // handled in form.html page script
                },
                { id: 'surveyor_designation', label: 'Designation',    type: 'text', readonly: true },
                { id: 'surveyor_nid',          label: 'NID Number',    type: 'text', readonly: true },
                { id: 'surveyor_contact',      label: 'Contact Number',type: 'text', readonly: true },
                // Submitted to (submitted by is static)
                { id: 'recipient_name',    label: 'Recipient Name',    type: 'text',     fullWidth: true },
                { id: 'recipient_address', label: 'Recipient Address', type: 'textarea', fullWidth: true,
                  placeholder: 'Designation\nBank Name\nAddress Line 1\nAddress Line 2\nContact Info' },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 2 — COVER LETTER
        // ═════════════════════════════════════════════════════
        {
            id: 'letter', title: 'Cover Letter', icon: '✉️',
            fields: [
                { id: 'letter_ref',  label: 'Letter Ref.',    type: 'text', placeholder: 'e.g. AMK/EBPLC/2025/...' },
                { id: 'letter_date', label: 'Letter Date',    type: 'date' },
                { id: 'letter_subject', label: 'Subject (property description)', type: 'text', fullWidth: true,
                  placeholder: 'e.g. Land & building situated at...' },
                // "Ref. A/C Name" synced from cover sheet
                { id: 'comm_medium', label: 'Communication Medium', type: 'text', placeholder: 'e.g. email, letter' },
                { id: 'comm_date',   label: 'Communication Date',   type: 'date' },
                { id: 'comm_person', label: 'Communication Person', type: 'text' },

                // ── Valuation table inputs (Sheet 2 rows 1 & 3; row 2 is computed) ──
                // Row 1 — Present Market Value (user enters area + rate + building)
                { id: 'market_land_area',  label: 'Market – Land Area (Decimal)',  type: 'number', placeholder: '0.00' },
                { id: 'market_rate',       label: 'Market – Rate per Decimal (BDT)', type: 'text', placeholder: '0' },
                { id: 'market_build_val',  label: 'Market – Building Value (BDT)',   type: 'text', placeholder: '0' },
                // Row 1 computed (readonly, filled by JS on form + in PDF)
                { id: 'market_land_val',   label: 'Market – Land Value (BDT)',      type: 'text', readonly: true },
                { id: 'market_total',      label: 'Market – Total Value (BDT)',     type: 'text', readonly: true },
                // Row 2 — Forced Sale Value (100% computed from Row 1, all readonly)
                { id: 'forced_land_area',  label: 'Forced – Land Area',     type: 'text', readonly: true },
                { id: 'forced_rate',       label: 'Forced – Rate',          type: 'text', readonly: true },
                { id: 'forced_land_val',   label: 'Forced – Land Value',    type: 'text', readonly: true },
                { id: 'forced_build_val',  label: 'Forced – Building Value',type: 'text', readonly: true },
                { id: 'forced_total',      label: 'Forced – Total Value',   type: 'text', readonly: true },
                // Row 3 — Mouza Value (user enters area + rate + building)
                { id: 'mouza_land_area',   label: 'Mouza – Land Area (Decimal)',     type: 'number', placeholder: '0.00' },
                { id: 'mouza_rate',        label: 'Mouza – Rate per Decimal (BDT)', type: 'text',   placeholder: '0' },
                { id: 'mouza_build_val',   label: 'Mouza – Building Value (BDT)',   type: 'text',   placeholder: '0' },
                { id: 'mouza_land_val',    label: 'Mouza – Land Value (BDT)',       type: 'text',   readonly: true },
                { id: 'mouza_total',       label: 'Mouza – Total Value (BDT)',      type: 'text',   readonly: true },

                // Signature selectors — selecting auto-fills designation fields
                {
                    id: 'valuer_1_name', label: 'Valuer 1', type: 'select',
                    placeholder: 'Select Valuer 1',
                    options: [
                        'Engr. Abdullah Al Rafi','Md Towhid Islam','Alif Ahmed','MD Junaid Hasan',
                        'Utsha Kar Ork','Sazzadur Rahman','Shahriar Alam','Md Mesbah Uddin','Md. Sahed Alam',
                    ],
                    onchange: 'autoFillValuer1'
                },
                { id: 'valuer_1_designation', label: 'Valuer 1 Designation', type: 'text', readonly: true },
                {
                    id: 'valuer_2_name', label: 'Valuer 2', type: 'select',
                    placeholder: 'Select Valuer 2',
                    options: [
                        'Engr. Abdullah Al Rafi','Md Towhid Islam','Alif Ahmed','MD Junaid Hasan',
                        'Utsha Kar Ork','Sazzadur Rahman','Shahriar Alam','Md Mesbah Uddin','Md. Sahed Alam',
                    ],
                    onchange: 'autoFillValuer2'
                },
                { id: 'valuer_2_designation', label: 'Valuer 2 Designation', type: 'text', readonly: true },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 3 — SUMMARY
        // ═════════════════════════════════════════════════════
        {
            id: 'summary', title: 'Summary of Valuation', icon: '📊',
            fields: [
                { id: 'file_receiving_date',     label: 'File Receiving Date',      type: 'date' },
                { id: 'valuation_ref_no',         label: 'Valuation Ref No.',       type: 'text', placeholder: 'Enter valuation ref no' },
                { id: 'valuation_date',           label: 'Valuation Date',          type: 'date' },
                { id: 'property_location',        label: 'Property Location',       type: 'text', fullWidth: true },
                { id: 'valuation_conducted_by',   label: 'Valuation Conducted By',  type: 'textarea', fullWidth: true,
                  placeholder: 'AMK Associates Limited' },
                // Surveyor fields (synced from Sheet 1 surveyor selection)
                { id: 'sum_surveyor_name',        label: 'Surveyor Name',  type: 'text', readonly: true },
                { id: 'sum_surveyor_designation', label: 'Designation',    type: 'text', readonly: true },
                { id: 'sum_surveyor_nid',          label: 'NID Number',    type: 'text', readonly: true },
                { id: 'sum_surveyor_contact',      label: 'Contact Number',type: 'text', readonly: true },
                // Property type
                {
                    id: 'property_type', label: 'Type of Property', type: 'select',
                    placeholder: 'Select type',
                    options: ['Freehold', 'Leasehold'],
                },
                { id: 'property_seller_type', label: 'Type of Property Seller', type: 'text' },
                // Computed values (synced from letter sheet calculations)
                { id: 'final_market_value', label: 'Current Market Value (BDT)', type: 'text', readonly: true },
                { id: 'final_forced_value', label: 'Forced Sale Value (BDT)',    type: 'text', readonly: true },
                { id: 'deviation_plinth',   label: 'Deviation (Plinth) %',       type: 'text' },
                { id: 'deviation_floor',    label: 'Deviation (Floor)',           type: 'text', placeholder: 'e.g. 1 to 5' },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 4 — SECTIONS A & B
        // ═════════════════════════════════════════════════════
        {
            id: 'sec_ab', title: 'A. Account  &  B. Owner', icon: '🏢',
            fields: [
                // Section A
                { id: 'ac_name',             label: 'A/C Name',                type: 'text',     fullWidth: true },
                { id: 'office_address',       label: 'Office/Business Address', type: 'textarea', fullWidth: true },
                { id: 'factory_address',      label: 'Factory Address',         type: 'textarea', fullWidth: true },
                { id: 'nature_of_business',   label: 'Nature of Business',      type: 'text' },
                { id: 'age_of_business',      label: 'Age of Business',         type: 'text' },
                { id: 'organization_type',    label: 'Organization Type',       type: 'text' },
                { id: 'contact_person_name',  label: 'Contact Person Name',     type: 'text' },
                { id: 'mobile_number',        label: 'Mobile Number',           type: 'text' },
                // Section B
                { id: 'owner_name',           label: "Property Owner(s) Name",     type: 'text',     fullWidth: true },
                { id: 'owner_father',         label: "Father's Name",              type: 'text' },
                { id: 'owner_mother',         label: "Mother's Name",              type: 'text' },
                { id: 'owner_present_address',label: 'Present Address',            type: 'textarea', fullWidth: true },
                { id: 'owner_perm_address',   label: 'Permanent Address',          type: 'textarea', fullWidth: true },
                { id: 'owner_contact',        label: 'Contact Number',             type: 'text' },
                { id: 'owner_nid',            label: 'NID Number',                 type: 'text' },
                { id: 'owner_relationship',   label: 'Relationship with Borrower', type: 'text' },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 5 — SECTIONS C & D
        // ═════════════════════════════════════════════════════
        {
            id: 'sec_cd', title: 'C. Schedule  &  D. Identification', icon: '📜',
            fields: [
                // Section C
                { id: 'district',               label: 'District',              type: 'text' },
                { id: 'thana_upazila',           label: 'Thana / Upazila',      type: 'text' },
                { id: 'mouza',                   label: 'Mouza',                type: 'text' },
                { id: 'jl_no',                   label: 'JL No.',               type: 'text' },
                { id: 'local_authority',         label: 'Local Authority',      type: 'text' },
                { id: 'land_office',             label: 'Land Office',          type: 'text' },
                { id: 'sub_register_office',     label: 'Sub-Register Office',  type: 'text' },
                { id: 'khatian_no',              label: 'Khatian No.',          type: 'text' },
                { id: 'dag_no',                  label: 'Corresponding Dag No.',type: 'text' },
                { id: 'deed_number_date',        label: 'Deed Number & Date',   type: 'text' },
                { id: 'mutation_khatian_no',     label: 'Mutation Khatian No.', type: 'text' },
                { id: 'jote_no',                 label: 'Jote No.',             type: 'text' },
                { id: 'dcr_no',                  label: 'DCR No.',              type: 'text' },
                { id: 'grr_no',                  label: 'GRR No.',              type: 'text' },
                { id: 'land_type_ldtr',          label: 'Land Type (LDTR)',     type: 'text' },
                { id: 'property_address',        label: 'Property Address',     type: 'textarea', fullWidth: true },
                { id: 'last_ownership_transfer', label: 'Last Ownership Transfer', type: 'text', fullWidth: true },
                { id: 'total_area_deed',         label: 'Total Area (Deed)',    type: 'text' },
                { id: 'total_area_physical',     label: 'Total Area (Physical)',type: 'text' },
                { id: 'way_to_visit',            label: 'Way to Visit Property',type: 'textarea', fullWidth: true },
                // Section D — 4 directions × 4 columns
                // Stored as flat fields: {dir}_{col} e.g. north_deed, north_present, north_demar, north_road
                { id: 'north_deed',    label: 'North – Chowhoddi (Deed)',   type: 'textarea' },
                { id: 'north_present', label: 'North – Present Chowhoddi',  type: 'textarea' },
                { id: 'north_demar',   label: 'North – Demarcation',        type: 'textarea' },
                { id: 'north_road',    label: 'North – Access Road',        type: 'textarea' },
                { id: 'south_deed',    label: 'South – Chowhoddi (Deed)',   type: 'textarea' },
                { id: 'south_present', label: 'South – Present Chowhoddi',  type: 'textarea' },
                { id: 'south_demar',   label: 'South – Demarcation',        type: 'textarea' },
                { id: 'south_road',    label: 'South – Access Road',        type: 'textarea' },
                { id: 'east_deed',     label: 'East – Chowhoddi (Deed)',    type: 'textarea' },
                { id: 'east_present',  label: 'East – Present Chowhoddi',   type: 'textarea' },
                { id: 'east_demar',    label: 'East – Demarcation',         type: 'textarea' },
                { id: 'east_road',     label: 'East – Access Road',         type: 'textarea' },
                { id: 'west_deed',     label: 'West – Chowhoddi (Deed)',    type: 'textarea' },
                { id: 'west_present',  label: 'West – Present Chowhoddi',   type: 'textarea' },
                { id: 'west_demar',    label: 'West – Demarcation',         type: 'textarea' },
                { id: 'west_road',     label: 'West – Access Road',         type: 'textarea' },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 6 — SECTION E
        // ═════════════════════════════════════════════════════
        {
            id: 'sec_e', title: 'E. Other Features', icon: '🏗️',
            fields: [
                { id: 'electricity',             label: 'Electricity',                    type: 'text' },
                { id: 'gas',                     label: 'GAS',                            type: 'text' },
                { id: 'water_supply',            label: 'Water Supply',                   type: 'text' },
                { id: 'sewerage',                label: 'Sewerage System',                type: 'text' },
                { id: 'internet',                label: 'Internet',                       type: 'text' },
                { id: 'satellite_location',      label: 'Satellite / Google Location',    type: 'text' },
                { id: 'access_road_status',      label: 'Status of Access Road',          type: 'text' },
                { id: 'nature_of_land',          label: 'Nature of Land',                 type: 'text' },
                { id: 'type_of_land',            label: 'Type of Land',                   type: 'text' },
                { id: 'plot_location',           label: 'Plot Location',                  type: 'text' },
                { id: 'description_of_property', label: 'Description of Property',        type: 'textarea', fullWidth: true },
                { id: 'usage_restriction',       label: 'Usage Restriction',              type: 'text' },
                { id: 'flood_possibility',       label: 'Flood Possibility',              type: 'text' },
                { id: 'land_classification',     label: 'Classification of Land',         type: 'text' },
                { id: 'status_master_plan',      label: 'Status in Master Plan',          type: 'text' },
                { id: 'current_possession',      label: 'Current Possession',             type: 'text' },
                { id: 'public_establishments',   label: 'Public Establishments Nearby',   type: 'textarea', fullWidth: true },
                { id: 'dist_prominent',          label: 'Distance to Prominent Location', type: 'text' },
                { id: 'dist_main_road',          label: 'Distance to Main Road',          type: 'text' },
                { id: 'dist_branch_office',      label: 'Distance to Branch/Office',      type: 'text' },
                { id: 'annual_income',           label: 'Annual Income from Property',    type: 'text' },
                { id: 'present_use',             label: 'Present Use of Property',        type: 'text' },
                { id: 'future_prospect',         label: 'Future Prospect',                type: 'textarea', fullWidth: true },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 7 — SECTION F
        // ═════════════════════════════════════════════════════
        {
            id: 'sec_f', title: 'F. Civil Construction', icon: '🏛️',
            fields: [
                { id: 'structure_type',      label: 'Structure Type',            type: 'text' },
                { id: 'foundation_type',     label: 'Foundation Type',           type: 'text' },
                { id: 'stories_plan',        label: 'No. of Stories (Plan)',     type: 'text' },
                { id: 'stories_physical',    label: 'No. of Stories (Physical)', type: 'text' },
                { id: 'approval_authority',  label: 'Approval Authority',        type: 'text' },
                { id: 'plan_no',             label: 'Plan No. (Sarok number)',   type: 'text' },
                { id: 'plan_date',           label: 'Plan Date',                 type: 'date' },
                { id: 'occupancy_category',  label: 'Occupancy Category',        type: 'text' },
                { id: 'age_of_structure',    label: 'Age of Structure (Years)',  type: 'number' },
                { id: 'shape_of_building',   label: 'Shape of Building',         type: 'text' },
                { id: 'project_name',        label: 'Project Name',              type: 'text' },
                { id: 'developer_name',      label: "Developer's Name",          type: 'text' },
                { id: 'owner_name_plan',     label: "Owner's Name in Plan",      type: 'text' },
                { id: 'security_guards',     label: 'Security Guards',           type: 'text' },
                { id: 'commercial',          label: 'Commercial',                type: 'text' },
                { id: 'garden_area',         label: 'Garden Area / Play Zone',   type: 'text' },
                { id: 'generator',           label: 'Generator Facilities',      type: 'text' },
                { id: 'lift',                label: 'Lift Facilities',           type: 'text' },
                { id: 'cctv',                label: 'CCTV',                      type: 'text' },
                { id: 'fire_fighting',       label: 'Fire Fighting & Emergency', type: 'text' },
                { id: 'front_face',          label: 'Front Face of Structure',   type: 'text' },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 8 — FLOOR TABLES
        // Stored as JSON arrays (_floor_area_rows, _floor_unit_rows)
        // Each row added via "Add One Floor" button (mirrors HTML)
        // ═════════════════════════════════════════════════════
        {
            id: 'floors', title: 'Floor Area & Unit Tables', icon: '🏢',
            fields: [
                // _floor_area_rows: Array of { floor, area_plan, area_phys, dev_sft, dev_pct }
                { id: '_floor_area_rows', label: 'Floor Area Table', type: 'floor-area-table', fullWidth: true },
                // _floor_unit_rows: Array of { floor, unit_plan, unit_phys, rooms, bathrooms, balcony, drawing, dining, drawing_dining }
                { id: '_floor_unit_rows', label: 'Floor Unit Table', type: 'floor-unit-table', fullWidth: true },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 9 — SECTIONS G & H
        // ═════════════════════════════════════════════════════
        {
            id: 'sec_gh', title: 'G. Setback  &  H. Construction %', icon: '📐',
            fields: [
                // G — one row per direction; deviation = physical − plan (computed)
                { id: 'setback_north_plan', label: 'North – Plan (Ft.)',    type: 'text' },
                { id: 'setback_north_phys', label: 'North – Physical (Ft.)',type: 'text' },
                { id: 'setback_north_dev',  label: 'North – Deviation',     type: 'text', readonly: true },
                { id: 'setback_south_plan', label: 'South – Plan (Ft.)',    type: 'text' },
                { id: 'setback_south_phys', label: 'South – Physical (Ft.)',type: 'text' },
                { id: 'setback_south_dev',  label: 'South – Deviation',     type: 'text', readonly: true },
                { id: 'setback_east_plan',  label: 'East – Plan (Ft.)',     type: 'text' },
                { id: 'setback_east_phys',  label: 'East – Physical (Ft.)', type: 'text' },
                { id: 'setback_east_dev',   label: 'East – Deviation',      type: 'text', readonly: true },
                { id: 'setback_west_plan',  label: 'West – Plan (Ft.)',     type: 'text' },
                { id: 'setback_west_phys',  label: 'West – Physical (Ft.)', type: 'text' },
                { id: 'setback_west_dev',   label: 'West – Deviation',      type: 'text', readonly: true },
                { id: 'setback_ns_plan',    label: 'Road N/S – Plan (Ft.)', type: 'text' },
                { id: 'setback_ns_phys',    label: 'Road N/S – Physical (Ft.)', type: 'text' },
                { id: 'setback_ns_dev',     label: 'Road N/S – Deviation',  type: 'text', readonly: true },
                { id: 'setback_ew_plan',    label: 'Road E/W – Plan (Ft.)', type: 'text' },
                { id: 'setback_ew_phys',    label: 'Road E/W – Physical (Ft.)', type: 'text' },
                { id: 'setback_ew_dev',     label: 'Road E/W – Deviation',  type: 'text', readonly: true },
                // H — _completion_rows: Array of { floor, structure, brick, wood, metal, plumbing, electrical, plaster, gen_floor, aluminium, paint, work_pct }
                //     work_pct is weighted sum (matches HTML weights: 37,9,7,4,8,9,6,8,6,6)
                { id: '_completion_rows', label: 'Construction % Table', type: 'completion-table', fullWidth: true },
            ]
        },

        // ═════════════════════════════════════════════════════
        // SHEET 10 — SECTION I
        // ═════════════════════════════════════════════════════
        {
            id: 'sec_i', title: 'I. Floor-wise Building Value', icon: '💰',
            fields: [
                // _cost_rows: Array of { floor, area_plan, area_phys, cost_per_sft, est_plan, est_phys, work_pct, present_plan, present_phys }
                //   est_plan = area_plan × cost_per_sft  (d = a*c)
                //   est_phys = area_phys × cost_per_sft  (e = b*c)
                //   present_plan = est_plan × work_pct/100  (g = d*f)
                //   present_phys = est_phys × work_pct/100  (h = e*f)
                { id: '_cost_rows', label: 'Floor-wise Building Value Table', type: 'cost-table', fullWidth: true },
                // Depreciation = (100/70) × age_of_structure  (rounded)
                { id: 'age_of_structure_i',  label: 'Age of Structure (Years)',  type: 'number',
                  note: 'Used to auto-calculate depreciation %' },
                { id: 'depreciation_pct',    label: 'Depreciation %',            type: 'text', readonly: true,
                  note: 'Auto: (100/70) × age' },
                // Totals (all readonly, computed from _cost_rows)
                { id: 'total_est_plan',      label: 'Total Estimated Value – Plan (BDT)',     type: 'text', readonly: true },
                { id: 'total_est_phys',      label: 'Total Estimated Value – Physical (BDT)', type: 'text', readonly: true },
                { id: 'total_present_plan',  label: 'Total Present Value – Plan (BDT)',       type: 'text', readonly: true },
                { id: 'total_present_phys',  label: 'Total Present Value – Physical (BDT)',   type: 'text', readonly: true },
                { id: 'dep_plan',            label: 'Depreciation Amount – Plan (BDT)',       type: 'text', readonly: true },
                { id: 'dep_phys',            label: 'Depreciation Amount – Physical (BDT)',   type: 'text', readonly: true },
                { id: 'net_plan',            label: 'Net Building Value – Plan (BDT)',        type: 'text', readonly: true },
                { id: 'net_phys',            label: 'Net Building Value – Physical (BDT)',    type: 'text', readonly: true },
                { id: 'price_justification', label: 'Price Justification', type: 'textarea', fullWidth: true },
            ]
        },

        // ═════════════════════════════════════════════════════
        // PHOTO SHEETS — Annexure-I
        // ═════════════════════════════════════════════════════
        {
            id: 'photos', title: 'Annexure-I: Photographs', icon: '📷',
            fields: [
                { id: '_photos_upload', label: '', type: 'photos', fullWidth: true }
            ]
        },
    ]
};