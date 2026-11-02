// =====================================================================
// Basement arcade — concept assembly (OpenSCAD)
// AUTO-GENERATED from parameters.json by generate.py.
// To change geometry: edit parameters.json, then re-run `python generate.py`.
// This file is also plain hand-editable OpenSCAD if you prefer to fork it.
//
// Units: millimetres. Concept-level CAD — joints, kerf, fasteners, actual
// trackball/gun mounting holes, TV VESA pattern, and wall structural
// anchorage are intentionally NOT modelled. Do not send this to a CNC as-is.
//
// Coordinate system (matches parameters.json coordinate_system):
//   origin  = floor level at the illustrative room's left back-wall corner
//   +X      = right, along the back wall (Station A then Station B)
//   +Y      = out from the back wall, into the room (depth)
//   +Z      = up from the floor
// =====================================================================

panel_t = 18;              // plywood panel thickness assumption (mm)

// ---- Station A: trackball pedestal -----------------------------------
ped_w = 760;
ped_d = 610;
ped_h = 950;
ped_x0 = 300;
trackball_d = 76.2;
trackball_cutout_d = 150;
ctrl_zone_w = 450;
ctrl_zone_d = 300;
ctrl_zone_cx = 380;
ctrl_zone_cy = 300;

// ---- Station B: shooter console ----------------------------------------
con_w = 1300;
con_d = 400;
con_h = 750;
con_x0 = 1660;
holster_spacing = 700;
deck_w = 1300;
deck_d = 600;
deck_h = 100;
deck_y0 = 400;

// ---- Wall TVs (active-area volumes only; schematic, no chassis) --------
tv43_w = 951.9;
tv43_h = 535.5;
tv43_center_z = 1500;
tv55_w = 1217.6;
tv55_h = 684.9;
tv55_center_z = 1600;
tv43_depth = 60;
tv55_depth = 60;

// ---- Wall-mount bracket, schematic only (NOT structural, NOT plywood) --
bracket_w = 600;
bracket_d = 60;
bracket_h = 400;

// =====================================================================
// Modules
// =====================================================================

module pedestal_box() {
    // Six-panel plywood box. Trackball control-zone is drawn as an outline
    // on the top deck ONLY — it is explicitly NOT cut here (no unverified
    // mounting holes in a concept file).
    color("burlywood", 0.9)
    translate([ped_x0, 0, 0])
    difference() {
        cube([ped_w, ped_d, ped_h]);
        // hollow the box to show it's a panel shell, not a solid block
        translate([panel_t, panel_t, panel_t])
            cube([ped_w - 2*panel_t, ped_d - 2*panel_t, ped_h - 2*panel_t]);
    }
    // reserved control-zone outline on the deck top (visual marker only)
    color("red", 0.6)
    translate([ped_x0 + ctrl_zone_cx - ctrl_zone_w/2, ctrl_zone_cy - ctrl_zone_d/2, ped_h])
        cube([ctrl_zone_w, ctrl_zone_d, 1]);
}

module shooter_console_box() {
    color("burlywood", 0.9)
    translate([con_x0, 0, 0])
    difference() {
        cube([con_w, con_d, con_h]);
        translate([panel_t, panel_t, panel_t])
            cube([con_w - 2*panel_t, con_d - 2*panel_t, con_h - 2*panel_t]);
    }
    // two holster reserved zones (outline markers only, not cut)
    color("red", 0.6)
    for (dx = [-holster_spacing/2, holster_spacing/2])
        translate([con_x0 + con_w/2 + dx, con_d/2, con_h])
            cylinder(h=1, d=120, $fn=24);
}

module removable_positional_gun_deck() {
    // Reserved footprint only — demountable, non-structural. Shown as a
    // thin low plinth so it reads clearly as "reserved", not "built".
    color("gray", 0.35)
    translate([con_x0, deck_y0, 0])
        cube([deck_w, deck_d, deck_h]);
}

module wall_tv(w, h, center_z, x0, x1, depth) {
    // Active-display-area volume only; bracket standoff is separate.
    // Actual TV chassis/bezel remain unselected.
    cx = (x0 + x1) / 2;
    color("black", 0.85)
    translate([cx - w/2, bracket_d, center_z - h/2])
        cube([w, depth, h]);
}

module wall_mount_bracket(x0, x1, center_z) {
    // Schematic off-the-shelf wall-mount arm silhouette. NOT plywood, NOT
    // structurally engineered here — anchorage into the real wall is gated.
    cx = (x0 + x1) / 2;
    color("dimgray", 0.6)
    translate([cx - bracket_w/2, 0, center_z - bracket_h/2])
        cube([bracket_w, bracket_d, bracket_h]);
}

module room_shell() {
    // Assumed room envelope — EDIT parameters.json room_assumptions to
    // match the real basement once it is measured. Drawn as wireframe
    // edges only so it never reads as "the real room".
    %cube([4500, 3500, 2300]);
}

// =====================================================================
// Assembly
// =====================================================================

room_shell();
pedestal_box();
shooter_console_box();
removable_positional_gun_deck();
wall_tv(tv43_w, tv43_h, tv43_center_z, ped_x0, ped_x0 + ped_w, tv43_depth);
wall_tv(tv55_w, tv55_h, tv55_center_z, con_x0, con_x0 + con_w, tv55_depth);
wall_mount_bracket(ped_x0, ped_x0 + ped_w, tv43_center_z);
wall_mount_bracket(con_x0, con_x0 + con_w, tv55_center_z);

// Basic parametric sanity (OpenSCAD-side mirror of the Python validator) —
// fails the render loudly if parameters.json produced an impossible layout.
assert(ped_w > 0 && ped_d > 0 && ped_h > 0, "pedestal dimensions must be positive");
assert(con_w > 0 && con_d > 0 && con_h > 0, "console dimensions must be positive");
assert(trackball_cutout_d <= min(ctrl_zone_w, ctrl_zone_d),
       "trackball cutout must fit inside the reserved control zone");
assert((con_x0) >= (ped_x0 + ped_w), "Station B must not overlap Station A");
