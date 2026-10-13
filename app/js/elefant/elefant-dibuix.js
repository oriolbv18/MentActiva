'use strict';
// ==========================================================
//  MentA · L'ELEFANT (v1.9, redisseny) · DIBUIX
//  Un elefantet petit, rodó i de cara, amb colors suaus. SVG propi i articulat (grups amb nom i pivots definits).
//  Coordenades (viewBox 0 0 200 200): terra a y=186. La trompa NO és al marcador: la dibuixa el motor (elefant-motor.js).
// ==========================================================
const ElefantDibuix = (() => {
  const VIEWBOX = '0 0 200 200';
  const PIVOTS = {
    cap: [100, 128],                       // el coll
    orellaEsq: [64, 66], orellaDre: [136, 66],
    cua: [150, 150],
    potes: [[79, 158], [121, 158], [68, 158], [132, 158]],     // 0 i 1 davant; 2 i 3 darrere (més fosques)
    ull: { esq: [80, 82, 8.5, 9.5], dre: [120, 82, 8.5, 9.5] },       // cx, cy, rx, ry
    basTrompa: [100, 100]
  };
  const pota = (i, x, lluny) => `
    <g class="el-pota${lluny ? ' lluny' : ''}" data-pota="${i}">
      <path class="el-pota-cos ${lluny ? 'el-c-fons' : 'el-c-cos'}" d="M${x - 13},152 h26 v22 q0,12 -8,12 h-10 q-8,0 -8,-12z"/>
      <ellipse class="el-c-ungla" cx="${x - 6}" cy="182" rx="3.6" ry="2.8"/><ellipse class="el-c-ungla" cx="${x + 6}" cy="182" rx="3.6" ry="2.8"/>
    </g>`;
  const ull = (c, [cx, cy, rx, ry]) => `
    <g class="el-ull" data-ull="${c}">
      <ellipse class="el-blanc" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
      <g class="el-pupilla"><circle cx="${cx}" cy="${cy + 1}" r="6.4" class="el-c-pupilla"/><circle cx="${cx + 2.2}" cy="${cy - 2}" r="2.2" fill="#fff"/></g>
      <ellipse class="el-parpella el-c-cap" cx="${cx}" cy="${cy}" rx="${rx + 1}" ry="${ry + 1}"/>
      <path class="el-cella" d="M${cx - 8},${cy - 15} q8,-5 16,-1"/>
    </g>`;

  function svg() {
    return `<svg class="el-svg" viewBox="${VIEWBOX}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <g class="el-escena">
    <ellipse class="el-ombra" cx="100" cy="188" rx="60" ry="6"/>
    <g class="el-cua"><path class="el-cua-cos" d="M148,146 C166,148 170,164 164,174" fill="none" stroke-width="6" stroke-linecap="round"/><circle class="el-c-ombra" cx="164" cy="175" r="5"/></g>
    ${pota(2, 68, true)}${pota(3, 132, true)}${pota(0, 79, false)}${pota(1, 121, false)}
    <g class="el-cos"><path class="el-c-cos" d="M48,146 C46,108 70,96 100,96 C130,96 154,108 152,146 C150,176 128,186 100,186 C72,186 50,176 48,146Z"/></g>
    <g class="el-acc el-acc-cos" data-acc="bufanda" hidden>
      <path class="el-verd" d="M62,124 C80,140 120,140 138,124 l6,14 C122,156 78,156 56,138z"/><path class="el-verd-fosc" d="M112,140 l16,3 l-3,28 l-16,-3z"/>
    </g>
    <g class="el-cap">
      <g class="el-orella-esq">
        <circle class="el-c-orella" cx="40" cy="84" r="34"/><circle class="el-orella-int" cx="40" cy="86" r="22"/>
      </g>
      <g class="el-orella-dre">
        <circle class="el-c-orella" cx="160" cy="84" r="34"/><circle class="el-orella-int" cx="160" cy="86" r="22"/>
      </g>
      <circle class="el-c-cap" cx="100" cy="84" r="48"/>
      <path class="el-llum" d="M70,56 C82,46 106,44 124,52 C104,52 84,56 70,70Z"/>
      <ellipse class="el-galta" cx="66" cy="102" rx="9" ry="6"/><ellipse class="el-galta" cx="134" cy="102" rx="9" ry="6"/>
      ${ull('esq', PIVOTS.ull.esq)}${ull('dre', PIVOTS.ull.dre)}
      <g class="el-boca" data-boca="somriure">
        <path class="el-boca-neutra" d="M88,118 q12,7 24,0" fill="none" stroke-width="3" stroke-linecap="round"/>
        <path class="el-boca-somriure" d="M84,115 q16,13 32,0" fill="none" stroke-width="3.2" stroke-linecap="round"/>
        <path class="el-boca-oberta" d="M86,114 q14,20 28,0 q-14,6 -28,0z"/><path class="el-llengua" d="M93,121 q7,7 14,0 q-7,-3 -14,0z"/>
        <ellipse class="el-boca-o" cx="100" cy="118" rx="5" ry="6"/>
        <path class="el-boca-trista" d="M89,122 q11,-8 22,0" fill="none" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g class="el-trompa">
        <path class="el-trompa-cos el-c-trompa" d=""/>
        <path class="el-trompa-ombra" d=""/>
        <path class="el-trompa-arrugues" d="" fill="none" stroke-width="1.5" stroke-linecap="round"/>
        <g class="el-punta"><g class="el-acc el-acc-punta" data-acc="paraigua" hidden>
          <path d="M0,-4 L0,-40" stroke="#5a4a3a" stroke-width="2.6" stroke-linecap="round"/>
          <path class="el-verd" d="M-30,-38 C-27,-60 27,-60 30,-38 C21,-44 15,-40 10,-45 C5,-40 -5,-40 -10,-45 C-15,-40 -21,-44 -30,-38z"/>
        </g></g>
        <g class="el-aigua" hidden></g>
      </g>
      <g class="el-acc el-acc-cap" data-acc="ulleres" hidden>
        <circle cx="80" cy="82" r="13" fill="none" stroke="#3a3f3c" stroke-width="2.6"/><circle cx="120" cy="82" r="13" fill="none" stroke="#3a3f3c" stroke-width="2.6"/>
        <path d="M93,82 q7,-4 14,0 M67,80 L58,76 M133,80 L142,76" fill="none" stroke="#3a3f3c" stroke-width="2.6" stroke-linecap="round"/>
      </g>
      <g class="el-acc el-acc-cap" data-acc="barret" hidden>
        <ellipse cx="100" cy="42" rx="38" ry="8" fill="#264d36"/><path class="el-verd" d="M76,42 C76,14 124,14 124,42z"/><path d="M76,37 h48" stroke="#f2a65a" stroke-width="4"/>
      </g>
      <g class="el-acc el-acc-cap" data-acc="gorra" hidden>
        <path class="el-verd" d="M68,50 C68,22 132,22 132,50z"/><path class="el-verd-fosc" d="M60,52 C48,52 48,60 62,60 L96,54 L96,48z"/><circle cx="100" cy="27" r="3.6" fill="#f2a65a"/>
      </g>
      <g class="el-acc el-acc-cap" data-acc="llaçada" hidden>
        <path d="M128,44 l-18,-10 l2,20 z M128,44 l18,-12 l-2,22 z" fill="#d94f5c"/><circle cx="128" cy="44" r="5" fill="#b83a47"/>
      </g>
      <g class="el-acc el-acc-cap" data-acc="barret-festa" hidden>
        <path d="M80,48 L100,6 L122,48z" fill="#f2a65a"/><path d="M87,38 l24,-5 M91,26 l14,-4" stroke="#fff" stroke-width="3.4" opacity=".9"/><circle cx="100" cy="6" r="5" fill="#d94f5c"/>
      </g>
    </g>
  </g>
</svg>`;
  }
  return { VIEWBOX, PIVOTS, svg };
})();
