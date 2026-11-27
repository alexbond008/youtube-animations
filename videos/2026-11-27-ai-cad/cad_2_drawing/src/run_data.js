// Every line below is from the real run log work/run_1/stream.jsonl (claude-opus-4-8, 270 s), condensed in time.
// Viewport: Claude's own two execute_code scripts replayed step by step (src/stages_run.py) + Claude's own get_view screenshots.
const T = (n, a) => `<span class="b">● </span><span class="v">${n}</span><span class="a">  ${a}</span>`;
const V = '../work/run_1/vp/', G = '../work/run_1/getview/';
const C = (tool, what) => `<span class="n">${tool}</span>${what}`;
window.DATA = {
  speed: '4.5 min run · condensed',
  lines: [
    [0.3, 'prompt', '<span class="gt">&gt; </span>Hey Claude, here\'s an engineering drawing. Create the same exact part in CAD, matching every single dimension.<br><span style="color:#A1A1AA">[image] shaft_drawing.png · 2500 × 1875</span>'],
    [1.2, 'think', '✻ <span class="t" data-th>Thinking</span>'],
    [2.2, 'tool', T('ToolSearch', '"freecad create document object part"')],
    [2.9, 'say', 'This is a stepped turned shaft (SHAFT, dwg 1234-DRW-001).'],
    [3.3, 'out', 'overall length <span class="hl">258</span> = 24 + 178 + 56'],
    [3.7, 'out', 'M16 ×24 · Ø25 ×25 · Ø28 ×30 · <span class="hl">Ø32 ×93</span> · Ø28 ×30 · <span class="hl">Ø39.7 ×24</span> · M12 ×32'],
    [4.6, 'tool', T('freecad · create_document', '"Shaft_1234"')],
    [4.9, 'sub', '⎿  Document \'Shaft_1234\' created successfully'],
    [5.5, 'tool', T('freecad · execute_code', 'stepped body, solid of revolution')],
    [5.9, 'code', 'steps = [(24.0, 16.0), (25.0, 25.0), (30.0, 28.0), (93.0, 32.0), ...]'],
    [6.3, 'code', 'cyl = Part.<span class="f">makeCylinder</span>(D/2.0, L, App.Vector(x,0,0), App.Vector(1,0,0))'],
    [7.2, 'out', 'total length = <span class="hl">258.0</span>'],
    [7.9, 'tool', T('freecad · execute_code', 'chamfers, undercuts, seal grooves, keyways')],
    [8.3, 'code', 'shape = <span class="f">chamfer_end</span>(shape, 0.0, 8.0, 1.6, True)'],
    [8.7, 'code', 'shape = <span class="f">ext_groove</span>(shape, 205.0, 1.85, 34.0, 39.7)'],
    [9.1, 'code', 'shape = <span class="f">slot_flatbottom</span>(shape, 30.0, 16.0, 8.0, 4.0, 12.5)'],
    [9.5, 'code', 'shape = <span class="f">woodruff</span>(shape, 214.0, 19.0, 6.0, 3.9, 19.85)'],
    [12.4, 'out', 'Volume = 159320.1 mm³ · BBox 258 × Ø39.7'],
    [13.1, 'tool', T('freecad · get_view', 'Top')],
    [13.8, 'tool', T('freecad · get_view', 'Front')],
    [14.5, 'say', 'The Front silhouette matches the drawing closely.'],
    [15.2, 'tool', T('freecad · execute_code', 'save + verify')],
    [15.6, 'out', 'Length: <span class="hl">258.0</span>  Max dia: <span class="hl">39.69</span>'],
    [16.4, 'done', '✓ Done — Shaft_1234.FCStd'],
    [17.1, 'say', '<span style="color:#F5B800">Interpreted:</span> inner step lengths, keyway positions, groove profile — confirm?'],
  ],
  frames: [
    [6.0, V + '01_shape_removeSplitter_c0.png', C('execute_code', '7 turned steps')],
    [8.4, V + '03_chamfer_end_c1.png', C('execute_code', '1.6×45° chamfer')],
    [8.8, V + '04_chamfer_end_c1.png', C('execute_code', '1×45° chamfer')],
    [9.2, V + '05_ext_groove_c1.png', C('execute_code', 'thread undercut')],
    [9.6, V + '06_ext_groove_c1.png', C('execute_code', 'undercut before boss')],
    [10.0, V + '07_ext_groove_c1.png', C('execute_code', 'groove → Ø34')],
    [10.4, V + '08_ext_groove_c1.png', C('execute_code', 'groove → Ø34')],
    [10.8, V + '09_slot_flatbottom_c1.png', C('execute_code', 'keyway 8 wide')],
    [11.3, V + '10_woodruff_c1.png', C('execute_code', 'Woodruff keyseat')],
    [13.3, G + 'gv_03_crop.png', C('get_view', 'Top')],
    [14.0, G + 'gv_04_crop.png', C('get_view', 'Front')],
    [15.4, V + '11_shape_removeSplitter_c1.png', C('execute_code', 'final shaft')],
  ],
};
