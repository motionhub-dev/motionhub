// The page a private motion's reel plays in, for its owner alone: player.motionhub.dev/play/_preview/ (player/build.mjs).
// The shared scripts are loaded already; the page that framed this one (motionhub.dev, the only one _headers lets frame
// it) built the reel's script in the browser, from the motion's files, with player/reel-plugin.mjs, and sends it here
// once: {motionhubPreview: 1, css, js, heavy}. The script runs as a blob, in a sandbox with no origin of its own, no
// cookie, no storage and no network (connect-src 'none'), as every reel does; nothing else is taken.
(() => {
  const player = document.getElementById('player');
  let done = false;
  addEventListener('message', (event) => {
    const d = event.data;
    if (done || event.source !== parent || !d || d.motionhubPreview !== 1 || typeof d.js !== 'string' || typeof d.css !== 'string') return;
    done = true;
    if (d.heavy === true) player.dataset.heavy = '1';
    const style = document.createElement('style');
    style.textContent = d.css;
    document.head.append(style);
    const script = document.createElement('script');
    script.src = URL.createObjectURL(new Blob([d.js], {type: 'text/javascript; charset=utf-8'}));
    document.body.append(script);
  });
  parent.postMessage({motionhubPreview: 'ready'}, '*');
})();
