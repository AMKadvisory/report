// ═══════════════════════════════════════════════════════════
//  forms/cbl-vehicle-valuation/schema.js
//  ► CBL (City Bank PLC) Vehicle Valuation Form Schema
//
//  Key differences vs BBPLC (vehicle-valuation/schema.js):
//  • Cover: ac_title, vehicle_brand, chassis_number, engine_number,
//           purchaser_name, registration_number, assessed_price,
//           report_submission_date, cover image upload
//  • Letter: our_ref (letter_ref) + bank_ref, comm_date only,
//            no comm_medium/comm_person/max_price/forced_sale
//  • Assessment: adds Price Justification table fields
//                (pj_showroom_max/assessed, pj_online_max/assessed,
//                 pj_database_max/assessed)
//  • Declaration: 6 points, 13 pages
//  • All vehicle/registration/inspection/BRTA fields identical
// ═══════════════════════════════════════════════════════════
const CBLVehicleValuationSchema = {
    id:    'cbl-vehicle-valuation',
    title: 'CBL Vehicle Inspection & Valuation Report',

    navGroups: [
        { label: 'Cover',    sections: ['cover', 'letter'] },
        { label: 'Vehicle',  sections: ['vehicle', 'registration'] },
        { label: 'Inspection', sections: ['interior', 'exterior', 'assessment'] },
        { label: 'Documents',  sections: ['photos', 'qr'] },
        { label: 'BRTA Verification', sections: ['brta'] },
    ],

    sections: [

        // ── COVER ────────────────────────────────────────────
        // Fields: A/C Title, Vehicle's Brand, Mfg Year, Chassis No,
        //         Engine No, Purchaser Name, Reg No, Assessed Price,
        //         Report Submission Date, Recipient, Cover Image
        {
            id: 'cover', title: 'Cover Details', icon: '📋',
            fields: [
                { id:'ac_title',               label:'A/C Title',                    type:'text',  placeholder:'Enter A/C Title' },
                { id:'vehicle_brand',          label:"Vehicle's Brand",               type:'text',  placeholder:'e.g. Toyota, Honda' },
                { id:'manufacturing_year',     label:'Manufacturing Year',            type:'text',  placeholder:'e.g. 2020' },
                { id:'chassis_number',         label:'Chassis No.',                   type:'text',  placeholder:'Enter Chassis Number' },
                { id:'engine_number',          label:'Engine No.',                    type:'text',  placeholder:'Enter Engine Number' },
                { id:'purchaser_name',         label:"Vehicle Purchaser's Name",      type:'text',  placeholder:"Enter Purchaser's Name" },
                { id:'registration_number',    label:'Vehicle Registration No.',      type:'text',  placeholder:'Enter Registration Number' },
                { id:'assessed_price',         label:'Assessed Price (BDT)',          type:'text',  placeholder:'0' },
                { id:'report_submission_date', label:'Report Submission Date',        type:'date' },
                { id:'recipient_name',         label:'Recipient Name',               type:'text',  fullWidth: true },
                { id:'recipient_address',      label:'Recipient Address',            type:'textarea', fullWidth: true,
                  placeholder: 'Designation\nBank Name\nAddress' },
                // Cover image uploaded separately via handleCoverImage()
            ]
        },

        // ── COVER LETTER ─────────────────────────────────────
        // Fields: Our Ref, Bank Ref, Communication Date,
        //         Valuer 1 + Designation, Valuer 2 + Designation
        {
            id: 'letter', title: 'Cover Letter', icon: '✉️',
            fields: [
                { id:'letter_ref',           label:'Our Ref.',             type:'text', placeholder:'AMK/CBL/2026/...' },
                { id:'bank_ref',             label:'Bank Ref.',            type:'text', placeholder:'Enter Bank Reference' },
                { id:'comm_date',            label:'Communication Date',   type:'date' },
                { id:'valuer_1_name',        label:'Valuer 1',             type:'text' },
                { id:'valuer_1_designation', label:'Valuer 1 Designation', type:'text' },
                { id:'valuer_2_name',        label:'Valuer 2',             type:'text' },
                { id:'valuer_2_designation', label:'Valuer 2 Designation', type:'text' },
            ]
        },

        // ── VEHICLE DETAILS ──────────────────────────────────
        // Same as BBPLC
        {
            id: 'vehicle', title: 'Vehicle Details', icon: '🚗',
            fields: [
                { id:'manufacturer',       label:'Manufacturing Company', type:'text' },
                { id:'trim_package',       label:'Trim / Package',        type:'text' },
                { id:'vehicle_model',      label:'Vehicle Model',         type:'text' },
                { id:'country_of_origin',  label:'Country of Origin',     type:'text' },
                { id:'engine_number',      label:'Engine Number',         type:'text' },
                { id:'chassis_number',     label:'Chassis Number',        type:'text' },
                { id:'manufacturing_year', label:'Manufacturing Year',    type:'text' },
                { id:'cubic_capacity',     label:'Cubic Capacity (CC)',   type:'text' },
                { id:'color',              label:'Color',                 type:'text' },
                { id:'vehicle_type', label:'Type of Vehicle', type:'checkbox',
                  options:['Non-Hybrid','Hybrid','Electric'], fullWidth:true },
                { id:'fuel_used', label:'Fuel Used', type:'checkbox', multi:true,
                  options:['Petrol','Diesel','CNG','Octane','Electric'], fullWidth:true },
            ]
        },

        // ── REGISTRATION DETAILS ─────────────────────────────
        // Same as BBPLC
        {
            id: 'registration', title: 'Registration Details', icon: '📝',
            fields: [
                { id:'owner_name',           label:'Current Owner Name',               type:'text' },
                { id:'registration_number',  label:'Registration Number',              type:'text' },
                { id:'registration_id',      label:'Registration ID',                  type:'text' },
                { id:'registration_date',    label:'Registration Date',                type:'date' },
                { id:'ownership_transfer',   label:'Ownership Transfer Status',        type:'text', fullWidth:true },
                { id:'insurance_policy',     label:'Insurance Policy Number & Date',   type:'text' },
                { id:'tax_clearance_number', label:'Tax Clearance Certificate Number', type:'text' },
                { id:'tax_clearance_date',   label:'Tax Clearance Up To',              type:'date' },
                { id:'fitness_cert_number',  label:'Fitness Certificate Number',       type:'text' },
                { id:'fitness_validity',     label:'Fitness Validity Up To',           type:'date' },
                { id:'hire_purchase', label:'Hire Purchase', type:'checkbox',
                  options:['Yes','No'], fullWidth:true },
            ]
        },

        // ── INTERIOR INSPECTION ──────────────────────────────
        // Same as BBPLC
        {
            id: 'interior', title: 'Interior Inspection', icon: '🪑',
            fields: [
                { id:'transmission',      label:'Transmission (Gear)',  type:'checkbox', options:['Auto','Manual'] },
                { id:'ignition',          label:'Ignition (Start)',      type:'checkbox', options:['Push','Key'] },
                { id:'power_window',      label:'Power Window',          type:'checkbox', options:['Auto','Manual'] },
                { id:'power_steering',    label:'Power Steering',        type:'checkbox', options:['Auto','Manual'] },
                { id:'power_side_mirror', label:'Power Side Mirror',     type:'checkbox', options:['Auto','Manual'] },
                { id:'power_door_locks',  label:'Power Door Locks',      type:'checkbox', options:['Yes','No'] },
                { id:'sound_system',      label:'Sound System',          type:'checkbox', options:['Built-in','Modified'] },
                { id:'wooden_panel',      label:'Wooden Panel',          type:'checkbox', options:['Yes','No'] },
                { id:'leather_interior',  label:'Leather Interior',      type:'checkbox', options:['Yes','No'] },
                { id:'airbag',            label:'Airbag',                type:'checkbox', options:['Yes','No'] },
                { id:'back_camera',       label:'Back Camera',           type:'checkbox', options:['Yes','No'] },
                { id:'ambient_lighting',  label:'Ambient Lighting',      type:'checkbox', options:['Built-in','Modified'] },
                { id:'interior_accessories_yn', label:'Additional Accessories', type:'checkbox',
                  options:['Yes','No'], toggleTarget:'interior-acc-detail',
                  detailField:'interior_accessories', detailPlaceholder:'Describe accessories', fullWidth:true },
                { id:'num_seats',     label:'No. of Seats',                    type:'text' },
                { id:'total_mileage', label:'Total Mileage (as per Dashboard)', type:'text' },
            ]
        },

        // ── EXTERIOR INSPECTION ──────────────────────────────
        // Same as BBPLC
        // FIX #5 (schema): hid_lights was already correctly defined here — no change needed.
        //                  The bug was only in the HTML form's JS builder (now fixed there).
        {
            id: 'exterior', title: 'Exterior Inspection', icon: '🔧',
            fields: [
                { id:'body_condition',   label:'Body Condition',    type:'checkbox', options:['Good','Fair','Moderate','Poor'] },
                { id:'engine_condition', label:'Engine Condition',  type:'checkbox', options:['Good','Fair','Moderate','Poor'] },
                { id:'tires_condition',  label:'Tires Condition',   type:'checkbox', options:['Good','Fair','Moderate','Poor'] },
                { id:'major_defects',    label:'Major Defects',     type:'checkbox', options:['Yes','No'] },
                { id:'chassis_repaired', label:'Chassis Repaired',  type:'checkbox', options:['Yes','No'] },
                { id:'alloy_rim',        label:'Alloy Rim',         type:'checkbox', options:['Built-in','Modified'] },
                { id:'sun_roof',         label:'Sun Roof/Moon Roof',type:'checkbox', options:['Yes','No'] },
                { id:'glass',            label:'Glass',             type:'checkbox', options:['Original','Repaired'] },
                { id:'fog_light',        label:'Fog Light',         type:'checkbox', options:['Yes','No'] },
                { id:'dimension',        label:'Dimension',         type:'checkbox', options:['Long','Hatchback','Saloon','SUV'] },
                { id:'paint_condition',  label:'Paint Condition',   type:'checkbox', options:['Good','Fair','Moderate','Poor'] },
                { id:'accidental_history', label:'Major Accidental History', type:'checkbox',
                  options:['Yes','No'], toggleTarget:'accidental-detail',
                  detailField:'accidental_history_detail', detailPlaceholder:'Describe accidental history', fullWidth:true },
                { id:'hid_lights', label:'HID Lights', type:'checkbox', options:['Good','Fair','Moderate','Poor'] },
                { id:'exterior_accessories_yn', label:'Additional Accessories', type:'checkbox',
                  options:['Yes','No'], toggleTarget:'exterior-acc-detail',
                  detailField:'exterior_accessories', detailPlaceholder:'Describe accessories', fullWidth:true },
            ]
        },

        // ── OVERALL ASSESSMENT ───────────────────────────────
        // CBL DIFFERENCE: includes Price Justification table fields
        {
            id: 'assessment', title: 'Assessment & Price Justification', icon: '📊',
            fields: [
                { id:'interior_condition', label:'Interior Condition', type:'checkbox', options:['Good','Average','Poor'] },
                { id:'exterior_condition', label:'Exterior Condition', type:'checkbox', options:['Good','Average','Poor'] },
                { id:'known_defects', label:'Any Known Defects', type:'checkbox',
                  options:['Yes','No'], toggleTarget:'known-defects-detail',
                  detailField:'known_defects_detail', detailPlaceholder:'Describe known defects', fullWidth:true },
                { id:'inspection_date',     label:'Date of Inspection',         type:'date' },
                { id:'inspection_time',     label:'Inspection Time',            type:'time' },
                { id:'inspection_location', label:'Location',                   type:'text' },
                { id:'contact_person',      label:'Contact Person Presented',   type:'text' },
                { id:'verification_agent',  label:'Name of Verification Agent', type:'text' },
                // Price Justification table (CBL specific)
                { id:'pj_showroom_max',      label:'Showroom – Maximum Price (BDT)',   type:'text' },
                { id:'pj_showroom_assessed', label:'Showroom – Assessed Price (BDT)',  type:'text' },
                { id:'pj_online_max',        label:'Online – Maximum Price (BDT)',     type:'text' },
                { id:'pj_online_assessed',   label:'Online – Assessed Price (BDT)',    type:'text' },
                { id:'pj_database_max',      label:'Database – Maximum Price (BDT)',   type:'text' },
                { id:'pj_database_assessed', label:'Database – Assessed Price (BDT)', type:'text' },
            ]
        },

        // ── PHOTOS ───────────────────────────────────────────
        {
            id: 'photos', title: 'Vehicle Photos', icon: '📷',
            fields: [
                { id:'_photos_upload', label:'', type:'photos', fullWidth:true }
            ]
        },

        // ── QR CODE ──────────────────────────────────────────
        {
            id: 'qr', title: 'QR Code / Document Link', icon: '📲',
            fields: [
                { id:'_qr_upload', label:'', type:'qr', fullWidth:true }
            ]
        },

        // ── BRTA VERIFICATION ────────────────────────────────
        // Same as BBPLC
        {
            id: 'brta', title: 'BRTA Registration Verification', icon: '🏛️',
            fields: [
                { id:'brta_authority',       label:'Current Authority',        type:'text' },
                { id:'brta_registration_id', label:'Registration ID',          type:'text' },
                { id:'brta_registration_no', label:'Registration No',          type:'text' },
                { id:'brta_prev_reg_no',     label:'Previous Registration No', type:'text' },
                { id:'brta_app_status',      label:'Application Status',       type:'text' },
                { id:'brta_reg_date',        label:'Registration Date',        type:'date' },
                { id:'brta_hire',            label:'Hire',                     type:'text' },
                { id:'brta_hire_purchase',   label:'Hire Purchase',            type:'text' },
                { id:'brta_ownership_type',  label:'Ownership Type',           type:'text' },
                { id:'brta_bank_name',       label:'Bank Name',                type:'text' },
                { id:'brta_bank_address',    label:'Bank Address',             type:'textarea', fullWidth:true },
                { id:'brta_chassis_no',      label:'Chassis No',               type:'text' },
                { id:'brta_engine_no',       label:'Engine No',                type:'text' },
                { id:'brta_mfg_year',        label:'Manufacture Year',         type:'text' },
                { id:'brta_veh_class',       label:'Vehicle Class',            type:'text' },
                { id:'brta_veh_type',        label:'Vehicle Type',             type:'text' },
                { id:'brta_num_seats',       label:'No. of Seats',             type:'text' },
                { id:'brta_manufacturer',    label:'Manufacturer',             type:'text' },
                { id:'brta_country',         label:"Maker's Country",          type:'text' },
                { id:'brta_color',           label:'Color',                    type:'text' },
                { id:'brta_hp',              label:'Horse Power',              type:'text' },
                { id:'brta_rpm',             label:'RPM',                      type:'text' },
                { id:'brta_cc',              label:'CC',                       type:'text' },
                { id:'brta_unladen_weight',  label:'Unladen Weight',           type:'text' },
                { id:'brta_max_weight',      label:'Max Weight',               type:'text' },
                { id:'brta_cylinders',       label:'No of Cylinders',          type:'text' },
                { id:'brta_vehicle_model',   label:'Vehicle Model',            type:'text' },
                { id:'brta_mileage',         label:'Mileage',                  type:'text' },
                { id:'brta_owners', label:'Owner History', type:'owner-repeater', fullWidth:true },
            ]
        }
    ]
};