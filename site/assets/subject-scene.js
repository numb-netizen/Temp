/* Decorative, subject-themed animated backgrounds for subject page headers.
   A page opts in with <header class="page-head" data-scene="chemistry">. The scene is
   purely visual: hidden from assistive technology, ignores the pointer and sits behind
   the heading text. Motion is controlled from subject-scene.css. */
(function () {
  var head = document.querySelector('.page-head[data-scene]');
  if (!head || head.querySelector('.subject-scene')) return;

  // Shorthand helpers keep the scenes readable.
  function a(cls, t, d, extra) { // animation class plus duration/delay custom properties
    return ' class="' + cls + '" style="--t:' + t + 's;--d:' + d + 's' + (extra ? ';' + extra : '') + '"';
  }
  function txt(x, y, s, size, anim) {
    // Merge an animation class into the text's own class (a second class attribute would be ignored).
    var attrs = anim ? anim.replace(' class="', ' class="t ') : ' class="t"';
    return '<text' + attrs + ' x="' + x + '" y="' + y + '" font-size="' + size + '">' + s + '</text>';
  }
  function bubbles(cx, cy, n, spread, h) { // bubbles rising from a liquid surface
    var out = '';
    for (var i = 0; i < n; i++) {
      var x = cx + ((i * 7) % (spread * 2 + 1)) - spread;
      out += '<circle' + a('bub sc-rise', (2.2 + (i % 3) * .6).toFixed(1), (-i * .55).toFixed(2), '--h:' + h + 'px') +
        ' cx="' + x + '" cy="' + (cy - (i % 2) * 6) + '" r="' + (2 + (i % 3)) + '"/>';
    }
    return out;
  }
  function gear(cx, cy, r, teeth, cls, t) {
    var pts = [], step = Math.PI * 2 / (teeth * 2);
    for (var i = 0; i < teeth * 2; i++) {
      var rr = i % 2 ? r : r + r * .2, ang = i * step;
      pts.push((cx + Math.cos(ang - step / 2) * rr).toFixed(1) + ',' + (cy + Math.sin(ang - step / 2) * rr).toFixed(1));
      pts.push((cx + Math.cos(ang + step / 2) * rr).toFixed(1) + ',' + (cy + Math.sin(ang + step / 2) * rr).toFixed(1));
    }
    return '<g' + a(cls, t, 0) + '><polygon class="k fa-soft" points="' + pts.join(' ') + '"/><circle class="k" cx="' + cx + '" cy="' + cy + '" r="' + (r * .35).toFixed(1) + '"/></g>';
  }
  function person(x, y, cls, d) {
    return '<g' + a('sc-bob', 4, d) + '><circle class="k ' + cls + '" cx="' + x + '" cy="' + y + '" r="9"/><path class="k" d="M' + (x - 15) + ' ' + (y + 30) + 'c0-12 7-18 15-18s15 6 15 18"/></g>';
  }

  var scenes = {
    chemistry: function () {
      var tubes = '', colours = ['fa', 'fb', 'fc'];
      for (var i = 0; i < 3; i++) {
        var x = 176 + i * 40;
        tubes += '<path class="fl ' + colours[i] + ' sc-hue"' + ' style="--d:' + (-i * 2) + 's" d="M' + (x + 2) + ' ' + (160 + i * 8) + 'h18v' + (34 - i * 8) + 'a9 9 0 0 1-18 0z"/>' +
          bubbles(x + 11, 192, 4, 4, -88) +
          '<path class="k" d="M' + x + ' 110v84a11 11 0 0 0 22 0v-84"/><path class="k" d="M' + (x - 3) + ' 110h28"/>' +
          '<path' + a('k2 sc-rise', 3.4, -i * 1.1, '--h:-34px') + ' d="M' + (x + 11) + ' 104c-6-6 6-10 0-16s6-10 0-16"/>';
      }
      var cells = '';
      for (var c = 0; c < 4; c++) cells += '<g' + a('sc-drift', 3 + c * .8, -c, '--x:' + (c % 2 ? -7 : 7) + 'px') + '><ellipse class="k2 ' + (c % 2 ? 'fc-soft' : 'fa-soft') + '" cx="' + [114, 140, 124, 146][c] + '" cy="' + [36, 30, 56, 52][c] + '" rx="9" ry="6"/><circle class="' + (c % 2 ? 'fc' : 'fa') + '" cx="' + [114, 140, 124, 146][c] + '" cy="' + [36, 30, 56, 52][c] + '" r="2.4"/></g>';
      return '<rect class="k fa-soft" x="30" y="218" width="108" height="16" rx="8"/><path class="k2" d="M42 226h84"/>' +
        '<circle' + a('fb sc-pulse', 2.4, 0) + ' cx="80" cy="210" r="14" fill-opacity=".3"/><circle class="k fb" cx="80" cy="210" r="6"/>' +
        '<path' + a('fb sc-pulse', 2.4, -.3) + ' d="M74 204h12l-3-18h-6z" fill-opacity=".45"/>' +
        '<path class="k fa-soft" d="M120 218C127 182 129 146 114 118L102 104L98 128C108 150 108 182 100 218Z"/>' +
        '<rect class="k fb-soft" x="72" y="179" width="16" height="7" rx="2"/>' +
        '<rect class="k fl-paper" x="42" y="170" width="84" height="9" rx="3"/><path class="k2" d="M50 168l12-2M110 168l-12-2"/>' +
        '<rect class="k fc-soft" x="58" y="165" width="44" height="5" rx="1.5"/><circle' + a('fc sc-pulse', 2, 0) + ' cx="80" cy="167.5" r="2.6"/>' +
        '<g transform="rotate(-30 78 106)"><rect class="k fl-paper" x="69" y="54" width="18" height="54" rx="5"/><path class="hl" d="M74 60v42"/>' +
        '<rect class="k fb-soft" x="65" y="44" width="26" height="12" rx="4"/><rect class="k fa" x="67" y="80" width="22" height="6" rx="2"/></g>' +
        '<rect class="k fa-soft" x="62" y="104" width="40" height="28" rx="9"/><path class="hl" d="M68 112h18"/>' +
        '<path class="k fb-soft" d="M64 132h34l-5 9H69z"/><path class="k fl-paper" d="M76 141h10v15h-10z"/><path class="k fb" d="M78 156h6v5h-6z"/>' +
        '<path class="k2" d="M70 141l-4 13M92 141l4 13"/>' +
        '<g' + a('sc-spin', 9, 0) + '><circle class="k fl-paper" cx="114" cy="162" r="10"/><path class="k2" d="M114 153v5M114 166v5M105 162h5M118 162h5"/></g><circle class="k fb" cx="114" cy="162" r="3.5"/>' +
        '<circle class="k fl-paper" cx="117" cy="186" r="5.5"/>' +
        '<defs><clipPath id="scene-lens-clip"><circle cx="130" cy="44" r="26"/></clipPath></defs>' +
        '<circle class="fl-paper" cx="130" cy="44" r="26"/><g clip-path="url(#scene-lens-clip)"><path class="k2" d="M104 44h52M130 18v52" stroke-dasharray="3 4"/>' + cells + '</g>' +
        '<circle class="k" cx="130" cy="44" r="26" stroke-width="3.5"/><path class="hl" d="M112 32a22 22 0 0 1 12-10"/>' +
        '<path class="k2" d="M53 49L104 44" stroke-dasharray="2 5"/>' +
        '<path class="k" d="M164 150h120M164 226h120M168 150v76M280 150v76"/>' + tubes +
        '<path class="fl fc sc-hue" style="--d:-1s" d="M323 198h60l12 22a6 6 0 0 1-5 9h-74a6 6 0 0 1-5-9z"/>' + bubbles(353, 214, 6, 18, -112) +
        '<path class="k" d="M340 118v42l-28 58a8 8 0 0 0 7 12h68a8 8 0 0 0 7-12l-28-58v-42M333 118h40"/>' +
        '<g' + a('sc-spin', 30, 0) + '><polygon class="k2" points="368,22 385.3,32 385.3,52 368,62 350.7,52 350.7,32"/><circle class="k2" cx="368" cy="42" r="10"/></g>' +
        '<g' + a('sc-bob', 5, -2) + '><path class="k2" d="M226 52l26-14M252 38l20 16"/><circle class="k fa" cx="226" cy="52" r="8"/><circle class="k fb" cx="252" cy="38" r="10"/><circle class="k fc" cx="272" cy="54" r="7"/></g>';
    },
    physics: function () {
      var orbits = '', dur = [2.6, 3.4, 4.2];
      for (var i = 0; i < 3; i++) {
        // Alternate the travel direction; negative begin times spread the electrons out.
        var orbit = i % 2 ? 'M186 130a76 25 0 1 0-152 0a76 25 0 1 0 152 0' : 'M186 130a76 25 0 1 1-152 0a76 25 0 1 1 152 0';
        orbits += '<g transform="rotate(' + (i * 60) + ' 110 130)"><ellipse class="k2" cx="110" cy="130" rx="76" ry="25"/>' +
          '<g class="electron"><circle class="fb" r="10" opacity=".28"/><circle class="k fb" r="5"/>' +
          '<animateMotion dur="' + dur[i] + 's" begin="' + (-i * 1.1).toFixed(1) + 's" repeatCount="indefinite" path="' + orbit + '"/></g></g>';
      }
      return orbits + '<circle' + a('fa-soft sc-pulse', 2.6, -1.3) + ' cx="110" cy="130" r="20"/><circle' + a('fa sc-pulse', 2.6, 0) + ' cx="110" cy="130" r="11"/>' +
        '<defs><clipPath id="scene-wave-clip"><rect x="210" y="30" width="200" height="80"/></clipPath></defs>' +
        '<g clip-path="url(#scene-wave-clip)"><path' + a('k sa sc-slide', 3, 0, '--x:-60px') + ' d="M210 70q15-30 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0"/></g>' +
        '<path class="k" d="M280 132h76"/><g' + a('sc-swing', 3.2, 0, '--a:22deg') + '><path class="k" d="M318 132v80"/><circle class="k fb-soft" cx="318" cy="222" r="13"/></g>' +
        txt(206, 228, 'E = mc²', 24, a('sc-bob', 6, -1)) + txt(372, 196, 'λ', 30, a('sc-bob', 5, -3)) +
        '<path' + a('fb sc-blink', 2.6, -0.4) + ' d="M384 40l-14 26h12l-8 24 22-32h-12l10-18z"/>';
    },
    math: function () {
      var sym = [['π', 228, 54, 34, -1], ['∑', 300, 72, 30, -3], ['√x', 368, 48, 26, -2], ['∞', 220, 128, 30, -4], ['∫', 392, 128, 34, -0.5]], s = '';
      for (var i = 0; i < sym.length; i++) s += txt(sym[i][1], sym[i][2], sym[i][0], sym[i][3], a('sc-bob', 5 + i % 3, sym[i][4]));
      return '<path class="k" d="M40 222h160M52 234V86"/><path class="k2" d="M52 186h148M52 150h148M52 114h148M88 222V86M124 222V86M160 222V86"/>' +
        '<path' + a('k sa sc-draw', 5, 0) + ' pathLength="1" d="M62 104Q124 316 190 104"/><circle' + a('fc sc-pulse', 2.5, 0) + ' cx="126" cy="210" r="5"/>' +
        '<path class="k fa-soft" d="M240 226h96v-78z"/><path class="k2" d="M322 226v-14h14"/>' + txt(256, 246, 'a²+b²=c²', 15) +
        '<g' + a('sc-swing', 4, 0, '--a:9deg') + '><path class="k" d="M376 150l-22 80M376 150l20 80"/><circle class="k fb" cx="376" cy="148" r="6"/></g>' +
        '<path' + a('k2 sc-draw', 4, -1) + ' pathLength="1" d="M346 236a36 16 0 0 0 58 0"/>' + s;
    },
    biology: function () {
      var rungs = '';
      for (var i = 0; i < 11; i++) {
        var y = 34 + i * 19;
        rungs += '<g' + a('sc-twist', 3, (-i * .27).toFixed(2)) + '><path class="k2" d="M66 ' + y + 'h48"/><circle class="fa" cx="66" cy="' + y + '" r="6"/><circle class="fc" cx="114" cy="' + y + '" r="6"/></g>';
      }
      return rungs + '<g' + a('sc-morph', 6, 0) + '><ellipse class="k fa-soft" cx="252" cy="140" rx="70" ry="54"/></g>' +
        '<circle' + a('k fb-soft sc-pulse', 4, 0) + ' cx="246" cy="134" r="20"/><circle class="fb" cx="246" cy="134" r="6"/>' +
        '<g' + a('sc-drift', 5, 0, '--x:10px') + '><ellipse class="k2 fc-soft" cx="290" cy="166" rx="16" ry="8"/><path class="k2" d="M278 166q6-6 12 0t12 0"/></g>' +
        '<circle' + a('fl fa sc-bob', 3, -1) + ' cx="212" cy="112" r="3"/><circle' + a('fl fc sc-bob', 3.5, -2) + ' cx="222" cy="170" r="3"/><circle' + a('fl fb sc-bob', 4, 0) + ' cx="288" cy="110" r="3"/>' +
        '<g' + a('sc-swing', 5, 0, '--a:8deg;transform-origin:15% 100%') + '><path class="k fa-soft" d="M370 220c-40-40-30-110 26-150 18 60 10 120-26 150z"/><path class="k2" d="M370 220c6-50 14-96 26-150M378 160l-14-14M384 120l12-10M374 190l18-6"/></g>';
    },
    ict: function () {
      var bits = '', b = ['1', '0', '1', '1', '0', '0', '1'];
      for (var i = 0; i < b.length; i++) bits += txt(206 + i * 30, 40 + (i % 3) * 12, b[i], 18, a('sc-fall', 3 + (i % 3) * .7, (-i * .6).toFixed(1)));
      var circuit = 'M210 150h50v40h60v-30h40M210 200h30v26h90M270 110v40M360 160v50h40';
      return '<rect class="k fa-soft" x="34" y="92" width="136" height="92" rx="8"/><path class="k" d="M88 184l-6 26h40l-6-26M70 212h64"/>' +
        '<path class="k2" d="M50 112h48M50 128h72M62 144h56M50 160h36"/><rect' + a('fa sc-blink', 1.1, 0) + ' x="90" y="152" width="9" height="14"/>' +
        txt(112, 128, '&lt;/&gt;', 20, a('sc-bob', 4, -1)) +
        '<path class="k2" d="' + circuit + '"/><path' + a('k sa sc-flow', 2.4, 0, 'stroke-dasharray:10 26;--len:36') + ' d="' + circuit + '"/>' +
        '<circle class="k fb" cx="260" cy="150" r="5"/><circle class="k fc" cx="320" cy="160" r="5"/><circle class="k fb" cx="330" cy="226" r="5"/><circle class="k fa" cx="400" cy="210" r="5"/>' +
        bits + '<g transform="translate(366 112)"><circle class="fa" cx="0" cy="0" r="5"/>' +
        '<path' + a('k sc-pulse', 2.4, 0) + ' d="M-14-12a20 20 0 0 1 28 0"/><path' + a('k sc-pulse', 2.4, -0.8) + ' d="M-24-22a34 34 0 0 1 48 0"/><path' + a('k sc-pulse', 2.4, -1.6) + ' d="M-34-32a48 48 0 0 1 68 0"/></g>';
    },
    bangla: function () {
      var l = [['অ', 254, 60, -1], ['আ', 330, 46, -3], ['ক', 392, 84, -2], ['খ', 300, 112, -4], ['ঋ', 372, 150, -0.5]], s = '';
      for (var i = 0; i < l.length; i++) s += txt(l[i][1], l[i][2], l[i][0], 32, a('sc-bob', 5 + i % 3, l[i][3]));
      return '<path class="k fa-soft" d="M140 226c-30-14-64-16-100-8v-88c36-8 70-6 100 8z"/><path class="k fb-soft" d="M140 226c30-14 64-16 100-8v-88c-36-8-70-6-100 8z"/>' +
        '<path class="k2" d="M56 150c24-4 46-2 68 6M56 172c24-4 46-2 68 6M56 194c24-4 46-2 68 6M156 156c22-8 44-10 68-6M156 178c22-8 44-10 68-6"/>' +
        '<g' + a('sc-flip', 6, 0) + '><path class="k fl-paper" d="M140 138c28-12 56-15 90-10v86c-34-5-62-2-90 10z"/></g>' +
        '<g' + a('sc-write', 3, 0) + '><path class="k fc-soft" d="M330 232c10-50 40-96 76-120-8 44-34 88-70 112z"/><path class="k2" d="M330 232l40-82"/></g>' +
        '<path' + a('k sa sc-draw', 3, 0) + ' pathLength="1" d="M254 236c12-10 22 8 34-2s22 8 34-2"/>' + s;
    },
    english: function () {
      var meridians = '';
      for (var i = 0; i < 3; i++) meridians += '<ellipse' + a('k2 sc-twist', 6, -i * 2) + ' cx="342" cy="150" rx="40" ry="60"/>';
      return '<g' + a('sc-pop', 4, 0) + '><path class="k fa-soft" d="M44 50h120a14 14 0 0 1 14 14v42a14 14 0 0 1-14 14H94l-22 20v-20H44a14 14 0 0 1-14-14V64a14 14 0 0 1 14-14z"/>' + txt(62, 96, 'Hello!', 26) + '</g>' +
        '<g' + a('sc-pop', 4, -2) + '><path class="k fb-soft" d="M120 140h96a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14h-8v18l-20-18h-68a14 14 0 0 1-14-14v-34a14 14 0 0 1 14-14z"/>' + txt(138, 180, 'A B C', 22) + '</g>' +
        '<path class="k fc-soft" d="M30 232h96v-16H30zM38 216h80v-14H38z"/>' +
        '<circle class="k fa-soft" cx="342" cy="150" r="60"/>' + meridians + '<path class="k2" d="M282 150h120M290 120h104M290 180h104"/>' +
        txt(250, 60, '“ ”', 40, a('sc-bob', 5, -1)) + txt(236, 244, 'Aa', 28, a('sc-bob', 4, -2));
    },
    economics: function () {
      var bars = '', h = [50, 82, 64, 108, 130];
      for (var i = 0; i < h.length; i++) bars += '<rect' + a((i % 2 ? 'fb-soft' : 'fa-soft') + ' k sc-grow', 4, (-i * .5).toFixed(1)) + ' x="' + (58 + i * 30) + '" y="' + (222 - h[i]) + '" width="20" height="' + h[i] + '" rx="3"/>';
      return '<path class="k" d="M42 222h170M48 230V70"/>' + bars +
        '<path' + a('k sc-draw sc2', 4, 0) + ' pathLength="1" d="M60 170l32-30 30 18 34-46 44-34"/><path class="k fc" d="M200 78l10-2-2 10z"/>' +
        '<path class="k2" d="M250 222h150M256 230V70"/><path class="k sa" d="M270 90l120 120"/><path class="k sc" d="M270 210l120-120"/>' +
        txt(392, 222, 'D', 16) + txt(392, 86, 'S', 16) + '<circle' + a('fb sc-pulse', 2.2, 0) + ' cx="330" cy="150" r="8"/>' +
        txt(214, 52, '৳', 30, a('sc-bob', 4, -1)) + txt(300, 50, '%', 26, a('sc-bob', 5, -3));
    },
    history: function () {
      return '<path class="k" d="M44 40h72M44 236h72M52 40c0 50 24 60 28 98-4 38-28 48-28 98M108 40c0 50-24 60-28 98 4 38 28 48 28 98"/>' +
        '<path' + a('fb sc-drain', 6, 0) + ' d="M58 60h44c-6 30-16 44-22 62-6-18-16-32-22-62z"/>' +
        '<path' + a('fb sc-grow', 6, 0) + ' d="M60 228h40c-4-22-12-34-20-50-8 16-16 28-20 50z"/>' +
        '<path' + a('k2 sa sc-flow', 1, 0, 'stroke-dasharray:4 6;--len:10') + ' d="M80 124v104"/>' +
        '<path class="k fl-paper" d="M150 64h120v150H150z"/><path class="k fa-soft" d="M144 56h132a8 8 0 0 1 0 16H144a8 8 0 0 1 0-16zM144 206h132a8 8 0 0 1 0 16H144a8 8 0 0 1 0-16z"/>' +
        '<path' + a('k2 sc-draw', 5, 0) + ' pathLength="1" d="M166 96h88M166 116h70M166 136h88M166 156h56M166 176h80"/>' +
        '<circle' + a('fc sc-pulse', 4, 0) + ' cx="356" cy="120" r="34" opacity=".8"/>' +
        '<path class="k" d="M342 232v-110l14-14 14 14v110M318 232v-80l12-10 12 10M370 232v-80l12-10 12 10v80M300 232h116"/>' +
        txt(318, 60, '১৯৭১', 26, a('sc-bob', 5, -1));
    },
    civics: function () {
      return '<path class="k fa-soft" d="M44 140a66 46 0 0 1 132 0z"/><path class="k" d="M36 140h148M44 150h132v70H44zM36 228h148M110 94V56"/>' +
        '<path class="k2" d="M64 150v70M88 150v70M112 150v70M136 150v70M160 150v70"/>' +
        '<g' + a('sc-wave', 2.6, 0) + '><path class="fl fa" d="M110 56h34v20h-34z"/><circle class="fc" cx="124" cy="66" r="6"/></g>' +
        '<path class="k" d="M276 228V82M248 228h56M276 82v-8"/><g' + a('sc-tilt', 4, 0) + '>' +
        '<path class="k" d="M224 92h104"/><path class="k2" d="M224 92l-18 46M224 92l18 46M328 92l-18 46M328 92l18 46"/>' +
        '<path class="k fb-soft" d="M200 138h48a24 14 0 0 1-48 0zM304 138h48a24 14 0 0 1-48 0z"/></g><circle' + a('fb sc-pulse', 3, 0) + ' cx="276" cy="80" r="7"/>' +
        '<defs><clipPath id="scene-ballot-clip"><rect x="340" y="40" width="80" height="130"/></clipPath></defs>' +
        '<g clip-path="url(#scene-ballot-clip)"><g' + a('sc-ballot', 4, 0) + '><path class="k fl-paper" d="M370 138h20v30h-20z"/><path class="k sa" d="M374 152l4 4 8-8"/></g></g>' +
        '<path class="k fa-soft" d="M352 170h56v58h-56z"/><path class="k2" d="M352 186h56"/><path' + a('k sb sc-slot', 4, 0) + ' d="M368 170h24"/>' +
        txt(372, 214, '✓', 20, a('fb sc-voted', 4, 0));
    },
    sociology: function () {
      var links = 'M86 82L196 120M196 120L310 76M196 120L130 196M196 120L270 196M310 76L370 150M270 196L370 150M86 82L130 196';
      return '<path class="k2" d="' + links + '"/><path' + a('k sa sc-flow', 3, 0, 'stroke-dasharray:8 30;--len:38') + ' d="' + links + '"/>' +
        person(86, 60, 'fa', 0) + person(196, 98, 'fb', -1) + person(310, 54, 'fc', -2) + person(130, 174, 'fc', -1.5) + person(270, 174, 'fa', -.5) + person(370, 128, 'fb', -2.5) +
        '<path' + a('fc sc-rise', 4, 0, '--h:-40px') + ' d="M230 70c-6-8-18-2-12 8l12 10 12-10c6-10-6-16-12-8z"/>' +
        '<path' + a('fa sc-rise', 4, -2, '--h:-40px') + ' d="M60 200c-6-8-18-2-12 8l12 10 12-10c6-10-6-16-12-8z"/>';
    },
    accounting: function () {
      var keys = '';
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) keys += '<rect' + a('k2 fa-soft sc-key', 3.6, (-(r * 3 + c) * .3).toFixed(1)) + ' x="' + (52 + c * 26) + '" y="' + (112 + r * 26) + '" width="18" height="18" rx="4"/>';
      var beads = '';
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) beads += '<circle' + a((i % 2 ? 'fb' : 'fa') + ' k2 sc-drift', 3 + i * .6, (-j * .3 - i).toFixed(1), '--x:' + (18 - j * 4) + 'px') + ' cx="' + (330 + j * 14) + '" cy="' + (128 + i * 34) + '" r="7"/>';
      return '<rect class="k" x="40" y="54" width="102" height="180" rx="12"/><rect class="k fb-soft" x="52" y="68" width="78" height="32" rx="5"/>' +
        txt(62, 92, '৳ 12,500', 15, a('sc-blink', 2.4, 0, 'animation-timing-function:ease-in-out')) + keys +
        '<path class="k fl-paper" d="M170 60h120v170H170z"/><path class="k2" d="M170 88h120M230 60v170M170 116h120M170 144h120M170 172h120M170 200h120"/>' +
        txt(186, 80, 'Dr.', 14) + txt(246, 80, 'Cr.', 14) +
        '<path' + a('k sa sc-draw', 4, 0) + ' pathLength="1" d="M190 102l6 6 12-12M250 130l6 6 12-12M190 158l6 6 12-12"/>' +
        '<path class="k" d="M314 100h92v124h-92zM314 128h92M314 162h92M314 196h92"/>' + beads;
    },
    business: function () {
      return gear(90, 110, 40, 10, 'sc-spin', 12) + gear(150, 172, 28, 8, 'sc-spin-rev', 8.4) +
        '<path class="k2" d="M196 228h120M204 236V96"/><path' + a('k sa sc-draw', 4, 0) + ' pathLength="1" d="M210 206l26-30 22 14 26-40 26-30"/><path class="k fa" d="M302 112l12-6-2 14z"/>' +
        '<g' + a('sc-bob', 3, 0, '--b:-14px') + '><path class="k fl-paper" d="M360 40c18 18 24 50 18 86h-36c-6-36 0-68 18-86z"/>' +
        '<circle class="k fb-soft" cx="360" cy="84" r="9"/><path class="k fa-soft" d="M342 116l-14 22 16-4zM378 116l14 22-16-4z"/>' +
        '<path' + a('fc sc-flicker', .5, 0) + ' d="M348 128h24l-12 34z"/><path' + a('fb sc-flicker', .4, -.2) + ' d="M352 128h16l-8 20z"/></g>' +
        '<path' + a('k2 sc-fall', 1.6, 0, '--h:60px') + ' d="M318 60v18"/><path' + a('k2 sc-fall', 1.9, -.7, '--h:60px') + ' d="M402 80v18"/>' +
        '<path class="k fb-soft" d="M30 196h52v36H30z"/><path class="k" d="M46 196v-8h20v8M30 210h52"/>';
    },
    finance: function () {
      var stack = '';
      for (var i = 0; i < 5; i++) stack += '<ellipse class="k fb-soft" cx="80" cy="' + (224 - i * 12) + '" rx="34" ry="9"/>';
      for (var j = 0; j < 3; j++) stack += '<ellipse class="k fb-soft" cx="140" cy="' + (224 - j * 12) + '" rx="26" ry="7"/>';
      return stack + '<g' + a('sc-drop', 2.8, 0) + '><ellipse class="k fb" cx="80" cy="150" rx="34" ry="9"/>' + txt(73, 156, '৳', 14) + '</g>' +
        '<ellipse class="k fc-soft" cx="262" cy="170" rx="64" ry="46"/><circle class="k fc-soft" cx="324" cy="164" r="16"/><path class="k" d="M224 132l-8-22 26 12M210 208v18M236 212v16M286 212v16M310 204v20M248 128h28"/>' +
        '<circle class="fb" cx="288" cy="150" r="4"/><g' + a('sc-drop', 2.8, -1.4) + '><circle class="k fb" cx="262" cy="104" r="12"/>' + txt(256, 110, '৳', 14) + '</g>' +
        '<path' + a('k sa sc-draw', 4, 0) + ' pathLength="1" d="M350 92l14-16 14 8 20-30"/>' +
        txt(186, 64, '৳', 30, a('sc-bob', 4, -1)) + txt(372, 132, '%', 26, a('sc-bob', 5, -2)) + txt(354, 222, '$', 24, a('sc-bob', 4.4, -3));
    },
    marketing: function () {
      var hearts = '';
      for (var i = 0; i < 3; i++) hearts += '<path' + a((i % 2 ? 'fa' : 'fc') + ' sc-rise', 3.6, -i * 1.2, '--h:-70px') + ' d="M' + (340 + i * 24) + ' 220c-5-7-15-2-10 7l10 8 10-8c5-9-5-14-10-7z"/>';
      return '<path class="k fa-soft" d="M44 118h20l70-40v118l-70-40H44z"/><path class="k" d="M60 158l12 46h18l-8-46"/>' +
        '<path' + a('k sc-pulse', 2, 0) + ' d="M152 112a40 40 0 0 1 0 50"/><path' + a('k sc-pulse', 2, -.6) + ' d="M166 98a62 62 0 0 1 0 78"/><path' + a('k sc-pulse', 2, -1.2) + ' d="M180 84a84 84 0 0 1 0 106"/>' +
        '<circle class="k fl-paper" cx="268" cy="110" r="52"/><circle class="k fc-soft" cx="268" cy="110" r="36"/><circle class="k fl-paper" cx="268" cy="110" r="20"/><circle class="fc" cx="268" cy="110" r="7"/>' +
        '<g' + a('sc-shoot', 3.4, 0) + '><path class="k" d="M268 110l-62 46"/><path class="k fb" d="M206 156l-10 2 4-10zM212 152l-12-2M212 152l-2 12"/></g>' +
        '<g' + a('sc-spin', 16, 0) + '><circle class="k fa-soft" cx="372" cy="58" r="32"/><path class="fb" d="M372 58V26a32 32 0 0 1 30 42z"/><path class="fc" d="M372 58l30 10a32 32 0 0 1-22 20z"/></g>' + hearts;
    },
    geography: function () {
      var meridians = '';
      for (var i = 0; i < 3; i++) meridians += '<ellipse' + a('k2 sc-twist', 6, -i * 2) + ' cx="104" cy="128" rx="64" ry="78"/>';
      return '<circle class="k fa-soft" cx="104" cy="128" r="78"/>' + meridians + '<path class="k2" d="M26 128h156M38 88h132M38 168h132"/>' +
        '<path class="fb" opacity=".6" d="M70 92c14-8 30 0 26 14s-24 10-28 22-16-4-10-16 4-14 12-20zM120 140c12-4 26 6 20 20s-22 16-26 4 0-20 6-24z"/>' +
        '<circle class="k fl-paper" cx="250" cy="176" r="44"/><path class="k2 fb-soft" d="M250 124l8 44 44 8-44 8-8 44-8-44-44-8 44-8z"/>' +
        '<g' + a('sc-swing', 3, 0, '--a:18deg;transform-origin:50% 50%') + '><path class="fc" d="M250 140l7 36h-14z"/><path class="fl-paper k2" d="M243 176h14l-7 36z"/></g>' + txt(244, 120, 'N', 14) +
        '<circle' + a('fb sc-pulse', 4, 0) + ' cx="368" cy="58" r="18"/><path class="k fa-soft" d="M294 230l42-74 26 40 22-30 34 64z"/>' +
        '<g' + a('sc-drift', 8, 0, '--x:-40px') + '><path class="k fl-paper" d="M320 94a12 12 0 0 1 22-6 10 10 0 0 1 18 8 8 8 0 0 1-2 16h-36a9 9 0 0 1-2-18z"/></g>' +
        '<path' + a('k sa sc-flow', 2, 0, 'stroke-dasharray:8 8;--len:16') + ' d="M310 240c20-6 30 6 50 0s30 6 50 0"/>';
    }
  };
  scenes['bangla-2'] = scenes.bangla;
  scenes['english-2'] = scenes.english;

  var name = head.getAttribute('data-scene');
  if (!scenes.hasOwnProperty(name)) return;
  var wrap = document.createElement('div');
  wrap.className = 'subject-scene scene-' + name;
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = '<svg viewBox="0 0 420 260" focusable="false" preserveAspectRatio="xMidYMid meet">' + scenes[name]() + '</svg>';
  head.insertBefore(wrap, head.firstChild);

  // CSS rules cannot stop SMIL motion, so pause it for reduced motion or the site pause setting.
  var svg = wrap.firstChild;
  if (!svg || !svg.pauseAnimations || typeof window === 'undefined') return;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function sync() {
    var still = (reduce && reduce.matches) || document.documentElement.classList.contains('motion-paused');
    if (still) svg.pauseAnimations(); else svg.unpauseAnimations();
  }
  sync();
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', sync);
  if (window.MutationObserver) new MutationObserver(sync).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
}());
