importScripts('wasm_exec.js');

const go = new Go();

WebAssembly.instantiateStreaming(fetch('pbr2dayz.wasm'), go.importObject)
  .then((result) => {
    go.run(result.instance).catch((err) => {
      postMessage({ type: 'error', error: String(err) });
    });

    postMessage({ type: 'ready' });
  })
  .catch((err) => {
    postMessage({ type: 'error', error: 'failed to load pbr2dayz.wasm: ' + err });
  });

onmessage = (event) => {
  const { type, baseColor, normal, metallic, roughness, ao } = event.data;
  if (type !== 'convert') {
    return;
  }

  const result = pbr2dayz(
    new Uint8Array(baseColor),
    new Uint8Array(normal),
    metallic ? new Uint8Array(metallic) : null,
    roughness ? new Uint8Array(roughness) : null,
    ao ? new Uint8Array(ao) : null
  );

  if (!result.ok) {
    postMessage({ type: 'result', ok: false, error: result.error });
    return;
  }

  postMessage(
    { type: 'result', ok: true, co: result.co, nohq: result.nohq, as: result.as, smdi: result.smdi },
    [result.co.buffer, result.nohq.buffer, result.as.buffer, result.smdi.buffer]
  );
};
