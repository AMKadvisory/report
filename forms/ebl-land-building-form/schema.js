// ═══════════════════════════════════════════════════════════
//  forms/ebl-land-building/schema.js
//  ► The ONLY file to edit when adding/removing/reordering
//    fields in the EBL Land & Building form.
//
//  Key differences vs property-valuation:
//  • Sheet 1 has NO surveyor table – only Ref A/C Name, Ref No,
//    Submitted by/to boxes.
//  • Sheet 3 (Summary) has the surveyor fields.
//  • Section F: Age of Structure includes construction period (from/to).
//  • Section F: CCTV label = "Close Circuit Camera (CCTV)".
//  • Section E: Longer/different labels (see inline comments).
//  • Section C: "Total Area as per Deed" / "Total Area Physically found".
//  • Sections J, K, L replace "Price Justification" textarea:
//      J = structured table (max price, min price, buy-sell, justification)
//      K = 9 static numbered points (no user input)
//      L = 9 static declaration points (no user input)
// ═══════════════════════════════════════════════════════════
const EBLLandBuildingSchema = {
    id:    'ebl-land-building',
    title: 'EBL Land & Building – Inspection Survey & Valuation Report',

    navGroups: [
        { label: 'Cover',     sections: ['cover', 'letter', 'summary'] },
        { label: 'Details',   sections: ['sec_ab', 'sec_cd'] },
        { label: 'Features',  sections: ['sec_e', 'sec_f'] },
        { label: 'Valuation', sections: ['floors', 'sec_hi', 'sec_jkl'] },
        { label: 'Photos',    sections: ['photos'] },
    ],

    valuerDesignations: {
        'Engr. Abdullah Al Rafi': 'Executive,ISV',
        'Md Towhid Islam':        'Senior Officer,ISV',
        'Alif Ahmed':             'Assistant Executive,ISV',
        'MD Junaid Hasan':        'Officer,ISV',
        'Utsha Kar Ork':          'Sr. Officer,ISV',
        'Sazzadur Rahman':        'Senior Officer,ISV',
        'Shahriar Alam':          'Officer,ISV',
        'Md Mesbah Uddin':        'Manager,ISV',
        'Md. Sahed Alam':         'Sr. Officer,ISV',
    },

    sections: [

        // ─────────────────────────────────────────────────────
        // SHEET 1 – COVER  (no surveyor table – EBL difference)
        // ─────────────────────────────────────────────────────
        {
            id: 'cover', title: 'Cover Page', icon: '📋',
            fields: [
                { id: 'reference_account_name', label: 'Reference Account Name', type: 'text', placeholder: 'Enter reference account name' },
                { id: 'reference_no',            label: 'Reference No.',          type: 'text', placeholder: 'Enter reference number' },
                { id: 'recipient_name',    label: 'Recipient Name',    type: 'text',     fullWidth: true },
                { id: 'recipient_address', label: 'Recipient Address', type: 'textarea', fullWidth: true,
                  placeholder: 'Designation\nBank Name\nAddress Line 1\nAddress Line 2\nContact Info' },
            ]
        },

        // ─────────────────────────────────────────────────────
        // SHEET 2 – COVER LETTER + VALUATION TABLE + SIGNATURES
        // ─────────────────────────────────────────────────────
        {
            id: 'letter', title: 'Cover Letter', icon: '✉️',
            fields: [
                { id: 'letter_ref',  label: 'Letter Ref.',  type: 'text', placeholder: 'e.g. AMK/EBPLC/2025/...' },
                { id: 'letter_date', label: 'Letter Date',  type: 'date' },
                { id: 'comm_medium', label: 'Communication Medium', type: 'text', placeholder: 'e.g. email, letter' },
                { id: 'comm_date',   label: 'Communication Date',   type: 'date' },
                { id: 'comm_person', label: 'Communication Person', type: 'text' },
                // Valuation table – Row 1: Market
                { id: 'market_land_area',  label: 'Market – Land Area (Decimal)',    type: 'number', placeholder: '0.00' },
                { id: 'market_rate',       label: 'Market – Rate per Decimal (BDT)', type: 'text',   placeholder: '0' },
                { id: 'market_land_val',   label: 'Market – Land Value (BDT)',       type: 'text',   readonly: true },
                { id: 'market_build_val',  label: 'Market – Building Value (BDT)',   type: 'text',   placeholder: '0' },
                { id: 'market_total',      label: 'Market – Total Value (BDT)',      type: 'text',   readonly: true },
                // Row 2: Forced (auto-computed)
                { id: 'forced_land_area',  label: 'Forced – Land Area',     type: 'text', readonly: true },
                { id: 'forced_rate',       label: 'Forced – Rate',          type: 'text', readonly: true },
                { id: 'forced_land_val',   label: 'Forced – Land Value',    type: 'text', readonly: true },
                { id: 'forced_build_val',  label: 'Forced – Building Value',type: 'text', readonly: true },
                { id: 'forced_total',      label: 'Forced – Total Value',   type: 'text', readonly: true },
                // Row 3: Mouza
                { id: 'mouza_land_area',  label: 'Mouza – Land Area (Decimal)',     type: 'number', placeholder: '0.00' },
                { id: 'mouza_rate',       label: 'Mouza – Rate per Decimal (BDT)', type: 'text',   placeholder: '0' },
                { id: 'mouza_land_val',   label: 'Mouza – Land Value (BDT)',       type: 'text',   readonly: true },
                { id: 'mouza_build_val',  label: 'Mouza – Building Value (BDT)',   type: 'text',   placeholder: '0' },
                { id: 'mouza_total',      label: 'Mouza – Total Value (BDT)',      type: 'text',   readonly: true },
                // Signatures
                { id: 'valuer_1_name',        label: 'Valuer 1', type: 'select',
                  placeholder: 'Select Valuer 1',
                  options: ['Engr. Abdullah Al Rafi','Md Towhid Islam','Alif Ahmed','MD Junaid Hasan',
                            'Utsha Kar Ork','Sazzadur Rahman','Shahriar Alam','Md Mesbah Uddin','Md. Sahed Alam'] },
                { id: 'valuer_1_designation', label: 'Valuer 1 Designation', type: 'text', readonly: true },
                { id: 'valuer_2_name',        label: 'Valuer 2', type: 'select',
                  placeholder: 'Select Valuer 2',
                  options: ['Engr. Abdullah Al Rafi','Md Towhid Islam','Alif Ahmed','MD Junaid Hasan',
                            'Utsha Kar Ork','Sazzadur Rahman','Shahriar Alam','Md Mesbah Uddin','Md. Sahed Alam'] },
                { id: 'valuer_2_designation', label: 'Valuer 2 Designation', type: 'text', readonly: true },
            ]
        },

        // ─────────────────────────────────────────────────────
        // SHEET 3 – SUMMARY  (surveyor fields live here in EBL)
        // ─────────────────────────────────────────────────────
        {
            id: 'summary', title: 'Summary of Valuation', icon: '📊',
            fields: [
                { id: 'file_receiving_date',    label: 'File Receiving Date',      type: 'date' },
                { id: 'valuation_ref_no',        label: 'Valuation Ref No.',       type: 'text' },
                { id: 'valuation_date',          label: 'Valuation Date',          type: 'date' },
                { id: 'property_location',       label: 'Property Location',       type: 'text', fullWidth: true },
                { id: 'valuation_conducted_by',  label: 'Valuation Conducted By',  type: 'textarea', fullWidth: true,
                  placeholder: 'AMK Associates Limited' },
                { id: 'surveyor_name',        label: 'Surveyor Name',   type: 'text' },
                { id: 'surveyor_designation', label: 'Designation',     type: 'text' },
                { id: 'surveyor_nid',          label: 'NID Number',     type: 'text' },
                { id: 'surveyor_contact',      label: 'Contact Number', type: 'text' },
                { id: 'property_type',         label: 'Type of Property', type: 'select',
                  placeholder: 'Select type', options: ['Freehold','Leasehold'] },
                { id: 'property_seller_type',  label: 'Type of Property Seller', type: 'text' },
                { id: 'final_market_value',    label: 'Current Market Value (BDT)', type: 'text', readonly: true },
                { id: 'final_forced_value',    label: 'Forced Sale Value (BDT)',    type: 'text', readonly: true },
                { id: 'deviation_plinth',      label: 'Deviation (Plinth) %',  type: 'text' },
                { id: 'deviation_floor',       label: 'Deviation (Floor)',      type: 'text', placeholder: 'e.g. 1 to 5' },
            ]
        },

        // ─────────────────────────────────────────────────────
        // SHEET 4 – A & B
        // ─────────────────────────────────────────────────────
        {
            id: 'sec_ab', title: 'A. Account  &  B. Owner', icon: '🏢',
            fields: [
                { id: 'ac_name',             label: 'A/C Name',                             type: 'text',     fullWidth: true },
                { id: 'contact_person_name',  label: 'Contact Person Name',                  type: 'text' },
                { id: 'mobile_number',        label: 'Mobile Number of Contact Person',      type: 'text' },
                { id: 'owner_name',           label: 'Property Owner(s) Name',  type: 'text',     fullWidth: true },
                { id: 'owner_father',         label: "Father's Name",            type: 'text' },
                { id: 'owner_mother',         label: "Mother's Name",            type: 'text' },
                { id: 'owner_present_address',label: 'Present Address',          type: 'textarea', fullWidth: true },
                { id: 'owner_perm_address',   label: 'Permanent Address',        type: 'textarea', fullWidth: true },
                { id: 'owner_contact',        label: 'Contact Number',           type: 'text' },
                { id: 'owner_nid',            label: 'NID Number',               type: 'text' },
                { id: 'owner_relationship',   label: 'Relationship with Borrower', type: 'text' },
            ]
        },

        // ─────────────────────────────────────────────────────
        // SHEET 5 – C & D
        // ─────────────────────────────────────────────────────
        {
            id: 'sec_cd', title: 'C. Schedule  &  D. Identification', icon: '📜',
            fields: [
                { id: 'district',               label: 'District',               type: 'text' },
                { id: 'thana_upazila',           label: 'Thana / Upazila',       type: 'text' },
                { id: 'mouza',                   label: 'Mouza',                  type: 'text' },
                { id: 'jl_no',                   label: 'JL No.',                 type: 'text' },
                { id: 'local_authority',         label: 'Local Authority',        type: 'text' },
                { id: 'land_office',             label: 'Land Office',            type: 'text' },
                { id: 'sub_register_office',     label: 'Sub-Register Office',    type: 'text' },
                { id: 'khatian_no',              label: 'Khatian No.',            type: 'text' },
                { id: 'dag_no',                  label: 'Corresponding Dag No.',  type: 'text' },
                { id: 'deed_number_date',        label: 'Deed Number & Date',     type: 'text' },
                { id: 'mutation_khatian_no',     label: 'Mutation Khatian No.',   type: 'text' },
                { id: 'jote_no',                 label: 'Jote No.',               type: 'text' },
                { id: 'dcr_no',                  label: 'DCR No.',                type: 'text' },
                { id: 'grr_no',                  label: 'GRR No.',                type: 'text' },
                { id: 'land_type_ldtr',          label: 'Land Type (LDTR)',       type: 'text' },
                { id: 'property_address',        label: 'Property Address',       type: 'textarea', fullWidth: true },
                { id: 'last_ownership_transfer', label: 'Last Ownership Transfer',type: 'text',     fullWidth: true },
                { id: 'total_area_deed',         label: 'Total Area as per Deed',          type: 'text' },
                { id: 'total_area_physical',     label: 'Total Area Physically found',     type: 'text' },
                { id: 'way_to_visit',            label: 'Way to visit Property',   type: 'textarea', fullWidth: true },
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

        // ─────────────────────────────────────────────────────
        // SHEET 6 – E
        // ─────────────────────────────────────────────────────
        {
            id: 'sec_e', title: 'E. Other Features', icon: '🏗️',
            fields: [
                { id: 'electricity',             label: 'Electricity',                                 type: 'text' },
                { id: 'gas',                     label: 'GAS',                                         type: 'text' },
                { id: 'water_supply',            label: 'Water Supply',                                type: 'text' },
                { id: 'sewerage',                label: 'Sewerage System',                             type: 'text' },
                { id: 'internet',                label: 'Internet',                                    type: 'text' },
                { id: 'satellite_location',      label: 'Satellite / Google Location',                 type: 'text' },
                { id: 'access_road_status',      label: 'Status of access Road for Transports',        type: 'text' },
                { id: 'nature_of_land',          label: 'Nature of Land',                              type: 'text' },
                { id: 'type_of_land',            label: 'Type of Land',                                type: 'text' },
                { id: 'plot_location',           label: 'Plot Location',                               type: 'text' },
                { id: 'description_of_property', label: 'Description of Property',                     type: 'textarea', fullWidth: true },
                { id: 'usage_restriction',       label: 'Usage Restriction',                           type: 'text' },
                { id: 'flood_possibility',       label: 'Possibility of Frequent Flood',               type: 'text' },
                { id: 'land_classification',     label: 'Classification of Land',                      type: 'text' },
                { id: 'status_master_plan',      label: 'Status in Master Plan',                       type: 'text' },
                { id: 'current_possession',      label: 'Current Possession',                          type: 'text' },
                { id: 'public_establishments',   label: 'Public Establishments nearby the Property',   type: 'textarea', fullWidth: true },
                { id: 'dist_prominent',          label: 'Distance from nearby Prominent location',     type: 'text' },
                { id: 'dist_main_road',          label: 'Distance from nearby Main Road',              type: 'text' },
                { id: 'dist_branch_office',      label: 'Distance from nearby Branch / Office',        type: 'text' },
                { id: 'annual_income',           label: 'Annual Income from the Property',             type: 'text' },
                { id: 'present_use',             label: 'Present Use of the Property',                 type: 'text' },
                { id: 'future_prospect',         label: 'Future Prospect',                             type: 'textarea', fullWidth: true },
            ]
        },

        // ─────────────────────────────────────────────────────
        // SHEET 7 – F
        // ─────────────────────────────────────────────────────
        {
            id: 'sec_f', title: 'F. Civil Construction', icon: '🏛️',
            fields: [
                { id: 'structure_type',      label: 'Structure Type',                    type: 'text' },
                { id: 'foundation_type',     label: 'Foundation Type',                   type: 'text' },
                { id: 'stories_plan',        label: 'No. of Stories (As per Plan)',      type: 'text' },
                { id: 'stories_physical',    label: 'No. of Stories (As per Physical)',  type: 'text' },
                { id: 'approval_authority',  label: 'Approval Authority',                type: 'text' },
                { id: 'plan_no',             label: 'Plan No. (Sarok number)',           type: 'text' },
                { id: 'plan_date',           label: 'Plan Date',                         type: 'date' },
                { id: 'occupancy_category',  label: 'Occupancy Category',                type: 'text' },
                { id: 'age_of_structure',    label: 'Age of Structure (Years)',          type: 'number' },
                { id: 'construction_from',   label: 'Construction Period – From (year)', type: 'text', placeholder: 'e.g. 2010' },
                { id: 'construction_to',     label: 'Construction Period – To (year)',   type: 'text', placeholder: 'e.g. 2015' },
                { id: 'shape_of_building',   label: 'Shape of Building',                 type: 'text' },
                { id: 'project_name',        label: 'Project Name',                      type: 'text' },
                { id: 'developer_name',      label: "Developer's Name",                  type: 'text' },
                { id: 'owner_name_plan',     label: "Owner's Name in Building Plan",     type: 'text' },
                { id: 'security_guards',     label: 'Security Guards',                   type: 'text' },
                { id: 'commercial',          label: 'Commercial',                        type: 'text' },
                { id: 'garden_area',         label: 'Garden Area / Play Zone',           type: 'text' },
                { id: 'generator',           label: 'Generator Facilities',              type: 'text' },
                { id: 'lift',                label: 'Lift Facilities',                   type: 'text' },
                { id: 'cctv',                label: 'Close Circuit Camera (CCTV)',       type: 'text' },
                { id: 'fire_fighting',       label: 'Fire Fighting & Emergency',         type: 'text' },
                { id: 'front_face',          label: 'Front Face of Structure',           type: 'text' },
            ]
        },

        // ─────────────────────────────────────────────────────
        // SHEET 8 – FLOOR TABLES  +  G. SETBACK
        // ─────────────────────────────────────────────────────
        {
            id: 'floors', title: 'Floor Tables & G. Setback', icon: '🏢',
            fields: [
                { id: '_floor_area_rows', label: 'Floor Area Table', type: 'floor-area-table', fullWidth: true },
                { id: '_floor_unit_rows', label: 'Floor Unit Table', type: 'floor-unit-table', fullWidth: true },
                { id: 'setback_north_plan', label: 'North – Plan (Ft.)',       type: 'text' },
                { id: 'setback_north_phys', label: 'North – Physical (Ft.)',   type: 'text' },
                { id: 'setback_north_dev',  label: 'North – Deviation',        type: 'text', readonly: true },
                { id: 'setback_south_plan', label: 'South – Plan (Ft.)',       type: 'text' },
                { id: 'setback_south_phys', label: 'South – Physical (Ft.)',   type: 'text' },
                { id: 'setback_south_dev',  label: 'South – Deviation',        type: 'text', readonly: true },
                { id: 'setback_east_plan',  label: 'East – Plan (Ft.)',        type: 'text' },
                { id: 'setback_east_phys',  label: 'East – Physical (Ft.)',    type: 'text' },
                { id: 'setback_east_dev',   label: 'East – Deviation',         type: 'text', readonly: true },
                { id: 'setback_west_plan',  label: 'West – Plan (Ft.)',        type: 'text' },
                { id: 'setback_west_phys',  label: 'West – Physical (Ft.)',    type: 'text' },
                { id: 'setback_west_dev',   label: 'West – Deviation',         type: 'text', readonly: true },
                { id: 'setback_ns_plan',    label: 'Road (N/S) – Plan (Ft.)', type: 'text' },
                { id: 'setback_ns_phys',    label: 'Road (N/S) – Physical',   type: 'text' },
                { id: 'setback_ns_dev',     label: 'Road (N/S) – Deviation',  type: 'text', readonly: true },
                { id: 'setback_ew_plan',    label: 'Road (E/W) – Plan (Ft.)', type: 'text' },
                { id: 'setback_ew_phys',    label: 'Road (E/W) – Physical',   type: 'text' },
                { id: 'setback_ew_dev',     label: 'Road (E/W) – Deviation',  type: 'text', readonly: true },
            ]
        },

        // ─────────────────────────────────────────────────────
        // SHEET 9 – H. Construction %  +  I. Building Value
        // ─────────────────────────────────────────────────────
        {
            id: 'sec_hi', title: 'H. Construction %  &  I. Building Value', icon: '💰',
            fields: [
                { id: '_completion_rows',  label: 'H. Construction % Table',      type: 'completion-table', fullWidth: true },
                { id: '_cost_rows',        label: 'I. Floor-wise Building Value', type: 'cost-table',       fullWidth: true },
                { id: 'age_of_structure',  label: 'Age of Structure (Years)',     type: 'number',
                  note: 'Depreciation = (100/70) × age, rounded' },
                { id: 'depreciation_pct',  label: 'Depreciation %',              type: 'text', readonly: true },
            ]
        },

        // ─────────────────────────────────────────────────────
        // SHEET 10 – J (user input) + K & L (static text)
        // ─────────────────────────────────────────────────────
        {
            id: 'sec_jkl', title: 'J. Price Justification', icon: '💬',
            fields: [
                { id: 'max_price',           label: 'Maximum Price (BDT)',  type: 'text',     fullWidth: true },
                { id: 'min_price',           label: 'Minimum Price (BDT)',  type: 'text',     fullWidth: true },
                { id: 'last_buy_sell',       label: 'Last Buy-Sell Record', type: 'textarea', fullWidth: true },
                { id: 'price_justification', label: 'Price Justification',  type: 'textarea', fullWidth: true },
            ]
        },

        // ─────────────────────────────────────────────────────
        // PHOTOS
        // ─────────────────────────────────────────────────────
        {
            id: 'photos', title: 'Annexure-I: Photographs', icon: '📷',
            fields: [
                { id: '_photos_upload', label: '', type: 'photos', fullWidth: true }
            ]
        },
    ]
};